import { Component, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionnaireDataService } from '../../services/gestionnaire-data.service';
import { KikiDataService } from '../../../services/kiki-data.service';
import { GestionnaireApiService, CommandeDto } from '../../../services/gestionnaire-api.service';
import { CommandeStoreService } from '../../../services/commande-store.service';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent implements OnInit, OnDestroy {
  /** Tous les clients rapatriés une fois ; le filtrage et la pagination
      s'effectuent ensuite localement. */
  clients: any[] = [];
  /** Résultat du filtre, toutes pages confondues. */
  filteredClients: any[] = [];
  /** Tranche affichée pour la page courante. */
  displayedClients: any[] = [];

  clientPage = 1;
  clientPageSize = 10;
  totalElements = 0;
  totalPages = 0;
  chargement = false;

  // Blocage
  showBlockModal = false;
  isBlocking = false;

  private destroy$ = new Subject<void>();
  
  // Variables Modales
  showEditModal = false;
  showDeleteModal = false;
  selectedClient: any = null;

  showViewClientModal = false;
  viewingClient: any = null;
  clientRequests: any[] = [];
  clientCommandes: CommandeDto[] = [];
  activeHistoryTab: 'COMMANDES' | 'DEMANDES' = 'COMMANDES';
  loadingHistory = false;
  montantTotalCommandes = 0;
  montantTotalDemandes = 0;
  montantTotalGlobal = 0;

  // Modales de détail pour l'historique
  selectedCommandeDetail: CommandeDto | null = null;
  selectedDemandeDetail: any | null = null;
  loadingCommandeDetail = false;

  showCreateClientModal = false;
  isCreating = false;
  isEditing = false;
  isDeleting = false;
  newClientForm: { name: string, email: string, phone: string, type: string, organization: string } = {
    name: '',
    email: '',
    phone: '',
    type: 'particulier',
    organization: ''
  };

  clientSearchQuery = '';
  clientFilterCategory = 'ALL';

  constructor(
    public gData: GestionnaireDataService, 
    private dataService: KikiDataService,
    private apiService: GestionnaireApiService,
    private store: CommandeStoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClients(): void {
    this.chargement = true;
    this.cdr.markForCheck();
    this.apiService.getAllClients(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.clients = res?.content || (Array.isArray(res) ? res : []);
          this.chargement = false;
          this.updateDisplayedClients();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur de chargement des clients', err);
          this.clients = [];
          this.chargement = false;
          this.updateDisplayedClients();
          this.dataService.showToast('Impossible de charger les clients.', true);
          this.cdr.detectChanges();
        }
      });
  }

  /** Filtre, recalcule le nombre de pages, puis découpe la page courante. */
  updateDisplayedClients(): void {
    const requete = this.clientSearchQuery.trim().toLowerCase();

    this.filteredClients = this.clients.filter(c => {
      if (this.clientFilterCategory === 'PARTICULIER' && c.organization) return false;
      if (this.clientFilterCategory === 'ENTREPRISE' && !c.organization) return false;

      if (requete) {
        return (c.name || '').toLowerCase().includes(requete)
            || (c.email || '').toLowerCase().includes(requete)
            || (c.organization || '').toLowerCase().includes(requete)
            || (c.phone || '').toLowerCase().includes(requete);
      }
      return true;
    });

    this.totalElements = this.filteredClients.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.clientPageSize));

    // Un filtre qui réduit la liste peut rendre la page courante inexistante.
    if (this.clientPage > this.totalPages) {
      this.clientPage = 1;
    }

    const debut = (this.clientPage - 1) * this.clientPageSize;
    this.displayedClients = this.filteredClients.slice(debut, debut + this.clientPageSize);
    this.cdr.markForCheck();
  }

  /** Remet la pagination à la première page : appelé quand un filtre change. */
  onFiltreChange(): void {
    this.clientPage = 1;
    this.updateDisplayedClients();
  }

  getClientTotalPages(): number {
    return Math.max(1, this.totalPages);
  }
  
  getClientPageArray(): (number | string)[] {
    return this.getPaginationArray(this.clientPage, this.getClientTotalPages());
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.getClientTotalPages()) {
      this.clientPage = page;
      this.updateDisplayedClients();
      this.cdr.detectChanges();
    }
  }

  closeAllModals(): void {
    this.showViewClientModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showCreateClientModal = false;
    this.showBlockModal = false;
    this.isCreating = false;
    this.isEditing = false;
    this.isDeleting = false;
    this.isBlocking = false;
    this.cdr.markForCheck();
  }

  openEditModal(client: any): void { 
    this.closeAllModals();
    this.selectedClient = { ...client }; 
    this.isEditing = false;
    this.showEditModal = true; 
    this.cdr.detectChanges();
  }
  
  closeEditModal(): void { 
    this.showEditModal = false; 
    this.selectedClient = null; 
    this.isEditing = false;
    this.cdr.detectChanges();
  }

  openViewClientModal(client: any): void {
    this.closeAllModals();
    this.viewingClient = { ...client };
    this.selectedCommandeDetail = null;
    this.selectedDemandeDetail = null;
    this.loadingCommandeDetail = false;
    this.showViewClientModal = true;

    // 1. Calcul immédiat (0ms) depuis les données locales / store
    this.recalculerActiviteClient(client);

    // 2. Synchronisation en arrière-plan avec le backend (non-bloquante)
    this.apiService.getCommandes(undefined, undefined, 0, 500).pipe(
      takeUntil(this.destroy$),
      catchError(() => of(null))
    ).subscribe(res => {
      if (res && res.content && Array.isArray(res.content)) {
        this.store.synchroniserListeDepuisBackend(res.content);
        if (this.viewingClient && String(this.viewingClient.id) === String(client.id)) {
          this.recalculerActiviteClient(client);
        }
      }
    });

    this.apiService.getAllDemandes(0, 500).pipe(
      takeUntil(this.destroy$),
      catchError(() => of(null))
    ).subscribe(res => {
      if (res && res.content && Array.isArray(res.content)) {
        if (this.viewingClient && String(this.viewingClient.id) === String(client.id)) {
          this.recalculerActiviteClient(client, res.content);
        }
      }
    });

    this.cdr.detectChanges();
  }

  recalculerActiviteClient(client: any, backendDemandes?: any[]): void {
    if (!client) return;

    const normPhone = (p: any) => String(p || '').replace(/\D/g, '').slice(-9);
    const clientPhoneNorm = normPhone(client.phone);
    const clientEmailNorm = (client.email || '').trim().toLowerCase();
    const clientNameNorm = (client.name || '').trim().toLowerCase();

    const matchClient = (item: any) => {
      if (!client || !item) return false;
      if (item.clientId != null && String(item.clientId) === String(client.id)) return true;
      if (clientEmailNorm && item.clientEmail && item.clientEmail.trim().toLowerCase() === clientEmailNorm) return true;
      if (clientPhoneNorm) {
        const itemPhoneNorm = normPhone(item.clientTelephone || item.clientPhone || item.telephone || item.phone);
        if (itemPhoneNorm && itemPhoneNorm === clientPhoneNorm) return true;
      }
      if (clientNameNorm && (item.clientNom || item.clientName)) {
        const itemNomNorm = (item.clientNom || item.clientName || '').trim().toLowerCase();
        if (itemNomNorm && itemNomNorm === clientNameNorm) return true;
      }
      return false;
    };

    // 1. Commandes
    const allCommandes = this.store.getCommandes() || [];
    this.clientCommandes = allCommandes.filter(matchClient);
    this.montantTotalCommandes = this.clientCommandes.reduce((sum, c) => sum + (c.montantTotal || 0), 0);

    // 2. Demandes
    const rawDemandes = backendDemandes || this.dataService.getRequests() || this.gData.requests || [];
    this.clientRequests = rawDemandes.filter(matchClient);
    this.montantTotalDemandes = this.clientRequests.reduce((sum, d) => sum + this.getMontantDemande(d), 0);

    // 3. Montant global consolidé
    this.montantTotalGlobal = this.montantTotalCommandes + this.montantTotalDemandes;

    // 4. Tab par défaut
    if (this.clientCommandes.length === 0 && this.clientRequests.length > 0) {
      this.activeHistoryTab = 'DEMANDES';
    } else {
      this.activeHistoryTab = 'COMMANDES';
    }

    this.loadingHistory = false;
    this.cdr.detectChanges();
  }
  
  closeViewClientModal(): void {
    this.showViewClientModal = false;
    this.viewingClient = null;
    this.clientRequests = [];
    this.clientCommandes = [];
    this.montantTotalCommandes = 0;
    this.montantTotalDemandes = 0;
    this.montantTotalGlobal = 0;
    this.loadingHistory = false;
    this.selectedCommandeDetail = null;
    this.selectedDemandeDetail = null;
    this.loadingCommandeDetail = false;
    this.cdr.detectChanges();
  }

  openCommandeDetail(cmd: CommandeDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedCommandeDetail = { ...cmd };
    this.cdr.detectChanges();

    if (!cmd.lignes || cmd.lignes.length === 0) {
      this.loadingCommandeDetail = true;
      this.apiService.getCommande(cmd.id).subscribe({
        next: (full) => {
          if (full) {
            this.selectedCommandeDetail = { ...cmd, ...full };
          }
          this.loadingCommandeDetail = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingCommandeDetail = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  closeCommandeDetail(): void {
    this.selectedCommandeDetail = null;
    this.loadingCommandeDetail = false;
    this.cdr.detectChanges();
  }

  openDemandeDetail(req: any, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedDemandeDetail = { ...req };
    this.cdr.detectChanges();
  }

  closeDemandeDetail(): void {
    this.selectedDemandeDetail = null;
    this.cdr.detectChanges();
  }

  getLignesCommande(c: CommandeDto | null): any[] {
    if (!c || !c.lignes || !Array.isArray(c.lignes)) return [];
    return c.lignes;
  }

  getNomProduit(l: any): string {
    return l?.produitNom || l?.nom || l?.name || 'Plat Kiki Traiteur';
  }

  getPrixUnitaire(l: any): number {
    return l?.prixUnitaire != null ? l.prixUnitaire : (l?.prix || l?.unitPrice || 0);
  }

  getQuantite(l: any): number {
    return l?.quantite || l?.qte || l?.quantity || 1;
  }

  getSousTotal(l: any): number {
    if (!l) return 0;
    if (l.sousTotal != null) return l.sousTotal;
    return this.getPrixUnitaire(l) * this.getQuantite(l);
  }

  getModePaiementLogo(mode: string | undefined): string {
    const m = (mode || '').toUpperCase();
    if (m === 'WAVE') {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZaeFi3xAkC86Ui29AojMASpYfFMPLDzf-1hTcDVS-0Q&s=10';
    }
    if (m === 'ORANGE_MONEY') {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkuwenMWEMEqLrjTBw59HU3cAqXn5JcznidoH8agbSKg&s=10';
    }
    if (m === 'CARTE_BANCAIRE') {
      return 'https://cdn-icons-png.flaticon.com/512/633/633611.png';
    }
    return 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png';
  }

  getModePaiementLibelle(mode: string | undefined): string {
    const m = (mode || '').toUpperCase();
    switch (m) {
      case 'WAVE': return 'Wave';
      case 'ORANGE_MONEY': return 'Orange Money';
      case 'CARTE_BANCAIRE': return 'Carte bancaire';
      case 'ESPECES':
      case 'ESPECES_A_LA_LIVRAISON':
      case 'ESPECES_AU_RETRAIT':
        return 'En espèces';
      default: return mode || 'En espèces';
    }
  }

  getMontantDemande(req: any): number {
    if (!req) return 0;
    if (req.montantTotal != null && req.montantTotal > 0) return req.montantTotal;
    const propValidee = req.propositions?.find((p: any) => 
      p.status === 'selectionnee_client' || p.status === 'validee_gestionnaire' || p.status === 'valide'
    );
    if (propValidee && propValidee.prixUnitairePersonne) {
      return propValidee.prixUnitairePersonne * (req.guests || 1);
    }
    if (req.propositions && req.propositions.length > 0 && req.propositions[0].prixUnitairePersonne) {
      return req.propositions[0].prixUnitairePersonne * (req.guests || 1);
    }
    const devis = this.gData.getDevisForRequest ? this.gData.getDevisForRequest(req.id) : null;
    if (devis && devis.montantTotal) return devis.montantTotal;
    return 0;
  }

  getTotalArticles(c: CommandeDto): number {
    if (!c || !c.lignes || !Array.isArray(c.lignes) || c.lignes.length === 0) return 1;
    return c.lignes.reduce((sum, l) => sum + (l.quantite || 1), 0);
  }

  getStatutCommandeLibelle(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'ACCEPTEE': return 'Acceptée';
      case 'EN_COURS': return 'En préparation';
      case 'PRETE': return 'Prête';
      case 'TERMINEE': return 'Terminée';
      case 'ANNULEE': return 'Annulée';
      default: return statut || 'En attente';
    }
  }

  getStatutCommandeBadge(statut: string): { bg: string; color: string; icon: string } {
    switch (statut) {
      case 'EN_ATTENTE':
        return { bg: '#FEF3C7', color: '#B45309', icon: 'fa-clock' };
      case 'ACCEPTEE':
        return { bg: '#DBEAFE', color: '#1D4ED8', icon: 'fa-check' };
      case 'EN_COURS':
        return { bg: '#EDE9FE', color: '#6D28D9', icon: 'fa-fire-burner' };
      case 'PRETE':
        return { bg: '#DCFCE7', color: '#15803D', icon: 'fa-box-open' };
      case 'TERMINEE':
        return { bg: '#D1FAE5', color: '#047857', icon: 'fa-check-double' };
      case 'ANNULEE':
        return { bg: '#FEE2E2', color: '#B91C1C', icon: 'fa-ban' };
      default:
        return { bg: '#F1F5F9', color: '#475569', icon: 'fa-circle-info' };
    }
  }

  getStatutPaiementBadge(cmd: CommandeDto): { libelle: string; bg: string; color: string; icon: string } {
    const p = (cmd.statutPaiement || '').toUpperCase();
    if (p === 'PAYEE' || p === 'PAYE') {
      return { libelle: 'Payé', bg: '#DCFCE7', color: '#166534', icon: 'fa-circle-check' };
    }
    if (cmd.modeRemise === 'RETRAIT') {
      return { libelle: 'À régler au retrait', bg: '#FEF3C7', color: '#92400E', icon: 'fa-hand-holding-dollar' };
    }
    return { libelle: 'À régler à la livraison', bg: '#FFF7ED', color: '#C2410C', icon: 'fa-truck-arrow-right' };
  }

  getModeRemiseBadge(mode: string): { libelle: string; icon: string } {
    if (mode === 'RETRAIT') {
      return { libelle: 'Retrait', icon: 'fa-store' };
    }
    return { libelle: 'Livraison', icon: 'fa-truck' };
  }

  submitEditClient(): void {
    if (!this.selectedClient || this.isEditing) return;
    this.isEditing = true;
    this.cdr.markForCheck();
    
    this.apiService.updateClient(this.selectedClient.id, this.selectedClient).subscribe({
      next: () => {
        this.isEditing = false;
        this.closeAllModals();
        this.dataService.showToast('Client mis à jour avec succès.');
        this.loadClients();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isEditing = false;
        console.error("API Update Error:", err);
        let msg = 'Erreur lors de la mise à jour.';
        if (err.error && typeof err.error === 'string') msg = err.error;
        else if (err.error && err.error.message) msg = err.error.message;
        else if (err.message) msg = err.message;
        
        this.dataService.showToast(msg, true);
        this.cdr.detectChanges();
      }
    });
  }

  openCreateClientModal(): void {
    this.closeAllModals();
    this.newClientForm = { name: '', email: '', phone: '', type: 'particulier', organization: '' };
    this.showCreateClientModal = true;
    this.cdr.detectChanges();
  }

  closeCreateClientModal(): void {
    this.showCreateClientModal = false;
    this.isCreating = false;
    this.cdr.detectChanges();
  }

  submitCreateClient(): void {
    if (!this.newClientForm.name || !this.newClientForm.email) {
      this.dataService.showToast('Le nom et l\'email sont requis.', true);
      return;
    }
    if (this.newClientForm.type === 'entreprise' && !this.newClientForm.organization) {
      this.dataService.showToast('Le nom de l\'entreprise est requis.', true);
      return;
    }
    if (this.isCreating) return;

    this.isCreating = true;
    this.cdr.markForCheck();
    this.apiService.createClient(this.newClientForm).subscribe({
      next: () => {
        this.isCreating = false;
        this.closeAllModals();
        this.dataService.showToast('Client créé avec succès.');
        this.loadClients();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isCreating = false;
        const msg = err.error?.message || err.error || 'Erreur lors de la création du client.';
        this.dataService.showToast(msg, true);
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteModal(client: any): void {
    this.closeAllModals();
    this.selectedClient = { ...client };
    this.showDeleteModal = true;
    this.isDeleting = false;
    this.cdr.detectChanges();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedClient = null;
    this.isDeleting = false;
    this.cdr.detectChanges();
  }

  confirmDeleteClient(): void {
    if (!this.selectedClient || this.isDeleting) return;
    this.isDeleting = true;
    this.cdr.markForCheck();

    this.apiService.deleteClient(this.selectedClient.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeAllModals();
        this.dataService.showToast('Client supprimé avec succès.');
        this.loadClients();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isDeleting = false;
        console.error("Erreur suppression client:", err);
        let msg = 'Erreur lors de la suppression.';
        if (err.error && typeof err.error === 'string') msg = err.error;
        else if (err.error && err.error.message) msg = err.error.message;
        
        this.dataService.showToast(msg, true);
        this.cdr.detectChanges();
      }
    });
  }

  // =============================================
  // BLOCAGE
  // =============================================

  openBlockModal(client: any): void {
    this.closeAllModals();
    this.selectedClient = { ...client };
    this.showBlockModal = true;
    this.isBlocking = false;
    this.cdr.detectChanges();
  }

  closeBlockModal(): void {
    this.showBlockModal = false;
    this.selectedClient = null;
    this.isBlocking = false;
    this.cdr.detectChanges();
  }

  confirmBlocage(): void {
    if (!this.selectedClient || this.isBlocking) return;
    const cible = !this.selectedClient.bloque;
    this.isBlocking = true;
    this.cdr.markForCheck();

    this.apiService.setClientBlocage(this.selectedClient.id, cible).subscribe({
      next: () => {
        this.isBlocking = false;
        this.closeAllModals();
        this.dataService.showToast(cible ? 'Client bloqué.' : 'Client débloqué.');
        this.loadClients();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isBlocking = false;
        console.error('Erreur de blocage', err);
        this.dataService.showToast(err.error?.message || 'Le blocage a échoué.', true);
        this.cdr.detectChanges();
      }
    });
  }

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
