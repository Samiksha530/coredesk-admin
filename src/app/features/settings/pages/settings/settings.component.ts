import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PreferencesService } from '../../services/preferences.service';
import { WorkspacePreferences } from '../../models/preferences.model';
import { notBlankValidator } from '../../../../shared/validators/not-blank.validator';
@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly preferences = inject(PreferencesService);
  private readonly initial = this.preferences.load();
  readonly saved = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    displayName: [
      this.initial.displayName,
      [Validators.required, notBlankValidator, Validators.maxLength(80)],
    ],
    digest: [this.initial.digest],
    currency: [this.initial.currency],
  });
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.set(false);
    this.error.set('');
    const value: WorkspacePreferences = this.form.getRawValue();
    try {
      this.preferences.save({ ...value, displayName: value.displayName.trim() });
      this.saved.set(true);
    } catch {
      this.error.set('Your browser could not save preferences. Check browser storage permissions.');
    }
  }
}
