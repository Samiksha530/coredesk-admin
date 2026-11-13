import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth/services/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  readonly open = signal(false);
  readonly links = [
    { path: 'dashboard', label: 'Overview', icon: '▦' },
    { path: 'users', label: 'User management', icon: '♙' },
    { path: 'roles', label: 'Roles & permissions', icon: '◇' },
    { path: 'activity', label: 'Activity log', icon: '◷' },
    { path: 'settings', label: 'Settings', icon: '⚙' },
  ] as const;
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  readonly currentPage = computed(
    () =>
      this.links.find((link) => this.currentUrl().split('?')[0] === `/${link.path}`)?.label ??
      'Overview',
  );
  constructor() {
    this.theme.initialize();
  }
}
