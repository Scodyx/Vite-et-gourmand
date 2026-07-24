import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() || inject(Router).createUrlTree(['/connexion'], { queryParams: { returnUrl: state.url } });
};
export const roleGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const roles = route.data['roles'] as Role[];
  if (!auth.isAuthenticated()) return inject(Router).createUrlTree(['/connexion']);
  return auth.hasRole(roles) || inject(Router).createUrlTree(['/interdit']);
};
