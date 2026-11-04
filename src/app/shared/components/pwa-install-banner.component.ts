import { Component, OnInit, OnDestroy, ChangeDetectorRef, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-install-banner.component.html',
  styleUrl: './pwa-install-banner.component.css'
})
export class PwaInstallBannerComponent implements OnInit, OnDestroy {
  deferredPrompt: any = null;
  showBanner = true;
  isInstalled = false;
  showIosGuide = false;
  hasUpdate = false;
  private currentAppVersion: string | null = null;
  private timerReapparition: any = null;
  private updateCheckInterval: any = null;

  constructor(
    private cdr: ChangeDetectorRef,
    @Optional() private notifService?: NotificationService
  ) {}

  private notifierMiseAJour(): void {
    this.hasUpdate = true;
    if (this.notifService) {
      this.notifService.ajouterNotificationLocale({
        id: -999,
        type: 'MISE_A_JOUR',
        message: 'Une nouvelle version de Mykiki est prête. Touchez pour mettre à jour.',
        lu: false,
        createdAt: new Date().toISOString()
      });
    }
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    // 1. Vérifier si l'application s'exécute déjà en mode PWA installé
    this.verifierSiDejaInstalle();

    // 2. Initialiser la détection de mise à jour
    this.initUpdateChecker();

    // 3. Écouter l'événement beforeinstallprompt
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e;
        if (!this.isInstalled && !this.hasUpdate) {
          this.showBanner = true;
          this.cdr.detectChanges();
        }
      });

      window.addEventListener('appinstalled', () => {
        this.isInstalled = true;
        try { localStorage.setItem('kiki_pwa_installed', 'true'); } catch {}
        this.showBanner = false;
        this.deferredPrompt = null;
        if (this.timerReapparition) {
          clearTimeout(this.timerReapparition);
        }
        this.cdr.detectChanges();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.timerReapparition) {
      clearTimeout(this.timerReapparition);
    }
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }
  }

  private initUpdateChecker(): void {
    if (typeof window === 'undefined') return;

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 1. Initialisation de la version de départ au chargement de l'application
    // L'application qui démarre est calée sur cette version initiale (pas de fausse alerte immédiate)
    fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.version) {
          this.currentAppVersion = data.version;
          try {
            localStorage.setItem('kiki_app_version', data.version);
          } catch {}
        }
        // Supprimer toute notification de mise à jour résiduelle au démarrage
        this.hasUpdate = false;
        this.notifService?.supprimerNotificationLocale('MISE_A_JOUR');
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.hasUpdate = false;
        this.notifService?.supprimerNotificationLocale('MISE_A_JOUR');
      });

    // En environnement de développement local (ng serve), ne pas déclencher d'alertes intempestives
    if (isLocalhost) return;

    // 2. Écoute du Service Worker natif en production
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        if (reg.waiting && this.currentAppVersion) {
          this.verifierNouvelleVersion();
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller && this.currentAppVersion) {
                this.verifierNouvelleVersion();
              }
            });
          }
        });
      });
    }

    // 3. Vérification périodique espacée (toutes les 5 minutes)
    this.updateCheckInterval = setInterval(() => {
      this.verifierNouvelleVersion();
    }, 300000);

    // 4. Vérifier quand l'onglet redevient actif après une absence (seulement si la version initiale est établie)
    window.addEventListener('focus', () => {
      if (this.currentAppVersion) {
        this.verifierNouvelleVersion();
      }
    });
  }

  private verifierNouvelleVersion(): void {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    if (!this.currentAppVersion) return;

    fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.version) {
          if (data.version !== this.currentAppVersion) {
            // Une nouvelle version a réellement été publiée pendant la session
            this.notifierMiseAJour();
          } else {
            // Version identique : aucune alerte
            this.hasUpdate = false;
            this.notifService?.supprimerNotificationLocale('MISE_A_JOUR');
            this.cdr.detectChanges();
          }
        }
      })
      .catch(() => {});
  }

  appliquerMiseAJour(): void {
    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (!win) return;

    // 1. Notifier le ServiceWorker
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          reg.update();
        });
      }).catch(() => {});
    }

    const rechargerPage = () => {
      win.location.href = win.location.origin + win.location.pathname;
    };

    // 2. Mettre à jour la version enregistrée
    fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.version && typeof localStorage !== 'undefined') {
          localStorage.setItem('kiki_app_version', data.version);
        }
      })
      .catch(() => {})
      .finally(() => {
        // 3. Vider les caches et recharger immédiatement la page
        if (typeof caches !== 'undefined' && caches.keys) {
          caches.keys().then(keys => {
            Promise.all(keys.map(k => caches.delete(k))).then(() => {
              rechargerPage();
            }).catch(() => {
              rechargerPage();
            });
          }).catch(() => {
            rechargerPage();
          });
        } else {
          rechargerPage();
        }
      });
  }

  ignorerMiseAJour(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.hasUpdate = false;
    this.notifService?.supprimerNotificationLocale('MISE_A_JOUR');
    this.cdr.detectChanges();
  }

  private verifierSiDejaInstalle(): void {
    if (typeof window === 'undefined') return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true ||
                         window.location.search.includes('source=pwa') ||
                         localStorage.getItem('kiki_pwa_installed') === 'true';
    this.isInstalled = isStandalone;
  }

  installer(): void {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          this.isInstalled = true;
          try { localStorage.setItem('kiki_pwa_installed', 'true'); } catch {}
          this.showBanner = false;
        }
        this.deferredPrompt = null;
        this.cdr.detectChanges();
      });
    } else {
      const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        this.showIosGuide = !this.showIosGuide;
      } else {
        alert("Pour installer Mykiki, cliquez sur l'icône d'installation dans la barre d'adresse de votre navigateur ou dans le menu de votre navigateur.");
      }
      this.cdr.detectChanges();
    }
  }

  fermer(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showBanner = false;
    this.showIosGuide = false;
    this.cdr.detectChanges();

    // Réapparaît automatiquement 10 secondes après la fermeture
    if (this.timerReapparition) {
      clearTimeout(this.timerReapparition);
    }
    this.timerReapparition = setTimeout(() => {
      this.verifierSiDejaInstalle();
      if (!this.isInstalled && !this.hasUpdate) {
        this.showBanner = true;
        this.cdr.detectChanges();
      }
    }, 10000);
  }
}
