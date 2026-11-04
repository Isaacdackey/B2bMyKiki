import { Component, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GestionnaireDataService } from '../../services/gestionnaire-data.service';
import { KikiDataService } from '../../../services/kiki-data.service';
import { GestionnaireApiService } from '../../../services/gestionnaire-api.service';
import { DemandeWorkflowService } from '../../../services/demande-workflow.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demandes.component.html'
})
export class DemandesComponent implements OnInit {
  requests: any[] = [];
  clients: any[] = [];
  devisList: any[] = [];

  requestClientFilter = '';
  requestPrestationFilter = 'ALL';
  selectedRequestStatusFilter = 'ALL';
  requestPage = 1;
  requestPageSize = 10;
  totalElements = 0;
  totalPages = 0;
  statusCounts: Record<string, number> = {};
  private destroy$ = new Subject<void>();

  showDevisModal = false;
  isDevisReadonly = false;
  isNewDevis = false;
  isCreatingNewClient = false;
  newClientForm: { name: string, email: string, phone: string, type: string, organization?: string } = { name: '', email: '', phone: '', type: 'particulier' };
  isDevisModified = false;
  selectedClientForDevis: any = null;
  devisSearchClientQuery = '';

  showRequestDetailsModal = false;
  currentDetailRequest: any = null;

  showTraceabilityModal = false;
  currentTraceRequest: any = null;
  currentTraceDevis: any = null;

  showRejectModal = false;
  requestToReject: any = null;
  rejectReason = '';

  showQuickPropositionForm = false;
  newProposition: any = { 
    titre: '', 
    description: '', 
    prixUnitairePersonne: null,
    sections: []
  };

  showPropositionSelectionModal = false;
  requestToAccept: any = null;
  propositions: any[] = [];
  selectedPropositionIds: number[] = [];
  
  showPropositionDetailsModal = false;
  propositionToView: any = null;
  loadingPropositionDetails = false;
  
  isSubmitting = false;

  devisForm: any = {
    requestId: '',
    clientEmail: '',
    clientName: '',
    clientId: '',
    prestationId: 'salle-diva',
    signatureGastronomique: 'Menu Signature Kiki Traiteur',
    guests: 50,
    location: 'Salle La Diva, Dakar',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    items: [{ desc: '', qty: 1, unitPrice: null }],
    tvaRate: 0,
    discount: 0,
    status: 'sent',
    history: [] as Array<{ date: string; action: string }>
  };

  // =============================================
  // FILTRES alignés sur la machine d'état (7 filtres stricts)
  // =============================================
  statusFiltersList = [
    { label: 'Toutes',                value: 'ALL',                 icon: 'fa-list',          color: '#475569' },
    { label: 'En attente',            value: 'EN_ATTENTE',          icon: 'fa-clock',          color: '#f59e0b' },
    { label: 'Acceptée',              value: 'ACCEPTEE',            icon: 'fa-check-circle',   color: '#3b82f6' },
    { label: 'Proposition envoyée',   value: 'PROPOSITION_ENVOYEE', icon: 'fa-paper-plane',    color: '#8b5cf6' },
    { label: 'Proposition validée',   value: 'PROPOSITION_VALIDEE', icon: 'fa-thumbs-up',      color: '#10b981' },
    { label: 'Abouties',              value: 'ABOUTI',              icon: 'fa-handshake',      color: '#059669' },
    { label: 'Refusées',              value: 'REFUSEE',             icon: 'fa-times-circle',   color: '#ef4444' },
  ];

  // État modale de génération de devis
  showGenererDevisModal = false;
  demandeToGenererDevis: any = null;
  genererDevisForm = { gestionnaireName: '', tvaRate: 0, discount: 0 };
  isGeneratingDevis = false;

  constructor(
    public gData: GestionnaireDataService,
    private dataService: KikiDataService,
    private apiService: GestionnaireApiService,
    private cdr: ChangeDetectorRef,
    private workflowService: DemandeWorkflowService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.gData.loadAll();
    this.gData.clients$.subscribe(c => this.clients = c);
    this.gData.devis$.subscribe(d => this.devisList = d);
    this.loadPropositions();
    this.loadStatusCounts();
    this.loadDemandes();
    this.checkQueryParams();
    // Rafraîchissement automatique déclenché par le DemandeWorkflowService
    this.workflowService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadStatusCounts();
        this.loadDemandes();
      });
  }

  private checkQueryParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const dId = params['demandeId'] || params['id'];
      if (dId) {
        this.openRequestDetailsModal({ id: +dId });
      }
    });
  }

  isLoadingDemandes = false;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatusCounts(): void {
    this.apiService.getDemandesStatusCounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (counts) => {
          this.statusCounts = counts || {};
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur chargement des compteurs', err);
          this.statusCounts = {};
          this.cdr.detectChanges();
        }
      });
  }

  loadDemandes(): void {
    this.isLoadingDemandes = true;
    this.apiService.getAllDemandes(this.requestPage - 1, this.requestPageSize, this.selectedRequestStatusFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isLoadingDemandes = false;
          if (res && Array.isArray(res.content)) {
            this.requests = res.content;
            this.totalElements = res.totalElements !== undefined ? res.totalElements : res.content.length;
            this.totalPages = res.totalPages !== undefined ? res.totalPages : (Math.ceil(this.requests.length / this.requestPageSize) || 1);
          } else if (Array.isArray(res)) {
            this.requests = res;
            this.totalElements = res.length;
            this.totalPages = Math.ceil(res.length / this.requestPageSize) || 1;
          } else {
            this.requests = [];
            this.totalElements = 0;
            this.totalPages = 0;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoadingDemandes = false;
          console.error('Erreur chargement demandes', err);
          this.requests = [];
          this.totalElements = 0;
          this.totalPages = 0;
          this.cdr.detectChanges();
        }
      });
  }

  rafraichirTout(): void {
    this.loadStatusCounts();
    this.loadDemandes();
    this.loadPropositions();
  }

  loadPropositions(): void {
    this.apiService.getPropositions().subscribe({
      next: (props: any) => {
        // Handle both paginated response and direct array response
        const loadedProps = props?.content ? props.content : props;
        this.propositions = Array.isArray(loadedProps) ? loadedProps.filter((p: any) => p.titre && p.titre.trim() !== '') : [];
      },
      error: (err) => console.error('Erreur lors du chargement des propositions', err)
    });
  }

  // --- FILTERS & PAGINATION ---
  /**
   * Filtres appliques cote navigateur : nom du client et prestation.
   *
   * Le statut n'est volontairement PAS refiltre ici. Le serveur l'a deja fait,
   * en tenant compte des differentes ecritures d'un meme etat. Un second filtre
   * en egalite stricte (r.status === 'EN_ATTENTE') rejetait les demandes stockees
   * "pending" ou "ANNULEE" que le serveur venait pourtant de renvoyer, et vidait
   * les onglets "En attente" et "Refusees".
   */
  getFilteredRequests(): any[] {
    return this.requests.filter(r => {
      const nameMatch = !this.requestClientFilter ||
        (r.clientName || this.gData.getClientName(r.clientId)).toLowerCase().includes(this.requestClientFilter.toLowerCase());
      const prestMatch = this.requestPrestationFilter === 'ALL' || r.prestationId === this.requestPrestationFilter;
      return nameMatch && prestMatch;
    });
  }

  getLastPropositionFeedback(req: any): { comment: string, selection: string } | null {
    if (!req || !req.propositions || req.propositions.length === 0) return null;
    
    // Trier par date d'envoi décroissante pour prendre la dernière proposition
    const sortedProps = [...req.propositions].sort((a, b) => {
      return new Date(b.dateEnvoi).getTime() - new Date(a.dateEnvoi).getTime();
    });
    
    const lastProp = sortedProps[0];
    if (lastProp && (lastProp.clientComment || lastProp.clientSelection)) {
      return {
        comment: lastProp.clientComment,
        selection: lastProp.clientSelection
      };
    }
    return null;
  }

  getParsedSelection(selectionJson: string): any {
    if (!selectionJson) return {};
    try {
      return JSON.parse(selectionJson);
    } catch (e) {
      console.error("Erreur lors du parsing de la sélection client", e);
      return {};
    }
  }

  // Helper method for filtering
  getFilteredRequestsList(): any[] {
    return this.getFilteredRequests();
  }

  getFilteredRequestsForPage(): any[] {
    return this.getFilteredRequests();
  }

  getRequestTotalPages(): number {
    return this.totalPages === 0 ? 1 : this.totalPages;
  }

  getRequestPageArray(): (number | string)[] {
    return this.getPaginationArray(this.requestPage, this.getRequestTotalPages());
  }

  selectRequestStatusFilter(val: string): void {
    this.selectedRequestStatusFilter = val;
    this.requestPage = 1;
    this.loadDemandes();
    this.cdr.detectChanges();
  }

  onRequestPageChange(page: number): void {
    if (page >= 1 && page <= this.getRequestTotalPages()) {
      this.requestPage = page;
      this.loadDemandes();
    }
  }

  // --- MODAL DEVIS ---
  openCreateDevisModal(): void {
    this.isNewDevis = true;
    this.isDevisReadonly = false;
    this.isCreatingNewClient = false;
    this.newClientForm = { name: '', email: '', phone: '', type: 'particulier', organization: '' };
    this.selectedClientForDevis = null;
    this.devisSearchClientQuery = '';
    this.devisForm = {
      requestId: '', clientEmail: '', clientName: '', clientId: '',
      prestationId: 'salle-diva', signatureGastronomique: 'Menu Signature Kiki Traiteur',
      guests: 50, location: 'Salle La Diva, Dakar',
      date: new Date().toISOString().split('T')[0], time: '19:00',
      items: [{ desc: '', qty: 1, unitPrice: null }],
      tvaRate: 0, discount: 0, status: 'sent', history: []
    };
    this.showDevisModal = true;
  }

  openDevisModal(req: any, readonly: boolean): void {
    this.isNewDevis = false;
    this.isDevisReadonly = readonly;
    this.isDevisModified = false;

    // Fetch devis from backend to ensure we have the latest data
    this.apiService.getDevisByDemandeId(req.id).subscribe({
      next: (apiDevis) => {
        this.populateDevisForm(req, apiDevis);
      },
      error: () => {
        // Fallback to local data or empty if not found in backend
        const existingDevis = this.gData.getDevisForRequest(req.id);
        this.populateDevisForm(req, existingDevis);
      }
    });
  }

  populateDevisForm(req: any, existingDevis: any): void {
    this.devisForm = {
      requestId: req.id,
      clientEmail: req.clientEmail || this.gData.getClientEmail(req.clientId),
      clientName: req.clientName || this.gData.getClientName(req.clientId),
      clientPhone: existingDevis?.clientPhone || req.clientPhone || '+221 77 777 77 77',
      clientId: req.clientId,
      prestationId: existingDevis?.prestationId || req.prestationId || 'salle-diva',
      signatureGastronomique: existingDevis?.signatureGastronomique || req.signatureGastronomique || 'Menu Signature Kiki Traiteur',
      guests: existingDevis?.guests || req.guests || 50,
      location: existingDevis?.location || req.location || 'Salle La Diva, Dakar',
      date: existingDevis?.date || req.date || new Date().toISOString().split('T')[0],
      time: existingDevis?.time || req.time || '19:00',
      items: (existingDevis?.items && existingDevis.items.length > 0) ? existingDevis.items : [{ desc: '', qty: 1, unitPrice: null }],
      tvaRate: existingDevis?.tvaRate || 0,
      discount: existingDevis?.discount || 0,
      status: existingDevis?.status || 'sent',
      history: existingDevis?.history || []
    };
    this.showDevisModal = true;
  }

  closeDevisModal(): void { this.showDevisModal = false; }

  getFilteredClientsForDevis(): any[] {
    if (!this.devisSearchClientQuery) return this.clients.slice(0, 8);
    return this.clients.filter(c => c.name?.toLowerCase().includes(this.devisSearchClientQuery.toLowerCase()));
  }

  selectClientForDevis(c: any): void {
    this.selectedClientForDevis = c;
    this.devisForm.clientId = c.id;
    this.devisForm.clientEmail = c.email;
    this.devisForm.clientName = c.name;
  }

  getDevisTotal(): number {
    const subtotal = (this.devisForm.items || []).reduce((s: number, i: any) => s + (i.qty * i.unitPrice), 0);
    const discount = this.devisForm.discount || 0;
    return subtotal - discount;
  }

  addDevisItem(): void {
    this.devisForm.items = [...(this.devisForm.items || []), { desc: '', qty: 1, unitPrice: null }];
  }

  removeDevisItem(idx: number): void {
    this.devisForm.items = this.devisForm.items.filter((_: any, i: number) => i !== idx);
  }

  isDevisFormValid(): boolean {
    if (!this.devisForm || !this.devisForm.items || this.devisForm.items.length === 0) {
      return false;
    }
    return this.devisForm.items.every((item: any) => item.desc && item.desc.trim() !== '' && item.unitPrice != null && item.unitPrice > 0);
  }

  sendDevis(): void {
    const reqId = this.devisForm.requestId;
    const payload = {
      demandeId: Number(reqId) || 0,
      devisRef: `#DEV-${reqId}-${Date.now()}`,
      clientName: this.devisForm.clientName,
      clientEmail: this.devisForm.clientEmail,
      clientPhone: this.devisForm.clientPhone,
      gestionnaireName: localStorage.getItem('userName') || 'Marie V.',
      prestationId: this.devisForm.prestationId,
      signatureGastronomique: this.devisForm.signatureGastronomique || 'Menu Signature Kiki Traiteur',
      tvaRate: 0,
      discount: this.devisForm.discount || 0,
      guests: this.devisForm.guests,
      location: this.devisForm.location,
      date: this.devisForm.date,
      time: (this.devisForm as any).time,
      status: 'sent',
      items: this.devisForm.items || []
    };
    if (!this.devisForm.requestId) return;
    this.isSubmitting = true;

    this.apiService.createOrUpdateDevis(payload).subscribe({
      next: (apiDevis) => {
        if (apiDevis && apiDevis.id) {
          this.apiService.sendDevisEmail(apiDevis.id).subscribe({
            next: () => {
              this.setStatus(this.devisForm.requestId, 'sent');
              this.dataService.showToast('Devis enregistré et PDF envoyé au client !');
              setTimeout(() => {
                this.showDevisModal = false;
                this.isSubmitting = false;
                this.gData.loadAll();
              }, 2000);
            },
            error: (e) => {
              console.error('Erreur lors de l\'envoi de l\'email', e);
              this.isSubmitting = false;
              this.dataService.showToast('Erreur lors de l\'envoi de l\'email', true);
            }
          });
        } else {
          this.isSubmitting = false;
        }
      },
      error: (e) => {
        console.warn('Backend non accessible', e);
        this.isSubmitting = false;
        this.dataService.showToast('Erreur lors de la création du devis', true);
      }
    });
  }

  createDevisDirectly(): void {
    if (!this.selectedClientForDevis && !this.devisForm.clientId && !this.isCreatingNewClient) {
      this.dataService.showToast('Veuillez sélectionner un client ou en créer un.', true);
      return;
    }
    
    if (this.isCreatingNewClient) {
      if (!this.newClientForm.name || !this.newClientForm.email) {
        this.dataService.showToast('Le nom et l\'email du client sont requis.', true);
        return;
      }
      if (this.newClientForm.type === 'entreprise' && !this.newClientForm.organization) {
        this.dataService.showToast('Le nom de l\'entreprise est requis.', true);
        return;
      }
    }

    const payload = {
      clientId: this.selectedClientForDevis ? this.selectedClientForDevis.id : this.devisForm.clientId,
      newClientName: this.isCreatingNewClient ? this.newClientForm.name : null,
      newClientEmail: this.isCreatingNewClient ? this.newClientForm.email : null,
      newClientPhone: this.isCreatingNewClient ? this.newClientForm.phone : null,
      newClientType: this.isCreatingNewClient ? (this.newClientForm.type || 'particulier') : null,
      newClientOrganization: (this.isCreatingNewClient && this.newClientForm.type === 'entreprise') ? this.newClientForm.organization : null,
      prestationId: this.devisForm.prestationId || 'salle-diva',
      signatureGastronomique: this.devisForm.signatureGastronomique || 'Menu Signature Kiki Traiteur',
      guests: this.devisForm.guests || 50,
      location: this.devisForm.location || 'Dakar',
      date: this.devisForm.date,
      time: this.devisForm.time,
      tvaRate: this.devisForm.tvaRate,
      discount: this.devisForm.discount,
      items: this.devisForm.items,
      gestionnaireName: localStorage.getItem('userName') || 'Marie V.'
    };

    this.isSubmitting = true;
    this.apiService.createDevisDirectly(payload).subscribe({
      next: (res) => {
        this.dataService.showToast('Devis créé et envoyé avec succès.');
        setTimeout(() => {
          this.isSubmitting = false;
          this.closeDevisModal();
          this.gData.loadAll();
        }, 2000);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        this.dataService.showToast('Erreur lors de la création du devis', true);
      }
    });
  }

  // --- STATUS ACTIONS ---
  setStatus(id: string, st: string, propIds?: number[]): void {
    const numId = Number(id);
    if (!isNaN(numId) && numId > 0) {
      if (st === 'sent' && propIds && propIds.length > 0) {
        this.apiService.accepterDemande(numId, propIds).subscribe({
          next: () => { this.dataService.updateRequestStatus(id, st); this.loadDemandes(); },
          error: () => { this.dataService.updateRequestStatus(id, st); this.loadDemandes(); }
        });
      } else if (st === 'aboutis') {
        this.apiService.validerSelection(numId).subscribe({
          next: () => { this.dataService.updateRequestStatus(id, st); this.loadDemandes(); },
          error: () => { this.dataService.updateRequestStatus(id, st); this.loadDemandes(); }
        });
      } else {
        this.apiService.updateStatus(numId, st).subscribe({
          next: () => { this.dataService.updateRequestStatus(id, st); this.loadDemandes(); },
          error: () => { this.dataService.updateRequestStatus(id, st); this.loadDemandes(); }
        });
      }
    } else {
      this.dataService.updateRequestStatus(id, st);
      this.loadDemandes();
    }
  }

  acceptRequest(req: any): void {
    this.requestToAccept = req;
    this.selectedPropositionIds = [];
    this.showPropositionSelectionModal = true;
  }

  nextStepRequest(req: any): void {
    if (this.isPendingStatus(req.status) || this.isAcceptedStatus(req.status)) {
      this.acceptRequest(req);
    } else if (this.isSentStatus(req.status)) {
      this.openDevisModal(req, false);
    } else if (req.status === 'selection_client') {
      this.acceptDevisAndCreateEvent(req);
    }
  }

  hasDevis(req: any): boolean {
    return !!this.gData.getDevisForRequest(req.id);
  }

  // =============================================
  // MACHINE D'ÉTAT — Actions de transition
  // =============================================

  /** ÉTAPE 2 : EN_ATTENTE → ACCEPTEE */
  priseEnCharge(req: any): void {
    this.apiService.priseEnCharge(req.id).subscribe({
      next: () => {
        this.dataService.showToast(`Demande #${req.id} prise en charge.`);
        this.loadDemandes();
        this.workflowService.triggerRefresh();
      },
      error: (e) => {
        console.error(e);
        this.dataService.showToast('Erreur lors de la prise en charge.', true);
      }
    });
  }

  /** ÉTAPE 3 : Ouvre la modale pour choisir les propositions à envoyer */
  ouvrirEnvoiProposition(req: any): void {
    this.requestToAccept = req;
    this.selectedPropositionIds = [];
    this.showPropositionSelectionModal = true;
  }

  /** ÉTAPE 3 : Confirme l'envoi des propositions sélectionnées */
  confirmerEnvoiProposition(): void {
    if (!this.requestToAccept || this.selectedPropositionIds.length === 0) {
      this.dataService.showToast('Veuillez sélectionner au moins une proposition.', true);
      return;
    }
    this.apiService.envoyerProposition(this.requestToAccept.id, this.selectedPropositionIds).subscribe({
      next: () => {
        this.dataService.showToast(`Proposition(s) envoyée(s) au client pour la demande #${this.requestToAccept.id}.`);
        this.closePropositionSelectionModal();
        this.loadDemandes();
        this.workflowService.triggerRefresh();
      },
      error: (e) => {
        console.error(e);
        this.dataService.showToast('Erreur lors de l\'envoi de la proposition.', true);
      }
    });
  }

  /** ÉTAPE 5 : Ouvre la modale pour régénérer une proposition (REFUSEE_CLIENT) */
  ouvrirRegenerationProposition(req: any): void {
    this.requestToAccept = req;
    this.selectedPropositionIds = [];
    this.showPropositionSelectionModal = true;
  }

  /** ÉTAPE 6 : Ouvre la modale de génération du devis */
  ouvrirGenererDevis(req: any): void {
    this.demandeToGenererDevis = req;
    this.genererDevisForm = {
      gestionnaireName: localStorage.getItem('userName') || 'Équipe Kiki Traiteur',
      tvaRate: 0,
      discount: 0
    };
    this.showGenererDevisModal = true;
  }

  closeGenererDevisModal(): void {
    this.showGenererDevisModal = false;
    this.demandeToGenererDevis = null;
  }

  /** ÉTAPE 6 : Confirme la génération du devis (PROPOSITION_VALIDEE → ABOUTI) */
  confirmerGenererDevis(): void {
    if (!this.demandeToGenererDevis) return;
    this.isGeneratingDevis = true;
    this.apiService.genererDevis(this.demandeToGenererDevis.id, this.genererDevisForm).subscribe({
      next: (res) => {
        this.isGeneratingDevis = false;
        this.dataService.showToast(`Devis ${res.devisRef} généré ! La demande est maintenant aboutie.`);
        this.closeGenererDevisModal();
        this.loadDemandes();
        this.workflowService.triggerRefresh();
      },
      error: (e) => {
        this.isGeneratingDevis = false;
        console.error(e);
        this.dataService.showToast('Erreur lors de la génération du devis.', true);
      }
    });
  }

  // --- Helpers : est-ce que ce statut correspond à X ? ---
  isEnAttenteStatus(s: string): boolean {
    return s === 'EN_ATTENTE' || s === 'pending';
  }
  isAccepteeStatus(s: string): boolean {
    return s === 'ACCEPTEE' || s === 'accepted';
  }
  isPropositionEnvoyeeStatus(s: string): boolean {
    return s === 'PROPOSITION_ENVOYEE' || s === 'propositions_envoyees' || s === 'sent';
  }
  isPropositionValideeStatus(s: string): boolean {
    return s === 'PROPOSITION_VALIDEE' || s === 'selection_client';
  }
  isRefuseeClientStatus(s: string): boolean {
    return s === 'REFUSEE_CLIENT' || s === 'refusee_client';
  }
  isAboutiStatus(s: string): boolean {
    return s === 'ABOUTI' || s === 'aboutis';
  }

  getNextStepIcon(status: string): string {
    if (this.isEnAttenteStatus(status)) return 'fa-check';
    if (this.isAccepteeStatus(status)) return 'fa-paper-plane';
    if (this.isPropositionEnvoyeeStatus(status)) return 'fa-file-invoice';
    if (this.isPropositionValideeStatus(status)) return 'fa-receipt';
    if (this.isRefuseeClientStatus(status)) return 'fa-redo';
    return 'fa-arrow-right';
  }

  getNextStepLabel(status: string): string {
    if (this.isEnAttenteStatus(status)) return 'Prendre en charge';
    if (this.isAccepteeStatus(status)) return 'Envoyer Proposition';
    if (this.isPropositionEnvoyeeStatus(status)) return 'En attente client...';
    if (this.isPropositionValideeStatus(status)) return 'Générer le Devis';
    if (this.isRefuseeClientStatus(status)) return 'Régénérer Proposition';
    return 'Étape Suivante';
  }

  /** Bouton contextuel principal selon le statut */
  executeNextStep(req: any): void {
    if (this.isEnAttenteStatus(req.status)) {
      this.priseEnCharge(req);
    } else if (this.isAccepteeStatus(req.status)) {
      this.ouvrirEnvoiProposition(req);
    } else if (this.isPropositionValideeStatus(req.status)) {
      this.ouvrirGenererDevis(req);
    } else if (this.isRefuseeClientStatus(req.status)) {
      this.ouvrirRegenerationProposition(req);
    }
  }

  acceptDirectly(): void {
    if (!this.requestToAccept) return;
    this.setStatus(this.requestToAccept.id, 'accepted');
    this.dataService.showToast(`Demande #${this.requestToAccept.id} acceptée directement.`);
    this.closePropositionSelectionModal();
  }

  createNewPropositionOnTheFly(): void {
    this.showQuickPropositionForm = !this.showQuickPropositionForm;
  }

  saveQuickProposition(): void {
    if (!this.newProposition.titre || !this.newProposition.prixUnitairePersonne) return;
    
    // Construction de l'objet complet attendu par le backend pour une proposition
    const propositionToCreate = {
      ...this.newProposition
    };

    this.apiService.createProposition(propositionToCreate).subscribe({
      next: (res) => {
        this.dataService.showToast('Proposition rapide créée et sélectionnée avec succès.');
        this.propositions.unshift(res); // Ajouter en haut de la liste
        this.selectedPropositionIds.push(res.id); // Sélectionner automatiquement
        
        // Réinitialiser le formulaire
        this.showQuickPropositionForm = false;
        this.newProposition = { titre: '', description: '', prixUnitairePersonne: null, sections: [] };
      },
      error: (err) => {
        console.error('Erreur lors de la création rapide', err);
        this.dataService.showToast('Erreur lors de la création de la proposition.');
      }
    });
  }

  addPropSection(): void {
    this.newProposition.sections.push({ nom: '', maxChoix: 1, items: [] });
  }

  removePropSection(index: number): void {
    this.newProposition.sections.splice(index, 1);
  }

  addPropItem(section: any): void {
    if (!section.items) section.items = [];
    section.items.push({ nom: '', description: '', isSelected: false });
  }

  removePropItem(section: any, itemIndex: number): void {
    section.items.splice(itemIndex, 1);
  }

  private normalizePropositionDetails(prop: any): any {
    if (!prop) return null;

    const rawSections = Array.isArray(prop.sections)
      ? prop.sections
      : (Array.isArray(prop.propositionSections) ? prop.propositionSections : []);

    return {
      ...prop,
      sections: rawSections.map((section: any, index: number) => ({
        ...section,
        nom: section?.nom ?? section?.name ?? `Section ${index + 1}`,
        maxChoix: section?.maxChoix ?? section?.maxChoices ?? 1,
        items: Array.isArray(section?.items) ? section.items : (Array.isArray(section?.propositionSectionItems) ? section.propositionSectionItems : [])
      }))
    };
  }

  viewPropositionDetails(prop: any, event: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.propositionToView = this.normalizePropositionDetails(prop);
    this.showPropositionDetailsModal = true;
    
    // Si la proposition contient déjà ses sections, on l'affiche immédiatement sans requête superflue
    if (this.propositionToView?.sections && this.propositionToView.sections.length > 0) {
      this.loadingPropositionDetails = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadingPropositionDetails = true;
    this.cdr.detectChanges();

    const catalogPropId = Number(prop?.propositionId ?? prop?.id);
    if (!catalogPropId || Number.isNaN(catalogPropId)) {
      this.loadingPropositionDetails = false;
      this.cdr.detectChanges();
      return;
    }

    this.apiService.getPropositionById(catalogPropId).subscribe({
      next: (fullProp) => {
        this.propositionToView = this.normalizePropositionDetails(fullProp ?? prop);
        this.loadingPropositionDetails = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Erreur chargement détails proposition distante, utilisation locale:', err);
        this.propositionToView = this.normalizePropositionDetails(prop);
        this.loadingPropositionDetails = false;
        this.cdr.detectChanges();
      }
    });
  }

  closePropositionDetailsModal(): void {
    this.showPropositionDetailsModal = false;
    this.propositionToView = null;
  }

  selectPropositionFromDetails(prop: any): void {
    if (!this.selectedPropositionIds.includes(prop.id)) {
      this.selectedPropositionIds.push(prop.id);
    }
    this.closePropositionDetailsModal();
  }

  togglePropositionSelection(id: number): void {
    const index = this.selectedPropositionIds.indexOf(id);
    if (index > -1) {
      this.selectedPropositionIds.splice(index, 1);
    } else {
      this.selectedPropositionIds.push(id);
    }
  }

  confirmAcceptRequest(): void {
    if (!this.requestToAccept || this.selectedPropositionIds.length === 0) return;
    const isRegeneration = this.isRefuseeClientStatus(this.requestToAccept.status);
    if (isRegeneration) {
      // ÉTAPE 5 : Régénération
      this.apiService.regenererProposition(this.requestToAccept.id, this.selectedPropositionIds).subscribe({
        next: () => {
          this.dataService.showToast(`Nouvelle proposition envoyée pour la demande #${this.requestToAccept.id}.`);
          this.closePropositionSelectionModal();
          this.loadDemandes();
          this.workflowService.triggerRefresh();
        },
        error: (e) => {
          console.error(e);
          this.dataService.showToast('Erreur lors de la régénération.', true);
        }
      });
    } else {
      // ÉTAPE 3 : Premier envoi
      this.confirmerEnvoiProposition();
    }
  }

  closePropositionSelectionModal(): void {
    this.showPropositionSelectionModal = false;
    this.requestToAccept = null;
    this.selectedPropositionIds = [];
  }

  acceptRequestFromDetails(): void {
    if (this.currentDetailRequest) {
      this.acceptRequest(this.currentDetailRequest);
      this.closeRequestDetailsModal();
    }
  }

  rejectRequest(req: any): void {
    this.requestToReject = req;
    this.showRejectModal = true;
  }

  confirmReject(): void {
    if (!this.requestToReject) return;
    this.apiService.refuserDemande(this.requestToReject.id, 'Refus depuis Gestionnaire').subscribe({
      next: (res) => {
        this.dataService.showToast(`Demande #${this.requestToReject.id} refusée.`);
        this.closeRejectModal();
        this.loadDemandes();
      },
      error: (err) => {
        console.error(err);
        this.dataService.showToast('Erreur lors du refus', true);
      }
    });
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.requestToReject = null;
  }

  rejectRequestFromDetails(): void {
    if (this.currentDetailRequest) {
      this.rejectRequest(this.currentDetailRequest);
      this.closeRequestDetailsModal();
    }
  }

  acceptDevisAndCreateEvent(req: any): void {
    this.dataService.updateRequestStatus(req.id, 'aboutis');
    const dev = this.gData.getDevisForRequest(req.id);
    if (dev) this.dataService.updateDevis(dev.id, { status: 'conclue' }, 'Devis accepté');
    this.dataService.showToast("Devis accepté ! Statut passé à 'Aboutis'.");
    this.loadDemandes();
  }

  // HISTORIQUE CLIENT & POPUP CHOIX
  showHistoryModal = false;
  historyDemande: any = null;
  historyPropositionsEnvoyees: any[] = [];
  loadingHistory = false;

  showChoixClientModal = false;
  selectedPropositionForChoix: any = null;

  isPropositionSelectionneeOuValidee(status: string): boolean {
    if (!status) return false;
    const s = String(status).toLowerCase().trim();
    return s.includes('selection') || s.includes('validee') || s.includes('valide') || s.includes('accepte');
  }

  ouvrirChoixClientModal(prop: any, event?: Event): void {
    event?.stopPropagation();
    this.selectedPropositionForChoix = prop;
    this.showChoixClientModal = true;
    this.cdr.detectChanges();
  }

  fermerChoixClientModal(): void {
    this.showChoixClientModal = false;
    this.selectedPropositionForChoix = null;
    this.cdr.detectChanges();
  }

  openHistoryModal(req: any): void {
    this.historyDemande = req;
    this.showHistoryModal = true;
    
    // Si la demande contient déjà ses propositions (ex: en cache local), les afficher immédiatement
    if (req && req.propositions && Array.isArray(req.propositions) && req.propositions.length > 0) {
      this.historyPropositionsEnvoyees = req.propositions;
      this.loadingHistory = false;
    } else {
      this.historyPropositionsEnvoyees = [];
      this.loadingHistory = true;
    }
    this.cdr.detectChanges();
    
    if (req && req.id) {
      this.apiService.getDemandeById(req.id).subscribe({
        next: (fullReq) => {
          this.historyPropositionsEnvoyees = (fullReq && fullReq.propositions) ? fullReq.propositions : [];
          req.propositions = this.historyPropositionsEnvoyees;
          this.loadingHistory = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur chargement historique', err);
          this.historyPropositionsEnvoyees = [];
          this.loadingHistory = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.loadingHistory = false;
      this.cdr.detectChanges();
    }
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.historyDemande = null;
    this.historyPropositionsEnvoyees = [];
    this.cdr.detectChanges();
  }

  parseSelection(jsonSelection: string): any {
    try {
      if (!jsonSelection) return null;
      return JSON.parse(jsonSelection);
    } catch (e) {
      return null;
    }
  }

  getSelectionKeys(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }

  getClientChoices(prop: any): { sectionNom: string; items: string[] }[] {
    if (!prop) return [];

    // Le serveur résout désormais la sélection en libellés lisibles : il
    // détient les sections et les plats, et connaît les deux formats que
    // MyKiki peut envoyer selon l'écran de validation. On lui fait confiance
    // en priorité ; la logique ci-dessous ne sert plus que de repli pour les
    // enregistrements antérieurs.
    if (Array.isArray(prop.choixClient) && prop.choixClient.length > 0) {
      return prop.choixClient;
    }

    const results: { sectionNom: string; items: string[] }[] = [];

    // 1. Essayer depuis clientSelection (JSON ou Objet)
    if (prop.clientSelection) {
      try {
        const raw = typeof prop.clientSelection === 'string' ? JSON.parse(prop.clientSelection) : prop.clientSelection;
        if (raw && typeof raw === 'object') {
          const keys = Object.keys(raw);
          const isNumericKeys = keys.length > 0 && keys.every(k => !isNaN(Number(k)));

          if (isNumericKeys && prop.sections && prop.sections.length > 0) {
            prop.sections.forEach((s: any) => {
              const selectedIds = raw[s.id] || raw[String(s.id)] || [];
              const chosenItems = (s.items || []).filter((it: any) => selectedIds.includes(it.id));
              if (chosenItems.length > 0) {
                results.push({
                  sectionNom: s.nom,
                  items: chosenItems.map((it: any) => it.nom + (it.description ? ' (' + it.description + ')' : ''))
                });
              }
            });

            // Si aucune correspondance directe par section ID, chercher les item IDs dans toutes les sections
            if (results.length === 0) {
              const allSelectedIds: number[] = [];
              keys.forEach(k => {
                const val = raw[k];
                if (Array.isArray(val)) {
                  val.forEach(v => {
                    const num = Number(v);
                    if (!isNaN(num)) allSelectedIds.push(num);
                  });
                }
              });

              if (allSelectedIds.length > 0) {
                prop.sections.forEach((s: any) => {
                  const matchingItems = (s.items || []).filter((it: any) => allSelectedIds.includes(it.id));
                  if (matchingItems.length > 0) {
                    results.push({
                      sectionNom: s.nom,
                      items: matchingItems.map((it: any) => it.nom + (it.description ? ' (' + it.description + ')' : ''))
                    });
                  }
                });
              }
            }
          } else if (raw.selections && typeof raw.selections === 'object') {
            if (raw.summary && Array.isArray(raw.summary)) {
              raw.summary.forEach((line: string) => {
                const parts = line.split(':');
                if (parts.length >= 2) {
                  results.push({
                    sectionNom: parts[0].trim(),
                    items: parts.slice(1).join(':').split(',').map((s: string) => s.trim()).filter(Boolean)
                  });
                }
              });
            }
          } else {
            keys.forEach(k => {
              const val = raw[k];
              if (Array.isArray(val) && val.length > 0) {
                results.push({
                  sectionNom: k,
                  items: val.map(v => typeof v === 'object' ? (v.nom || JSON.stringify(v)) : String(v))
                });
              } else if (typeof val === 'string' && val.trim()) {
                results.push({
                  sectionNom: k,
                  items: [val]
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn('Erreur parsing clientSelection', e);
      }
    }

    // 2. Si aucun résultat, chercher dans le résumé de commentaire [Choix validés: ...]
    if (results.length === 0 && prop.clientComment && prop.clientComment.includes('[Choix validés:')) {
      const match = prop.clientComment.match(/\[Choix validés:\s*([^\]]+)\]/);
      if (match && match[1]) {
        const sectionsStr = match[1].split('|');
        sectionsStr.forEach((secStr: string) => {
          const colonIdx = secStr.indexOf(':');
          if (colonIdx > 0) {
            const secName = secStr.substring(0, colonIdx).trim();
            const itemsStr = secStr.substring(colonIdx + 1).trim();
            const items = itemsStr.split(',').map(s => s.trim()).filter(Boolean);
            if (items.length > 0) {
              results.push({ sectionNom: secName, items });
            }
          }
        });
      }
    }

    // 3. Si toujours vide, chercher dans le localStorage
    if (results.length === 0) {
      try {
        const cached = localStorage.getItem('kiki_prop_choices_' + prop.id) ||
                       localStorage.getItem('kiki_prop_choices_' + prop.propositionId) ||
                       (this.historyDemande?.id ? localStorage.getItem('kiki_demande_choices_' + this.historyDemande.id) : null);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.summary && Array.isArray(parsed.summary)) {
            parsed.summary.forEach((line: string) => {
              const parts = line.split(':');
              if (parts.length >= 2) {
                results.push({
                  sectionNom: parts[0].trim(),
                  items: parts.slice(1).join(':').split(',').map((s: string) => s.trim()).filter(Boolean)
                });
              }
            });
          }
        }
      } catch (e) {}
    }

    return results;
  }

  getClientCleanComment(prop: any): string {
    if (!prop || !prop.clientComment) return '';
    let comment = prop.clientComment.trim();
    if (comment.startsWith('[Choix validés:')) {
      const endIdx = comment.indexOf(']');
      if (endIdx >= 0) {
        comment = comment.substring(endIdx + 1).trim();
      }
    }
    return comment;
  }

  createNouvellePropositionFromHistory(): void {
    this.closeHistoryModal();
    this.acceptRequest(this.historyDemande);
  }

  validerDevisFromHistory(): void {
    this.closeHistoryModal();
    this.nextStepRequest(this.historyDemande);
  }

  // --- REQUEST DETAILS MODAL ---
  openRequestDetailsModal(req: any): void {
    this.apiService.getDemandeById(req.id).subscribe({
      next: (fullReq) => {
        this.currentDetailRequest = fullReq;
        this.showRequestDetailsModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement détails demande', err);
        // Fallback sur les données partielles
        this.currentDetailRequest = req;
        this.showRequestDetailsModal = true;
      }
    });
  }

  closeRequestDetailsModal(): void {
    this.showRequestDetailsModal = false;
    this.currentDetailRequest = null;
  }

  // --- TRACEABILITY ---
  openTraceabilityModal(req: any): void {
    this.currentTraceRequest = req;
    this.currentTraceDevis = this.gData.getDevisForRequest(req.id);
    this.showTraceabilityModal = true;
  }

  closeTraceabilityModal(): void {
    this.showTraceabilityModal = false;
    this.currentTraceRequest = null;
  }

  // --- DELEGATES ---
  getClientName = (id: string) => this.gData.getClientName(id);
  getClientType = (id: string) => this.gData.getClientType(id);
  getPrestationName = (id: string) => this.gData.getPrestationName(id);
  formatDate = (d: string) => this.gData.formatDate(d);
  getBadgeClass = (s: string) => this.gData.getBadgeClass(s);
  getStatusLabel = (s: string) => this.gData.getStatusLabel(s);
  isPendingStatus = (s: string) => this.gData.isPendingStatus(s);
  isAcceptedStatus = (s: string) => this.gData.isAcceptedStatus(s);
  isSentStatus = (s: string) => this.gData.isSentStatus(s);
  isAboutisStatus = (s: string) => this.gData.isAboutisStatus(s);
  isRejectedStatus = (s: string) => this.gData.isRejectedStatus(s);

  getPaginationArray(currentPage: number, totalPages: number): (number | string)[] {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i == 1 || i == totalPages || i >= currentPage - delta && i < currentPage + delta + 1) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }
}
