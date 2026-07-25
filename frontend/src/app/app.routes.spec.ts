import { authGuard } from './core/auth/auth.guard';
import { routes } from './app.routes';

describe('order detail route', () => {
  it('is protected by the authentication guard', () => {
    const route = routes.find(candidate => candidate.path === 'espace/commandes/:id');
    expect(route).toBeDefined();
    expect(route?.canActivate).toContain(authGuard);
  });
});
