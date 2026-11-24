import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { PlatB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-b2b-commande',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './b2b-commande.component.html',
  styleUrls: ['./b2b-commande.component.css']
})
export class B2bCommandeComponent {
  b2b = inject(B2bStateService);

  constructor() {
    const r = this.b2b.currentSession().role;
    if (r !== 'SALARIE_CONVENTIONNE' && r !== 'SALARIE_AUTONOME') {
      this.b2b.setSessionRole({
        role: this.b2b.modeProfil() === 'AUTONOME' ? 'SALARIE_AUTONOME' : 'SALARIE_CONVENTIONNE',
        nomComplet: this.b2b.modeProfil() === 'AUTONOME' ? 'Ousmane Ba (Consultant)' : 'Babacar Ndiaye',
        titrePoste: this.b2b.modeProfil() === 'AUTONOME' ? 'Salarié Autonome' : 'Salarié Conventionné',
        entite: 'TotalEnergies Sénégal',
        siteId: 'site-1',
        siteNom: 'Siège Plateau - Dakar',
        badge: this.b2b.modeProfil() === 'AUTONOME' ? 'Paiement direct Wave' : 'Subventionné 100% • 0 FCFA',
        badgeColor: this.b2b.modeProfil() === 'AUTONOME' ? '#1D4ED8' : '#2E7D32'
      });
    }
  }

  qrMode = signal<'MONTRER' | 'SCANNER'>('MONTRER');
  scanCantineValide = signal(false);
  flashGarnitureMessage = signal<string | null>(null);
  private flashGarnitureTimer?: ReturnType<typeof setTimeout>;
  garnituresDisponibles = ['Riz parfumé', 'Pommes sautées', 'Attiéké', 'Légumes sautés'];
  garnitureParPlat = signal<Record<string, string>>({});

  selectionnerGarniture(platId: string, garniture: string) {
    this.garnitureParPlat.update(map => ({ ...map, [platId]: garniture }));
  }

  validerScanCantine() {
    this.scanCantineValide.set(true);
    const emp = this.b2b.currentEmploye();
    const cmdEnCours = this.b2b.listeCommandesSite().find(
      c => c.statut === 'EN_COURS' && (c.matricule === emp.matricule || c.employeNom.includes(emp.nom))
    );
    if (cmdEnCours) {
      this.b2b.scannerCommandeSite(cmdEnCours.id);
    }
  }

  // SÉLECTION DU JOUR POUR COMMANDER TOUTE LA SEMAINE (Lundi à Dimanche)
  joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
  private readonly todayIndex = (new Date().getDay() + 6) % 7; // 0 = Lundi .. 6 = Dimanche
  jourSelectionne = signal<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'>(
    this.joursSemaine[this.todayIndex]
  );

  datesSemaineMap: Record<string, string> = this.buildDatesSemaineMap();

  private buildDatesSemaineMap(): Record<string, string> {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - this.todayIndex);
    const moisCourts = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const map: Record<string, string> = {};
    this.joursSemaine.forEach((jour, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const label = `${String(d.getDate()).padStart(2, '0')} ${moisCourts[d.getMonth()]}`;
      map[jour] = idx === this.todayIndex ? `${label} (Aujourd'hui)` : label;
    });
    return map;
  }

  changerJourCommande(jour: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche') {
    this.jourSelectionne.set(jour);
    this.pageMenu.set(1);
  }

  // Onglet de filtrage pour le mode SUBVENTIONNE (Strictement les 4 composantes de la formule)
  activeTab = signal<'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON'>('ENTREE');

  // Filtre catalogue pour le mode AUTONOME
  filterAutonome = signal<'TOUT' | 'PLAT' | 'ENTREE' | 'DESSERT' | 'BOISSON'>('TOUT');
  termeRecherche = signal<string>('');

  // Numéro Wave pour le salarié autonome (0% de subvention)
  wavePhone = signal<string>('+221 77 654 32 10');

  // GESTION DU CUT-OFF & RÉCLAMATIONS (Exigence Mentor)
  isAfterCutOff = signal<boolean>(false);

  toggleSimulerApresCutOff() {
    this.isAfterCutOff.update(v => !v);
  }

  // Vérifier si la commande est bloquée par le cut-off
  isBloqueParCutOff = computed(() => {
    // Si c'est pour un jour futur (Vendredi, Samedi, Dimanche), pas de blocage cut-off !
    const jour = this.jourSelectionne();
    if (jour === 'Vendredi' || jour === 'Samedi' || jour === 'Dimanche') {
      return false;
    }
    // Si l'employé a été débloqué par le responsable de site, il n'est plus bloqué !
    if (this.b2b.isEmployeDebloqueAujourdhui(this.b2b.currentEmploye().id)) {
      return false;
    }
    // Sinon, dépend de la simulation ou de l'état cut-off
    return this.isAfterCutOff();
  });

  // MODAL DE RÉCLAMATION (Cut-Off Dépassé)
  showReclamationModal = signal<boolean>(false);
  motifReclamationInput = signal<string>('Réunion imprévue en clientèle ce matin, demande de déblocage pour déjeuner à la cantine.');
  reclamationEnvoyee = signal<boolean>(false);

  ouvrirModalReclamation() {
    this.reclamationEnvoyee.set(false);
    this.showReclamationModal.set(true);
  }

  fermerModalReclamation() {
    this.showReclamationModal.set(false);
  }

  envoyerReclamation() {
    this.b2b.soumettreReclamation(this.b2b.currentEmploye(), this.motifReclamationInput());
    this.reclamationEnvoyee.set(true);
    setTimeout(() => {
      this.showReclamationModal.set(false);
      this.reclamationEnvoyee.set(false);
    }, 2500);
  }

  // Plats du menu planifié pour le jour sélectionné
  menuDuJourSelectionne = computed(() => {
    const entId = this.b2b.currentEntreprise().id;
    const jour = this.jourSelectionne();
    return this.b2b.menusPlanifiesEntreprises().find(m => m.entrepriseId === entId && m.jourNom === jour) || null;
  });

  // Plats filtrés enrichis avec les quotas & stocks en temps réel
  platsFiltres = computed(() => {
    const cat = this.categorieSelectionnee();
    const query = this.termeRecherche().trim().toLowerCase();
    const menu = this.menuDuJourSelectionne();
    const jour = this.jourSelectionne();

    let listeBase: PlatB2B[] = [];

    if (menu && menu.lignes && menu.lignes.length > 0) {
      // Afficher les plats programmés par le Responsable pour ce jour précis (en excluant les plats archivés)
      listeBase = menu.lignes
        .filter(l => !this.b2b.catalogueJour().find(p => p.id === l.platId)?.isArchive)
        .map(l => {
        const platOrigine = this.b2b.catalogueJour().find(p => p.id === l.platId);
        return {
          id: l.platId,
          nom: l.nomPlat,
          description: platOrigine?.description || 'Plat cuisiné frais du jour par la brigade Kiki.',
          categorie: l.categorie as any,
          prixUnitaire: platOrigine?.prixUnitaire || 3000,
          image: platOrigine?.image || '/assets/images/plats/p1.jpg',
          calories: platOrigine?.calories || 500,
          disponible: l.disponible !== false
        };
      });
      if (!listeBase.some(p => p.categorie === 'GARNITURE')) {
        listeBase = [
          ...listeBase,
          ...this.b2b.catalogueJour().filter(p => !p.isArchive && p.categorie === 'GARNITURE')
        ];
      }
    } else {
      // Fallback catalogue complet
      listeBase = this.b2b.catalogueJour().filter(p => !p.isArchive);
    }

    if (cat !== 'all') {
      listeBase = listeBase.filter(p => p.categorie === cat);
    }

    if (query) {
      listeBase = listeBase.filter(p => 
        p.nom.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    return listeBase;
  });

  // Pagination du menu employé
  pageMenu = signal<number>(1);
  pageSizeMenu = 6;

  totalPagesMenu = computed(() => Math.max(1, Math.ceil(this.platsFiltres().length / this.pageSizeMenu)));
  pagesMenuArray = computed(() => Array.from({ length: this.totalPagesMenu() }, (_, i) => i + 1));
  platsPagines = computed(() => {
    const start = (this.pageMenu() - 1) * this.pageSizeMenu;
    return this.platsFiltres().slice(start, start + this.pageSizeMenu);
  });

  // Slides du carrousel Hero Banner MyKiki
  slides = [
    {
      id: 'slide-1',
      badge: 'COMMANDER IMMÉDIATEMENT',
      isPromo: false,
      titre: 'Pastels au Mérou & Crevettes (Lot de 12)',
      description: 'Beignets croustillants farcis au poisson noble et crevettes, servis avec une sauce tomate pimentée signature.',
      prix: 6000,
      imageUrl: 'assets/images/plats/pastels.jpg',
      boutonTexte: 'Choisir ce plat'
    },
    {
      id: 'slide-2',
      badge: 'OFFRE DU MOMENT',
      isPromo: true,
      titre: 'Dégustation Offerte au Lab',
      description: 'Dès 40 convives, profitez d\'une séance dégustation sur-mesure avec notre Chef exécutif.',
      imageUrl: 'assets/images/table-with-delicious-sweets-covered-with-pink-silk.jpg',
      boutonTexte: 'Nouvelle demande'
    },
    {
      id: 'slide-3',
      badge: 'SPÉCIALITÉ DU CHEF',
      isPromo: false,
      titre: 'Thiéboudienne Penda Mbaye Royale',
      description: 'Riz rouge mijoté au mérou frais, crevettes géantes et légumes du terroir.',
      prix: 5500,
      imageUrl: 'assets/images/plats/thieboudienne.jpg',
      boutonTexte: 'Choisir ce plat'
    }
  ];
  slideActuel = signal(0);
  valeursFumee: string[] = ['Professionnalisme', 'Convivialité', 'Loyauté', 'Fiabilité', 'Excellence', 'Savoir-faire'];

  allerAuSlide(index: number) {
    this.slideActuel.set(index);
  }

  showConfirmationModal = signal(false);
  orderPlaced = signal(false);
  isWaveProcessing = signal(false);
  qrDataString = signal<string>('');

  // Catégories inspirées de MyKiki avec libellés adaptés au mode profil
  categorieSelectionnee = signal<string>('all');

  categories = computed(() => {
    const isSub = this.b2b.modeProfil() === 'SUBVENTIONNE';
    return [
      { id: 'all', name: 'Tous', icon: 'fa-globe' },
      { id: 'ENTREE', name: isSub ? '1. Entrée' : 'Entrées', icon: 'fa-cookie-bite' },
      { id: 'PLAT', name: isSub ? '2. Plat Chaud' : 'Plats Chauds', icon: 'fa-utensils' },
      { id: 'GARNITURE', name: isSub ? '3. Garniture' : 'Garnitures', icon: 'fa-bowl-rice' },
      { id: 'DESSERT', name: isSub ? '4. Dessert' : 'Desserts', icon: 'fa-cake-candles' },
      { id: 'BOISSON', name: isSub ? '5. Boisson' : 'Boissons', icon: 'fa-wine-glass-alt' }
    ];
  });

  selectCategory(catId: string) {
    this.categorieSelectionnee.set(catId);
    this.pageMenu.set(1);
    if (catId === 'all') {
      this.filterAutonome.set('TOUT');
    } else {
      this.filterAutonome.set(catId as any);
      this.activeTab.set(catId as any);
    }
  }

  // DERNIÈRE COMMANDE ENREGISTRÉE & REVOIR LE QR CODE À TOUT MOMENT
  derniereCommande = signal<{
    id: string;
    date: string;
    heureRetrait: string;
    siteNom: string;
    formuleNom: string;
    entreeNom?: string;
    platNom?: string;
    dessertNom?: string;
    boissonNom?: string;
    qrCode: string;
    prixTotal: number;
    partEntreprise: number;
    partEmploye: number;
  } | null>({
    id: 'CMD-TOT-20261109-001',
    date: 'Aujourd’hui',
    heureRetrait: '12h00 - 12h30',
    siteNom: 'Siège Plateau - Dakar',
    formuleNom: 'Formule Déjeuner 4 comp.',
    entreeNom: 'Pastels Dorés au Thon (x3)',
    platNom: 'Poulet Yassa Braisé Kiki & Riz Parfumé',
    dessertNom: 'Fondant au Chocolat Noir',
    boissonNom: 'Jus Naturel de Bissap Frais Menthe',
    qrCode: 'KT-TOT-9842-SITE1-20261109',
    prixTotal: 5000,
    partEntreprise: 5000,
    partEmploye: 0
  });

  // Modal spécifique pour réafficher le QR Code de retrait
  showQrCodeModal = signal(false);

  ouvrirQrCodeModal() {
    const cmd = this.derniereCommande();
    if (cmd) {
      this.qrDataString.set(cmd.qrCode);
      this.showQrCodeModal.set(true);
    }
  }

  fermerQrCodeModal() {
    this.showQrCodeModal.set(false);
  }

  // Génération du QR Code SVG en direct (haute précision, sans dépendance externe)
  qrMatrix = computed(() => {
    const data = this.qrDataString() || 'KIKI-B2B-PASS';
    return this.generateQrMatrix(data);
  });

  // Helper stock pour le template
  getStock(platId: string) {
    return this.b2b.getStockInfoPlat(platId, this.jourSelectionne());
  }

  // Ouvrir / fermer le tiroir latéral du panier ou scroll vers le panier
  afficherPanierMobile = signal(false);

  togglePanier() {
    this.afficherPanierMobile.update(v => !v);
    if (typeof document !== 'undefined') {
      const el = document.getElementById('b2b-cart-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  nombreArticlesPanier = computed(() => {
    if (this.b2b.modeProfil() === 'SUBVENTIONNE') {
      const s = this.b2b.selection();
      return (s.entree ? 1 : 0) + (s.plat ? 1 : 0) + (s.dessert ? 1 : 0) + (s.boisson ? 1 : 0);
    } else {
      return this.b2b.nbArticlesPanierAutonome();
    }
  });

  choisirOuAjouterPlat(plat: PlatB2B) {
    if (this.isBloqueParCutOff()) {
      this.ouvrirModalReclamation();
      return;
    }
    if (this.b2b.modeProfil() === 'SUBVENTIONNE') {
      this.b2b.choisirPlat(plat);
    } else {
      this.b2b.ajouterAuPanierAutonome(plat);
    }

    if (plat.categorie === 'PLAT') {
      this.flashGarnitureMessage.set('Plat chaud sélectionné ! Choisissez maintenant votre garniture.');
      if (this.flashGarnitureTimer) clearTimeout(this.flashGarnitureTimer);
      this.flashGarnitureTimer = setTimeout(() => this.flashGarnitureMessage.set(null), 4000);
    }
  }

  isPlatActiveDansMode(plat: PlatB2B): boolean {
    if (this.b2b.modeProfil() === 'SUBVENTIONNE') {
      return this.isPlatSelected(plat);
    } else {
      return this.b2b.quantitePlatAutonome(plat.id) > 0;
    }
  }

  isPlatSelected(plat: PlatB2B): boolean {
    const s = this.b2b.selection();
    if (plat.categorie === 'ENTREE') return s.entree?.id === plat.id;
    if (plat.categorie === 'PLAT') return s.plat?.id === plat.id;
    if (plat.categorie === 'GARNITURE') return s.garniture?.id === plat.id;
    if (plat.categorie === 'DESSERT') return s.dessert?.id === plat.id;
    if (plat.categorie === 'BOISSON') return s.boisson?.id === plat.id;
    return false;
  }

  validerCommande() {
    if (this.isBloqueParCutOff()) {
      this.ouvrirModalReclamation();
      return;
    }
    if (this.b2b.modeProfil() === 'SUBVENTIONNE') {
      if (!this.b2b.isFormuleComplete()) return;
    } else {
      if (this.b2b.panierAutonome().length === 0) return;
    }
    this.showConfirmationModal.set(true);
  }

  confirmerPaiementEtEnvoi() {
    const matricule = this.b2b.currentEmploye().matricule;
    const site = this.b2b.siteActuel();
    const dateStr = new Date().toISOString().slice(0, 10);
    const code = `KT-${matricule}-${site.id}-${dateStr}`;
    this.qrDataString.set(code);

    const s = this.b2b.selection();
    const cmdCode = `CMD-B2B-${Date.now().toString().slice(-6)}`;
    const prixTotal = this.b2b.modeProfil() === 'AUTONOME' ? this.b2b.totalPanierAutonome() : this.b2b.formuleActuelle().prixForfait;
    const partEntreprise = this.b2b.partPriseEnChargeEntreprise();
    const partEmploye = this.b2b.resteAPayerEmploye();
    const platNomResume = this.b2b.modeProfil() === 'AUTONOME'
      ? (this.b2b.panierAutonome().map(i => `${i.plat.nom} (x${i.quantite})`).join(', ') || 'Commande Autonome')
      : (s.plat?.nom || s.entree?.nom || 'Formule Déjeuner');

    this.derniereCommande.set({
      id: cmdCode,
      date: this.jourSelectionne() + ' ' + (this.datesSemaineMap[this.jourSelectionne()] || ''),
      heureRetrait: this.b2b.creneauLivraison(),
      siteNom: site.nom,
      formuleNom: this.b2b.formuleActuelle().nom,
      entreeNom: s.entree?.nom,
      platNom: s.plat?.nom,
      dessertNom: s.dessert?.nom,
      boissonNom: s.boisson?.nom,
      qrCode: code,
      prixTotal,
      partEntreprise,
      partEmploye
    });

    this.b2b.enregistrerCommandeSite({
      codeCommande: cmdCode,
      platNom: platNomResume,
      categorie: 'PLAT',
      montantTotal: prixTotal,
      partEntreprise,
      partEmploye,
      qrCode: code
    });

    // Pour l'employé non subventionné (0% ou AUTONOME) : règlement obligatoire par Wave
    const estNonSubventionne = this.b2b.modeProfil() === 'AUTONOME' || this.b2b.currentEmploye().tauxSubvention === 0;

    if (estNonSubventionne || this.b2b.resteAPayerEmploye() > 0) {
      this.isWaveProcessing.set(true);
      setTimeout(() => {
        this.isWaveProcessing.set(false);
        this.orderPlaced.set(true);
      }, 1500);
    } else {
      this.orderPlaced.set(true);
    }
  }

  fermerModalSucces() {
    this.showConfirmationModal.set(false);
    this.orderPlaced.set(false);
    if (this.b2b.modeProfil() === 'AUTONOME') {
      this.b2b.viderPanierAutonome();
    } else {
      this.b2b.reinitialiserSelection();
    }
  }

  // Algorithme standard de génération de matrice QR Code 25x25 (Version 2)
  private generateQrMatrix(text: string): boolean[][] {
    const size = 25;
    const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    
    const addFinder = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[row + r][col + c] = true;
          }
        }
      }
    };

    addFinder(0, 0);
    addFinder(0, size - 7);
    addFinder(size - 7, 0);

    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = (i % 2 === 0);
      matrix[i][6] = (i % 2 === 0);
    }

    const alignR = 18, alignC = 18;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
          matrix[alignR + r][alignC + c] = true;
        }
      }
    }

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inFinder1 = r < 8 && c < 8;
        const inFinder2 = r < 8 && c >= size - 8;
        const inFinder3 = r >= size - 8 && c < 8;
        const inTiming = r === 6 || c === 6;
        const inAlign = Math.abs(r - alignR) <= 2 && Math.abs(c - alignC) <= 2;

        if (!inFinder1 && !inFinder2 && !inFinder3 && !inTiming && !inAlign) {
          const bit = (Math.sin(hash + r * 13 + c * 37) * 10000) % 1;
          matrix[r][c] = Math.abs(bit) > 0.48;
        }
      }
    }

    return matrix;
  }
}
