import { Component, OnInit, OnDestroy, ViewEncapsulation, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  isOpen = false;
  notifications: AppNotification[] = [];
  count = 0;
  private subs: Subscription[] = [];

  constructor(
    private notifService: NotificationService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.notifService.notifications$.subscribe(n => this.notifications = n),
      this.notifService.count$.subscribe(c => this.count = c)
    );
    this.notifService.startPolling();
    this.notifService.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-bell-wrapper')) {
      this.isOpen = false;
    }
  }

  toggleDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.notifService.loadNotifications();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  onNotifClick(notif: AppNotification): void {
    if (!notif.lu) {
      this.notifService.markAsRead(notif.id).subscribe(() => {
        notif.lu = true;
        this.count = Math.max(0, this.count - 1);
      });
    }

    if (notif.type === 'MISE_A_JOUR' || notif.type === 'UPDATE') {
      this.notifService.supprimerNotificationLocale('MISE_A_JOUR');
      const win = typeof window !== 'undefined' ? (window as any) : null;
      if (win) {
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(reg => {
              if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              reg.update();
            });
          }).catch(() => {});
        }
        if ('caches' in win) {
          win.caches.keys().then((keys: string[]) => {
            Promise.all(keys.map(k => win.caches.delete(k))).then(() => {
              win.location.href = win.location.origin + win.location.pathname;
            }).catch(() => win.location.href = win.location.origin + win.location.pathname);
          }).catch(() => win.location.href = win.location.origin + win.location.pathname);
        } else {
          win.location.href = win.location.origin + win.location.pathname;
        }
      }
      this.isOpen = false;
      return;
    }

    const isClient = this.auth.isClient();

    if (isClient) {
      if (notif.type === 'PROPOSITION_ENVOYEE') {
        this.router.navigate(['/mykiki/propositions'], {
          queryParams: { demandeId: notif.demandeId, propId: notif.propositionEnvoyeeId }
        });
      } else if (notif.type === 'NOUVELLE_COMMANDE' || notif.type === 'STATUT_COMMANDE' || notif.type === 'RAPPEL_COMMANDE_PRETE') {
        this.router.navigate(['/mykiki/commandes'], {
          queryParams: { commandeId: notif.demandeId }
        });
      } else if (notif.demandeId) {
        this.router.navigate(['/mykiki/demandes'], {
          queryParams: { demandeId: notif.demandeId }
        });
      } else {
        this.router.navigate(['/mykiki/demandes']);
      }
    } else {
      // Gestionnaire ou Admin
      if (notif.type === 'NOUVEAU_MESSAGE_CONTACT') {
        this.router.navigate(['/gestionnaire/cms'], {
          queryParams: { tab: 'MESSAGES' }
        });
      } else if (notif.type === 'NOUVELLE_COMMANDE' || notif.type === 'STATUT_COMMANDE' || notif.type === 'COMMANDE_URGENTE' || notif.type === 'COMMANDE_ANNULEE_CLIENT' || notif.type === 'COMMANDE_ANNULEE') {
        this.router.navigate(['/gestionnaire/commandes'], {
          queryParams: { commandeId: notif.demandeId }
        });
      } else if (notif.demandeId) {
        this.router.navigate(['/gestionnaire/demandes'], {
          queryParams: { demandeId: notif.demandeId }
        });
      } else {
        this.router.navigate(['/gestionnaire/demandes']);
      }
    }

    this.isOpen = false;
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.lu = true);
      this.count = 0;
    });
  }

  getNotifIcon(type: string): string {
    const icons: Record<string, string> = {
      'NOUVELLE_DEMANDE': 'fa-file-invoice',
      'PROPOSITION_ENVOYEE': 'fa-paper-plane',
      'SELECTION_CLIENT': 'fa-check-double',
      'DEMANDE_ABOUTIE': 'fa-trophy',
      'DEMANDE_REFUSEE': 'fa-times-circle',
      'NOUVELLE_COMMANDE': 'fa-cart-shopping',
      'STATUT_COMMANDE': 'fa-box-open',
      'COMMANDE_ANNULEE_CLIENT': 'fa-ban',
      'COMMANDE_ANNULEE': 'fa-ban',
      'NOUVEAU_MESSAGE_CONTACT': 'fa-envelope-open-text',
      'COMMANDE_URGENTE': 'fa-triangle-exclamation',
      'RAPPEL_COMMANDE_PRETE': 'fa-clock',
      'MISE_A_JOUR': 'fa-arrows-rotate',
      'UPDATE': 'fa-arrows-rotate'
    };
    return icons[type] || 'fa-bell';
  }

  getNotifIconClass(type: string): string {
    const classes: Record<string, string> = {
      'NOUVELLE_DEMANDE': 'type-new-request',
      'PROPOSITION_ENVOYEE': 'type-proposition',
      'SELECTION_CLIENT': 'type-selection',
      'DEMANDE_ABOUTIE': 'type-aboutie',
      'NOUVELLE_COMMANDE': 'type-commande',
      'STATUT_COMMANDE': 'type-statut',
      'COMMANDE_ANNULEE_CLIENT': 'type-urgent',
      'COMMANDE_ANNULEE': 'type-urgent',
      'NOUVEAU_MESSAGE_CONTACT': 'type-message-contact',
      'COMMANDE_URGENTE': 'type-urgent',
      'RAPPEL_COMMANDE_PRETE': 'type-rappel',
      'MISE_A_JOUR': 'type-mise-a-jour',
      'UPDATE': 'type-mise-a-jour'
    };
    return classes[type] || 'type-new-request';
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
      return date.toLocaleDateString('fr-FR');
    } catch {
      return '';
    }
  }
}
