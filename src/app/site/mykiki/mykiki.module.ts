import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./mykiki-layout.component').then(m => m.MyKikiLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./mykiki-home.component').then(m => m.MyKikiHomeComponent)
      },
      {
        path: 'profil',
        loadComponent: () => import('./mykiki-profil.component').then(m => m.MyKikiProfilComponent)
      },
      {
        path: 'propositions',
        redirectTo: 'commandes',
        pathMatch: 'full'
      },
      {
        path: 'demandes',
        redirectTo: 'commandes',
        pathMatch: 'full'
      },
      {
        path: 'devis',
        redirectTo: 'commandes',
        pathMatch: 'full'
      },
      {
        path: 'nouvelle-demande',
        loadComponent: () => import('./mykiki-nouvelle-demande.component').then(m => m.MyKikiNouvelleDemandeComponent)
      },
      // — Commande de mets —
      {
        path: 'catalogue',
        loadComponent: () => import('./mykiki-catalogue.component').then(m => m.MyKikiCatalogueComponent)
      },
      {
        path: 'panier',
        loadComponent: () => import('./mykiki-panier.component').then(m => m.MyKikiPanierComponent)
      },
      {
        path: 'commandes',
        loadComponent: () => import('./mykiki-commandes.component').then(m => m.MyKikiCommandesComponent)
      }
    ]
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyKikiModule {}
