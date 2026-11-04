import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KikiDataService } from '../../../services/kiki-data.service';
import { GestionnaireApiService } from '../../../services/gestionnaire-api.service';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

export interface PropositionSectionItem {
  id?: number;
  nom: string;
  description: string;
}

export interface PropositionSection {
  id?: number;
  nom: string;
  maxChoix: number;
  items: PropositionSectionItem[];
}

export interface Proposition {
  id?: number;
  titre: string;
  description: string;
  prixUnitairePersonne: number;
  imageUrl?: string;
  sections: PropositionSection[];
}

@Component({
  selector: 'app-propositions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './propositions.component.html',
  styleUrl: './propositions.component.css'
})
export class PropositionsComponent implements OnInit {
  allPropositions: Proposition[] = [];
  filteredPropositions: Proposition[] = [];
  propositions: Proposition[] = [];
  envoyees: any[] = [];
  selectedProposition: Proposition | null = null;
  viewingProposition: Proposition | null = null;
  isEditing = false;
  isAdding = false;
  
  loading = false;
  activeTab = 'catalogue'; // 'catalogue' | 'envoyees'

  // Recherche & Filtres
  searchQuery = '';
  searchFilter = '';
  tarifFilter = 'ALL';

  onSearchChange(): void {
    this.searchQuery = this.searchFilter || this.searchQuery;
    this.applyFilters();
  }

  // Pagination
  propPage = 1;
  propPageSize = 10;
  propTotalPages = 1;
  propTotalElements = 0;

  constructor(
    private apiService: GestionnaireApiService,
    private dataService: KikiDataService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
    this.loadPropositions();
    this.loadEnvoyees();
  }

  loadEnvoyees() {
    this.apiService.getPropositionsEnvoyees().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : ((res && res.content) ? res.content : []);
        // Ne conserver que les propositions validées et transmises à l'ERP
        const validesErp = list.filter((p: any) => 
          p.status === 'validee_gestionnaire' || p.status === 'VALIDEE_GESTIONNAIRE' || p.status === 'transmise_erp' || p.status === 'devis_genere'
        );
        this.envoyees = [...validesErp].sort((a: any, b: any) => {
          const timeB = b.gestionnaireValidatedAt ? new Date(b.gestionnaireValidatedAt).getTime() : (b.dateEnvoi ? new Date(b.dateEnvoi).getTime() : 0);
          const timeA = a.gestionnaireValidatedAt ? new Date(a.gestionnaireValidatedAt).getTime() : (a.dateEnvoi ? new Date(a.dateEnvoi).getTime() : 0);
          return timeB - timeA || ((b.id || 0) - (a.id || 0));
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des propositions envoyées à l\'ERP', err);
      }
    });
  }

  loadPropositions() {
    this.loading = true;
    this.apiService.getPropositions(0, 500).subscribe({
      next: (res: any) => {
        let list: any[] = [];
        if (res && Array.isArray(res.content)) {
          list = res.content;
        } else if (Array.isArray(res)) {
          list = res;
        }
        this.allPropositions = [...list].sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des propositions:', err);
        this.loading = false;
        this.allPropositions = [];
        this.applyFilters();
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters() {
    let result = [...this.allPropositions];

    // 1. Filtrage par mot-clé (Titre, Description, ID)
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.titre && p.titre.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.id && String(p.id).includes(q))
      );
    }

    // 2. Filtrage par tranche de tarif
    if (this.tarifFilter !== 'ALL') {
      result = result.filter(p => {
        const price = p.prixUnitairePersonne || 0;
        if (this.tarifFilter === 'SUR_DEVIS') return price <= 0;
        if (this.tarifFilter === 'LESS_5K') return price > 0 && price <= 5000;
        if (this.tarifFilter === '5K_15K') return price > 5000 && price <= 15000;
        if (this.tarifFilter === 'MORE_15K') return price > 15000;
        return true;
      });
    }

    // Liste complete apres filtrage : c'est elle qui decide de l'affichage du
    // tableau dans le template. Elle n'etait jamais assignee, donc le catalogue
    // restait invisible et l'ecran "Aucune proposition trouvee" s'affichait
    // meme lorsque des propositions existaient.
    this.filteredPropositions = result;

    this.propTotalElements = result.length;
    this.propTotalPages = Math.max(1, Math.ceil(this.propTotalElements / this.propPageSize));
    
    if (this.propPage > this.propTotalPages) {
      this.propPage = 1;
    }
    
    const start = (this.propPage - 1) * this.propPageSize;
    this.propositions = result.slice(start, start + this.propPageSize);
    this.cdr.detectChanges();
  }

  resetFilters() {
    this.searchQuery = '';
    this.tarifFilter = 'ALL';
    this.propPage = 1;
    this.applyFilters();
  }

  onPropPageChange(page: number) {
    if (page >= 1 && page <= this.getPropTotalPages()) {
      this.propPage = page;
      this.applyFilters();
    }
  }

  getPropTotalPages(): number {
    return Math.max(1, this.propTotalPages);
  }

  getPropPaginationArray(): (number | string)[] {
    const current = this.propPage;
    const last = this.getPropTotalPages();
    const delta = 2;
    const left = current - delta;
    const right = current + delta + 1;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= last; i++) {
      if (i === 1 || i === last || (i >= left && i < right)) {
        range.push(i);
      }
    }

    for (const i of range) {
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

  openAddModal() {
    this.selectedProposition = {
      titre: '',
      description: '',
      prixUnitairePersonne: 0,
      sections: []
    };
    this.isAdding = true;
    this.isEditing = true;
  }

  openEditModal(prop: Proposition) {
    if (!prop.id) return;
    this.loading = true;
    this.apiService.getPropositionById(prop.id).subscribe({
      next: (res) => {
        this.selectedProposition = res;
        this.isAdding = false;
        this.isEditing = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.dataService.showToast("Erreur lors du chargement de la proposition", true);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeModal() {
    this.isEditing = false;
    this.selectedProposition = null;
  }

  addSection() {
    if (this.selectedProposition) {
      this.selectedProposition.sections.push({
        nom: '',
        maxChoix: 1,
        items: []
      });
    }
  }

  removeSection(index: number) {
    if (this.selectedProposition) {
      this.selectedProposition.sections.splice(index, 1);
    }
  }

  addItem(section: PropositionSection) {
    section.items.push({
      nom: '',
      description: ''
    });
  }

  removeItem(section: PropositionSection, index: number) {
    section.items.splice(index, 1);
  }

  saveProposition() {
    if (!this.selectedProposition) return;

    if (this.isAdding) {
      this.apiService.createProposition(this.selectedProposition).subscribe({
        next: (res) => {
          this.dataService.showToast("Proposition ajoutée avec succès");
          this.loadPropositions();
          this.closeModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.dataService.showToast("Erreur lors de l'ajout", true);
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    } else {
      if (!this.selectedProposition.id) return;
      this.apiService.updateProposition(this.selectedProposition.id, this.selectedProposition).subscribe({
        next: (res) => {
          this.dataService.showToast("Proposition modifiée avec succès");
          this.loadPropositions();
          this.closeModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.dataService.showToast("Erreur lors de la modification", true);
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteProposition(prop: Proposition) {
    if (!prop.id) return;
    if (confirm(`Voulez-vous vraiment supprimer la proposition "${prop.titre}" ?`)) {
      this.apiService.deleteProposition(prop.id).subscribe({
        next: () => {
          this.dataService.showToast("Proposition supprimée");
          this.loadPropositions();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.dataService.showToast("Erreur lors de la suppression", true);
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  // --- View Details for Envoyées ---
  viewingEnvoyee: any = null;
  parsedClientSelection: any = null;

  openViewModal(env: any) {
    this.viewingEnvoyee = env;
    if (env.clientSelection) {
      try {
        this.parsedClientSelection = typeof env.clientSelection === 'string' ? JSON.parse(env.clientSelection) : env.clientSelection;
      } catch (e) {
        this.parsedClientSelection = null;
      }
    } else {
      this.parsedClientSelection = null;
    }
  }

  closeViewModal() {
    this.viewingEnvoyee = null;
    this.parsedClientSelection = null;
  }

  getClientChoices(prop: any): { sectionNom: string; items: string[] }[] {
    if (!prop) return [];
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
                       (prop.demandeId ? localStorage.getItem('kiki_demande_choices_' + prop.demandeId) : null);
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

  // --- View Details for Catalogue ---
  openViewProposition(prop: Proposition) {
    this.viewingProposition = prop;
    if (prop.id) {
      this.apiService.getPropositionById(prop.id).subscribe({
        next: (fullProp: any) => {
          if (fullProp) {
            this.viewingProposition = fullProp;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.warn('Utilisation des données locales:', err);
        }
      });
    }
  }

  closeViewProposition() {
    this.viewingProposition = null;
  }
}
