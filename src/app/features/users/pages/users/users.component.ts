import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Role } from '../../../../core/auth/models/auth.model';
import { User, UserStatus } from '../../models/user.model';
import { UsersService } from '../../services/users.service';
import { getApiErrorMessage } from '../../../../shared/utils/api-error.util';
import { notBlankValidator } from '../../../../shared/validators/not-blank.validator';
@Component({
  selector: 'app-users',
  imports: [AsyncStateComponent, StatusBadgeComponent, ConfirmDialogComponent, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  readonly auth = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly pageSize = 7;
  readonly users = signal<User[]>([]);
  readonly query = signal('');
  readonly role = signal('');
  readonly status = signal('');
  readonly page = signal(1);
  readonly asc = signal(true);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly deleting = signal<User | null>(null);
  readonly error = signal('');
  readonly formError = signal('');
  readonly message = signal('');
  editingId = '';
  readonly canEdit = computed(() => ['Admin', 'Manager'].includes(this.auth.session()?.role ?? ''));
  readonly active = computed(() => this.users().filter((user) => user.status === 'Active').length);
  readonly filtered = computed(() => {
    const search = this.query().trim().toLowerCase();
    return this.users()
      .filter(
        (user) =>
          `${user.name} ${user.email}`.toLowerCase().includes(search) &&
          (!this.role() || user.role === this.role()) &&
          (!this.status() || user.status === this.status()),
      )
      .sort((a, b) => a.name.localeCompare(b.name) * (this.asc() ? 1 : -1));
  });
  readonly pages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly paged = computed(() =>
    this.filtered().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize),
  );
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, notBlankValidator, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['Viewer' as Role],
    status: ['Invited' as UserStatus],
    department: ['', [Validators.required, notBlankValidator, Validators.maxLength(60)]],
  });
  constructor() {
    this.load();
  }
  canEditMember(user: User): boolean {
    return this.canEdit() && (user.role !== 'Admin' || this.auth.session()?.role === 'Admin');
  }
  canDeleteMember(user: User): boolean {
    return this.auth.session()?.role === 'Admin' && user.email !== this.auth.session()?.email;
  }
  updateQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }
  updateRole(value: string): void {
    this.role.set(value);
    this.page.set(1);
  }
  updateStatus(value: string): void {
    this.status.set(value);
    this.page.set(1);
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.usersService
      .getUsers()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.page.update((page) => Math.min(page, this.pages()));
        },
        error: (error: unknown) =>
          this.error.set(
            getApiErrorMessage(error, 'Unable to load members. Check the API connection.'),
          ),
      });
  }
  openMemberForm(user?: User): void {
    if (!this.canEdit() || (user && !this.canEditMember(user))) return;
    this.editingId = user?.id ?? '';
    this.form.reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'Viewer',
      status: user?.status ?? 'Invited',
      department: user?.department ?? '',
    });
    this.formError.set('');
    this.showForm.set(true);
  }
  closeMemberForm(): void {
    if (!this.saving()) this.showForm.set(false);
  }
  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.formError.set('');
    this.usersService
      .saveUser({
        ...value,
        name: value.name.trim(),
        department: value.department.trim(),
        email: value.email.trim().toLowerCase(),
        ...(this.editingId ? { id: this.editingId } : {}),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.showForm.set(false);
          this.message.set('Member saved successfully.');
          this.load();
        },
        error: (error: unknown) =>
          this.formError.set(getApiErrorMessage(error, 'Unable to save member.')),
      });
  }
  remove(user: User): void {
    if (!this.canDeleteMember(user) || this.saving()) return;
    this.saving.set(true);
    this.usersService
      .deleteUser(user.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.deleting.set(null);
          this.page.set(1);
          this.message.set('Member removed.');
          this.load();
        },
        error: (error: unknown) => {
          this.deleting.set(null);
          this.error.set(getApiErrorMessage(error, 'Unable to remove member.'));
        },
      });
  }
}
