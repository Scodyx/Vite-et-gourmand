import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home').then(m => m.HomeComponent), title: 'Accueil | Vite & Gourmand' },
  { path: 'menus', loadComponent: () => import('./features/menus/menu-list').then(m => m.MenuListComponent), title: 'Nos menus' },
  { path: 'menus/:slug', loadComponent: () => import('./features/menus/menu-detail').then(m => m.MenuDetailComponent), title: 'Détail du menu' },
  { path: 'contact', loadComponent: () => import('./features/public/public-pages').then(m => m.ContactComponent), title: 'Contact' },
  { path: 'connexion', loadComponent: () => import('./features/auth/login').then(m => m.LoginComponent), title: 'Connexion' },
  { path: 'inscription', loadComponent: () => import('./features/auth/register').then(m => m.RegisterComponent), title: 'Inscription' },
  { path: 'mot-de-passe-oublie', loadComponent: () => import('./features/public/public-pages').then(m => m.ForgotPasswordComponent) },
  { path: 'reinitialisation', loadComponent: () => import('./features/public/public-pages').then(m => m.ResetPasswordComponent) },
  { path: 'mentions-legales', loadComponent: () => import('./features/public/public-pages').then(m => m.LegalNoticeComponent) },
  { path: 'conditions', loadComponent: () => import('./features/public/public-pages').then(m => m.TermsComponent) },
  { path: 'espace', canActivate: [authGuard], loadComponent: () => import('./features/dashboards/dashboards').then(m => m.UserDashboardComponent) },
  { path: 'commande/:slug', canActivate: [authGuard], loadComponent: () => import('./features/dashboards/dashboards').then(m => m.OrderCreateComponent) },
  { path: 'employe', canActivate: [roleGuard], data: { roles: ['EMPLOYEE','ADMIN'] }, loadComponent: () => import('./features/dashboards/dashboards').then(m => m.EmployeeDashboardComponent) },
  { path: 'admin', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./features/dashboards/dashboards').then(m => m.AdminDashboardComponent) },
  { path: 'interdit', loadComponent: () => import('./features/public/public-pages').then(m => m.ForbiddenComponent) },
  { path: '**', loadComponent: () => import('./features/public/public-pages').then(m => m.NotFoundComponent), title: 'Page introuvable' }
];
