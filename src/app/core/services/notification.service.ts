import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, switchMap, startWith } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: number;
  type: string;
  message: string;
  demandeId?: number;
  propositionEnvoyeeId?: number;
  lu: boolean;
  createdAt: string;
}

const API_BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  private countSubject = new BehaviorSubject<number>(0);

  notifications$ = this.notificationsSubject.asObservable();
  count$ = this.countSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {}

  /**
   * Démarre le polling des notifications (toutes les 30 secondes par défaut).
   * À appeler depuis le layout gestionnaire / client au ngOnInit.
   */
  startPolling(intervalMs: number = 30000): void {
    if (!this.auth.isLoggedIn()) return;

    interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.fetchCount())
    ).subscribe({
      next: (data) => this.countSubject.next(data.count || 0),
      error: (e) => console.warn('Erreur polling notifications:', e)
    });
  }

  /** Récupère les notifications non lues */
  getUnread(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${API_BASE}/api/notifications`);
  }

  /** Nombre de notifications non lues */
  fetchCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${API_BASE}/api/notifications/count`);
  }

  /** Charge et met à jour le sujet */
  loadNotifications(): void {
    this.getUnread().subscribe({
      next: (notifs) => {
        const localNotifs = this.notificationsSubject.value.filter(n => n.id < 0 && !n.lu);
        const merged = [...localNotifs, ...(notifs || [])];
        this.notificationsSubject.next(merged);
        this.countSubject.next(merged.filter(n => !n.lu).length);
      },
      error: (e) => console.warn('Erreur chargement notifications:', e)
    });
  }

  /** Ajoute ou met à jour une notification locale (ex: mise à jour disponible) */
  ajouterNotificationLocale(notif: AppNotification): void {
    const list = this.notificationsSubject.value;
    if (!list.some(n => n.id === notif.id || (n.type === notif.type && n.message === notif.message))) {
      const updated = [notif, ...list];
      this.notificationsSubject.next(updated);
      this.countSubject.next(updated.filter(n => !n.lu).length);
    }
  }

  /** Supprime les notifications locales d'un type donné (ex: MISE_A_JOUR) */
  supprimerNotificationLocale(type: string): void {
    const list = this.notificationsSubject.value;
    const filtered = list.filter(n => n.type !== type && n.id !== -999);
    if (filtered.length !== list.length) {
      this.notificationsSubject.next(filtered);
      this.countSubject.next(filtered.filter(n => !n.lu).length);
    }
  }

  /** Marque une notification comme lue */
  markAsRead(id: number): Observable<void> {
    if (id < 0) {
      // Notification locale
      const list = this.notificationsSubject.value.map(n => n.id === id ? { ...n, lu: true } : n);
      this.notificationsSubject.next(list);
      this.countSubject.next(list.filter(n => !n.lu).length);
      return new Observable(obs => { obs.next(); obs.complete(); });
    }
    return this.http.put<void>(`${API_BASE}/api/notifications/${id}/read`, {});
  }

  /** Marque toutes comme lues */
  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${API_BASE}/api/notifications/read-all`, {});
  }

  get count(): number {
    return this.countSubject.value;
  }

  get notifications(): AppNotification[] {
    return this.notificationsSubject.value;
  }
}
