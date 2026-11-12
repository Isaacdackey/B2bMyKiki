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

  navigerSuperAdmin(section: 'DASHBOARD' | 'ENTREPRISES' | 'CATALOGUE' | 'PLANNING') {
    this.b2b.superAdminActiveSection.set(section);
    this.router.navigate(['/b2b/super-admin']);
    this.b2b.closeMobileDrawer();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  navigerRh(section: 'STATISTIQUES' | 'COMMANDES_SITE' | 'EMPLOYES' | 'FACTURATION') {
    this.b2b.rhActiveSection.set(section);
    this.router.navigate(['/b2b/rh']);
    this.b2b.closeMobileDrawer();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  navigerCuisine(tab: 'PRODUCTION' | 'PLANNING_SEMAINE' | 'SCAN_QR' | 'AUTONOME' | 'BORDEREAUX') {
    this.b2b.cuisineActiveTab.set(tab);
    this.router.navigate(['/b2b/cuisine']);
    this.b2b.closeMobileDrawer();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.b2b.isMobileDrawerOpen()) {
      this.b2b.closeMobileDrawer();
    }
  }
}

