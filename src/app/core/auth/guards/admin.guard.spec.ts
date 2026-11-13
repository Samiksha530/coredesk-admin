import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';
import { adminGuard } from './admin.guard';
import { provideTestAuth } from '../../../../testing/auth.fixture';
describe('adminGuard', () => {
  it('redirects a manager away from permission administration', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTestAuth('Manager')] });
    const result = TestBed.runInInjectionContext(() =>
      adminGuard(new ActivatedRouteSnapshot(), { url: '/roles' } as RouterStateSnapshot),
    );
    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/dashboard',
    );
  });
  it('allows an administrator', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTestAuth()] });
    expect(
      TestBed.runInInjectionContext(() =>
        adminGuard(new ActivatedRouteSnapshot(), { url: '/roles' } as RouterStateSnapshot),
      ),
    ).toBe(true);
  });
});
