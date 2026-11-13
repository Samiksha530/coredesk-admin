import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { createSession } from '../../../../testing/auth.fixture';
describe('AuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('stores access tokens only in memory', () => {
    const auth = TestBed.inject(AuthService);
    auth.login({ email: 'admin@coredesk.demo', password: 'Demo@123' }).subscribe();
    TestBed.inject(HttpTestingController).expectOne('/api/auth/login').flush(createSession());
    expect(auth.session()?.token).toBe('test-access-token');
    expect(sessionStorage.getItem('coredesk-session')).toBeNull();
  });
  it('shares concurrent refresh requests', () => {
    const auth = TestBed.inject(AuthService);
    auth.refreshSession().subscribe();
    auth.refreshSession().subscribe();
    TestBed.inject(HttpTestingController).expectOne('/api/auth/refresh').flush(createSession());
    expect(auth.session()?.role).toBe('Admin');
  });
  it('treats an absent refresh cookie as signed out', () => {
    const auth = TestBed.inject(AuthService);
    let session: unknown = 'pending';
    auth.restoreSession().subscribe((value) => (session = value));
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/refresh')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session).toBeNull();
  });
});
