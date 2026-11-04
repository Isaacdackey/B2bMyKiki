import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DemandeDevisRequestDto {
  name: string;
  email: string;
  phone: string;
  clientType: string;
  organization?: string;
  prestationId: string;
  prestationTitle?: string;
  date: string;
  time: string;
  guests: number;
  isInstitution?: boolean;
  locationType?: string;
  locationDetails?: string;
  cuisine?: string;
  evenementNature?: string;
  message?: string;
}

export interface PropositionDto {
  id: number;
  demandeId?: number;
  demande?: any;
  demandeTitle?: string;
  demandeNature?: string;
  titre: string;
  description?: string;
  prixUnitairePersonne?: number;
  dateEnvoi?: string;
  /** Statut : envoyee | vue | selectionnee_client | refusee_client | validee_gestionnaire */
  status?: string;
  clientComment?: string;
  clientSelection?: string;
  clientValidatedAt?: string;
  sections?: {
    id: number;
    nom: string;
    maxChoix: number;
    items?: { id: number; nom: string; description?: string; }[];
  }[];
  _borderColor?: string;
  _statusBadgeStyle?: any;
  _statusLabel?: string;
  _isPropEnAttente?: boolean;
}

export interface DemandeDevisResponseDto {
  id: number;
  client: {
    id: number;
    name: string;
    email: string;
    phone: string;
    type: string;
    organization?: string;
  };
  prestationId: string;
  prestationTitle?: string;
  evenementNature?: string;
  date: string;
  time: string;
  guests: number;
  isInstitution?: boolean;
  organization?: string;
  locationType?: string;
  locationDetails?: string;
  cuisine?: string;
  message?: string;
  status: string;
  dateSubmitted: string;
  propositions?: PropositionDto[];
  _iconStyle?: any;
  _iconClass?: string;
  _prestationLabel?: string;
  _statusChipStyle?: any;
  _statusLabel?: string;
  _isPropositionEnvoyee?: boolean;
  _canCancel?: boolean;
  _statusColor?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientApiService {
  private apiUrl = `${environment.apiUrl}/api/client`;
  private mykikiUrl = `${environment.apiUrl}/api/mykiki`;

  constructor(private http: HttpClient) {}

  creerDemandeDevis(payload: DemandeDevisRequestDto): Observable<DemandeDevisResponseDto> {
    return this.http.post<DemandeDevisResponseDto>(`${this.apiUrl}/devis`, payload);
  }

  getAllDemandes(): Observable<DemandeDevisResponseDto[]> {
    return this.http.get<DemandeDevisResponseDto[]>(`${this.apiUrl}/devis`);
  }

  getDemandesByEmail(email: string): Observable<DemandeDevisResponseDto[]> {
    return this.http.get<DemandeDevisResponseDto[]>(`${this.apiUrl}/devis/client/${email}`);
  }

  // =============================================
  // MYKIKI — Demandes du client connecté
  // =============================================

  getMykikiDemandes(): Observable<DemandeDevisResponseDto[]> {
    return this.http.get<DemandeDevisResponseDto[]>(`${this.mykikiUrl}/demandes`);
  }

  getMyKikiStats(): Observable<any> {
    return this.http.get<any>(`${this.mykikiUrl}/stats`);
  }

  getMykikiDemandeById(id: number): Observable<DemandeDevisResponseDto> {
    return this.http.get<DemandeDevisResponseDto>(`${this.mykikiUrl}/demandes/${id}`);
  }

  /** Annuler une demande EN_ATTENTE */
  annulerDemande(id: number): Observable<any> {
    return this.http.delete(`${this.mykikiUrl}/demandes/${id}`);
  }

  // =============================================
  // MYKIKI — Propositions
  // =============================================

  getPropositions(): Observable<PropositionDto[]> {
    return this.http.get<PropositionDto[]>(`${this.mykikiUrl}/propositions`);
  }

  /** Valider une proposition (par ID de proposition) */
  validerPropositionById(id: number, payload: { clientComment?: string, clientSelection?: string }): Observable<any> {
    return this.http.post(`${this.mykikiUrl}/propositions/${id}/valider`, payload);
  }

  /** Refuser une proposition (par ID de proposition) */
  refuserPropositionById(id: number, payload: { clientComment?: string }): Observable<any> {
    return this.http.post(`${this.mykikiUrl}/propositions/${id}/refuser`, payload);
  }

  /** ÉTAPE 4a : PROPOSITION_ENVOYEE → PROPOSITION_VALIDEE */
  validerProposition(demandeId: number, commentaire: string, selection: string): Observable<any> {
    return this.http.post(`${this.mykikiUrl}/demandes/${demandeId}/valider-proposition`, {
      commentaire,
      selection
    });
  }

  /** ÉTAPE 4b : PROPOSITION_ENVOYEE → REFUSEE_CLIENT */
  refuserProposition(demandeId: number, commentaire: string): Observable<any> {
    return this.http.post(`${this.mykikiUrl}/demandes/${demandeId}/refuser-proposition`, {
      commentaire
    });
  }

  /** ÉTAPE 4c : PROPOSITION_ENVOYEE → MODIFICATION_DEMANDEE */
  demanderModification(demandeId: number, commentaire: string): Observable<any> {
    return this.http.post(`${this.mykikiUrl}/demandes/${demandeId}/demander-modification`, {
      commentaire
    });
  }

  respondToProposition(demandeId: number, propId: number, data: { status: string, comment?: string, selection?: string }): Observable<any> {
    return this.http.post(`${this.mykikiUrl}/demandes/${demandeId}/propositions/${propId}/repondre`, data);
  }

  // =============================================
  // MYKIKI — Devis & Factures Confirmés
  // =============================================

  getMykikiDevis(): Observable<DemandeDevisResponseDto[]> {
    return this.http.get<DemandeDevisResponseDto[]>(`${this.mykikiUrl}/devis`);
  }
}
