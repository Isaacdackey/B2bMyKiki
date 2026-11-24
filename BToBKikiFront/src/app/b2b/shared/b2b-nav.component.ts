import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { B2bStateService } from './b2b-state.service';

@Component({
  selector: 'app-b2b-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './b2b-nav.component.html',
  styleUrls: ['./b2b-nav.component.css']
})
export class B2bNavComponent {
  b2b = inject(B2bStateService);
  private router = inject(Router);

  onNavClick() {
    this.b2b.closeMobileDrawer();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  navigerSuperAdmin(section: 'DASHBOARD' | 'ENTREPRISES' | 'CATALOGUE' | 'PLANNING') {
    this.b2b.superAdminActiveSection.set(section);
    const routeMap = {
      DASHBOARD: '/b2b/super-admin/dashboard',
      ENTREPRISES: '/b2b/super-admin/entreprises',
      CATALOGUE: '/b2b/super-admin/catalogue',
      PLANNING: '/b2b/super-admin/planning'
    };
    this.router.navigate([routeMap[section]]);
    this.onNavClick();
  }

  navigerRh(section: 'STATISTIQUES' | 'COMMANDES_SITE' | 'EMPLOYES' | 'FACTURATION') {
    this.b2b.rhActiveSection.set(section);
    const routeMap = {
      STATISTIQUES: '/b2b/rh/dashboard',
      COMMANDES_SITE: '/b2b/rh/commandes',
      EMPLOYES: '/b2b/rh/employes',
      FACTURATION: '/b2b/rh/facturation'
    };
    this.router.navigate([routeMap[section]]);
    this.onNavClick();
  }

  navigerCuisine(tab: 'DASHBOARD' | 'INFOS' | 'UTILISATEURS' | 'MENU' | 'COMMANDES' | 'FACTURATION' | 'RECLAMATIONS' | 'PROJECTION_QR') {
    this.b2b.cuisineActiveTab.set(tab);
    const routeMap = {
      DASHBOARD: '/b2b/cuisine/dashboard',
      MENU: '/b2b/cuisine/menu',
      COMMANDES: '/b2b/cuisine/commandes',
      PROJECTION_QR: '/b2b/cuisine/qr',
      RECLAMATIONS: '/b2b/cuisine/reclamations',
      UTILISATEURS: '/b2b/cuisine/utilisateurs',
      FACTURATION: '/b2b/cuisine/facturation',
      INFOS: '/b2b/cuisine/infos'
    };
    this.router.navigate([routeMap[tab]]);
    this.onNavClick();
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.b2b.isMobileDrawerOpen()) {
      this.b2b.closeMobileDrawer();
    }
  }
}

