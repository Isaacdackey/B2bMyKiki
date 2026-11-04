import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { KikiDataService } from '../../services/kiki-data.service';
import { GestionnaireApiService } from '../../services/gestionnaire-api.service';

@Injectable({ providedIn: 'root' })
export class GestionnaireDataService {
  private requestsSubject = new BehaviorSubject<any[]>([]);
  private clientsSubject = new BehaviorSubject<any[]>([]);
  private eventsSubject = new BehaviorSubject<any[]>([]);
  private staffSubject = new BehaviorSubject<any[]>([]);
  private faqsSubject = new BehaviorSubject<any[]>([]);
  private testimonialsSubject = new BehaviorSubject<any[]>([]);
  private mediaSubject = new BehaviorSubject<any[]>([]);
  private devisSubject = new BehaviorSubject<any[]>([]);

  requests$ = this.requestsSubject.asObservable();
  clients$ = this.clientsSubject.asObservable();
  events$ = this.eventsSubject.asObservable();
  staff$ = this.staffSubject.asObservable();
  faqs$ = this.faqsSubject.asObservable();
  testimonials$ = this.testimonialsSubject.asObservable();
  media$ = this.mediaSubject.asObservable();
  devis$ = this.devisSubject.asObservable();

  get requests(): any[] { return this.requestsSubject.value; }
  get clients(): any[] { return this.clientsSubject.value; }
  get events(): any[] { return this.eventsSubject.value; }
  get staff(): any[] { return this.staffSubject.value; }
  get faqs(): any[] { return this.faqsSubject.value; }
  get testimonials(): any[] { return this.testimonialsSubject.value; }
  get media(): any[] { return this.mediaSubject.value; }
  get devis(): any[] { return this.devisSubject.value; }

  constructor(
    private dataService: KikiDataService,
    private apiService: GestionnaireApiService
  ) {}

  loadAll(): void {
    // Note: Staff, Demandes, and Clients are now loaded on-demand via server-side pagination in their respective components
    this.mediaSubject.next(this.dataService.getMedia());

    this.apiService.getAllDevis().subscribe({
      next: (data) => { if (data && Array.isArray(data)) this.devisSubject.next(data); },
      error: (e) => console.warn('Erreur devis', e)
    });

    this.apiService.getFaqs().subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.faqsSubject.next(data.map((f: any) => ({
            id: String(f.id),
            question: f.question,
            answer: f.reponse || f.answer,
            category: f.categorie || f.category || 'Général'
          })));
        }
      },
      error: (e) => { console.warn('Erreur FAQs', e); this.faqsSubject.next([]); }
    });

    this.apiService.getTestimonials().subscribe({
      next: (data: any[]) => {
        if (data && Array.isArray(data)) {
          this.testimonialsSubject.next(data.map(t => ({
            id: String(t.id),
            text: t.content || '',
            clientName: t.clientName || '',
            clientTitle: t.role || '',
            stars: t.rating || 5
          })));
        }
      },
      error: (e: any) => { console.warn('Erreur témoignages', e); this.testimonialsSubject.next([]); }
    });
  }

  // --- Shared Helpers ---
  getClientName(clientId: string): string {
    const r = this.requests.find(item => String(item.clientId) === String(clientId) && item.clientName && item.clientName !== 'Client inconnu');
    if (r?.clientName) return r.clientName;
    const c = this.clients.find(item => String(item.id) === String(clientId));
    return c ? c.name : (clientId ? `Client #${clientId}` : 'Client inconnu');
  }

  getClientType(clientId: string): string {
    const r = this.requests.find(item => String(item.clientId) === String(clientId));
    if (r?.isInstitution || r?.organization) return 'Entreprise';
    const c = this.clients.find(item => String(item.id) === String(clientId));
    if (!c) return 'Particulier';
    return (c.type === 'entreprise' || c.type === 'institution' || c.organization) ? 'Entreprise' : 'Particulier';
  }

  getClientEmail(clientId: string): string {
    const c = this.clients.find(item => item.id === clientId);
    return c ? c.email : 'client@gmail.com';
  }

  getClientPhone(clientId: string): string {
    const c = this.clients.find(item => item.id === clientId);
    return c ? (c.phone || '') : '';
  }

  getClientOrg(clientId: string): string {
    const r = this.requests.find(item => String(item.clientId) === String(clientId));
    if (r?.organization) return r.organization;
    const c = this.clients.find(item => String(item.id) === String(clientId));
    return (c?.organization) ? c.organization : '';
  }

  getPrestationName(id: string): string {
    const names: Record<string, string> = {
      'traiteur': 'Service Traiteur Prestige',
      'evenements': "Organisation d'Événements",
      'salle-diva': 'Salle La Diva',
      'decoration': 'Design & Décoration',
      'location': 'Location de Matériel',
      'takeaway': 'Plats à Emporter',
      'foodtruck': 'Food Truck Gourmet'
    };
    return names[id] || id;
  }

  getUnitPrice(id: string): number {
    const prices: Record<string, number> = {
      'traiteur': 15000, 'evenements': 20000, 'salle-diva': 25000,
      'decoration': 5000, 'location': 3000, 'takeaway': 8000, 'foodtruck': 12000
    };
    return prices[id] || 15000;
  }

  formatDate(d: string): string {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
  }

  getStaffName(id: string): string {
    const s = this.staff.find(item => item.id === id);
    return s ? s.name : id;
  }

  getStaffRole(id: string): string {
    const s = this.staff.find(item => item.id === id);
    return s ? s.role : '';
  }

  getDevisForRequest(requestId: string): any {
    return this.devis.find(d => String(d.requestId) === String(requestId));
  }

  // Status helpers — machine d'état complète + rétrocompatibilité
  isPendingStatus(status: string): boolean {
    return !status || status === 'pending' || status === 'EN_ATTENTE';
  }
  isAcceptedStatus(status: string): boolean {
    return status === 'accepted' || status === 'ACCEPTEE';
  }
  isSentStatus(status: string): boolean {
    return status === 'sent' || status === 'PROPOSITION_ENVOYEE' || status === 'propositions_envoyees';
  }
  isSelectionClientStatus(status: string): boolean {
    return status === 'selection_client' || status === 'PROPOSITION_VALIDEE';
  }
  isRefuseeClientStatus(status: string): boolean {
    return status === 'refusee_client' || status === 'REFUSEE_CLIENT';
  }
  isAboutisStatus(status: string): boolean {
    return status === 'aboutis' || status === 'ABOUTI' || status === 'conclue' || status === 'event_created';
  }
  isRejectedStatus(status: string): boolean {
    return status === 'rejected' || status === 'REFUSEE' || status === 'refuse';
  }

  /**
   * Libellé lisible d'un statut.
   *
   * Comparaison en minuscules : la base mélange les écritures historiques et
   * actuelles d'un même état. « ANNULEE » manquait et s'affichait brut.
   */
  getStatusLabel(status: string): string {
    switch ((status || '').trim().toLowerCase()) {
      case 'en_attente': case 'pending': case 'new': case '': return 'En attente';
      case 'acceptee': case 'accepted': case 'approved': return 'Acceptée';
      case 'proposition_envoyee': case 'propositions_envoyees': case 'envoyee': case 'sent':
        return 'Proposition envoyée';
      case 'proposition_validee': case 'selection_client': case 'validee_gestionnaire':
        return 'Proposition validée';
      case 'refusee_client': return 'Refusée (client)';
      case 'abouti': case 'aboutis': case 'confirmed': return 'Aboutie';
      case 'refusee': case 'refuse': case 'refused': case 'rejected': return 'Refusée';
      case 'annulee': case 'annule': case 'cancelled': return 'Annulée';
      default: return status;
    }
  }

  getBadgeClass(status: string): string {
    if (this.isPendingStatus(status)) return 'badge-pending';
    if (this.isAcceptedStatus(status)) return 'badge-accepted';
    if (this.isSentStatus(status)) return 'badge-quoted';
    if (this.isSelectionClientStatus(status)) return 'badge-selection';
    if (this.isRefuseeClientStatus(status)) return 'badge-refusee-client';
    if (this.isAboutisStatus(status)) return 'badge-aboutis';
    if (this.isRejectedStatus(status)) return 'badge-rejected';
    return 'badge-pending';
  }
}
