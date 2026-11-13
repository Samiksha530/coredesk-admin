import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './shell.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { provideTestAuth } from '../../../testing/auth.fixture';
describe('ShellComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter([]), provideTestAuth('Viewer')],
    });
  });
  it('hides admin navigation for a viewer and keeps sign out accessible', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/roles"]')).toBeNull();
    const logout: HTMLButtonElement = fixture.nativeElement.querySelector('.sidebar > .profile');
    expect(logout.textContent).toContain('Sign out');
    logout.click();
    expect(TestBed.inject(AuthService).logout).toHaveBeenCalled();
  });
  it('toggles mobile navigation and aria-expanded', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-controls="workspace-sidebar"]',
    );
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});
