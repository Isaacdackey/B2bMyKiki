import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PanierService, ArticlePanier } from './services/panier.service';
import { CommandeClientService, ProduitCatalogue } from './services/commande-client.service';
import { KikiDataService } from '../../services/kiki-data.service';

export interface CommandeRecu {
  numero: string;
  dateCommande: Date;
  modeRemise: 'RETRAIT' | 'LIVRAISON';
  modeRemiseLibelle: string;
  dateRemise: string;
  adresseLivraison?: string;
  telephoneContact?: string;
  modePaiement: string;
  modePaiementLibelle: string;
  detailsPaiement?: string;
  noteClient?: string;
  articles: ArticlePanier[];
  montantTotal: number;
}

@Component({
  selector: 'app-mykiki-panier',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mykiki-panier.component.html',
  styleUrl: './mykiki-panier.component.css'
})
export class MyKikiPanierComponent implements OnInit, OnDestroy {
  articles: ArticlePanier[] = [];
  premierRetrait = new Date();

  /**
   * Tunnel de commande en 3 étapes + écran/modale de confirmation :
   * 1. 'panier'   : Mon Panier
   * 2. 'remise'   : Remise & Date
   * 3. 'paiement' : Paiement
   * 4. 'confirmation' : Commande validée
   */
  etape: 'panier' | 'remise' | 'paiement' | 'confirmation' = 'panier';

  // ─── Client Google & Téléphone ───
  clientSansTelephone = false;

  // ─── Modale confirmation plat chaud sans garniture ───
  modalConfirmationSansGarnitureOuverte = false;
  sansGarnitureConfirme = false;

  // ─── Étape 2 : Remise & Date ───
  modeRemise: 'RETRAIT' | 'LIVRAISON' = 'RETRAIT';
  adresseLivraison = '';
  telephoneContact = '';
  dateRemise = '';
  noteClient = '';
  aTenteContinuer = false;

  // ─── Étape 3 : Paiement ───
  modePaiement: 'WAVE' | 'ORANGE_MONEY' | 'CARTE_BANCAIRE' = 'WAVE';
  telephonePaiement = '77 ';
  carteNumero = '';
  carteNom = '';
  carteDate = '';
  carteCvc = '';

  // ─── Fidélité & Points Bonus ───
  soldePoints = 0;
  configFidelite: any = null;
  utiliserPointsFidelite = false;

  // ─── Garnitures & Accompagnements ───
  produitsCatalogueMap = new Map<number, ProduitCatalogue>();
  catalogueGarnitures: ProduitCatalogue[] = [];
  garnituresChoisies: { garniture: ProduitCatalogue; quantite: number }[] = [];
  termeRechercheGarniture = '';

  // ─── Simulation ───
  simulationEnCours = false;
  commandeConfirmee: CommandeRecu | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    public panier: PanierService,
    private api: CommandeClientService,
    private dataService: KikiDataService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  fermerConfirmation(): void {
    this.router.navigate(['/mykiki/commandes']);
  }

  ngOnInit(): void {
    this.chargerProfilClient();
    this.chargerFidelite();
    this.chargerConfigFidelite();
    this.chargerGarnituresCatalogue();

    this.panier.articles$
      .pipe(takeUntil(this.destroy$))
      .subscribe(articles => {
        this.articles = articles;
        this.premierRetrait = this.panier.premierRetraitPossible;
        if (!this.dateRemise) {
          this.dateRemise = this.versValeurLocale(this.premierRetrait);
        }
        this.nettoyerGarnituresIncompatibles();
        this.cdr.detectChanges();
      });
  }

  chargerProfilClient(): void {
    this.http.get<any>(`${environment.apiUrl}/api/mykiki/profil`).subscribe({
      next: (res) => {
        if (res) {
          const tel = (res.phone || res.telephone || '').trim();
          if (!tel || tel === 'Non renseigné') {
            this.clientSansTelephone = true;
          } else {
            this.clientSansTelephone = false;
            if (!this.telephoneContact) {
              this.telephoneContact = this.formaterTelephone(tel);
            }
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  get telephoneContactObligatoire(): boolean {
    return this.clientSansTelephone || this.modeRemise === 'LIVRAISON';
  }

  get platAuDelaiMax(): ArticlePanier | null {
    if (this.articles.length === 0) return null;
    let maxDelai = -1;
    let maxArticle: ArticlePanier | null = null;
    for (const a of this.articles) {
      const d = a.delaiPreparationHeures || 0;
      if (d > maxDelai) {
        maxDelai = d;
        maxArticle = a;
      }
    }
    return maxArticle;
  }

  chargerGarnituresCatalogue(): void {
    forkJoin({
      prods: this.api.getProduits(),
      garnitures: this.api.getGarnitures()
    }).subscribe({
      next: ({ prods, garnitures }: { prods: ProduitCatalogue[]; garnitures: ProduitCatalogue[] }) => {
        (prods || []).forEach((p: ProduitCatalogue) => this.produitsCatalogueMap.set(p.id, p));
        (garnitures || []).forEach((g: ProduitCatalogue) => this.produitsCatalogueMap.set(g.id, g));
        
        let allGarnitures: ProduitCatalogue[] = (garnitures && garnitures.length > 0) ? garnitures : [];
        if (allGarnitures.length === 0) {
          allGarnitures = (prods || []).filter((p: ProduitCatalogue) => {
            const nomCat = (p.categorieNom || '').toLowerCase();
            const nomProd = (p.nom || '').toLowerCase();
            return nomCat.includes('garniture') || nomCat.includes('accompagnement') ||
                   nomProd.includes('riz') || nomProd.includes('alloco') || nomProd.includes('frite') ||
                   nomProd.includes('attiéké') || nomProd.includes('attieke') || nomProd.includes('purée') ||
                   nomProd.includes('puree') || nomProd.includes('gratin');
          });
        }
        this.catalogueGarnitures = allGarnitures;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  private nettoyerGarnituresIncompatibles(): void {
    if (this.quotaGarnituresOffertes === 0) {
      this.garnituresChoisies = [];
      return;
    }
    const valides = this.garnituresCompatiblesPanier;
    if (valides.length > 0) {
      const validesIds = new Set(valides.map(g => g.id));
      this.garnituresChoisies = this.garnituresChoisies.filter(item => validesIds.has(item.garniture.id));
    }
  }

  chargerFidelite(): void {
    this.http.get<{ points: number }>(`${environment.apiUrl}/api/mykiki/fidelite`).subscribe({
      next: (r) => {
        this.soldePoints = r?.points ?? 0;
        this.cdr.detectChanges();
      },
      error: () => this.soldePoints = 0
    });
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

  get pointsRequis(): number {
    return this.configFidelite?.pointsRequisBonus || 30;
  }

  get aAssezDePoints(): boolean {
    return this.soldePoints >= this.pointsRequis;
  }

  get metBonusDansPanier(): ArticlePanier | null {
    if (!this.configFidelite || this.articles.length === 0) return null;
    const bonusIds: number[] = this.configFidelite.produitIdsBonus 
      || (this.configFidelite.produitsBonus ? this.configFidelite.produitsBonus.map((p: any) => p.id) : [])
      || (this.configFidelite.produitsBonusIds ? this.configFidelite.produitsBonusIds.split(',').map((x: string) => Number(x.trim())) : []);
    
    if (bonusIds.length > 0) {
      return this.articles.find(a => bonusIds.includes(a.produitId)) || null;
    }
    return this.articles.length > 0 ? this.articles[0] : null;
  }

  get remiseFidelite(): number {
    if (!this.utiliserPointsFidelite || !this.aAssezDePoints) return 0;
    const bonus = this.metBonusDansPanier;
    if (bonus) {
      return bonus.prixUnitaire;
    }
    return Math.min(this.panier.total, 3000);
  }

  get totalApresRemise(): number {
    return Math.max(0, this.panier.total - this.remiseFidelite);
  }

  // ─── Getters Garnitures (Plats chauds uniquement : 1 plat chaud commandé = 1 garniture incluse) ───
  get platsChaudsDansPanier(): ArticlePanier[] {
    return this.articles.filter(a => {
      if (a.estGarniture) return false;
      const refProd = this.produitsCatalogueMap.get(a.produitId);
      const cat = (a.categorieNom || refProd?.categorieNom || '').toLowerCase();
      const garnitures = (a.garnituresCompatibles && a.garnituresCompatibles.length > 0)
        ? a.garnituresCompatibles
        : (refProd?.garnituresCompatibles || []);

      // Exclure formellement : salés (pièces salées, canapés, pastels, amuse-bouches),
      // entrées, salades, jus locaux, boissons, cocktails, desserts, douceurs, pâtisseries, et garnitures
      const estExclu = cat.includes('salé') || cat.includes('sale') || cat.includes('canapé') || cat.includes('canape') ||
                       cat.includes('finger') || cat.includes('amuse') || cat.includes('pièce') || cat.includes('piece') ||
                       cat.includes('entrée') || cat.includes('entree') || cat.includes('salade') ||
                       cat.includes('jus') || cat.includes('boisson') || cat.includes('cocktail') || cat.includes('vin') ||
                       cat.includes('dessert') || cat.includes('douceur') || cat.includes('patisserie') || cat.includes('sucre') || cat.includes('sucré') ||
                       cat.includes('garniture') || cat.includes('accompagnement');

      if (estExclu) return false;

      // Si le plat possède explicitement des garnitures compatibles configurées
      if (garnitures && garnitures.length > 0) return true;

      // Concerne uniquement les plats chauds
      return cat.includes('plat') || cat.includes('chaud') || cat.includes('repas') ||
             cat.includes('grill') || cat.includes('viande') || cat.includes('poisson') || cat.includes('méchoui') || cat.includes('mechoui');
    });
  }

  get entreesEtPlatsChaudsDansPanier(): ArticlePanier[] {
    return this.platsChaudsDansPanier;
  }

  get quotaGarnituresOffertes(): number {
    return this.platsChaudsDansPanier.reduce((sum, p) => sum + (p.quantite || 1), 0);
  }

  get garnituresCompatiblesPanier(): ProduitCatalogue[] {
    const map = new Map<number, ProduitCatalogue>();
    for (const plat of this.platsChaudsDansPanier) {
      const refProd = this.produitsCatalogueMap.get(plat.produitId);
      const garnitures = (plat.garnituresCompatibles && plat.garnituresCompatibles.length > 0)
        ? plat.garnituresCompatibles
        : (refProd?.garnituresCompatibles || []);

      if (garnitures && garnitures.length > 0) {
        for (const g of garnitures) {
          if (g && g.id) {
            map.set(g.id, g as ProduitCatalogue);
          }
        }
      }
    }
    if (map.size === 0 && this.catalogueGarnitures.length > 0) {
      for (const g of this.catalogueGarnitures) {
        map.set(g.id, g);
      }
    }
    return Array.from(map.values());
  }

  get garnituresCompatiblesFiltrees(): ProduitCatalogue[] {
    const list = this.garnituresCompatiblesPanier;
    const q = (this.termeRechercheGarniture || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter(g =>
      (g.nom && g.nom.toLowerCase().includes(q)) ||
      (g.description && g.description.toLowerCase().includes(q))
    );
  }

  get totalGarnituresChoisies(): number {
    return this.garnituresChoisies.reduce((sum, it) => sum + it.quantite, 0);
  }

  get nombreGarnituresOffertesUtilisees(): number {
    return Math.min(this.totalGarnituresChoisies, this.quotaGarnituresOffertes);
  }

  get surplusGarnituresPayantes(): number {
    return Math.max(0, this.totalGarnituresChoisies - this.quotaGarnituresOffertes);
  }

  get coutSurplusGarnitures(): number {
    if (this.surplusGarnituresPayantes <= 0) return 0;
    const portions: number[] = [];
    for (const item of this.garnituresChoisies) {
      const prix = item.garniture.prix || 0;
      for (let i = 0; i < item.quantite; i++) {
        portions.push(prix);
      }
    }
    portions.sort((a, b) => b - a);
    const portionsPayantes = portions.slice(this.quotaGarnituresOffertes);
    return portionsPayantes.reduce((sum, p) => sum + p, 0);
  }

  get totalFinalApresRemise(): number {
    return Math.max(0, this.panier.total + this.coutSurplusGarnitures - this.remiseFidelite);
  }

  getQuantiteGarniture(garnitureId: number): number {
    const item = this.garnituresChoisies.find(g => g.garniture.id === garnitureId);
    return item ? item.quantite : 0;
  }

  modifierQuantiteGarniture(garniture: ProduitCatalogue, nouvelleQte: number): void {
    this.sansGarnitureConfirme = false;
    if (nouvelleQte <= 0) {
      this.garnituresChoisies = this.garnituresChoisies.filter(g => g.garniture.id !== garniture.id);
    } else {
      const existant = this.garnituresChoisies.find(g => g.garniture.id === garniture.id);
      if (existant) {
        existant.quantite = nouvelleQte;
      } else {
        this.garnituresChoisies.push({ garniture, quantite: nouvelleQte });
      }
    }
    this.cdr.detectChanges();
  }

  tenterAllerARemise(): void {
    if (this.quotaGarnituresOffertes > 0 && this.totalGarnituresChoisies === 0 && !this.sansGarnitureConfirme) {
      this.modalConfirmationSansGarnitureOuverte = true;
      this.cdr.detectChanges();
      return;
    }
    this.allerARemise();
  }

  confirmerSansGarniture(): void {
    this.sansGarnitureConfirme = true;
    this.modalConfirmationSansGarnitureOuverte = false;
    this.allerARemise();
  }

  fermerModalGarnitureEtChoisir(): void {
    this.modalConfirmationSansGarnitureOuverte = false;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  modifierQuantite(a: ArticlePanier, quantite: number): void {
    const min = a.quantiteMinimale && a.quantiteMinimale > 0 ? a.quantiteMinimale : 1;
    if (quantite < min) {
      this.retirer(a);
      return;
    }
    this.panier.definirQuantite(a.produitId, quantite);
  }

  retirer(a: ArticlePanier): void {
    this.panier.retirer(a.produitId);
    this.dataService.showToast(`${a.nom} retiré du panier.`);
  }

  viderPanier(): void {
    if (confirm('Vider entièrement votre panier ?')) {
      this.panier.vider();
      this.garnituresChoisies = [];
      this.sansGarnitureConfirme = false;
      this.dataService.showToast('Panier vidé.');
    }
  }

  // =============================================
  // NAVIGATION STEPPER
  // =============================================

  allerAEtape(cible: 'panier' | 'remise' | 'paiement'): void {
    if (this.simulationEnCours) return;
    if (cible === 'panier') {
      this.etape = 'panier';
    } else if (cible === 'remise' && this.articles.length > 0) {
      this.tenterAllerARemise();
    } else if (cible === 'paiement' && this.articles.length > 0 && this.remiseValide) {
      this.allerAuPaiement();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cdr.detectChanges();
  }

  allerARemise(): void {
    if (!this.dateRemise) {
      this.dateRemise = this.versValeurLocale(this.panier.premierRetraitPossible);
    }
    this.etape = 'remise';
    this.aTenteContinuer = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cdr.detectChanges();
  }

  retourAuPanier(): void {
    if (this.simulationEnCours) return;
    this.etape = 'panier';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cdr.detectChanges();
  }

  formaterTelephone(val: string): string {
    if (!val) return '';
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('221') && digits.length > 9) {
      digits = digits.substring(3);
    }
    // Strictement au maximum 9 chiffres pour le Sénégal (ex: 77 123 45 67)
    digits = digits.substring(0, 9);
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.substring(0, 2)} ${digits.substring(2)}`;
    } else if (digits.length <= 7) {
      return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
    } else {
      return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5, 7)} ${digits.substring(7, 9)}`;
    }
  }

  onTelephoneContactInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.telephoneContact = this.formaterTelephone(input.value);
    input.value = this.telephoneContact;
  }

  onTelephonePaiementInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.telephonePaiement = this.formaterTelephone(input.value);
    input.value = this.telephonePaiement;
  }

  get digitsTelephoneContact(): string {
    return (this.telephoneContact || '').replace(/\D/g, '');
  }

  get digitsTelephonePaiement(): string {
    return (this.telephonePaiement || '').replace(/\D/g, '');
  }

  get telephoneContactValide(): boolean {
    if (!this.telephoneContact.trim()) return !this.telephoneContactObligatoire;
    return this.digitsTelephoneContact.length === 9;
  }

  get telephonePaiementValide(): boolean {
    if (this.modePaiement === 'WAVE' || this.modePaiement === 'ORANGE_MONEY') {
      return this.digitsTelephonePaiement.length === 9;
    }
    return true;
  }

  allerAuPaiement(): void {
    this.aTenteContinuer = true;
    if (!this.dateRemise) {
      this.dataService.showToast('Veuillez sélectionner la date et l\'heure de retrait/livraison.', true);
      return;
    }
    if (this.creneauTropTot) {
      const minDateStr = new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(this.panier.premierRetraitPossible);
      const nomPlat = this.platAuDelaiMax?.nom ? ` (pour « ${this.platAuDelaiMax.nom} »)` : '';
      this.dataService.showToast(
        `Impossible de valider : le temps de préparation${nomPlat} (${this.libelleDelai(this.panier.delaiPreparationHeures)}) n'est pas respecté. Veuillez choisir un créneau à partir du ${minDateStr}.`,
        true
      );
      return;
    }
    if (this.telephoneContactObligatoire && (!this.telephoneContact.trim() || !this.telephoneContactValide)) {
      this.dataService.showToast('Numéro de téléphone obligatoire : 9 chiffres requis (ex : 77 123 45 67).', true);
      return;
    }
    if (!this.remiseValide) {
      this.dataService.showToast('Veuillez renseigner les informations de livraison requises.', true);
      return;
    }

    // Si l'utilisateur n'avait pas de téléphone renseigné, synchroniser son profil
    if (this.clientSansTelephone && this.telephoneContactValide) {
      this.http.put<any>(`${environment.apiUrl}/api/mykiki/profil`, {
        phone: this.digitsTelephoneContact
      }).subscribe({
        next: () => { this.clientSansTelephone = false; },
        error: () => {}
      });
    }

    this.etape = 'paiement';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cdr.detectChanges();
  }

  retourARemise(): void {
    if (this.simulationEnCours) return;
    this.etape = 'remise';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cdr.detectChanges();
  }

  // =============================================
  // GESTION DU MODE DE REMISE & PAIEMENT
  // =============================================

  selectionnerModeRemise(mode: 'RETRAIT' | 'LIVRAISON'): void {
    this.modeRemise = mode;
    this.cdr.detectChanges();
  }

  selectionnerModePaiement(mode: 'WAVE' | 'ORANGE_MONEY' | 'CARTE_BANCAIRE'): void {
    this.modePaiement = mode;
    this.cdr.detectChanges();
  }

  get dateMinimale(): string {
    return this.versValeurLocale(this.panier.premierRetraitPossible);
  }

  get creneauTropTot(): boolean {
    if (!this.dateRemise) return false;
    const minTimestamp = this.panier.premierRetraitPossible.getTime() - (60 * 1000);
    return new Date(this.dateRemise).getTime() < minTimestamp;
  }

  get remiseValide(): boolean {
    if (!this.dateRemise || this.creneauTropTot) return false;
    if (this.modeRemise === 'LIVRAISON' && !this.adresseLivraison.trim()) return false;
    if (this.telephoneContact.trim() && !this.telephoneContactValide) return false;
    return this.articles.length > 0;
  }

  get paiementValide(): boolean {
    if (!this.remiseValide) return false;
    if (this.modePaiement === 'WAVE' || this.modePaiement === 'ORANGE_MONEY') {
      return this.digitsTelephonePaiement.length === 9;
    }
    return true;
  }

  get libelleModePaiement(): string {
    switch (this.modePaiement) {
      case 'WAVE': return `Wave (${this.telephonePaiement ? '+221 ' + this.telephonePaiement : 'Mobile'})`;
      case 'ORANGE_MONEY': return `Orange Money (${this.telephonePaiement ? '+221 ' + this.telephonePaiement : 'Mobile'})`;
      case 'CARTE_BANCAIRE': return 'Carte Bancaire (Visa / Mastercard)';
      default: return 'Paiement immédiat';
    }
  }

  // =============================================
  // SIMULATION DU PAIEMENT & CONFIRMATION
  // =============================================

  validerCommandeSimulation(): void {
    if (this.simulationEnCours) return;

    if (this.creneauTropTot) {
      const minDateStr = new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(this.panier.premierRetraitPossible);
      this.dataService.showToast(
        `Validation impossible : le temps de préparation (${this.libelleDelai(this.panier.delaiPreparationHeures)}) dépasse l'heure choisie. Choisissez un créneau à partir du ${minDateStr}.`,
        true
      );
      return;
    }

    if ((this.modePaiement === 'WAVE' || this.modePaiement === 'ORANGE_MONEY') && this.digitsTelephonePaiement.length !== 9) {
      this.dataService.showToast(`Numéro ${this.modePaiement === 'WAVE' ? 'Wave' : 'Orange Money'} invalide : 9 chiffres requis (ex : 77 123 45 67).`, true);
      return;
    }

    if (!this.paiementValide) {
      this.dataService.showToast('Veuillez vérifier les informations de paiement et de remise.', true);
      return;
    }

    this.simulationEnCours = true;
    this.cdr.detectChanges();

    // Copie de sauvegarde des articles et du montant avant vidage du panier
    const articlesCommandes: ArticlePanier[] = [...this.articles];
    for (const g of this.garnituresChoisies) {
      if (g.quantite > 0) {
        articlesCommandes.push({
          produitId: g.garniture.id,
          nom: `[Accompagnement] ${g.garniture.nom}`,
          prixUnitaire: g.garniture.prix || 0,
          quantite: g.quantite,
          delaiPreparationHeures: g.garniture.delaiPreparationHeures || 0,
          imageUrl: g.garniture.imageUrl,
          estGarniture: true
        });
      }
    }

    const totalMontant = this.totalFinalApresRemise;
    const anneeCourante = new Date().getFullYear();
    const referenceAlea = Math.floor(10000 + Math.random() * 90000);
    const numeroGenere = `CMD-${anneeCourante}-${referenceAlea}`;

    const lignesPourRequete = [
      ...this.articles.map(a => ({
        produitId: a.produitId,
        produitNom: a.nom,
        prixUnitaire: a.prixUnitaire,
        quantite: a.quantite,
        sousTotal: a.prixUnitaire * a.quantite
      })),
      ...this.garnituresChoisies.filter(g => g.quantite > 0).map(g => ({
        produitId: g.garniture.id,
        produitNom: `[Accompagnement] ${g.garniture.nom}`,
        prixUnitaire: g.garniture.prix || 0,
        quantite: g.quantite,
        sousTotal: (g.garniture.prix || 0) * g.quantite
      }))
    ];

    // Envoi au service de commande client (qui enregistre immédiatement dans le store partagé)
    this.api.passerCommande({
      lignes: lignesPourRequete,
      modeRemise: this.modeRemise,
      modePaiement: this.modePaiement,
      dateRemise: this.dateRemise,
      adresseLivraison: this.modeRemise === 'LIVRAISON' ? this.adresseLivraison.trim() : undefined,
      telephoneContact: this.telephoneContact.trim() || undefined,
      noteClient: this.noteClient.trim() || undefined,
      pointsUtilises: this.utiliserPointsFidelite ? this.pointsRequis : 0,
      produitBonusId: this.metBonusDansPanier?.produitId,
      remiseFidelite: this.remiseFidelite
    }).subscribe({
      next: (cmdCreee) => {
        const numFinal = cmdCreee?.numero || numeroGenere;
        const cmdId = (cmdCreee as any)?.id;
        const telPaiement = (this.modePaiement === 'WAVE' || this.modePaiement === 'ORANGE_MONEY')
          ? this.telephonePaiement.trim()
          : (this.telephoneContact.trim() || '770000000');

        // Le paiement immédiat est obligatoire : déclenchement du règlement auprès de la passerelle
        if (cmdId) {
          this.api.payer(cmdId, telPaiement).subscribe({
            next: () => this.finaliserCommande(numFinal, articlesCommandes, totalMontant),
            error: () => this.finaliserCommande(numFinal, articlesCommandes, totalMontant)
          });
        } else {
          this.finaliserCommande(numFinal, articlesCommandes, totalMontant);
        }
      },
      error: (err) => {
        this.simulationEnCours = false;
        const msg = err?.error?.message || err?.message || 'Erreur lors de la validation de la commande. Veuillez vérifier les informations saisies.';
        this.dataService.showToast(msg, true);
        this.cdr.detectChanges();
      }
    });
  }

  private finaliserCommande(numFinal: string, articlesCommandes: ArticlePanier[], totalMontant: number): void {
    this.simulationEnCours = false;

    // Déduire les points localement si utilisés
    if (this.utiliserPointsFidelite) {
      this.soldePoints = Math.max(0, this.soldePoints - this.pointsRequis);
    }

    // Construction du reçu
    this.commandeConfirmee = {
      numero: numFinal,
      dateCommande: new Date(),
      modeRemise: this.modeRemise,
      modeRemiseLibelle: this.modeRemise === 'LIVRAISON' ? 'Livraison à domicile' : 'Retrait au restaurant',
      dateRemise: this.dateRemise,
      adresseLivraison: this.modeRemise === 'LIVRAISON' ? this.adresseLivraison.trim() : undefined,
      telephoneContact: this.telephoneContact.trim() || undefined,
      modePaiement: this.modePaiement,
      modePaiementLibelle: this.libelleModePaiement,
      noteClient: this.noteClient.trim() || undefined,
      articles: articlesCommandes,
      montantTotal: totalMontant
    };

    // Vider le panier et les garnitures
    this.panier.vider();
    this.garnituresChoisies = [];

    // Passer à l'étape de confirmation
    this.etape = 'confirmation';
    this.dataService.showToast(`Commande ${numFinal} validée et réglée avec succès !`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cdr.detectChanges();
  }

  // =============================================
  // HELPERS
  // =============================================

  private versValeurLocale(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
         + `T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  libelleDelai(heures: number): string {
    if (!heures || heures <= 0) return 'immédiate';
    if (heures < 1) return `${Math.round(heures * 60)} minutes`;
    if (heures < 24) return `${heures} heures`;
    const jours = Math.round(heures / 24);
    return jours === 1 ? '1 jour' : `${jours} jours`;
  }
}
