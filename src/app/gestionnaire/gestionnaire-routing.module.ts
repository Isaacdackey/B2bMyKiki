import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionnaireLayoutComponent } from './gestionnaire.component';

// We will add the components later when we create them
const routes: Routes = [
  {
    path: '',
    component: GestionnaireLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'demandes', loadComponent: () => import('./components/demandes/demandes.component').then(m => m.DemandesComponent) },
      { path: 'propositions', loadComponent: () => import('./components/propositions/propositions.component').then(m => m.PropositionsComponent) },
      { path: 'agenda', loadComponent: () => import('./components/agenda/agenda.component').then(m => m.AgendaComponent) },
      { path: 'mediatheque', loadComponent: () => import('./components/mediatheque/mediatheque.component').then(m => m.MediathequeComponent) },
      { path: 'cms', loadComponent: () => import('./components/cms/cms.component').then(m => m.CmsComponent) },
      { path: 'clients', loadComponent: () => import('./components/clients/clients.component').then(m => m.ClientsComponent) },
      { path: 'personnel', loadComponent: () => import('./components/personnel/personnel.component').then(m => m.PersonnelComponent) },
      { path: 'sync', loadComponent: () => import('./components/google-sync/google-sync.component').then(m => m.GoogleSyncComponent) },
      // — Module Commandes & Catalogue & Fidélité —
      { path: 'commandes', loadComponent: () => import('./components/commandes/commandes.component').then(m => m.CommandesComponent) },
      { path: 'avis', loadComponent: () => import('./components/avis/avis.component').then(m => m.AvisComponent) },
      { path: 'catalogue', loadComponent: () => import('./components/catalogue/catalogue.component').then(m => m.CatalogueComponent) },
      { path: 'fidelite', loadComponent: () => import('./components/fidelite/fidelite.component').then(m => m.FideliteComponent) }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionnaireRoutingModule { }
