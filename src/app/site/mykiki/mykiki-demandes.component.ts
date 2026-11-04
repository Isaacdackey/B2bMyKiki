import { Component, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClientApiService, DemandeDevisResponseDto } from '../../services/client-api.service';
import { AuthService } from '../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-mykiki-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mykiki-demandes.component.html',
  styleUrl: './mykiki-demandes.component.css'
})
export class MyKikiDemandesComponent implements OnInit {
  demandes: DemandeDevisResponseDto[] = [];
  filteredDemandes: DemandeDevisResponseDto[] = [];
  isLoading = true;
  errorMessage = '';

  selectedDemande: DemandeDevisResponseDto | null = null;

  currentPage = 1;
  pageSize = 6;
  totalPages = 1;
  paginatedDemandes: DemandeDevisResponseDto[] = [];

  searchQuery = '';
  filterStatus = '';
  filterPrestation = '';

  showCancelModal = false;
  demandeToCancel: any = null;
  isCancelling = false;

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private clientApi: ClientApiService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  getClientName(d?: any): string {
    return d?.client?.name || d?.clientName || this.authService.getCurrentUser()?.fullName || 'Client';
  }

  getClientEmail(d?: any): string {
    const user = this.authService.getCurrentUser();
    return d?.client?.email || d?.clientEmail || (user as any)?.email || user?.username || 'client@kikitraiteur.com';
  }

  getClientPhone(d?: any): string {
    const user = this.authService.getCurrentUser();
    return d?.client?.phone || d?.clientPhone || (user as any)?.phone || '+221 77 000 00 00';
  }

  getInitials(name?: string): string {
    const target = (name || this.getClientName()).trim();
    if (!target) return 'CL';
    const parts = target.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.substring(0, 2).toUpperCase();
  }

  ngOnInit(): void {
    this.loadDemandes();
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showCancelModal) {
      this.showCancelModal = false;
    } else if (this.selectedDemande) {
      this.closeDetail();
    }
  }

  getDemandesEmptyMessage(): string {
    return (this.searchQuery || this.filterStatus || this.filterPrestation)
      ? 'Aucune demande ne correspond à votre recherche ou filtre.'
      : 'Vous n\'avez encore soumis aucune demande de devis.';
  }

  loadDemandes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.clientApi.getMykikiDemandes()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.demandes = (data || []).sort((a, b) =>
            new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime()
          ).map(d => this.enrichDemande(d));
          this.applyFilters();
          this.checkQueryParams();
        },
        error: (err) => {
          console.error('Erreur chargement demandes:', err);
          if (err.status === 401 || err.status === 403) {
            this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          } else {
            this.errorMessage = 'Impossible de charger vos demandes. Vérifiez votre connexion.';
          }
        }
      });
  }

  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      const dId = params['demandeId'] || params['id'];
      if (dId) {
        const match = this.demandes.find(d => d.id?.toString() === dId.toString());
        if (match) {
          this.openDetail(match);
        }
      }
    });
  }

  private enrichDemande(d: any): any {
    d._iconClass = this.getStatusIcon(d.status);
    d._prestationLabel = this.getPrestationLabel(d.prestationId);
    d._statusLabel = this.getStatusLabel(d.status);
    d._isPropositionEnvoyee = this.isPropositionEnvoyee(d.status);
    d._canCancel = this.canCancel(d.status);

    if (d.propositions) {
      d.propositions = d.propositions.map((p: any) => {
        p._statusLabel = this.getPropStatusLabel(p.status);
        p._isPropEnAttente = this.isPropEnAttente(p.status);
        return p;
      });
    }
    return d;
  }

  getLocationTypeLabel(d: any): string {
    const type = d?.locationType || d?.prestationId || 'SALLE-DIVA';
    return type.toString().toUpperCase().replace(/[_-\s]+/g, '-');
  }

  private normalizeStatus(status?: string): string {
    const raw = (status ?? '').toString().trim();
    if (!raw) return '';
    const value = raw.toLowerCase().replace(/[_\-\s]+/g, '');
    const aliases: Record<string, string> = {
      pending: 'EN_ATTENTE',
      attente: 'EN_ATTENTE',
      enattente: 'EN_ATTENTE',
      accepted: 'ACCEPTEE',
      acceptee: 'ACCEPTEE',
      propositionenvoyee: 'PROPOSITION_ENVOYEE',
      propositionsenvoyees: 'PROPOSITION_ENVOYEE',
      selectionclient: 'PROPOSITION_VALIDEE',
      selectionneeclient: 'PROPOSITION_VALIDEE',
      selectionnee_client: 'PROPOSITION_VALIDEE',
      refuseeclient: 'REFUSEE_CLIENT',
      refusee_client: 'REFUSEE_CLIENT',
      abouti: 'ABOUTI',
      aboutis: 'ABOUTI',
      annee: 'ANNULEE',
      annulee: 'ANNULEE',
      rejete: 'REFUSEE',
      rejetee: 'REFUSEE'
    };
    return aliases[value] ?? raw.toUpperCase();
  }

  applyFilters(): void {
    let result = [...this.demandes];

    if (this.filterStatus) {
      const req = this.normalizeStatus(this.filterStatus);
      result = result.filter(d => this.normalizeStatus(d.status) === req);
    }

    if (this.filterPrestation) {
      const filterLow = this.filterPrestation.toLowerCase();
      result = result.filter(d => (d.prestationId || '').toLowerCase().includes(filterLow));
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(d => 
        (d.id && ('#kt-' + d.id).includes(q)) ||
        (d.id && d.id.toString().includes(q)) ||
        (d._prestationLabel && d._prestationLabel.toLowerCase().includes(q)) ||
        (d.evenementNature && d.evenementNature.toLowerCase().includes(q)) ||
        (d.locationDetails && d.locationDetails.toLowerCase().includes(q)) ||
        (d.message && d.message.toLowerCase().includes(q))
      );
    }

    this.filteredDemandes = result;
    this.totalPages = Math.ceil(this.filteredDemandes.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    this.updatePaginatedDemandes();
  }

  updatePaginatedDemandes(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedDemandes = this.filteredDemandes.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedDemandes();
    }
  }

  getPagesArray(): (number | string)[] {
    if (this.totalPages <= 3) {
      const pages: number[] = [];
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
      return pages;
    }

    if (this.currentPage <= 3) {
      return [1, 2, 3, '...'];
    } else if (this.currentPage >= this.totalPages) {
      return ['...', this.totalPages - 2, this.totalPages - 1, this.totalPages];
    } else {
      return ['...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...'];
    }
  }

  openDetail(d: DemandeDevisResponseDto): void {
    this.selectedDemande = d;
  }

  closeDetail(): void {
    this.selectedDemande = null;
  }

  confirmCancelFromModal(d: any): void {
    this.closeDetail();
    this.confirmCancel(d);
  }

  canCancel(status: string): boolean {
    const value = this.normalizeStatus(status);
    return value === 'EN_ATTENTE' || value === 'PENDING';
  }

  isCancelled(status?: string): boolean {
    return this.normalizeStatus(status) === 'ANNULEE';
  }

  reorder(d: any): void {
    this.router.navigate(['/mykiki/nouvelle-demande'], {
      queryParams: {
        prestation: d.prestationId,
        guests: d.guests,
        nature: d.evenementNature,
        location: d.locationDetails
      }
    });
  }

  confirmCancel(d: any): void {
    this.demandeToCancel = d;
    this.showCancelModal = true;
  }

  doCancel(): void {
    if (!this.demandeToCancel) return;
    this.isCancelling = true;
    this.clientApi.annulerDemande(this.demandeToCancel.id).subscribe({
      next: () => {
        this.isCancelling = false;
        this.showCancelModal = false;
        this.showToast('Votre demande a été annulée avec succès.', 'success');
        this.loadDemandes();
      },
      error: (err) => {
        this.isCancelling = false;
        this.showToast('Erreur lors de l\'annulation de la demande.', 'error');
      }
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType = type;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 4000);
  }

  getBadgeClass(status?: string): string {
    const value = this.normalizeStatus(status);
    switch (value) {
      case 'PROPOSITION_ENVOYEE':
        return 'badge-action-requise';
      case 'PROPOSITION_VALIDEE':
      case 'ACCEPTEE':
        return 'badge-validee';
      case 'ABOUTI':
        return 'badge-confirme';
      case 'EN_ATTENTE':
      case 'PENDING':
        return 'badge-attente';
      case 'REFUSEE_CLIENT':
      case 'REFUSEE':
      case 'ANNULEE':
        return 'badge-refusee';
      case 'non_retenue':
        return 'badge-inactive';
      default:
        return 'badge-attente';
    }
  }

  getStatusIcon(status?: string): string {
    const value = this.normalizeStatus(status);
    switch (value) {
      case 'EN_ATTENTE': return 'fa-clock';
      case 'ACCEPTEE': return 'fa-concierge-bell';
      case 'PROPOSITION_ENVOYEE': return 'fa-bell';
      case 'PROPOSITION_VALIDEE': return 'fa-check-circle';
      case 'ABOUTI': return 'fa-award';
      case 'ANNULEE': return 'fa-ban';
      case 'REFUSEE_CLIENT':
      case 'REFUSEE': return 'fa-times-circle';
      case 'non_retenue': return 'fa-times';
      default: return 'fa-folder';
    }
  }

  getStatusLabel(status?: string): string {
    const value = this.normalizeStatus(status);
    switch (value) {
      case 'EN_ATTENTE': return 'En attente';
      case 'ACCEPTEE': return 'Accepter';
      case 'PROPOSITION_ENVOYEE': return 'Action Requise';
      case 'PROPOSITION_VALIDEE': return 'Choix validés';
      case 'ABOUTI': return 'Devis Confirmé';
      case 'ANNULEE': return 'Annulée';
      case 'REFUSEE_CLIENT':
      case 'REFUSEE': return 'Refusée';
      case 'non_retenue': return 'Non retenue';
      default: return status || 'En cours';
    }
  }

  getPropStatusLabel(status?: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'envoyee' || s === 'vue') return 'Action Requise';
    if (s === 'selectionnee_client') return 'Validée par vous';
    if (s === 'validee_gestionnaire') return 'Devis Confirmé';
    if (s === 'refusee_client') return 'Refusée';
    if (s === 'non_retenue' || s === 'nonretenue' || s === 'caduc' || s === 'inactive') return 'Non retenue';
    return status || 'Proposition reçue';
  }

  isPropEnAttente(status?: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'envoyee' || s === 'vue';
  }

  isPropositionEnvoyee(status?: string): boolean {
    return this.normalizeStatus(status) === 'PROPOSITION_ENVOYEE';
  }

  getPrestationLabel(id?: string): string {
    if (!id) return 'Sur-Mesure';
    // Supprimer le préfixe "prestation" ou "prestation-" s'il existe
    const clean = id.toString()
      .replace(/^prestation[\s_-]+/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();

    const low = clean.toLowerCase();
    if (low === 'traiteur' || low === 'traiteur prestige') return 'Traiteur Prestige';
    if (low.includes('restauration') && low.includes('entreprise')) return 'Restauration d\'entreprise';
    if (low.includes('evenement') || low.includes('evenements') || low.includes('evenementiel')) return 'Événementiel';
    if (low.includes('salle') || low.includes('diva')) return 'Salle La Diva';
    if (low.includes('foodtruck') || low.includes('food truck')) return 'Food Truck';
    if (low.includes('takeaway') || low.includes('emporter')) return 'Plats à Emporter';

    // Capitaliser proprement
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
}
