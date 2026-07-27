import { authGuard, roleGuard } from './core/auth/auth.guard';
import { routes } from './app.routes';

describe('order detail route', () => {
  it('is protected by the authentication guard', () => {
    const route = routes.find(candidate => candidate.path === 'espace/commandes/:id');
    expect(route).toBeDefined();
    expect(route?.canActivate).toContain(authGuard);
  });
});

describe('employee routes', () => {
  it('protects dashboard, list, detail and moderation for EMPLOYEE or ADMIN', () => {
    for (const path of ['employe', 'employe/commandes', 'employe/commandes/:id', 'employe/avis']) {
      const route = routes.find(candidate => candidate.path === path);
      expect(route).withContext(path).toBeDefined();
      expect(route?.canActivate).withContext(path).toContain(roleGuard);
      expect(route?.data?.['roles']).withContext(path).toEqual(['EMPLOYEE', 'ADMIN']);
    }
  });
});
