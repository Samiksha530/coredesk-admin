import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { LoginComponent } from './login.component';
import { createSession } from '../../../../../testing/auth.fixture';
describe('LoginComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('does not submit an invalid email', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.patchValue({ email: 'invalid' });
    fixture.componentInstance.submit();
    TestBed.inject(HttpTestingController).expectNone('/api/auth/login');
  });
  it('signs in and navigates to the dashboard', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.submit();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/auth/login');
    expect(request.request.body.email).toBe('admin@coredesk.demo');
    request.flush(createSession());
    expect(navigate).toHaveBeenCalledWith('/dashboard');
    expect(fixture.componentInstance.busy()).toBe(false);
  });
  it('shows rejected credentials and allows another attempt', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.submit();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/login')
      .flush(
        { message: 'Invalid demo email or password.' },
        { status: 401, statusText: 'Unauthorized' },
      );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Invalid demo email',
    );
    expect(fixture.componentInstance.busy()).toBe(false);
  });
});
