import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../../services/gestionnaire-api.service';
import { environment } from '../../../environments/environment';

export interface AdminUserResponse {
  id: number;
  username: string;
  fullName: string;
  role: string;
  poste?: string;
  departement?: string;
  customLoginSlug: string;
  active: boolean;
  tempPasswordChangeRequired: boolean;
  createdAt: string;
  lastLoginAt: string;
  tempPassword?: string;
  loginUrl?: string;
  telephone?: string;
  phone?: string;
  _roleLabel?: string;
}

export type PersonnelRole =
  'ADMIN' | 'ADMINISTRATION' | 'GESTIONNAIRE' | 'PERSONNEL' |
  'RESPONSABLE_CUISINE' | 'SOUS_CHEF' | 'ECONOME' | 'MAGASINIER' |
  'CONTROLEUR' | 'CUISINIER' | 'SERVEUR' | 'AIDE_CUISINIER' |
  'CHAUFFEUR' | 'PLONGEUR' | 'AGENT_SECURITE';

export interface AdminCreateUserRequest {
  fullName: string;
  username: string;
  role: PersonnelRole;
}

export interface AdminUpdateUserRequest {
  fullName: string;
  username: string;
  role: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminPersonnelService {
  private apiUrl = `${environment.apiUrl}/api/admin/users`;

  constructor(private http: HttpClient) {}

  getAllStaff(page: number = 0, size: number = 10): Observable<PageResponse<AdminUserResponse>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<PageResponse<AdminUserResponse>>(this.apiUrl, { params });
  }

  createStaffUser(data: AdminCreateUserRequest): Observable<AdminUserResponse> {
    return this.http.post<AdminUserResponse>(this.apiUrl, data);
  }

  updateStaffUser(id: number, data: AdminUpdateUserRequest): Observable<AdminUserResponse> {
    return this.http.put<AdminUserResponse>(`${this.apiUrl}/${id}`, data);
  }

  deleteStaffUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Réinitialise l'accès : nouveau mot de passe temporaire généré côté backend.
   * Retourne la réponse avec tempPassword visible une seule fois.
   */
  resetAccess(id: number): Observable<AdminUserResponse> {
    return this.http.post<AdminUserResponse>(`${this.apiUrl}/${id}/reset-access`, {});
  }

  /**
   * Active ou désactive un compte utilisateur.
   */
  toggleActive(id: number, active: boolean): Observable<AdminUserResponse> {
    return this.http.patch<AdminUserResponse>(`${this.apiUrl}/${id}/toggle-active?active=${active}`, {});
  }
}
