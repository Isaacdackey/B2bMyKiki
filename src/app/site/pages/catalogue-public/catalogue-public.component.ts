import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ProduitCatalogue } from '../../mykiki/services/commande-client.service';

export interface LignePanierInvite {
  produitId: number;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  quantiteMinimale?: number;
  imageUrl?: string;
  delaiCommandeHeures?: number;
}

@Component({
  selector: 'app-catalogue-public',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './catalogue-public.component.html',
  styleUrl: './catalogue-public.component.css'
})
export class CataloguePublicComponent implements OnInit {
  produits: ProduitCatalogue[] = [];
  categories: string[] = [];
  categorieActive = 'TOUTES';
  chargement = false;
  rechercheTexte = '';

  // Pagination & infinite scroll
  produitsVisiblesCount = 10;
  readonly tailleLot = 10;
  chargementSuite = false;

  // Modal Détail
  produitSelectionne: ProduitCatalogue | null = null;
  quantiteModal = 1;

  // Panier Invité
  panierOuvert = false;
  articlesPanier: LignePanierInvite[] = [];

  // Formulaire Invité
  commandeForm = {
    nomClient: '',
    telephoneContact: '',
    emailClient: '',
    modeRemise: 'RETRAIT' as 'RETRAIT' | 'LIVRAISON',
    adresseLivraison: '',
    dateRemise: '',
    modePaiement: 'WAVE',
    noteClient: ''
  };

  delaiMinimumRequis = 48;
  dateMinimumIso = '';
  envoiEnCours = false;
  commandeConfirmee: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.calculerDateMinimum();
    this.initialiserCatalogue();
    this.chargerPanierDepuisStorage();
  }

  private calculerDateMinimum(): void {
    const dateMin = new Date(Date.now() + this.delaiMinimumRequis * 3600 * 1000);
    const pad = (n: number) => n < 10 ? '0' + n : n;
    this.dateMinimumIso = `${dateMin.getFullYear()}-${pad(dateMin.getMonth() + 1)}-${pad(dateMin.getDate())}T${pad(dateMin.getHours())}:${pad(dateMin.getMinutes())}`;
    this.commandeForm.dateRemise = this.dateMinimumIso;
  }

  private initialiserCatalogue(): void {
    this.chargement = true;
    this.http.get<any>(`${environment.apiUrl}/api/catalogue/produits`).subscribe({
      next: (res) => {
        let prods: ProduitCatalogue[] = [];
        if (Array.isArray(res)) {
          prods = res;
        } else if (res && res.data) {
          prods = res.data.Produits || res.data.produits || res.data.items || res.data.products || (Array.isArray(res.data) ? res.data : []);
        }

        if (prods && Array.isArray(prods) && prods.length > 0) {
          this.produits = prods
            .filter(p => p.disponible)
            .filter(p => {
              const cat = (p.categorieNom || '').toLowerCase();
              return !cat.includes('garniture') && !cat.includes('accompagnement');
            });
          this.categories = Array.from(
            new Set(this.produits.map(p => p.categorieNom).filter((n): n is string => !!n && !n.toLowerCase().includes('garniture') && !n.toLowerCase().includes('accompagnement')))
          );
        } else {
          this.produits = [];
          this.categories = [];
        }
        this.produitsVisiblesCount = this.tailleLot;
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur de chargement du catalogue public', err);
        this.produits = [];
        this.categories = [];
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  get produitsFiltres(): ProduitCatalogue[] {
    let prods = this.categorieActive === 'TOUTES'
      ? this.produits
      : this.produits.filter(p => p.categorieNom === this.categorieActive);

    if (this.rechercheTexte.trim()) {
      const q = this.rechercheTexte.toLowerCase().trim();
      prods = prods.filter(p => 
        (p.nom && p.nom.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.categorieNom && p.categorieNom.toLowerCase().includes(q))
      );
    }

    return prods.slice().sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }));
  }

  get produitsFiltresTotal(): number {
    return this.produitsFiltres.length;
  }

  get produitsAffiches(): ProduitCatalogue[] {
    return this.produitsFiltres.slice(0, this.produitsVisiblesCount);
  }

  changerCategorie(cat: string): void {
    this.categorieActive = cat;
    this.produitsVisiblesCount = this.tailleLot;
    this.cdr.detectChanges();
  }

  onRechercheChange(): void {
    this.produitsVisiblesCount = this.tailleLot;
    this.cdr.detectChanges();
  }

  getCategoryIcon(catName: string): string {
    const n = (catName || '').toLowerCase();
    if (n.includes('cocktail') || n.includes('boisson') || n.includes('jus') || n.includes('vin')) return 'fa-cocktail';
    if (n.includes('plateau') || n.includes('boîte') || n.includes('boite')) return 'fa-boxes-stacked';
    if (n.includes('entrée') || n.includes('entree') || n.includes('salade')) return 'fa-leaf';
    if (n.includes('plat') || n.includes('chaud') || n.includes('viande') || n.includes('poisson') || n.includes('méchoui')) return 'fa-utensils';
    if (n.includes('pièce') || n.includes('piece') || n.includes('salé') || n.includes('sale') || n.includes('canapé') || n.includes('finger')) return 'fa-cubes';
    if (n.includes('dessert') || n.includes('douceur') || n.includes('sucré') || n.includes('sucre') || n.includes('patisserie') || n.includes('gâteau')) return 'fa-birthday-cake';
    if (n.includes('buffet') || n.includes('réception') || n.includes('formule')) return 'fa-concierge-bell';
    if (n.includes('garniture') || n.includes('pain') || n.includes('riz')) return 'fa-bowl-rice';
    return 'fa-utensils';
  }

  // Écouteur de scroll pour charger plus
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

  ouvrirDetails(p: ProduitCatalogue): void {
    this.produitSelectionne = p;
    this.quantiteModal = Math.max(1, p.quantiteMinimale || 1);
  }

  fermerDetails(): void {
    this.produitSelectionne = null;
    this.quantiteModal = 1;
  }

  augmenterQuantiteModal(): void {
    this.quantiteModal++;
  }

  diminuerQuantiteModal(): void {
    const min = this.produitSelectionne?.quantiteMinimale || 1;
    if (this.quantiteModal > min) {
      this.quantiteModal--;
    }
  }

  validerAjoutModal(): void {
    if (!this.produitSelectionne) return;
    this.ajouterAuPanier(this.produitSelectionne, this.quantiteModal);
    this.fermerDetails();
  }

  // Gestion Panier
  get totalArticlesPanier(): number {
    return this.articlesPanier.reduce((sum, it) => sum + it.quantite, 0);
  }

  get totalPanier(): number {
    return this.articlesPanier.reduce((sum, it) => sum + (it.prixUnitaire * it.quantite), 0);
  }

  get totalAvecLivraison(): number {
    const frais = this.commandeForm.modeRemise === 'LIVRAISON' ? 2000 : 0;
    return this.totalPanier + frais;
  }

  getQuantite(produitId: number): number {
    const it = this.articlesPanier.find(a => a.produitId === produitId);
    return it ? it.quantite : 0;
  }

  ajouterDirectAuPanier(p: ProduitCatalogue, event: Event): void {
    event.stopPropagation();
    const qte = Math.max(1, p.quantiteMinimale || 1);
    this.ajouterAuPanier(p, qte);
  }

  ajouterAuPanier(p: ProduitCatalogue, quantiteAAjouter: number): void {
    const existant = this.articlesPanier.find(a => a.produitId === p.id);
    const qteMin = p.quantiteMinimale && p.quantiteMinimale > 0 ? p.quantiteMinimale : 1;
    if (existant) {
      existant.quantite += quantiteAAjouter;
    } else {
      this.articlesPanier.push({
        produitId: p.id,
        nom: p.nom,
        prixUnitaire: p.prix,
        quantite: quantiteAAjouter,
        quantiteMinimale: qteMin,
        imageUrl: p.imageUrl,
        delaiCommandeHeures: p.delaiPreparationHeures || p.delaiCommandeHeures || 48
      });
    }
    this.sauvegarderPanier();
    this.cdr.detectChanges();
  }

  augmenterArticle(produitId: number): void {
    const it = this.articlesPanier.find(a => a.produitId === produitId);
    if (it) {
      it.quantite++;
      this.sauvegarderPanier();
      this.cdr.detectChanges();
    }
  }

  diminuerArticle(produitId: number): void {
    const it = this.articlesPanier.find(a => a.produitId === produitId);
    if (it) {
      const qteMin = it.quantiteMinimale && it.quantiteMinimale > 0 ? it.quantiteMinimale : 1;
      if (it.quantite > qteMin) {
        it.quantite--;
      } else {
        this.articlesPanier = this.articlesPanier.filter(a => a.produitId !== produitId);
      }
      this.sauvegarderPanier();
      this.cdr.detectChanges();
    }
  }

  private sauvegarderPanier(): void {
    localStorage.setItem('kiki_panier_guest', JSON.stringify(this.articlesPanier));
  }

  private chargerPanierDepuisStorage(): void {
    try {
      const raw = localStorage.getItem('kiki_panier_guest');
      if (raw) this.articlesPanier = JSON.parse(raw);
    } catch {
      this.articlesPanier = [];
    }
  }

  formulaireValide(): boolean {
    if (!this.commandeForm.nomClient.trim()) return false;
    if (!this.commandeForm.telephoneContact.trim()) return false;
    if (!this.commandeForm.dateRemise) return false;
    if (this.commandeForm.modeRemise === 'LIVRAISON' && !this.commandeForm.adresseLivraison.trim()) return false;
    return this.articlesPanier.length > 0;
  }

  passerCommandeInvite(): void {
    if (!this.formulaireValide()) return;
    this.envoiEnCours = true;

    const payload = {
      nomClient: this.commandeForm.nomClient.trim(),
      telephoneContact: this.commandeForm.telephoneContact.trim(),
      emailClient: this.commandeForm.emailClient.trim() || undefined,
      modeRemise: this.commandeForm.modeRemise,
      adresseLivraison: this.commandeForm.adresseLivraison.trim() || undefined,
      dateRemise: this.commandeForm.dateRemise,
      modePaiement: this.commandeForm.modePaiement,
      noteClient: this.commandeForm.noteClient.trim() || undefined,
      fraisLivraison: this.commandeForm.modeRemise === 'LIVRAISON' ? 2000 : 0,
      lignes: this.articlesPanier.map(it => ({
        produitId: it.produitId,
        produitNom: it.nom,
        prixUnitaire: it.prixUnitaire,
        quantite: it.quantite,
        sousTotal: it.prixUnitaire * it.quantite
      }))
    };

    this.http.post(`${environment.apiUrl}/api/catalogue/commandes`, payload).subscribe({
      next: (cmd: any) => {
        this.envoiEnCours = false;
        this.commandeConfirmee = cmd || { numero: `CMD-${Date.now().toString().slice(-6)}` };
        this.articlesPanier = [];
        this.sauvegarderPanier();
        this.panierOuvert = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.envoiEnCours = false;
        this.commandeConfirmee = { numero: `CMD-${Date.now().toString().slice(-6)}` };
        this.articlesPanier = [];
        this.sauvegarderPanier();
        this.panierOuvert = false;
        this.cdr.detectChanges();
      }
    });
  }

  fermerConfirmation(): void {
    this.commandeConfirmee = null;
  }
}
