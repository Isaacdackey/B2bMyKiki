import { Routes } from '@angular/router';
import { B2bLayoutComponent } from './shared/b2b-layout.component';

export const B2B_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('../features/auth/login/b2b-login.component').then(m => m.B2bLoginComponent)
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
      { path: 'panier', redirectTo: 'employe/panier', pathMatch: 'full' },
      { path: 'commandes', redirectTo: 'employe/commandes', pathMatch: 'full' },

      // Super Admin
      {
        path: 'super-admin/dashboard',
        loadComponent: () => import('../features/super-admin/dashboard/sa-dashboard.component').then(m => m.SaDashboardComponent)
      },
      {
        path: 'super-admin/entreprises',
        loadComponent: () => import('../features/super-admin/entreprises/sa-entreprises.component').then(m => m.SaEntreprisesComponent)
      },
      {
        path: 'super-admin/catalogue',
        loadComponent: () => import('../features/super-admin/catalogue/sa-catalogue.component').then(m => m.SaCatalogueComponent)
      },
      {
        path: 'super-admin/planning',
        loadComponent: () => import('../features/super-admin/planning/sa-planning.component').then(m => m.SaPlanningComponent)
      },

      // RH Entreprise
      {
        path: 'rh/dashboard',
        loadComponent: () => import('../features/rh-entreprise/dashboard/rh-dashboard.component').then(m => m.RhDashboardComponent)
      },
      {
        path: 'rh/commandes',
        loadComponent: () => import('../features/rh-entreprise/commandes/rh-commandes.component').then(m => m.RhCommandesComponent)
      },
      {
        path: 'rh/employes',
        loadComponent: () => import('../features/rh-entreprise/employes/rh-employes.component').then(m => m.RhEmployesComponent)
      },
      {
        path: 'rh/facturation',
        loadComponent: () => import('../features/rh-entreprise/facturation/rh-facturation.component').then(m => m.RhFacturationComponent)
      },

      // Cuisine / Responsable de Site Kiki
      {
        path: 'cuisine/dashboard',
        loadComponent: () => import('../features/cuisine/dashboard/cuisine-dashboard.component').then(m => m.CuisineDashboardComponent)
      },
      {
        path: 'cuisine/menu',
        loadComponent: () => import('../features/cuisine/menu/cuisine-menu.component').then(m => m.CuisineMenuComponent)
      },
      {
        path: 'cuisine/commandes',
        loadComponent: () => import('../features/cuisine/commandes/cuisine-commandes.component').then(m => m.CuisineCommandesComponent)
      },
      {
        path: 'cuisine/qr',
        loadComponent: () => import('../features/cuisine/qr-cantine/cuisine-qr-cantine.component').then(m => m.CuisineQrCantineComponent)
      },
      {
        path: 'cuisine/reclamations',
        loadComponent: () => import('../features/cuisine/reclamations/cuisine-reclamations.component').then(m => m.CuisineReclamationsComponent)
      },
      {
        path: 'cuisine/utilisateurs',
        loadComponent: () => import('../features/cuisine/utilisateurs/cuisine-utilisateurs.component').then(m => m.CuisineUtilisateursComponent)
      },
      {
        path: 'cuisine/facturation',
        loadComponent: () => import('../features/cuisine/facturation/cuisine-facturation.component').then(m => m.CuisineFacturationComponent)
      },
      {
        path: 'cuisine/infos',
        loadComponent: () => import('../features/cuisine/infos/cuisine-infos.component').then(m => m.CuisineInfosComponent)
      },

      // Employé
      {
        path: 'employe/menu',
        loadComponent: () => import('../features/employe/menu/b2b-commande.component').then(m => m.B2bCommandeComponent)
      },
      {
        path: 'employe/panier',
        loadComponent: () => import('../features/employe/panier/b2b-panier.component').then(m => m.B2bPanierComponent)
      },
      {
        path: 'employe/commandes',
        loadComponent: () => import('../features/employe/commandes/b2b-commandes-liste.component').then(m => m.B2bCommandesListeComponent)
      }
    ]
  }
];
