import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ClientApiService, DemandeDevisResponseDto } from '../../services/client-api.service';
import { PanierService } from './services/panier.service';
import { CommandeClientService, ProduitCatalogue, Commande } from './services/commande-client.service';
import { FideliteService } from './services/fidelite.service';
import { KikiDataService } from '../../services/kiki-data.service';
import { forkJoin } from 'rxjs';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

export interface HomeSlide {
  id: string | number;
  badge: string;
  isPromo: boolean;
  titre: string;
  description: string;
  prix?: number;
  imageUrl: string;
  boutonTexte: string;
  boutonLien?: string;
  produit?: ProduitCatalogue;
}

@Component({
  selector: 'app-mykiki-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mykiki-home.component.html',
  styleUrl: './mykiki-home.component.css'
})
export class MyKikiHomeComponent implements OnInit, OnDestroy {
  unreadPropositions = 0;
  demandesEnCours = 0;
  pointsFidelite = 0;
  searchQuery = '';
  selectedCategory = 'all';

  dernieresCommandes: Commande[] = [];
  dernieresDemandes: DemandeDevisResponseDto[] = [];

  categories: CategoryItem[] = [
    { id: 'all', name: 'Tous', icon: 'fa-globe' }
  ];

  tousProduits: ProduitCatalogue[] = [];
  platsPhares: ProduitCatalogue[] = [];
  produitsAffiches: ProduitCatalogue[] = [];
  produitSelectionne: ProduitCatalogue | null = null;
  quantiteSelectionnee = 1;

  valeursFumee: string[] = ['Professionnalisme', 'Convivialité', 'Loyauté', 'Fiabilité', 'Excellence', 'Savoir-faire'];

  getPrenom(): string {
    const user = this.auth.getCurrentUser();
    if (!user) return 'Client';
    const raw = (user as any).prenom || user.fullName || '';
    if (!raw) return 'Client';
    if (raw.includes('@')) {
      const part = raw.split('@')[0];
      return part.charAt(0).toUpperCase() + part.slice(1);
    }
    return raw.trim().split(' ')[0] || raw;
  }

  // Slides du Hero Slider
  slides: HomeSlide[] = [
    {
      id: 'promo-lab',
      badge: 'Offre du Moment',
      isPromo: true,
      titre: 'Dégustation Offerte au Lab',
      description: 'Dès 40 convives, profitez d\'une séance dégustation sur-mesure avec notre Chef exécutif.',
      imageUrl: 'assets/images/table-with-delicious-sweets-covered-with-pink-silk.jpg',
      boutonTexte: 'Nouvelle demande',
      boutonLien: '/mykiki/nouvelle-demande'
    }
  ];
  slideActuel = 0;
  private slideTimeout: any;

  constructor(
    private auth: AuthService,
    private notifService: NotificationService,
    private clientApi: ClientApiService,
    private commandeClientService: CommandeClientService,
    private panierService: PanierService,
    private fideliteService: FideliteService,
    private dataService: KikiDataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.construireCategories();
    this.construireSlides();
    this.filtrerProduits();

    this.fideliteService.points$.subscribe(p => {
      this.pointsFidelite = p;
      this.cdr.markForCheck();
    });
    this.fideliteService.chargerFidelite();

    this.notifService.count$.subscribe(c => this.unreadPropositions = c);
    
    this.clientApi.getMyKikiStats().subscribe({
      next: (stats) => {
        if (stats) {
          this.demandesEnCours = stats.demandesEnCours ?? 0;
          if (stats.propositionsEnAttenteDeReponse !== undefined) {
            this.unreadPropositions = stats.propositionsEnAttenteDeReponse;
          }
        }
      },
      error: (err) => console.error('Erreur chargement stats MyKiki', err)
    });

    this.chargerCatalogue();
    this.chargerActivitesRecentes();
    this.demarrerAutoSlide();
  }

  ngOnDestroy(): void {
    this.arreterAutoSlide();
  }

  /**
   * Rotation automatique en boucle infinie :
   * Le slide "Nouvelle demande" / Promo reste plus longtemps (7.5s) que les plats (4s).
   */
  demarrerAutoSlide(): void {
    this.arreterAutoSlide();
    if (this.slides.length <= 1) return;

    const current = this.slides[this.slideActuel];
    const duree = current?.isPromo ? 7500 : 4000;

    this.slideTimeout = setTimeout(() => {
      this.slideSuivant();
      this.demarrerAutoSlide();
    }, duree);
  }

  pauseAutoSlide(): void {
    this.arreterAutoSlide();
  }

  reprendreAutoSlide(): void {
    this.demarrerAutoSlide();
  }

  private arreterAutoSlide(): void {
    if (this.slideTimeout) {
      clearTimeout(this.slideTimeout);
      this.slideTimeout = null;
    }
  }

  // Gestures Swipe & Touch / Drag Défilement tactile façon galerie
  private touchStartX = 0;
  private touchEndX = 0;
  private isDragging = false;

  onTouchStart(event: TouchEvent): void {
    this.pauseAutoSlide();
    if (event.touches && event.touches.length > 0) {
      this.touchStartX = event.touches[0].clientX;
      this.touchEndX = this.touchStartX;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches && event.touches.length > 0) {
      this.touchEndX = event.touches[0].clientX;
    }
  }

  onTouchEnd(event: TouchEvent): void {
    this.handleSwipe();
    this.reprendreAutoSlide();
  }

  onMouseDown(event: MouseEvent): void {
    this.pauseAutoSlide();
    this.isDragging = true;
    this.touchStartX = event.clientX;
    this.touchEndX = this.touchStartX;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.touchEndX = event.clientX;
  }

  onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.handleSwipe();
    this.reprendreAutoSlide();
  }

  private handleSwipe(): void {
    const swipeThreshold = 40;
    const deltaX = this.touchEndX - this.touchStartX;
    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX < 0) {
        this.slideSuivant();
      } else {
        this.slidePrecedent();
      }
    }
  }

  slideSuivant(): void {
    if (this.slides.length <= 1) return;
    this.slideActuel = (this.slideActuel + 1) % this.slides.length;
    this.cdr.detectChanges();
  }

  slidePrecedent(): void {
    if (this.slides.length <= 1) return;
    this.slideActuel = (this.slideActuel - 1 + this.slides.length) % this.slides.length;
    this.cdr.detectChanges();
  }

  allerAuSlide(idx: number): void {
    this.slideActuel = idx;
    this.demarrerAutoSlide();
    this.cdr.detectChanges();
  }

  getSelectedCategoryName(): string {
    if (this.selectedCategory === 'all') return 'Tous';
    const cat = this.categories.find(c => c.id === this.selectedCategory);
    return cat ? cat.name : this.selectedCategory;
  }

  getVoirPlusQueryParams(): Record<string, string> {
    if (this.selectedCategory !== 'all') {
      const cat = this.categories.find(c => c.id === this.selectedCategory);
      if (cat && cat.name) {
        return { categorie: cat.name };
      }
    }
    return {};
  }

  chargerCatalogue(): void {
    forkJoin({
      prods: this.commandeClientService.getProduits(true),
      cats: this.commandeClientService.getCategories(true)
    }).subscribe({
      next: ({ prods, cats }: { prods: ProduitCatalogue[]; cats: any[] }) => {
        const catMap = new Map<any, string>();
        (cats || []).forEach((c: any) => {
          catMap.set(c.id, c.nom);
          catMap.set(String(c.id), c.nom);
          catMap.set(Number(c.id), c.nom);
        });
        this.tousProduits = (prods || [])
          .filter((p: ProduitCatalogue) => p.disponible)
          .map((p: ProduitCatalogue) => {
            if (!p.categorieNom && p.categorieId && catMap.has(p.categorieId)) {
              p.categorieNom = catMap.get(p.categorieId);
            }
            if (!p.categorieNom) {
              p.categorieNom = 'Mets';
            }
            return p;
          })
          .filter((p: ProduitCatalogue) => {
            const cat = (p.categorieNom || '').toLowerCase();
            return !cat.includes('garniture') && !cat.includes('accompagnement');
          });

        this.construireCategories();
        this.construireSlides();
        this.filtrerProduits();
      },
      error: (err) => {
        console.error('Erreur chargement catalogue API:', err);
        this.tousProduits = [];
        this.construireCategories();
        this.construireSlides();
        this.filtrerProduits();
      }
    });
  }

  private construireSlides(): void {
    const list: HomeSlide[] = [
      {
        id: 'promo-lab',
        badge: 'Offre du Moment',
        isPromo: true,
        titre: 'Dégustation Offerte au Lab',
        description: 'Dès 40 convives, profitez d\'une séance dégustation sur-mesure avec notre Chef exécutif.',
        imageUrl: 'assets/images/table-with-delicious-sweets-covered-with-pink-silk.jpg',
        boutonTexte: 'Nouvelle demande',
        boutonLien: '/mykiki/nouvelle-demande'
      }
    ];

    // Ajouter les mets dans le slider avec le badge "Commander immédiatement" (pas de mention "phare" pour le client)
    let phares = this.tousProduits.filter(p => p.estPhare);
    if (phares.length === 0 && this.tousProduits.length > 0) {
      phares = this.tousProduits.slice(0, 4);
    }

    phares.forEach(p => {
      list.push({
        id: p.id,
        badge: 'Commander immédiatement',
        isPromo: false,
        titre: p.nom,
        description: p.description || 'Une création culinaire d\'exception préparée avec des ingrédients nobles.',
        prix: p.prix,
        imageUrl: p.imageUrl || 'assets/images/table-with-delicious-sweets-covered-with-pink-silk.jpg',
        boutonTexte: 'Voir ce plat',
        produit: p
      });
    });

    this.slides = list;
  }

  private construireCategories(): void {
    const catsMap = new Map<string, number>();
    this.tousProduits.forEach(p => {
      const catNom = (p.categorieNom || 'Autres').trim();
      if (!catNom.toLowerCase().includes('garniture') && !catNom.toLowerCase().includes('accompagnement')) {
        catsMap.set(catNom, (catsMap.get(catNom) || 0) + 1);
      }
    });

    const categoryList: CategoryItem[] = [
      { id: 'all', name: 'Tous', icon: 'fa-globe' }
    ];

    catsMap.forEach((_, catNom) => {
      categoryList.push({
        id: catNom.toLowerCase(),
        name: catNom,
        icon: this.getCategoryIcon(catNom)
      });
    });

    this.categories = categoryList;
  }

  getCategoryIcon(catName: string): string {
    if (!catName) return 'fa-utensils';
    const c = catName.toLowerCase();
    if (c.includes('cocktail') || c.includes('boisson') || c.includes('jus') || c.includes('vin') || c.includes('bar')) {
      return 'fa-cocktail';
    }
    if (c.includes('plateau') || c.includes('boîte') || c.includes('boite')) {
      return 'fa-boxes-stacked';
    }
    if (c.includes('pièce') || c.includes('piece') || c.includes('salé') || c.includes('sale') || c.includes('amuse')) {
      return 'fa-cubes';
    }
    if (c.includes('plat') || c.includes('chaud') || c.includes('viande') || c.includes('poisson') || c.includes('grill') || c.includes('méchoui')) {
      return 'fa-utensils';
    }
    if (c.includes('entrée') || c.includes('entree') || c.includes('salade') || c.includes('fraich') || c.includes('veget')) {
      return 'fa-leaf';
    }
    if (c.includes('garniture') || c.includes('riz') || c.includes('pâte') || c.includes('accompagn')) {
      return 'fa-bowl-rice';
    }
    if (c.includes('dessert') || c.includes('sucré') || c.includes('sucre') || c.includes('douceur') || c.includes('gâteau') || c.includes('patiss')) {
      return 'fa-birthday-cake';
    }
    return 'fa-utensils';
  }

  onSearch(): void {
    this.filtrerProduits();
  }

  selectCategory(catId: string): void {
    this.selectedCategory = catId;
    this.filtrerProduits();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.filtrerProduits();
  }

  getQuantitePanier(produitId: number): number {
    return this.panierService.getQuantite(produitId);
  }

  private filtrerProduits(): void {
    const q = this.searchQuery.toLowerCase().trim();

    // Cas 1 : Recherche textuelle
    if (q) {
      let matches = this.tousProduits.filter(p =>
        (p.nom && p.nom.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.categorieNom && p.categorieNom.toLowerCase().includes(q))
      );

      if (this.selectedCategory !== 'all') {
        const catObj = this.categories.find(c => c.id === this.selectedCategory);
        const targetCatName = catObj ? catObj.name.toLowerCase() : this.selectedCategory.toLowerCase();
        matches = matches.filter(p =>
          (p.categorieNom || 'Autres').trim().toLowerCase() === targetCatName
        );
        // Au moment des filtres : limiter à 4 mets
        this.produitsAffiches = matches.slice(0, 4);
      } else {
        // Recherche globale : max 4 mets par catégorie
        const prodsParCat: ProduitCatalogue[] = [];
        const distinctCats = this.categories.filter(c => c.id !== 'all');
        distinctCats.forEach(cat => {
          const prods = matches.filter(p =>
            (p.categorieNom || 'Autres').trim().toLowerCase() === cat.name.toLowerCase()
          );
          prodsParCat.push(...prods.slice(0, 4));
        });
        const addedIds = new Set(prodsParCat.map(p => p.id));
        const rest = matches.filter(p => !addedIds.has(p.id));
        this.produitsAffiches = [...prodsParCat, ...rest.slice(0, 4)];
      }
      return;
    }

    // Cas 2 : Filtre par catégorie sélectionnée -> 4 mets de la catégorie
    if (this.selectedCategory !== 'all') {
      const catObj = this.categories.find(c => c.id === this.selectedCategory);
      const targetCatName = catObj ? catObj.name.toLowerCase() : this.selectedCategory.toLowerCase();

      const prodsDeLaCat = this.tousProduits.filter(p =>
        (p.categorieNom || 'Autres').trim().toLowerCase() === targetCatName
      );

      // Tri : phares en premier, puis alphabétique
      const trie = prodsDeLaCat.slice().sort((a, b) => {
        if (a.estPhare && !b.estPhare) return -1;
        if (!a.estPhare && b.estPhare) return 1;
        return (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' });
      });

      // Max 4 mets pour la catégorie filtrée
      this.produitsAffiches = trie.slice(0, 4);
      return;
    }

    // Cas 3 : Vue d'accueil par défaut (Tous) -> 2 produits de chaque catégorie
    const prodsParCat: ProduitCatalogue[] = [];
    const distinctCats = this.categories.filter(c => c.id !== 'all');

    distinctCats.forEach(cat => {
      const prods = this.tousProduits.filter(p =>
        (p.categorieNom || 'Autres').trim().toLowerCase() === cat.name.toLowerCase()
      );

      // Tri : phares en premier, puis alphabétique
      const trie = prods.slice().sort((a, b) => {
        if (a.estPhare && !b.estPhare) return -1;
        if (!a.estPhare && b.estPhare) return 1;
        return (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' });
      });

      // 2 produits de chaque catégorie
      prodsParCat.push(...trie.slice(0, 2));
    });

    if (prodsParCat.length === 0 && this.tousProduits.length > 0) {
      prodsParCat.push(...this.tousProduits.slice(0, 8));
    }

    this.produitsAffiches = prodsParCat;
  }

  ajouterAuPanier(p: ProduitCatalogue): void {
    const qte = Math.max(1, p.quantiteMinimale || 1);
    this.panierService.ajouter({
      produitId: p.id,
      nom: p.nom,
      imageUrl: p.imageUrl,
      prixUnitaire: p.prix,
      delaiPreparationHeures: p.delaiPreparationHeures || 48,
      quantiteMinimale: p.quantiteMinimale || 1,
      categorieId: p.categorieId,
      categorieNom: p.categorieNom,
      garnituresCompatibles: p.garnituresCompatibles || []
    }, qte);
    this.dataService.showToast(`${qte > 1 ? qte + 'x ' : ''}${p.nom} ajouté au panier.`);
  }

  ouvrirProduit(p: ProduitCatalogue): void {
    this.produitSelectionne = p;
    this.quantiteSelectionnee = Math.max(1, p.quantiteMinimale || 1);
  }

  fermerDetails(): void {
    this.produitSelectionne = null;
    this.quantiteSelectionnee = 1;
  }

  augmenterQuantite(): void {
    this.quantiteSelectionnee++;
  }

  diminuerQuantite(): void {
    const min = this.produitSelectionne?.quantiteMinimale || 1;
    if (this.quantiteSelectionnee > min) {
      this.quantiteSelectionnee--;
    }
  }

  ajouterSelectionAuPanier(): void {
    if (!this.produitSelectionne) return;
    const p = this.produitSelectionne;
    this.panierService.ajouter({
      produitId: p.id,
      nom: p.nom,
      imageUrl: p.imageUrl,
      prixUnitaire: p.prix,
      delaiPreparationHeures: p.delaiPreparationHeures || 48,
      quantiteMinimale: p.quantiteMinimale || 1,
      categorieId: p.categorieId,
      categorieNom: p.categorieNom,
      garnituresCompatibles: p.garnituresCompatibles || []
    }, this.quantiteSelectionnee);
    this.dataService.showToast(`${this.quantiteSelectionnee}x ${p.nom} ajouté(s) au panier.`);
    this.fermerDetails();
  }

  ouvrirModaleFidelite(): void {
    this.fideliteService.ouvrirModale();
  }

  chargerActivitesRecentes(): void {
    // 1. Dernières commandes (max 2)
    this.commandeClientService.mesCommandes().subscribe({
      next: (commandes) => {
        this.dernieresCommandes = (commandes || []).slice(0, 2);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('Erreur chargement dernières commandes', err);
        this.dernieresCommandes = [];
      }
    });

    // 2. Dernières demandes de devis (max 2)
    this.clientApi.getMykikiDemandes().subscribe({
      next: (demandes) => {
        this.dernieresDemandes = (demandes || []).slice(0, 2);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('Erreur chargement dernières demandes', err);
        this.dernieresDemandes = [];
      }
    });
  }

  getBadgeClassCommande(statut?: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'st-attente';
      case 'ACCEPTEE': return 'st-validee';
      case 'EN_COURS': return 'st-encours';
      case 'PRETE': return 'st-prete';
      case 'TERMINEE': return 'st-terminee';
      case 'ANNULEE': return 'st-annulee';
      default: return 'st-attente';
    }
  }

  getIconeCommande(statut?: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'fa-clock';
      case 'ACCEPTEE': return 'fa-check';
      case 'EN_COURS': return 'fa-fire-burner';
      case 'PRETE': return 'fa-box-open';
      case 'TERMINEE': return 'fa-check-double';
      case 'ANNULEE': return 'fa-ban';
      default: return 'fa-circle-info';
    }
  }

  getStatutDemandeEffectif(d: DemandeDevisResponseDto | string): string {
    if (!d) return 'EN_ATTENTE';
    if (typeof d === 'string') return d;
    const demStatus = (d.status || '').toUpperCase();
    if (demStatus === 'ACCEPTEE' || demStatus === 'ACCEPTED' || demStatus === 'DEVIS_VALIDE' || demStatus === 'ABOUTI' || demStatus === 'ABOUTIS') {
      return 'ACCEPTEE';
    }
    if (demStatus === 'PROPOSITION_VALIDEE' || demStatus === 'SELECTION_CLIENT') {
      return 'PROPOSITION_VALIDEE';
    }
    if (d.propositions && d.propositions.length > 0) {
      if (d.propositions.some(p => p.status === 'selectionnee_client' || p.status === 'validee_gestionnaire')) {
        return 'PROPOSITION_VALIDEE';
      }
      const hasEnAttente = d.propositions.some(p => p.status === 'envoyee' || p.status === 'vue' || !p.status);
      if (hasEnAttente || demStatus === 'PROPOSITION_ENVOYEE' || demStatus === 'PROPOSITIONS_ENVOYEES') {
        return 'PROPOSITION_ENVOYEE';
      }
      const allRefused = d.propositions.every(p => p.status === 'refusee_client' || p.status === 'refusee');
      if (allRefused) {
        return 'PROPOSITION_REFUSEE';
      }
    }
    if (demStatus === 'REFUSEE_CLIENT' || demStatus === 'PROPOSITION_REFUSEE') {
      return 'PROPOSITION_REFUSEE';
    }
    if (demStatus === 'ANNULEE' || demStatus === 'CANCELLED') {
      return 'ANNULEE';
    }
    if (demStatus === 'PROPOSITION_ENVOYEE' || demStatus === 'PROPOSITIONS_ENVOYEES') {
      return 'PROPOSITION_ENVOYEE';
    }
    return d.status || 'EN_ATTENTE';
  }

  getLibelleStatutDemande(d: DemandeDevisResponseDto): string {
    const st = this.getStatutDemandeEffectif(d);
    switch (st?.toUpperCase()) {
      case 'EN_ATTENTE':
      case 'PENDING':
        return 'En étude';
      case 'PROPOSITION_ENVOYEE':
      case 'PROPOSITIONS_ENVOYEES':
      case 'PROPOSAL_SENT':
        return 'Proposition reçue';
      case 'PROPOSITION_VALIDEE':
      case 'SELECTION_CLIENT':
        return 'Proposition validée';
      case 'PROPOSITION_REFUSEE':
      case 'REFUSEE_CLIENT':
        return 'Proposition refusée';
      case 'ACCEPTEE':
      case 'ACCEPTED':
      case 'ABOUTI':
      case 'DEVIS_VALIDE':
        return 'Devis accepté';
      case 'ANNULEE':
      case 'CANCELLED':
        return 'Annulée';
      default:
        return 'En étude';
    }
  }

  getBadgeClassDemande(d: DemandeDevisResponseDto): string {
    const st = this.getStatutDemandeEffectif(d);
    switch (st?.toUpperCase()) {
      case 'EN_ATTENTE':
      case 'PENDING':
        return 'st-attente';
      case 'PROPOSITION_ENVOYEE':
      case 'PROPOSITIONS_ENVOYEES':
      case 'PROPOSAL_SENT':
        return 'st-proposition';
      case 'PROPOSITION_VALIDEE':
      case 'SELECTION_CLIENT':
        return 'st-validee';
      case 'PROPOSITION_REFUSEE':
      case 'REFUSEE_CLIENT':
        return 'st-annulee';
      case 'ACCEPTEE':
      case 'ACCEPTED':
      case 'ABOUTI':
      case 'DEVIS_VALIDE':
        return 'st-acceptee';
      case 'ANNULEE':
      case 'CANCELLED':
        return 'st-annulee';
      default:
        return 'st-attente';
    }
  }

  getIconeDemande(d: DemandeDevisResponseDto): string {
    const st = this.getStatutDemandeEffectif(d);
    switch (st?.toUpperCase()) {
      case 'EN_ATTENTE':
      case 'PENDING':
        return 'fa-hourglass-half';
      case 'PROPOSITION_ENVOYEE':
      case 'PROPOSAL_SENT':
        return 'fa-bell';
      case 'PROPOSITION_VALIDEE':
        return 'fa-check';
      case 'PROPOSITION_REFUSEE':
        return 'fa-rotate-left';
      case 'ACCEPTEE':
      case 'ACCEPTED':
      case 'ABOUTI':
        return 'fa-check-double';
      case 'ANNULEE':
      case 'CANCELLED':
        return 'fa-ban';
      default:
        return 'fa-circle-info';
    }
  }
}


