import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GestionnaireApiService, CommandeDto } from '../../../services/gestionnaire-api.service';
import { CommandeStoreService } from '../../../services/commande-store.service';
import { KikiDataService } from '../../../services/kiki-data.service';

interface RepartitionNote {
  etoiles: number;
  compte: number;
  pourcentage: number;
}

@Component({
  selector: 'app-gestionnaire-avis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './avis.component.html',
  styleUrl: './avis.component.css'
})
export class AvisComponent implements OnInit {

  chargement = false;
  commandes: CommandeDto[] = [];
  toutesCommandes: CommandeDto[] = [];

  // Filtres & Recherche
  rechercheTexte = '';
  filtreNote: number | 'TOUTES' | 'AVEC_TEXTE' = 'TOUTES';

  // Statistiques
  noteMoyenne = 0;
  totalAvis = 0;
  totalAvecCommentaire = 0;
  repartitions: RepartitionNote[] = [];

  // Pagination
  page = 1;
  taillePage = 10;
  totalElements = 0;
  totalPages = 1;

  // Modale Détail de l'Avis & Panier
  modaleDetailAvisOuverte = false;
  commandeSelectionnee: CommandeDto | null = null;

  // Modale Panier rétrocompatible
  modalePanierOuverte = false;
  commandePourPanier: CommandeDto | null = null;

  constructor(
    private api: GestionnaireApiService,
    private store: CommandeStoreService,
    private dataService: KikiDataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.charger();

    this.store.commandes$.subscribe(liste => {
      if (liste && liste.length > 0) {
        this.toutesCommandes = liste;
        this.calculerStats();
        this.filtrerAvis();
        this.cdr.detectChanges();
      }
    });
  }

  charger(): void {
    this.chargement = true;
    this.api.getCommandes('TOUTES', 'TOUS', 0, 150).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.content)) {
          this.toutesCommandes = res.content;
          this.store.synchroniserListeDepuisBackend(res.content);
        } else {
          this.toutesCommandes = this.store.getCommandes();
        }
        this.calculerStats();
        this.filtrerAvis();
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement avis', err);
        this.toutesCommandes = this.store.getCommandes();
        this.calculerStats();
        this.filtrerAvis();
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  getCommandesAvecAvis(): CommandeDto[] {
    return this.toutesCommandes.filter(c => c.noteClientAvis != null && c.noteClientAvis > 0);
  }

  calculerStats(): void {
    const list = this.getCommandesAvecAvis();
    this.totalAvis = list.length;
    this.totalAvecCommentaire = list.filter(c => !!c.commentaireClientAvis && c.commentaireClientAvis.trim().length > 0).length;

    if (this.totalAvis === 0) {
      this.noteMoyenne = 0;
      this.repartitions = [5, 4, 3, 2, 1].map(etoiles => ({ etoiles, compte: 0, pourcentage: 0 }));
      return;
    }

    const totalSomme = list.reduce((acc, c) => acc + (c.noteClientAvis || 0), 0);
    this.noteMoyenne = Math.round((totalSomme / this.totalAvis) * 10) / 10;

    this.repartitions = [5, 4, 3, 2, 1].map(etoiles => {
      const compte = list.filter(c => Math.round(c.noteClientAvis || 0) === etoiles).length;
      const pourcentage = Math.round((compte / this.totalAvis) * 100);
      return { etoiles, compte, pourcentage };
    });
  }

  filtrerAvis(resetPage: boolean = false): void {
    if (resetPage) {
      this.page = 1;
    }

    let list = this.getCommandesAvecAvis();

    // Filtre par note / critère
    if (this.filtreNote === 'AVEC_TEXTE') {
      list = list.filter(c => !!c.commentaireClientAvis && c.commentaireClientAvis.trim().length > 0);
    } else if (typeof this.filtreNote === 'number') {
      list = list.filter(c => Math.round(c.noteClientAvis || 0) === this.filtreNote);
    }

    // Filtre par recherche textuelle
    if (this.rechercheTexte.trim()) {
      const q = this.rechercheTexte.toLowerCase().trim();
      list = list.filter(c =>
        (c.numero && c.numero.toLowerCase().includes(q)) ||
        (c.clientNom && c.clientNom.toLowerCase().includes(q)) ||
        (c.clientTelephone && c.clientTelephone.includes(q)) ||
        (c.clientEmail && c.clientEmail.toLowerCase().includes(q)) ||
        (c.commentaireClientAvis && c.commentaireClientAvis.toLowerCase().includes(q)) ||
        (c.lignes && c.lignes.some(l => (l.produitNom || '').toLowerCase().includes(q)))
      );
    }

    // Tri du plus récent au plus ancien
    list.sort((a, b) => {
      const dateA = new Date(a.avisDate || a.updatedAt || a.dateRemise || a.createdAt || 0).getTime();
      const dateB = new Date(b.avisDate || b.updatedAt || b.dateRemise || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    this.totalElements = list.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.taillePage));
    if (this.page > this.totalPages) {
      this.page = 1;
    }

    const start = (this.page - 1) * this.taillePage;
    this.commandes = list.slice(start, start + this.taillePage);
  }

  selectionnerFiltreNote(filtre: number | 'TOUTES' | 'AVEC_TEXTE'): void {
    this.filtreNote = filtre;
    this.filtrerAvis(true);
  }

  changerPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.filtrerAvis(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pagesAffichees(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const cur = this.page;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (cur > 3) pages.push('...');
    const debut = Math.max(2, cur - 1);
    const fin = Math.min(total - 1, cur + 1);
    for (let i = debut; i <= fin; i++) pages.push(i);
    if (cur < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  allerVersFidelite(): void {
    this.router.navigate(['/gestionnaire/fidelite']);
  }

  allerVersCommande(numero: string): void {
    this.router.navigate(['/gestionnaire/commandes'], { queryParams: { numero } });
  }

  // ══════════════════════════════════════════════════════
  // MODALE DÉTAIL DE L'AVIS & PANIER
  // ══════════════════════════════════════════════════════

  ouvrirDetailAvis(c: CommandeDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.commandeSelectionnee = c;
    this.modaleDetailAvisOuverte = true;
    this.cdr.detectChanges();

    if (!c.lignes || c.lignes.length === 0) {
      this.api.getCommande(c.id).subscribe({
        next: (full) => {
          if (full && full.lignes && full.lignes.length > 0) {
            this.commandeSelectionnee = { ...c, ...full };
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.cdr.detectChanges();
        }
      });
    }
  }

  fermerDetailAvis(): void {
    this.modaleDetailAvisOuverte = false;
    this.commandeSelectionnee = null;
    this.cdr.detectChanges();
  }

  // ══════════════════════════════════════════════════════
  // MODALE PANIER
  // ══════════════════════════════════════════════════════

  ouvrirModalePanier(c: CommandeDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.ouvrirDetailAvis(c, event);
  }

  fermerModalePanier(): void {
    this.fermerDetailAvis();
  }

  getLignesCommande(c: CommandeDto | null): any[] {
    if (!c) return [];
    if (c.lignes && Array.isArray(c.lignes) && c.lignes.length > 0) return c.lignes;
    const fromStore = this.store.getCommandeById(c.id);
    if (fromStore?.lignes && Array.isArray(fromStore.lignes) && fromStore.lignes.length > 0) {
      return fromStore.lignes;
    }
    const anyC = c as any;
    if (anyC.articles && Array.isArray(anyC.articles) && anyC.articles.length > 0) return anyC.articles;
    if (anyC.items && Array.isArray(anyC.items) && anyC.items.length > 0) return anyC.items;
    return [];
  }

  getNomProduit(l: any): string {
    if (!l) return 'Mets Kiki Traiteur';
    return l.produitNom || l.nom || l.nomProduit || l.designation || l.titre || l.plat || 'Mets Kiki Traiteur';
  }

  getPrixUnitaire(l: any): number {
    if (!l) return 0;
    return l.prixUnitaire || l.prix || l.unitPrice || 0;
  }

  getQuantite(l: any): number {
    if (!l) return 1;
    return l.quantite || l.qte || l.quantity || 1;
  }

  getSousTotal(l: any): number {
    if (!l) return 0;
    if (l.sousTotal != null) return l.sousTotal;
    return this.getPrixUnitaire(l) * this.getQuantite(l);
  }

  compterTotalArticles(c: CommandeDto): number {
    const lignes = this.getLignesCommande(c);
    if (!lignes || lignes.length === 0) return 0;
    return lignes.reduce((total, l) => total + this.getQuantite(l), 0);
  }
}
