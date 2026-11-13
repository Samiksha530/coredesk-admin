import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { getApiErrorMessage } from '../../../../shared/utils/api-error.util';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['admin@coredesk.demo', [Validators.required, Validators.email]],
    password: ['Demo@123', Validators.required],
  });
  choose(role: string): void {
    this.form.patchValue({ email: `${role}@coredesk.demo`, password: 'Demo@123' });
  }
  submit(): void {
    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const credentials = this.form.getRawValue();
    this.auth
      .login({ ...credentials, email: credentials.email.trim().toLowerCase() })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(
            returnUrl?.startsWith('/') &&
              !returnUrl.startsWith('//') &&
              !returnUrl.startsWith('/login')
              ? returnUrl
              : '/dashboard',
          );
        },
        error: (error: unknown) =>
          this.error.set(
            getApiErrorMessage(
              error,
              'Cannot reach the API. Restart the app with npm start and try again.',
            ),
          ),
      });
  }
}
