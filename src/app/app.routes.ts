import { Routes } from '@angular/router';
import { authGuard, clientGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // =============================================
  // ESPACE RESTAURATION B2B (DÉCOUPÉ PAR RÔLES)
  // =============================================
  {
    path: 'b2b',
    loadChildren: () => import('./b2b/b2b.routes').then(m => m.B2B_ROUTES)
  },
  // =============================================
  // LOGIN UNIFIÉ & SÉCURITÉ
  // =============================================
  {
    path: 'login',
    loadComponent: () => import('./site/auth/login-unified/login.component').then(m => m.LoginComponent)
  },
  {
    // Accès via slug personnalisé : /login/admin-kiki ou slug spécifique
    path: 'login/:slug',
    loadComponent: () => import('./site/auth/login-unified/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./site/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent)
  },

  // =============================================
  // AUTHENTIFICATION CLIENT MYKIKI (STANDALONE - SANS HEADER/BURGER/FOOTER DU SITE)
  // =============================================
  {
    path: 'login-client',
    loadComponent: () => import('./site/auth/login-client/login-client.component').then(m => m.LoginClientComponent)
  },
  {
    path: 'mykiki/login',
    redirectTo: 'login-client',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    redirectTo: 'login-client',
    pathMatch: 'full'
  },
  {
    path: 'mykiki/register',
    loadComponent: () => import('./site/mykiki/mykiki-register.component').then(m => m.MyKikiRegisterComponent)
  },

  // =============================================
  // ESPACE CLIENT MYKIKI (APPLICATION CLIENT)
  // =============================================
  {
    path: 'mykiki',
    canActivate: [clientGuard],
    loadChildren: () => import('./site/mykiki/mykiki.module').then((m) => m.MyKikiModule)
  },

  // =============================================
  // BACK-OFFICE GESTIONNAIRE / ADMIN
  // =============================================
  {
    path: 'gestionnaire',
    canActivate: [authGuard],
    loadChildren: () => import('./gestionnaire/gestionnaire.module').then((m) => m.GestionnaireModule)
  },

  // Redirections de compatibilité
  { path: 'manager-dashboard', redirectTo: 'gestionnaire', pathMatch: 'full' },
  { path: 'admin', redirectTo: 'gestionnaire', pathMatch: 'full' },

  // =============================================
  // =============================================
  // PAGE D'ACCUEIL PRINCIPALE B2B (PAR DÉFAUT SUR /)
  // =============================================
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./b2b/home/b2b-home.component').then(m => m.B2bHomeComponent)
  },

  // SITE PUBLIC VITRINE (AUTRES PAGES : /prestations, /devis, /contact...)
  // =============================================
  {
    path: '',
    loadChildren: () => import('./site/site.module').then((m) => m.SiteModule)
  },

  // Wildcard
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

