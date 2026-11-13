import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { createSession } from '../../../../testing/auth.fixture';
describe('authInterceptor', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  function login() {
    TestBed.inject(AuthService)
      .login({ email: 'admin@coredesk.demo', password: 'Demo@123' })
      .subscribe();
    TestBed.inject(HttpTestingController).expectOne('/api/auth/login').flush(createSession());
  }
  it('adds tokens to API requests but never third-party requests', () => {
    login();
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    http.get('/api/users').subscribe();
    const api = controller.expectOne('/api/users');
    expect(api.request.headers.get('Authorization')).toBe('Bearer test-access-token');
    api.flush([]);
    http.get('https://example.com/public').subscribe();
    const external = controller.expectOne('https://example.com/public');
    expect(external.request.headers.has('Authorization')).toBe(false);
    external.flush({});
  });
  it('refreshes an expired token and retries once', () => {
    login();
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    http.get('/api/users').subscribe();
    controller.expectOne('/api/users').flush({}, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne('/api/auth/refresh').flush({ ...createSession(), token: 'fresh-token' });
    const retried = controller.expectOne('/api/users');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    retried.flush([]);
  });
});
