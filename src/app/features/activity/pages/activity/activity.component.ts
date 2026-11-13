import { AsyncStateComponent } from '../../../../shared/components/async-state/async-state.component';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { AuditService } from '../../services/activity.service';
import { AuditEvent } from '../../models/audit-event.model';
import { getApiErrorMessage } from '../../../../shared/utils/api-error.util';
@Component({
  selector: 'app-activity',
  imports: [AsyncStateComponent, DatePipe],
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityComponent {
  private readonly auditService = inject(AuditService);
  private readonly destroyRef = inject(DestroyRef);
  readonly events = signal<AuditEvent[]>([]);
  readonly error = signal('');
  readonly loading = signal(false);
  constructor() {
    this.load();
  }
  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.auditService
      .getEvents()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (events) => this.events.set(events),
        error: (error: unknown) =>
          this.error.set(getApiErrorMessage(error, 'Unable to load activity. Please retry.')),
      });
  }
}
