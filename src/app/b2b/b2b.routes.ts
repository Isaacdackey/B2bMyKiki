import { Routes } from '@angular/router';

export const B2B_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
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
    path: 'rh',
    loadComponent: () => import('./rh-entreprise/b2b-rh-dashboard.component').then(m => m.B2bRhDashboardComponent)
  },
  {
    path: 'cuisine',
    loadComponent: () => import('./cuisine/b2b-cuisine-production.component').then(m => m.B2bCuisineProductionComponent)
  },
  {
    path: 'evenements',
    loadComponent: () => import('./evenements/b2b-evenements-devis.component').then(m => m.B2bEvenementsDevisComponent)
  }
];

