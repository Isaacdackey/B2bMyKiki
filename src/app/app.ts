import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PwaInstallBannerComponent } from './shared/components/pwa-install-banner.component';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PwaInstallBannerComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  readonly title = 'Mykiki | Kiki Traiteur';

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Vérification du routage spécifique au lancement PWA / application installée
    this.verifierRoutagePwaInitial();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => this.observeAnimations(), 100);
      this.confinementPwaNavigation(event.urlAfterRedirects || event.url);
    });
  }

  /**
   * Détecte si l'application s'exécute en mode PWA standalone (installée sur l'appareil)
   */
  private isPwaMode(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           window.location.search.includes('source=pwa');
  }

  /**
   * Vérifie si un chemin appartient au site vitrine public
   */
  private isPublicSitePath(path: string): boolean {
    const cleanPath = path.split('?')[0].split('#')[0];
    const publicPaths = [
      '/',
      '',
      '/a-propos',
      '/prestations',
      '/realisations',
      '/contact',
      '/devis',
      '/catalogue',
      '/mentions-legales',
      '/politique-confidentialite'
    ];
    return publicPaths.includes(cleanPath);
  }

  /**
   * Logique d'ouverture après installation de l'application :
   * - Si déjà connecté en tant que client -> Espace MyKiki (/mykiki)
   * - Si connecté en tant que gestionnaire / admin -> Dashboard (/gestionnaire/dashboard)
   * - Si non connecté -> Interface de connexion dédiée de l'application (/login-client)
   */
  private verifierRoutagePwaInitial(): void {
    if (!this.isPwaMode()) return;

    const currentPath = window.location.pathname;

    if (this.isPublicSitePath(currentPath)) {
      if (this.auth.isLoggedIn()) {
        const user = this.auth.getCurrentUser();
        if (user?.role === 'CLIENT') {
          this.router.navigate(['/mykiki']);
          return;
        } else if (user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE') {
          this.router.navigate(['/gestionnaire/dashboard']);
          return;
        }
      }

      // Si l'utilisateur n'est pas connecté dans l'application installée,
      // on l'oriente directement vers l'interface de connexion de l'application
      this.router.navigate(['/login-client']);
    }
  }

  /**
   * Confinement PWA : Dans l'application installée, toute navigation vers une page
   * du site vitrine est automatiquement redirigée vers MyKiki ou l'interface de connexion.
   */
  private confinementPwaNavigation(url: string): void {
    if (!this.isPwaMode()) return;

    if (this.isPublicSitePath(url)) {
      if (this.auth.isLoggedIn() && this.auth.isClient()) {
        this.router.navigate(['/mykiki']);
      } else if (!this.auth.isLoggedIn()) {
        this.router.navigate(['/login-client']);
      }
    }
  }

  private observeAnimations(): void {
    const animElements = Array.from(document.querySelectorAll('.animate-fade, .animate-on-scroll'));
    if ('IntersectionObserver' in window && animElements.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      animElements.forEach(el => observer.observe(el));
    } else {
      animElements.forEach(el => el.classList.add('visible'));
    }

    const revealEls = Array.from(document.querySelectorAll('.reveal'));
    if ('IntersectionObserver' in window && revealEls.length > 0) {
      const revObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade', 'visible');
            revObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      revealEls.forEach(el => revObserver.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('animate-fade', 'visible'));
    }
  }
}
