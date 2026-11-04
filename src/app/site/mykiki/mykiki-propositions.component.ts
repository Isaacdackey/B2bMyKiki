import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ClientApiService } from '../../services/client-api.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-mykiki-propositions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mykiki-propositions.component.html',
  styleUrl: './mykiki-propositions.component.css'
})
export class MyKikiPropositionsComponent implements OnInit {
  allPropositions: any[] = [];
  propositions: any[] = [];
  pagedPropositions: any[] = [];
  
  isLoading = true;
  isSubmitting = false;

  searchFilter = '';
  filterStatus = '';

  targetDemandeId: number | null = null;
  targetPropId: number | null = null;

  pageSize = 6;
  currentPage = 1;
  totalPages = 1;

  activeProp: any = null;
  clientComment = '';
  commentRequired = false;
  showRefuseConfirm = false;

  clientSelections: { [sectionNom: string]: Set<string> } = {};

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private clientApi: ClientApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['demandeId']) {
        this.targetDemandeId = +params['demandeId'];
      } else {
        this.targetDemandeId = null;
      }
      if (params['propId']) {
        this.targetPropId = +params['propId'];
      }
      this.loadPropositions();
    });
  }

  clearDemandeFilter(): void {
    this.targetDemandeId = null;
    this.targetPropId = null;
    this.applyFilters();
  }

  loadPropositions() {
    this.isLoading = true;
    this.clientApi.getPropositions()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          // Trier par date la plus récente en premier (dateEnvoi desc ou id desc)
          this.allPropositions = (data || []).sort((a: any, b: any) => {
            const timeB = b.dateEnvoi ? new Date(b.dateEnvoi).getTime() : 0;
            const timeA = a.dateEnvoi ? new Date(a.dateEnvoi).getTime() : 0;
            return timeB - timeA || ((b.id || 0) - (a.id || 0));
          });
          this.applyFilters();

          // Si un propId spécifique a été demandé, ou si on a filtré sur une demande qui a une seule proposition
          if (this.targetPropId) {
            const match = this.propositions.find(p => p.id === this.targetPropId);
            if (match) {
              this.openDetails(match);
            }
          } else if (this.targetDemandeId && this.propositions.length === 1) {
            this.openDetails(this.propositions[0]);
          }
        },
        error: (err) => {
          console.error('Erreur chargement propositions', err);
          this.allPropositions = [];
          this.propositions = [];
        }
      });
  }

  applyFilters(): void {
    let result = [...this.allPropositions];

    // Filtrer par demandeId si spécifié
    if (this.targetDemandeId) {
      result = result.filter(p => Number(p.demandeId) === this.targetDemandeId);
    }

    if (this.filterStatus) {
      const requestedStatus = this.normalizeStatus(this.filterStatus);
      result = result.filter(p => this.normalizeStatus(p.status) === requestedStatus);
    }

    if (this.searchFilter.trim()) {
      const q = this.searchFilter.toLowerCase().trim();
      result = result.filter(p => 
        (p.titre && p.titre.toLowerCase().includes(q)) ||
        (p.demandeId && ('#kt-' + p.demandeId).includes(q)) ||
        (p.demandeId && p.demandeId.toString().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    this.propositions = result;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.propositions.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedPropositions = this.propositions.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPagesArray(): (number | string)[] {
    if (this.totalPages <= 3) {
      const pages: number[] = [];
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
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

  normalizeStatus(status?: string): string {
    const raw = (status ?? '').toString().trim();
    if (!raw) return '';
    const value = raw.toLowerCase().replace(/[_\-\s]+/g, '');
    if (value === 'envoyee' || value === 'propositionenvoyee' || value === 'propositionsenvoyees') return 'envoyee';
    if (value === 'vue' || value === 'vu') return 'vue';
    if (value === 'selectionneeclient' || value === 'selectionclient' || value === 'choixvalides' || value === 'repondu') return 'selectionnee_client';
    if (value === 'valideegestionnaire' || value === 'propositionvalidee' || value === 'validee') return 'validee_gestionnaire';
    if (value === 'refuseeclient' || value === 'refusee_client' || value === 'rejete' || value === 'rejetee') return 'refusee_client';
    if (value === 'nonretenue' || value === 'caduc' || value === 'inactive' || value === 'remplacee') return 'non_retenue';
    return value;
  }

  isPending(status?: string): boolean {
    const value = this.normalizeStatus(status);
    return value === 'envoyee' || value === 'vue';
  }

  isConfirmed(status?: string): boolean {
    return this.normalizeStatus(status) === 'selectionnee_client';
  }

  isFinalized(status?: string): boolean {
    return this.normalizeStatus(status) === 'validee_gestionnaire';
  }

  isRefused(status?: string): boolean {
    return this.normalizeStatus(status) === 'refusee_client';
  }

  isNonRetenue(status?: string): boolean {
    return this.normalizeStatus(status) === 'non_retenue';
  }

  getPropositionsEmptyMessage(): string {
    if (this.targetDemandeId) {
      return `Aucune proposition trouvée pour le dossier #KT-${this.targetDemandeId}.`;
    }
    if (this.searchFilter || this.filterStatus) {
      return 'Aucune proposition ne correspond à votre recherche ou filtre.';
    }
    return 'Vous n\'avez pas encore reçu de proposition pour vos demandes.';
  }

  openDetails(prop: any) {
    this.activeProp = prop;
    this.clientComment = prop.clientComment || '';
    this.commentRequired = false;
    this.showRefuseConfirm = false;
    this.clientSelections = {};

    let existingSelection: any = null;
    if (prop.clientSelection) {
      try {
        existingSelection = typeof prop.clientSelection === 'string' ? JSON.parse(prop.clientSelection) : prop.clientSelection;
        if (existingSelection && existingSelection.selections) {
          existingSelection = { ...existingSelection, ...existingSelection.selections };
        }
      } catch (e) {}
    }

    if (prop.sections) {
      prop.sections.forEach((s: any) => {
        this.clientSelections[s.nom] = new Set<string>();
        const sIdKey = String(s.id);
        const fromNom = existingSelection ? existingSelection[s.nom] : null;
        const fromId = existingSelection ? (existingSelection[s.id] || existingSelection[sIdKey]) : null;

        if (Array.isArray(fromNom)) {
          fromNom.forEach((itemNom: string) => this.clientSelections[s.nom].add(itemNom));
        }
        if (Array.isArray(fromId)) {
          (s.items || []).forEach((it: any) => {
            if (fromId.includes(it.id) || fromId.includes(Number(it.id))) {
              this.clientSelections[s.nom].add(it.nom);
            }
          });
        }
        // Fallback isSelected
        (s.items || []).forEach((it: any) => {
          if (it.isSelected === true) {
            this.clientSelections[s.nom].add(it.nom);
          }
        });
      });
    }
  }

  closeDetails() {
    this.activeProp = null;
    this.showRefuseConfirm = false;
  }

  toggleItem(section: any, item: any) {
    if (!this.isPending(this.activeProp?.status)) return;
    
    const key = section.nom;
    if (!this.clientSelections[key]) {
      this.clientSelections[key] = new Set<string>();
    }
    const set = this.clientSelections[key];
    if (set.has(item.nom)) {
      set.delete(item.nom);
    } else if (set.size < section.maxChoix) {
      set.add(item.nom);
    }
  }

  isItemSelected(section: any, item: any): boolean {
    return this.clientSelections[section.nom]?.has(item.nom) ?? false;
  }

  getSelectedCount(section: any): number {
    return this.clientSelections[section.nom]?.size ?? 0;
  }

  canValidate(): boolean {
    if (!this.activeProp || !this.isPending(this.activeProp.status)) return false;
    if (!this.activeProp.sections || this.activeProp.sections.length === 0) return true;
    return this.activeProp.sections.every((s: any) => {
      if (!s.items || s.items.length === 0) return true;
      return this.getSelectedCount(s) > 0;
    });
  }

  private ensureCommentProvided(): boolean {
    const comment = (this.clientComment || '').trim();
    this.commentRequired = !comment;
    return !!comment;
  }

  valider() {
    if (!this.activeProp || !this.isPending(this.activeProp.status)) return;
    if (!this.canValidate()) {
      this.showToast('Veuillez sélectionner au moins un choix dans chaque section (Entrées, Plats, Desserts...).', 'error');
      return;
    }
    if (!this.ensureCommentProvided()) {
      this.showToast('Un commentaire est obligatoire avant de valider votre réponse.', 'error');
      return;
    }

    this.isSubmitting = true;
    const selectionObj: { [key: string]: any } = {};
    const summary: string[] = [];
    const itemsDetailed: any[] = [];
    const numericSelections: { [secId: string]: number[] } = {};

    if (this.activeProp.sections) {
      this.activeProp.sections.forEach((s: any) => {
        const itemNames = Array.from(this.clientSelections[s.nom] || []);
        selectionObj[s.nom] = itemNames;
        const chosenItems = (s.items || []).filter((it: any) => itemNames.includes(it.nom));
        const sKey = String(s.id);
        numericSelections[sKey] = chosenItems.map((it: any) => it.id);
        selectionObj[sKey] = chosenItems.map((it: any) => it.id);
        if (chosenItems.length > 0) {
          summary.push(`${s.nom}: ${itemNames.join(', ')}`);
          chosenItems.forEach((it: any) => {
            itemsDetailed.push({
              id: it.id,
              nom: it.nom,
              description: it.description,
              sectionId: s.id,
              sectionNom: s.nom
            });
          });
        }
      });
    }

    selectionObj['selections'] = numericSelections;
    selectionObj['summary'] = summary;
    selectionObj['items'] = itemsDetailed;
    selectionObj['validatedAt'] = new Date().toISOString();

    let fullComment = this.clientComment.trim();
    if (summary.length > 0 && !fullComment.includes('[Choix validés:')) {
      fullComment = `[Choix validés: ${summary.join(' | ')}] ${fullComment}`.trim();
    }

    this.clientApi.validerPropositionById(this.activeProp.id, {
      clientComment: fullComment,
      clientSelection: JSON.stringify(selectionObj)
    })
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          this.closeDetails();
          this.showToast('Vos choix ont été transmis avec succès au Chef !', 'success');
          this.loadPropositions();
        },
        error: (err) => {
          console.error(err);
          this.showToast('Une erreur est survenue lors de l\'envoi. Réessayez.', 'error');
        }
      });
  }

  confirmRefuse() {
    if (!this.activeProp || !this.isPending(this.activeProp.status)) return;
    if (!this.ensureCommentProvided()) {
      this.showToast('Un commentaire est obligatoire pour justifier votre refus.', 'error');
      return;
    }

    this.isSubmitting = true;
    this.clientApi.refuserPropositionById(this.activeProp.id, { clientComment: this.clientComment.trim() })
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          this.closeDetails();
          this.showToast('Refus transmis. Une proposition révisée vous sera envoyée.', 'success');
          this.loadPropositions();
        },
        error: (err) => {
          console.error(err);
          this.showToast('Une erreur est survenue. Réessayez.', 'error');
        }
      });
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 4000);
  }

  getBadgeClass(status?: string): string {
    const value = this.normalizeStatus(status);
    switch (value) {
      case 'envoyee':
      case 'vue':
        return 'badge-action-requise';
      case 'selectionnee_client':
        return 'badge-validee';
      case 'validee_gestionnaire':
        return 'badge-confirme';
      case 'refusee_client':
        return 'badge-refusee';
      case 'non_retenue':
        return 'badge-inactive';
      default:
        return 'badge-action-requise';
    }
  }

  getPropStatusIcon(status?: string): string {
    const value = this.normalizeStatus(status);
    switch (value) {
      case 'envoyee':
      case 'vue':
        return 'fa-bell';
      case 'selectionnee_client':
        return 'fa-check-circle';
      case 'validee_gestionnaire':
        return 'fa-file-contract';
      case 'refusee_client':
        return 'fa-times-circle';
      case 'non_retenue':
        return 'fa-times';
      default:
        return 'fa-bell';
    }
  }

  getStatusLabel(status: string): string {
    const value = this.normalizeStatus(status);
    switch(value) {
      case 'envoyee': return 'Action Requise';
      case 'vue': return 'Vue';
      case 'selectionnee_client': return 'Validée par vous';
      case 'validee_gestionnaire': return 'Devis Confirmé';
      case 'refusee_client': return 'Refusée';
      case 'non_retenue': return 'Non retenue';
      default: return status || 'Action Requise';
    }
  }
}
