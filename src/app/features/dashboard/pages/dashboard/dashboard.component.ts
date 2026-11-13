import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { AsyncStateComponent } from '../../../../shared/components/async-state/async-state.component';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, defer, finalize, map, switchMap, tap } from 'rxjs';
import { User } from '../../../users/models/user.model';
import { UsersService } from '../../../users/services/users.service';
import { AnalyticsService } from '../../services/dashboard.service';
import { AnalyticsSummary, CustomerSegment, ReportingPeriod } from '../../models/analytics.model';
import { buildAnalyticsCsv, downloadCsv } from '../../utils/report-export.util';
import { getApiErrorMessage } from '../../../../shared/utils/api-error.util';
@Component({
  selector: 'app-dashboard',
  imports: [
    RevenueChartComponent,
    AsyncStateComponent,
    StatusBadgeComponent,
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly usersService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly periodChanges = new Subject<ReportingPeriod>();
  readonly data = signal<AnalyticsSummary | null>(null);
  readonly team = signal<User[]>([]);
  readonly members = signal(0);
  readonly error = signal('');
  readonly teamError = signal('');
  readonly period = signal<ReportingPeriod>('30');
  readonly loadedPeriod = signal<ReportingPeriod>('30');
  readonly loading = signal(false);
  readonly segments: readonly CustomerSegment[] = [
    { name: 'Enterprise', value: 48, color: '#159f88' },
    { name: 'Small business', value: 32, color: '#85cbb8' },
    { name: 'Individuals', value: 20, color: '#e0ebe7' },
  ];
  readonly labels = computed(() =>
    this.loadedPeriod() === '365'
      ? ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov']
      : this.loadedPeriod() === '90'
        ? ['Aug 15', 'Sep 1', 'Sep 15', 'Oct 1', 'Oct 15', 'Nov 13']
        : ['Oct 15', 'Oct 20', 'Oct 25', 'Oct 30', 'Nov 5', 'Nov 13'],
  );
  constructor() {
    // A new period cancels the previous request so slower responses cannot overwrite newer data.
    this.periodChanges
      .pipe(
        tap(() => this.error.set('')),
        switchMap((period) =>
          defer(() => {
            this.loading.set(true);
            return this.analyticsService.getSummary(period);
          }).pipe(
            map((summary) => ({ summary, period })),
            finalize(() => this.loading.set(false)),
            catchError((error: unknown) => {
              this.error.set(
                getApiErrorMessage(
                  error,
                  'Could not load analytics. Check the API server and retry.',
                ),
              );
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ summary, period }) => {
        this.data.set(summary);
        this.loadedPeriod.set(period);
      });
    this.load('30');
    this.loadTeam();
  }
  load(value: string): void {
    if (value !== '30' && value !== '90' && value !== '365') return;
    this.period.set(value);
    this.periodChanges.next(value);
  }
  loadTeam(): void {
    this.teamError.set('');
    this.usersService
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.team.set(users.slice(0, 4));
          this.members.set(users.length);
        },
        error: (error: unknown) =>
          this.teamError.set(getApiErrorMessage(error, 'Could not load team data.')),
      });
  }
  exportReport(): void {
    const summary = this.data();
    if (summary)
      downloadCsv(buildAnalyticsCsv(summary, this.loadedPeriod()), 'coredesk-analytics.csv');
  }
}
