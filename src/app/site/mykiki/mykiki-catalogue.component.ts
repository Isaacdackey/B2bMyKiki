import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PanierService } from './services/panier.service';
import { CommandeClientService, ProduitCatalogue } from './services/commande-client.service';
import { KikiDataService } from '../../services/kiki-data.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-mykiki-catalogue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mykiki-catalogue.component.html',
  styleUrl: './mykiki-catalogue.component.css'
})
export class MyKikiCatalogueComponent implements OnInit {
  ongletPrincipal: 'A_EMPORTER' | 'PRESTATIONS' = 'A_EMPORTER';
  produits: ProduitCatalogue[] = [];
  categories: string[] = [];
  categorieActive = 'TOUTES';
  termeRecherche = '';
  chargement = false;
  produitSelectionne: ProduitCatalogue | null = null;
  quantiteSelectionnee = 1;

  // Pagination au scroll : 10 produits initiaux + 10 à chaque fin de défilement
  produitsVisiblesCount = 10;
  readonly tailleLot = 10;
  chargementSuite = false;

  configFidelite: any = null;

  constructor(
    private panier: PanierService,
    private api: CommandeClientService,
    private dataService: KikiDataService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  changerOngletPrincipal(tab: 'A_EMPORTER' | 'PRESTATIONS'): void {
    this.ongletPrincipal = tab;
  }

  demanderPrestation(prestationId: 'restauration-entreprise' | 'evenementiel'): void {
    this.router.navigate(['/mykiki/nouvelle-demande'], { queryParams: { prestation: prestationId } });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['categorie']) {
        this.categorieActive = params['categorie'];
        this.produitsVisiblesCount = this.tailleLot;
      }
    });
    this.chargerCatalogue();
    this.chargerConfigFidelite();
  }

  chargerConfigFidelite(): void {
    this.http.get<any>(`${environment.apiUrl}/api/fidelite/config`).subscribe({
      next: (cfg) => {
        this.configFidelite = cfg;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  estProduitBonus(produitId: number): boolean {
    if (!this.configFidelite) return false;
    if (this.configFidelite.produitsBonus && this.configFidelite.produitsBonus.some((p: any) => p.id === produitId)) {
      return true;
    }
    if (this.configFidelite.produitIdsBonus && this.configFidelite.produitIdsBonus.includes(produitId)) {
      return true;
    }
    if (this.configFidelite.produitsBonusIds) {
      const ids = this.configFidelite.produitsBonusIds.split(',').map((x: string) => Number(x.trim()));
      return ids.includes(produitId);
    }
    return false;
  }

  filtrerProduits(): void {
    this.produitsVisiblesCount = this.tailleLot;
    this.cdr.detectChanges();
  }

  reinitialiserFiltres(): void {
    this.categorieActive = 'TOUTES';
    this.termeRecherche = '';
    this.produitsVisiblesCount = this.tailleLot;
    this.cdr.detectChanges();
  }

  get produitsFiltres(): ProduitCatalogue[] {
    let prods = this.categorieActive === 'TOUTES'
      ? this.produits
      : this.produits.filter(p => p.categorieNom === this.categorieActive);

    if (this.termeRecherche && this.termeRecherche.trim()) {
      const q = this.termeRecherche.trim().toLowerCase();
      prods = prods.filter(p => 
        (p.nom && p.nom.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.categorieNom && p.categorieNom.toLowerCase().includes(q))
      );
    }

    // Tri alphabétique par nom du produit
    return prods.slice().sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }));
  }

  get produitsFiltresTotal(): number {
    return this.produitsFiltres.length;
  }

  get produitsAffiches(): ProduitCatalogue[] {
    return this.produitsFiltres.slice(0, this.produitsVisiblesCount);
  }

  getQuantitePanier(produitId: number): number {
    return this.panier.getQuantite(produitId);
  }

  changerCategorie(cat: string): void {
    this.categorieActive = cat;
    this.produitsVisiblesCount = this.tailleLot;
    this.cdr.detectChanges();
  }

  // Écouteur de scroll pour le chargement infini
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (this.chargement || this.chargementSuite) return;
    if (this.produitsVisiblesCount >= this.produitsFiltresTotal) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 250;

    if (scrollPosition >= threshold) {
      this.chargerPlus();
    }
  }

  chargerPlus(): void {
    if (this.produitsVisiblesCount >= this.produitsFiltresTotal) return;
    this.chargementSuite = true;
    setTimeout(() => {
      this.produitsVisiblesCount += this.tailleLot;
      this.chargementSuite = false;
      this.cdr.detectChanges();
    }, 200);
  }

  getCategoryIcon(catName: string): string {
    const n = (catName || '').toLowerCase();
    if (n.includes('cocktail') || n.includes('boisson') || n.includes('jus') || n.includes('vin')) return 'fa-cocktail';
    if (n.includes('entrée') || n.includes('entree') || n.includes('salade')) return 'fa-leaf';
    if (n.includes('plat') || n.includes('chaud') || n.includes('viande') || n.includes('poisson')) return 'fa-utensils';
    if (n.includes('pièce') || n.includes('piece') || n.includes('salé') || n.includes('sale') || n.includes('canapé') || n.includes('finger')) return 'fa-cubes';
    if (n.includes('dessert') || n.includes('douceur') || n.includes('sucré') || n.includes('sucre') || n.includes('patisserie') || n.includes('gâteau')) return 'fa-birthday-cake';
    if (n.includes('buffet') || n.includes('réception') || n.includes('formule')) return 'fa-concierge-bell';
    if (n.includes('garniture') || n.includes('pain') || n.includes('riz')) return 'fa-bowl-rice';
    return 'fa-utensils';
  }

  private chargerCatalogue(): void {
    this.chargement = true;
    forkJoin({
      prods: this.api.getProduits(true),
      cats: this.api.getCategories(true)
    }).subscribe({
      next: ({ prods, cats }: { prods: ProduitCatalogue[]; cats: any[] }) => {
        const catMap = new Map<any, string>();
        (cats || []).forEach((c: any) => {
          catMap.set(c.id, c.nom);
          catMap.set(String(c.id), c.nom);
          catMap.set(Number(c.id), c.nom);
        });
        // Exclure les garnitures de la commande directe du catalogue client
        this.produits = (prods || [])
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

        this.categories = Array.from(
          new Set(this.produits.map(p => p.categorieNom).filter((n): n is string => !!n && !n.toLowerCase().includes('garniture') && !n.toLowerCase().includes('accompagnement'))));
        if (this.categories.length === 0 && cats && cats.length > 0) {
          this.categories = cats
            .filter(c => c.nom && !c.nom.toLowerCase().includes('garniture') && !c.nom.toLowerCase().includes('accompagnement'))
            .map(c => c.nom);
        }
        if (this.categorieActive && this.categorieActive !== 'TOUTES') {
          const match = this.categories.find(c => c.toLowerCase() === this.categorieActive.toLowerCase());
          if (match) {
            this.categorieActive = match;
          } else {
            this.categorieActive = 'TOUTES';
          }
        }
        this.produitsVisiblesCount = this.tailleLot;
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur de chargement du catalogue API:', err);
        this.produits = [];
        this.categories = [];
        this.produitsVisiblesCount = this.tailleLot;
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  titreDelai(heures: number): string {
    if (!heures || heures <= 0) return 'Disponible immédiatement';
    return `À commander ${this.libelleDelai(heures)} à l'avance`;
  }

  libelleDelai(heures: number): string {
    if (!heures || heures <= 0) return 'Immédiat';
    if (heures < 1) return `${Math.round(heures * 60)} min`;
    if (heures < 24) return `${heures} h`;
    const jours = Math.round(heures / 24);
    return jours === 1 ? '1 jour' : `${jours} jours`;
  }

  ouvrirDetails(p: ProduitCatalogue): void {
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

  ajouterDirectAuPanier(p: ProduitCatalogue, event: Event): void {
    event.stopPropagation();
    const qte = Math.max(1, p.quantiteMinimale || 1);
    this.panier.ajouter({
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

  ajouterSelectionAuPanier(): void {
    if (!this.produitSelectionne) return;
    const p = this.produitSelectionne;
    this.panier.ajouter({
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
}

