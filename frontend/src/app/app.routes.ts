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
  { path: 'espace/commandes/:id', canActivate: [authGuard], loadComponent: () => import('./features/dashboards/order-detail').then(m => m.OrderDetailComponent), title: 'Détail de la commande' },
  { path: 'profil', canActivate: [authGuard], loadComponent: () => import('./features/management/management').then(m => m.ProfileComponent) },
  { path: 'commande/:slug', canActivate: [authGuard], loadComponent: () => import('./features/dashboards/dashboards').then(m => m.OrderCreateComponent) },
  { path: 'employe', canActivate: [roleGuard], data: { roles: ['EMPLOYEE','ADMIN'] }, loadComponent: () => import('./features/employee/employee-dashboard').then(m => m.EmployeeDashboardComponent) },
  { path: 'employe/commandes', canActivate: [roleGuard], data: { roles: ['EMPLOYEE','ADMIN'] }, loadComponent: () => import('./features/employee/employee-orders').then(m => m.EmployeeOrdersComponent), title: 'Commandes | Espace équipe' },
  { path: 'employe/commandes/:id', canActivate: [roleGuard], data: { roles: ['EMPLOYEE','ADMIN'] }, loadComponent: () => import('./features/employee/employee-order-detail').then(m => m.EmployeeOrderDetailComponent), title: 'Détail commande | Espace équipe' },
  { path: 'employe/catalogue', canActivate: [roleGuard], data: { roles: ['EMPLOYEE','ADMIN'] }, loadComponent: () => import('./features/management/management').then(m => m.CatalogManagementComponent) },
  { path: 'employe/avis', canActivate: [roleGuard], data: { roles: ['EMPLOYEE','ADMIN'] }, loadComponent: () => import('./features/management/management').then(m => m.ReviewModerationComponent) },
  { path: 'admin', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./features/admin/admin').then(m => m.AdminDashboardComponent) },
  { path: 'admin/employes', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./features/admin/admin').then(m => m.AdminEmployeesComponent) },
  { path: 'admin/horaires', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./features/admin/admin').then(m => m.AdminOpeningHoursComponent) },
  { path: 'admin/statistiques', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./features/admin/admin').then(m => m.AdminStatisticsComponent) },
  { path: 'interdit', loadComponent: () => import('./features/public/public-pages').then(m => m.ForbiddenComponent) },
  { path: '**', loadComponent: () => import('./features/public/public-pages').then(m => m.NotFoundComponent), title: 'Page introuvable' }
];
