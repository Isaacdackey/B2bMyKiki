import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EntrepriseB2B,
  EmployeB2B,
  PlatB2B,
  CommandeEntrepriseSite,
  ReclamationCutOffB2B,
  FacturationLigneJournaliere,
  MenuPlanifieJourEntreprise
} from './b2b.models';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class B2bApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://b2bmykiki.onrender.com/api/v1';

  private getHeaders(): HttpHeaders {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('b2b_jwt_token') : null;
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  login(email: string, password: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/auth/login`, { email, password });
  }

  registerAutonome(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/auth/register-autonome`, payload);
  }

  verifyInvitation(token: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/auth/invitation/verify?token=${encodeURIComponent(token)}`);
  }

  activateInvitation(payload: { token: string; password: string; nomComplet?: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/auth/invitation/activate`, payload);
  }

  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  verifyResetToken(token: string): Observable<ApiResponse<{ email: string }>> {
    return this.http.get<ApiResponse<{ email: string }>>(`${this.baseUrl}/auth/reset-password/verify?token=${encodeURIComponent(token)}`);
  }

  resetPassword(payload: { token: string; newPassword: string }): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/auth/reset-password`, payload);
  }

  getEntreprises(): Observable<ApiResponse<EntrepriseB2B[]>> {
    return this.http.get<ApiResponse<EntrepriseB2B[]>>(`${this.baseUrl}/b2b/entreprises`, { headers: this.getHeaders() });
  }

  createEntreprise(ent: Partial<EntrepriseB2B>): Observable<ApiResponse<EntrepriseB2B>> {
    return this.http.post<ApiResponse<EntrepriseB2B>>(`${this.baseUrl}/b2b/entreprises`, ent, { headers: this.getHeaders() });
  }

  updateEntreprise(id: string, ent: Partial<EntrepriseB2B>): Observable<ApiResponse<EntrepriseB2B>> {
    return this.http.put<ApiResponse<EntrepriseB2B>>(`${this.baseUrl}/b2b/entreprises/${id}`, ent, { headers: this.getHeaders() });
  }

  toggleArchiveEntreprise(id: string): Observable<ApiResponse<EntrepriseB2B>> {
    return this.http.patch<ApiResponse<EntrepriseB2B>>(`${this.baseUrl}/b2b/entreprises/${id}/archive`, {}, { headers: this.getHeaders() });
  }

  getEmployes(entrepriseId?: string): Observable<ApiResponse<EmployeB2B[]>> {
    const q = entrepriseId ? `?entrepriseId=${encodeURIComponent(entrepriseId)}` : '';
    return this.http.get<ApiResponse<EmployeB2B[]>>(`${this.baseUrl}/b2b/employes${q}`, { headers: this.getHeaders() });
  }

  createEmploye(emp: Partial<EmployeB2B>): Observable<ApiResponse<EmployeB2B>> {
    return this.http.post<ApiResponse<EmployeB2B>>(`${this.baseUrl}/b2b/employes`, emp, { headers: this.getHeaders() });
  }

  updateTauxSubvention(id: string, tauxSubvention: number): Observable<ApiResponse<EmployeB2B>> {
    return this.http.patch<ApiResponse<EmployeB2B>>(`${this.baseUrl}/b2b/employes/${id}/taux`, { tauxSubvention }, { headers: this.getHeaders() });
  }

  toggleActifEmploye(id: string): Observable<ApiResponse<EmployeB2B>> {
    return this.http.patch<ApiResponse<EmployeB2B>>(`${this.baseUrl}/b2b/employes/${id}/toggle-actif`, {}, { headers: this.getHeaders() });
  }

  getCatalogue(includeArchived = false): Observable<ApiResponse<PlatB2B[]>> {
    return this.http.get<ApiResponse<PlatB2B[]>>(`${this.baseUrl}/b2b/catalogue?includeArchived=${includeArchived}`, { headers: this.getHeaders() });
  }

  createPlat(plat: Partial<PlatB2B>): Observable<ApiResponse<PlatB2B>> {
    return this.http.post<ApiResponse<PlatB2B>>(`${this.baseUrl}/b2b/catalogue`, plat, { headers: this.getHeaders() });
  }

  updatePlat(id: string, plat: Partial<PlatB2B>): Observable<ApiResponse<PlatB2B>> {
    return this.http.put<ApiResponse<PlatB2B>>(`${this.baseUrl}/b2b/catalogue/${id}`, plat, { headers: this.getHeaders() });
  }

  toggleArchivePlat(id: string): Observable<ApiResponse<PlatB2B>> {
    return this.http.patch<ApiResponse<PlatB2B>>(`${this.baseUrl}/b2b/catalogue/${id}/archive`, {}, { headers: this.getHeaders() });
  }

  toggleDisponibilitePlat(id: string): Observable<ApiResponse<PlatB2B>> {
    return this.http.patch<ApiResponse<PlatB2B>>(`${this.baseUrl}/b2b/catalogue/${id}/disponibilite`, {}, { headers: this.getHeaders() });
  }

  getPlanning(entrepriseId?: string): Observable<ApiResponse<MenuPlanifieJourEntreprise[]>> {
    const q = entrepriseId ? `?entrepriseId=${encodeURIComponent(entrepriseId)}` : '';
    return this.http.get<ApiResponse<MenuPlanifieJourEntreprise[]>>(`${this.baseUrl}/b2b/planning${q}`, { headers: this.getHeaders() });
  }

  ajouterPlatPlanning(entrepriseId: string, jourNom: string, platId: string, quantitePrevue = 35): Observable<ApiResponse<MenuPlanifieJourEntreprise>> {
    return this.http.post<ApiResponse<MenuPlanifieJourEntreprise>>(
      `${this.baseUrl}/b2b/planning/ajouter-plat`,
      { entrepriseId, jourNom, platId, quantitePrevue },
      { headers: this.getHeaders() }
    );
  }

  supprimerLignePlanning(ligneId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/b2b/planning/lignes/${ligneId}`, { headers: this.getHeaders() });
  }

  dupliquerPlanningJour(entrepriseId: string, jourSource: string, jourCible: string): Observable<ApiResponse<MenuPlanifieJourEntreprise>> {
    return this.http.post<ApiResponse<MenuPlanifieJourEntreprise>>(
      `${this.baseUrl}/b2b/planning/dupliquer`,
      { entrepriseId, jourSource, jourCible },
      { headers: this.getHeaders() }
    );
  }

  reconduireSemainePlanning(entrepriseId = 'ent-001'): Observable<ApiResponse<MenuPlanifieJourEntreprise[]>> {
    return this.http.post<ApiResponse<MenuPlanifieJourEntreprise[]>>(
      `${this.baseUrl}/b2b/planning/reconduire-semaine?entrepriseId=${encodeURIComponent(entrepriseId)}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  deployerPlanningGlobal(sourceEntrepriseId = 'ent-001'): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(
      `${this.baseUrl}/b2b/planning/deployer?sourceEntrepriseId=${encodeURIComponent(sourceEntrepriseId)}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  updateQuantitePlanning(ligneId: string, quantitePrevue: number): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/b2b/planning/lignes/${ligneId}/quantite`, { quantitePrevue }, { headers: this.getHeaders() });
  }

  addSite(entrepriseId: string, site: Partial<any>): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/b2b/entreprises/${entrepriseId}/sites`, site, { headers: this.getHeaders() });
  }

  getInvitations(entrepriseId?: string): Observable<ApiResponse<any[]>> {
    const url = (!entrepriseId || entrepriseId === 'ALL')
      ? `${this.baseUrl}/b2b/entreprises/invitations`
      : `${this.baseUrl}/b2b/entreprises/${entrepriseId}/invitations`;
    return this.http.get<ApiResponse<any[]>>(url, { headers: this.getHeaders() });
  }

  createInvitation(entrepriseId: string, inv: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/b2b/entreprises/${entrepriseId}/invitations`, inv, { headers: this.getHeaders() });
  }

  resendInvitation(entrepriseId: string, invitationId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/b2b/entreprises/${entrepriseId}/invitations/${invitationId}/resend`, {}, { headers: this.getHeaders() });
  }

  getCommandes(entrepriseId = 'ent-001'): Observable<ApiResponse<CommandeEntrepriseSite[]>> {
    return this.http.get<ApiResponse<CommandeEntrepriseSite[]>>(`${this.baseUrl}/b2b/commandes?entrepriseId=${encodeURIComponent(entrepriseId)}`, { headers: this.getHeaders() });
  }

  createCommande(cmd: Partial<CommandeEntrepriseSite>): Observable<ApiResponse<CommandeEntrepriseSite>> {
    return this.http.post<ApiResponse<CommandeEntrepriseSite>>(`${this.baseUrl}/b2b/commandes`, cmd, { headers: this.getHeaders() });
  }

  scannerCommande(id: string): Observable<ApiResponse<CommandeEntrepriseSite>> {
    return this.http.patch<ApiResponse<CommandeEntrepriseSite>>(`${this.baseUrl}/b2b/commandes/${id}/scanner`, {}, { headers: this.getHeaders() });
  }

  livrerCommande(id: string): Observable<ApiResponse<CommandeEntrepriseSite>> {
    return this.http.patch<ApiResponse<CommandeEntrepriseSite>>(`${this.baseUrl}/b2b/commandes/${id}/livrer`, {}, { headers: this.getHeaders() });
  }

  getReclamations(entrepriseId = 'ent-001'): Observable<ApiResponse<ReclamationCutOffB2B[]>> {
    return this.http.get<ApiResponse<ReclamationCutOffB2B[]>>(`${this.baseUrl}/b2b/reclamations?entrepriseId=${encodeURIComponent(entrepriseId)}`, { headers: this.getHeaders() });
  }

  createReclamation(rec: Partial<ReclamationCutOffB2B>): Observable<ApiResponse<ReclamationCutOffB2B>> {
    return this.http.post<ApiResponse<ReclamationCutOffB2B>>(`${this.baseUrl}/b2b/reclamations`, rec, { headers: this.getHeaders() });
  }

  debloquerReclamation(id: string, responsable = 'Responsable Site Kiki'): Observable<ApiResponse<ReclamationCutOffB2B>> {
    return this.http.patch<ApiResponse<ReclamationCutOffB2B>>(`${this.baseUrl}/b2b/reclamations/${id}/debloquer`, { responsable }, { headers: this.getHeaders() });
  }

  getFacturation(entrepriseId = 'ent-001'): Observable<ApiResponse<FacturationLigneJournaliere[]>> {
    return this.http.get<ApiResponse<FacturationLigneJournaliere[]>>(`${this.baseUrl}/b2b/facturation?entrepriseId=${encodeURIComponent(entrepriseId)}`, { headers: this.getHeaders() });
  }

  getPrestations(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/b2b/parametres/prestations`, { headers: this.getHeaders() });
  }

  createPrestation(item: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/b2b/parametres/prestations`, item, { headers: this.getHeaders() });
  }

  getCategories(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/b2b/parametres/categories`, { headers: this.getHeaders() });
  }

  createCategorie(item: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/b2b/parametres/categories`, item, { headers: this.getHeaders() });
  }

  toggleArchivePrestation(code: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/b2b/parametres/prestations/${encodeURIComponent(code)}/archive`, {}, { headers: this.getHeaders() });
  }

  toggleArchiveCategorie(code: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/b2b/parametres/categories/${encodeURIComponent(code)}/archive`, {}, { headers: this.getHeaders() });
  }
}
