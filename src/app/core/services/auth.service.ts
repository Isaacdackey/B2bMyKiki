import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'GESTIONNAIRE' | 'PERSONNEL' | 'CLIENT';
  tempPasswordChangeRequired: boolean;
  redirectUrl: string;
}

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  role: string;
  tempPasswordChangeRequired: boolean;
  active: boolean;
  customLoginSlug?: string;
}

const API_BASE = environment.apiUrl;
const TOKEN_KEY = 'kiki_jwt_token';
const USER_KEY = 'kiki_current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Restaurer la session depuis sessionStorage ou localStorage au démarrage
    const stored = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        this.currentUserSubject.next(JSON.parse(stored));
      } catch {
        this.clearSession();
      }
    }
  }

  /**
   * Connexion classique (username + password) ou via slug
   */
  login(username: string, password: string, slug?: string): Observable<LoginResponse> {
    const payload: any = { username, password };
    if (slug) payload.slug = slug;

    return this.http.post<LoginResponse>(`${API_BASE}/api/auth/login`, payload).pipe(
      tap(response => this.enregistrerSession(response))
    );
  }

  /**
   * Ouvre une session à partir d'une réponse d'authentification.
   */
  enregistrerSession(response: LoginResponse): void {
    sessionStorage.setItem(TOKEN_KEY, response.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(response));
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    localStorage.setItem('kiki_has_account', 'true');
    this.currentUserSubject.next(response);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'ADMIN';
  }

  isGestionnaire(): boolean {
    const role = this.getCurrentUser()?.role;
    return role === 'GESTIONNAIRE' || role === 'ADMIN';
  }

  isPersonnel(): boolean {
    return this.getCurrentUser()?.role === 'PERSONNEL';
  }

  isClient(): boolean {
    return this.getCurrentUser()?.role === 'CLIENT';
  }

  /** Ensemble des rôles qui ont accès au back-office */
  private static readonly BACK_OFFICE_ROLES = new Set([
    'ADMIN', 'GESTIONNAIRE', 'PERSONNEL',
    'RESPONSABLE_CUISINE', 'SOUS_CHEF', 'ECONOME', 'MAGASINIER',
    'CONTROLEUR', 'CUISINIER', 'SERVEUR', 'AIDE_CUISINIER',
    'CHAUFFEUR', 'PLONGEUR', 'AGENT_SECURITE'
  ]);

  isBackOfficeUser(): boolean {
    const role = this.getCurrentUser()?.role;
    return !!role && AuthService.BACK_OFFICE_ROLES.has(role);
  }

  needsPasswordChange(): boolean {
    return !!this.getCurrentUser()?.tempPasswordChangeRequired;
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API_BASE}/api/auth/me`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${API_BASE}/api/auth/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      tap(() => {
        // Mettre à jour le flag localement
        const user = this.getCurrentUser();
        if (user) {
          user.tempPasswordChangeRequired = false;
          sessionStorage.setItem(USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  // Admin endpoints
  getAllUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${API_BASE}/api/admin/users`);
  }

  createUser(userData: any): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${API_BASE}/api/admin/users`, userData);
  }

  resetUserAccess(userId: number): Observable<any> {
    return this.http.put<any>(`${API_BASE}/api/admin/users/${userId}/reset-access`, {});
  }

  toggleUserActive(userId: number, active: boolean): Observable<any> {
    return this.http.put<any>(`${API_BASE}/api/admin/users/${userId}/toggle-active?active=${active}`, {});
  }

  private clearSession(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
  }
}
