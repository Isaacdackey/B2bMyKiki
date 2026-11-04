import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SiteComponent } from './site.component';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { PrestationsComponent } from './pages/prestations/prestations.component';
import { RealisationsComponent } from './pages/realisations/realisations.component';
import { ContactComponent } from './pages/contact/contact.component';
import { LoginStaffComponent } from './auth/login-staff/login-staff.component';
import { DevisComponent } from './pages/devis/devis.component';
import { MentionsLegalesComponent } from './pages/mentions-legales/mentions-legales.component';
import { PolitiqueConfidentialiteComponent } from './pages/politique-confidentialite/politique-confidentialite.component';
import { CataloguePublicComponent } from './pages/catalogue-public/catalogue-public.component';

@NgModule({
  imports: [
    CommonModule,
    SiteComponent,
    HomeComponent,
    AboutComponent,
    PrestationsComponent,
    RealisationsComponent,
    ContactComponent,
    LoginStaffComponent,
    DevisComponent,
    MentionsLegalesComponent,
    PolitiqueConfidentialiteComponent,
    CataloguePublicComponent,
    RouterModule.forChild([
      {
        path: '',
        component: SiteComponent,
        children: [
          { path: '', component: HomeComponent },
          { path: 'a-propos', component: AboutComponent },
          { path: 'prestations', component: PrestationsComponent },
          { path: 'catalogue', component: CataloguePublicComponent },
          { path: 'realisations', component: RealisationsComponent },
          { path: 'contact', component: ContactComponent },
          { path: 'login-staff', redirectTo: '/login', pathMatch: 'full' },
          { path: 'admin-login', redirectTo: '/login', pathMatch: 'full' },
          { path: 'kiki-admin', redirectTo: '/login', pathMatch: 'full' },
          { path: 'gestionnaire-login', redirectTo: '/login', pathMatch: 'full' },
          { path: 'devis', component: DevisComponent },
          { path: 'mentions-legales', component: MentionsLegalesComponent },
          { path: 'politique-confidentialite', component: PolitiqueConfidentialiteComponent }
        ]
      }
    ])
  ]
})
export class SiteModule {}
