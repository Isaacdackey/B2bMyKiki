import { Routes } from '@angular/router';

export const B2B_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/b2b-home.component').then(m => m.B2bHomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/b2b-login.component').then(m => m.B2bLoginComponent)
  },
  {
    path: 'commande',
    loadComponent: () => import('./employe/b2b-commande.component').then(m => m.B2bCommandeComponent)
  },
  {
    path: 'panier',
    loadComponent: () => import('./employe/b2b-panier.component').then(m => m.B2bPanierComponent)
  },
  {
    path: 'rh',
    loadComponent: () => import('./rh-entreprise/b2b-rh-dashboard.component').then(m => m.B2bRhDashboardComponent)
  },
  {
    path: 'cuisine',
    loadComponent: () => import('./cuisine/b2b-cuisine-production.component').then(m => m.B2bCuisineProductionComponent)
  },
  {
    path: 'super-admin',
    loadComponent: () => import('./super-admin/b2b-super-admin.component').then(m => m.B2bSuperAdminComponent)
  }
];

