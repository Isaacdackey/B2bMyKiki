import { Routes } from '@angular/router';
import { b2bRoleGuard } from './shared/b2b-auth.guard';
import { B2bLayoutComponent } from './shared/b2b-layout.component';

export const B2B_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('../features/auth/login/b2b-login.component').then(m => m.B2bLoginComponent)
  },
  {
    path: 'activation',
    loadComponent: () => import('../features/auth/activation/b2b-activation.component').then(m => m.B2bActivationComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('../features/auth/forgot-password/b2b-forgot-password.component').then(m => m.B2bForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('../features/auth/reset-password/b2b-reset-password.component').then(m => m.B2bResetPasswordComponent)
  },
  {
    path: '',
    component: B2bLayoutComponent,
    children: [
      // Redirections de compatibilité pour les anciennes routes
      { path: 'super-admin', redirectTo: 'super-admin/dashboard', pathMatch: 'full' },
      { path: 'rh', redirectTo: 'rh/dashboard', pathMatch: 'full' },
      { path: 'cuisine', redirectTo: 'cuisine/dashboard', pathMatch: 'full' },
      { path: 'commande', redirectTo: 'employe/menu', pathMatch: 'full' },
      { path: 'panier', redirectTo: 'employe/menu', pathMatch: 'full' },
      { path: 'commandes', redirectTo: 'employe/commandes', pathMatch: 'full' },

      // Super Admin
      {
        path: 'super-admin/dashboard',
        canActivate: [b2bRoleGuard(['SUPER_ADMIN'])],
        loadComponent: () => import('../features/super-admin/dashboard/sa-dashboard.component').then(m => m.SaDashboardComponent)
      },
      {
        path: 'super-admin/entreprises',
        canActivate: [b2bRoleGuard(['SUPER_ADMIN'])],
        loadComponent: () => import('../features/super-admin/entreprises/sa-entreprises.component').then(m => m.SaEntreprisesComponent)
      },
      {
        path: 'super-admin/catalogue',
        canActivate: [b2bRoleGuard(['SUPER_ADMIN'])],
        loadComponent: () => import('../features/super-admin/catalogue/sa-catalogue.component').then(m => m.SaCatalogueComponent)
      },
      {
        path: 'super-admin/planning',
        canActivate: [b2bRoleGuard(['SUPER_ADMIN'])],
        loadComponent: () => import('../features/super-admin/planning/sa-planning.component').then(m => m.SaPlanningComponent)
      },

      // RH Entreprise
      {
        path: 'rh/dashboard',
        canActivate: [b2bRoleGuard(['RESPONSABLE_ENTREPRISE', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/rh-entreprise/dashboard/rh-dashboard.component').then(m => m.RhDashboardComponent)
      },
      {
        path: 'rh/commandes',
        canActivate: [b2bRoleGuard(['RESPONSABLE_ENTREPRISE', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/rh-entreprise/commandes/rh-commandes.component').then(m => m.RhCommandesComponent)
      },
      {
        path: 'rh/employes',
        canActivate: [b2bRoleGuard(['RESPONSABLE_ENTREPRISE', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/rh-entreprise/employes/rh-employes.component').then(m => m.RhEmployesComponent)
      },
      {
        path: 'rh/facturation',
        canActivate: [b2bRoleGuard(['RESPONSABLE_ENTREPRISE', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/rh-entreprise/facturation/rh-facturation.component').then(m => m.RhFacturationComponent)
      },

      // Cuisine / Responsable de Site Kiki
      {
        path: 'cuisine/dashboard',
        canActivate: [b2bRoleGuard(['RESPONSABLE_SITE_KIKI', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/cuisine/dashboard/cuisine-dashboard.component').then(m => m.CuisineDashboardComponent)
      },
      {
        path: 'cuisine/menu',
        canActivate: [b2bRoleGuard(['RESPONSABLE_SITE_KIKI', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/cuisine/menu/cuisine-menu.component').then(m => m.CuisineMenuComponent)
      },
      {
        path: 'cuisine/commandes',
        canActivate: [b2bRoleGuard(['RESPONSABLE_SITE_KIKI', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/cuisine/commandes/cuisine-commandes.component').then(m => m.CuisineCommandesComponent)
      },
      {
        path: 'cuisine/qr',
        canActivate: [b2bRoleGuard(['RESPONSABLE_SITE_KIKI', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/cuisine/qr-cantine/cuisine-qr-cantine.component').then(m => m.CuisineQrCantineComponent)
      },
      {
        path: 'cuisine/reclamations',
        canActivate: [b2bRoleGuard(['RESPONSABLE_SITE_KIKI', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/cuisine/reclamations/cuisine-reclamations.component').then(m => m.CuisineReclamationsComponent)
      },
      {
        path: 'cuisine/utilisateurs',
        canActivate: [b2bRoleGuard(['RESPONSABLE_SITE_KIKI', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/cuisine/utilisateurs/cuisine-utilisateurs.component').then(m => m.CuisineUtilisateursComponent)
      },
      {
        path: 'cuisine/facturation',
        canActivate: [b2bRoleGuard(['RESPONSABLE_SITE_KIKI', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/cuisine/facturation/cuisine-facturation.component').then(m => m.CuisineFacturationComponent)
      },
      {
        path: 'cuisine/infos',
        redirectTo: 'cuisine/utilisateurs',
        pathMatch: 'full'
      },

      // Employé
      {
        path: 'employe/menu',
        canActivate: [b2bRoleGuard(['SALARIE_CONVENTIONNE', 'SALARIE_AUTONOME', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/employe/menu/b2b-commande.component').then(m => m.B2bCommandeComponent)
      },
      {
        path: 'employe/panier',
        redirectTo: 'employe/menu',
        pathMatch: 'full'
      },
      {
        path: 'employe/commandes',
        canActivate: [b2bRoleGuard(['SALARIE_CONVENTIONNE', 'SALARIE_AUTONOME', 'SUPER_ADMIN'])],
        loadComponent: () => import('../features/employe/commandes/b2b-commandes-liste.component').then(m => m.B2bCommandesListeComponent)
      }
    ]
  }
];
