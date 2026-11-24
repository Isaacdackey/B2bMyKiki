import { Routes } from '@angular/router';

export const routes: Routes = [
  // Redirections directes racine vers la connexion B2B
  {
    path: '',
    redirectTo: 'b2b/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    redirectTo: 'b2b/login',
    pathMatch: 'full'
  },
  {
    path: 'commande',
    redirectTo: 'b2b/commande',
    pathMatch: 'full'
  },
  {
    path: 'panier',
    redirectTo: 'b2b/panier',
    pathMatch: 'full'
  },
  {
    path: 'rh',
    redirectTo: 'b2b/rh',
    pathMatch: 'full'
  },
  {
    path: 'cuisine',
    redirectTo: 'b2b/cuisine',
    pathMatch: 'full'
  },
  {
    path: 'super-admin',
    redirectTo: 'b2b/super-admin',
    pathMatch: 'full'
  },

  // Espace B2B principal
  {
    path: 'b2b',
    loadChildren: () => import('./b2b/b2b.routes').then(m => m.B2B_ROUTES)
  },

  // Wildcard redirection vers la connexion B2B
  {
    path: '**',
    redirectTo: 'b2b/login',
    pathMatch: 'full'
  }
];
