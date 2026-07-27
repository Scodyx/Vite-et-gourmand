import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard, roleGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authentication guards', () => {
  const auth = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated', 'hasRole']);
  const router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    { provide: AuthService, useValue: auth }, { provide: Router, useValue: router }
  ]}));

  it('redirects anonymous visitors to login with the return URL', () => {
    const redirect = {} as UrlTree;
    auth.isAuthenticated.and.returnValue(false);
    router.createUrlTree.and.returnValue(redirect);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/commandes' } as never));
    expect(result).toBe(redirect);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/connexion'], { queryParams: { returnUrl: '/commandes' } });
  });

  it('refuses an authenticated user without the required role', () => {
    const redirect = {} as UrlTree;
    auth.isAuthenticated.and.returnValue(true);
    auth.hasRole.and.returnValue(false);
    router.createUrlTree.and.returnValue(redirect);
    const route = { data: { roles: ['ADMIN'] } } as never;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as never));
    expect(result).toBe(redirect);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/interdit']);
  });

  it('allows EMPLOYEE and ADMIN identities on employee routes', () => {
    auth.isAuthenticated.and.returnValue(true);
    auth.hasRole.and.returnValue(true);
    const route = { data: { roles: ['EMPLOYEE', 'ADMIN'] } } as never;
    expect(TestBed.runInInjectionContext(() => roleGuard(route, {} as never))).toBeTrue();
    expect(auth.hasRole).toHaveBeenCalledWith(['EMPLOYEE', 'ADMIN']);
  });
});
