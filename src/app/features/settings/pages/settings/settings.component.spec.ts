import { TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
describe('SettingsComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [SettingsComponent] });
  });
  it('restores and saves typed preferences', () => {
    localStorage.setItem(
      'coredesk-preferences',
      JSON.stringify({ displayName: 'Samiksha', digest: 'disabled', currency: 'INR' }),
    );
    const component = TestBed.createComponent(SettingsComponent).componentInstance;
    expect(component.form.controls.displayName.value).toBe('Samiksha');
    component.form.patchValue({ displayName: 'CoreDesk Team' });
    component.save();
    expect(JSON.parse(localStorage.getItem('coredesk-preferences')!).displayName).toBe(
      'CoreDesk Team',
    );
    expect(component.saved()).toBe(true);
  });
  it('does not persist a blank display name', () => {
    const component = TestBed.createComponent(SettingsComponent).componentInstance;
    component.form.patchValue({ displayName: '   ' });
    component.save();
    expect(component.form.invalid).toBe(true);
    expect(localStorage.getItem('coredesk-preferences')).toBeNull();
  });
});
