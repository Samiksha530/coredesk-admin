import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';
import { authGuard } from './auth.guard';
import { provideTestAuth } from '../../../../testing/auth.fixture';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';
describe('authGuard', () => {
  it('preserves the requested route when redirecting to login', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { session: signal(null) } }],
    });
    const result = TestBed.runInInjectionContext(() =>
      authGuard(new ActivatedRouteSnapshot(), { url: '/users' } as RouterStateSnapshot),
    );
    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/login?returnUrl=%2Fusers',
    );
  });
  it('allows signed-in viewers to enter authenticated routes', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTestAuth('Viewer')] });
    expect(
      TestBed.runInInjectionContext(() =>
        authGuard(new ActivatedRouteSnapshot(), { url: '/users' } as RouterStateSnapshot),
      ),
    ).toBe(true);
  });
});
