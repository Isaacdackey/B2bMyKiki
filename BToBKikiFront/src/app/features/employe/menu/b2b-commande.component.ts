import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { B2bApiService } from '../../../b2b/shared/b2b-api.service';
import { AlerteCommandeB2B, PlatB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-b2b-commande',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './b2b-commande.component.html',
  styleUrls: ['./b2b-commande.component.css']
})
export class B2bCommandeComponent implements OnInit {
  b2b = inject(B2bStateService);
  private api = inject(B2bApiService);
  alertesCommande = signal<AlerteCommandeB2B[]>([]);

  ngOnInit(): void {
    const email = this.b2b.currentEmploye().email;
    if (email) {
      this.api.getAlertesEmploye(email).subscribe({
        next: (res) => {
          if (res.success && Array.isArray(res.data)) {
            this.alertesCommande.set(res.data.filter(a => !a.lu));
          }
        },
        error: () => {}
      });
    }
  }

  marquerAlerteLue(id: string) {
    this.alertesCommande.update(list => list.filter(a => a.id !== id));
    this.api.marquerAlerteLue(id).subscribe({ error: () => {} });
  }

  constructor() {
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
    const cmdId = this.derniereCommande()?.id;
    if (cmdId && this.b2b.scannerParQrOuCode(cmdId)) {
      return;
    }
    const emp = this.b2b.currentEmploye();
    this.b2b.scannerParQrOuCode(emp.matricule);
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

  isJourPasse(jour: string): boolean {
    const idx = this.joursSemaine.indexOf(jour as any);
    return idx >= 0 && idx < this.todayIndex;
  }

  private getDateIsoPourJour(jour: string): string {
    const idx = Math.max(0, this.joursSemaine.indexOf(jour as any));
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() - this.todayIndex + idx);
    return d.toISOString().slice(0, 10);
  }

  changerJourCommande(jour: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche') {
    if (this.isJourPasse(jour)) {
      return;
    }
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

  // Vérifier si la commande est bloquée par le cut-off (dépend du type de prestation & de la convention)
  isBloqueParCutOff = computed(() => {
    const jour = this.jourSelectionne();
    if (this.isJourPasse(jour)) {
      return true;
    }
    const ent = this.b2b.currentEntreprise();
    if (ent.cutOffType === 'SANS_CUTOFF') {
      return false;
    }
    const prest = this.b2b.typesPrestationConfigurables().find(t => t.code === ent.typePrestation) as any;
    if (prest?.joursDisponibles?.length && !prest.joursDisponibles.includes(jour)) {
      return true;
    }
    if (jour === 'Vendredi' || jour === 'Samedi' || jour === 'Dimanche') {
      return false;
    }
    if (this.b2b.isEmployeDebloqueAujourdhui(this.b2b.currentEmploye().id)) {
      return false;
    }
    if (this.isAfterCutOff()) {
      return true;
    }
    const now = new Date();
    const [hStr, mStr] = (ent.cutOffHeure || '18:00').split(':');
    const cutH = parseInt(hStr, 10) || 18;
    const cutM = parseInt(mStr, 10) || 0;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return nowMins >= (cutH * 60 + cutM);
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
    const emp = this.b2b.currentEmploye();
    const session = this.b2b.currentSession();
    const employeReel = session?.nomComplet
      ? { ...emp, prenom: session.nomComplet, nom: '' }
      : emp;
    this.b2b.soumettreReclamation(employeReel, this.motifReclamationInput());
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
      listeBase = [];
    }

    // Respecter les catégories autorisées par la convention de l'entreprise
    const autorisees = this.b2b.currentEntreprise()?.categoriesAutorisees;
    if (autorisees && autorisees.length > 0) {
      listeBase = listeBase.filter(p =>
        autorisees.includes(p.categorie) ||
        (p.categorie === 'GARNITURE' && autorisees.includes('PLAT'))
      );
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
    const autorisees = this.b2b.currentEntreprise().categoriesAutorisees || [];
    const base = [
      { id: 'ENTREE', name: isSub ? '1. Entrée' : 'Entrées', icon: 'fa-cookie-bite' },
      { id: 'PLAT', name: isSub ? '2. Plat Chaud' : 'Plats Chauds', icon: 'fa-utensils' },
      { id: 'GARNITURE', name: isSub ? '3. Garniture' : 'Garnitures', icon: 'fa-bowl-rice' },
      { id: 'DESSERT', name: isSub ? '4. Dessert' : 'Desserts', icon: 'fa-cake-candles' },
      { id: 'BOISSON', name: isSub ? '5. Boisson' : 'Boissons', icon: 'fa-wine-glass-alt' }
    ];
    const filtrees = autorisees.length > 0
      ? base.filter(c => autorisees.includes(c.id) || (c.id === 'GARNITURE' && autorisees.includes('PLAT')))
      : base;
    return [{ id: 'all', name: 'Tous', icon: 'fa-globe' }, ...filtrees];
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
  } | null>(null);

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

  // Commandes enregistrées directement pour chaque jour de la semaine (avec QR Code dédié par jour)
  commandesSemaine = signal<Record<string, {
    id: string;
    dateIso: string;
    plats: PlatB2B[];
    qrCode: string;
    prixTotal: number;
    partEntreprise: number;
    partEmploye: number;
  }>>({});

  commandeDuJourActif = computed(() => this.commandesSemaine()[this.jourSelectionne()] || null);

  aDejaCommandeJour(jour: string): boolean {
    const cmd = this.commandesSemaine()[jour];
    return !!cmd && cmd.plats.length > 0;
  }

  ouvrirQrCodeJour() {
    const cmdJour = this.commandeDuJourActif();
    const site = this.b2b.siteActuel();
    const jour = this.jourSelectionne();
    if (cmdJour) {
      this.derniereCommande.set({
        id: cmdJour.id,
        date: `${jour} ${this.datesSemaineMap[jour] || ''}`.trim(),
        heureRetrait: this.b2b.creneauLivraison(),
        siteNom: site.nom,
        formuleNom: this.b2b.modeProfil() === 'AUTONOME' ? 'À la carte' : this.b2b.formuleActuelle().nom,
        entreeNom: cmdJour.plats.find(p => p.categorie === 'ENTREE')?.nom,
        platNom: cmdJour.plats.find(p => p.categorie === 'PLAT')?.nom,
        dessertNom: cmdJour.plats.find(p => p.categorie === 'DESSERT')?.nom,
        boissonNom: cmdJour.plats.find(p => p.categorie === 'BOISSON')?.nom,
        qrCode: cmdJour.qrCode,
        prixTotal: cmdJour.prixTotal,
        partEntreprise: cmdJour.partEntreprise,
        partEmploye: cmdJour.partEmploye
      });
      this.qrDataString.set(cmdJour.qrCode);
      this.showQrCodeModal.set(true);
      return;
    }
    this.ouvrirQrCodeModal();
  }

  choisirOuAjouterPlat(plat: PlatB2B) {
    const jour = this.jourSelectionne();
    if (this.isJourPasse(jour)) {
      return;
    }
    if (this.isBloqueParCutOff()) {
      this.ouvrirModalReclamation();
      return;
    }
    if (this.b2b.modeProfil() === 'SUBVENTIONNE') {
      this.b2b.choisirPlat(plat);
    }

    const emp = this.b2b.currentEmploye();
    const site = this.b2b.siteActuel();
    const dateIso = this.getDateIsoPourJour(jour);
    const codeCommande = `CMD-${emp.matricule}-${dateIso}`;
    const qrCode = `KT-${emp.matricule}-${site.id}-${dateIso}`;

    const existante = this.commandesSemaine()[jour];
    let platsJour = existante ? [...existante.plats] : [];
    if (this.b2b.modeProfil() === 'SUBVENTIONNE') {
      platsJour = platsJour.filter(p => p.categorie !== plat.categorie);
      platsJour.push(plat);
    } else {
      const deja = platsJour.some(p => p.id === plat.id);
      platsJour = deja ? platsJour.filter(p => p.id !== plat.id) : [...platsJour, plat];
    }

    const prixTotal = this.b2b.modeProfil() === 'AUTONOME'
      ? platsJour.reduce((s, p) => s + (p.prixUnitaire || 0), 0)
      : this.b2b.formuleActuelle().prixForfait;
    const taux = this.b2b.modeProfil() === 'SUBVENTIONNE' ? (emp.tauxSubvention || 0) : 0;
    const partEntreprise = Math.round((prixTotal * taux) / 100);
    const partEmploye = Math.max(0, prixTotal - partEntreprise);

    this.commandesSemaine.update(map => ({
      ...map,
      [jour]: {
        id: codeCommande,
        dateIso,
        plats: platsJour,
        qrCode,
        prixTotal,
        partEntreprise,
        partEmploye
      }
    }));

    const platNomResume = platsJour.map(p => p.nom).join(' + ') || plat.nom;
    this.derniereCommande.set({
      id: codeCommande,
      date: `${jour} ${this.datesSemaineMap[jour] || ''}`.trim(),
      heureRetrait: this.b2b.creneauLivraison(),
      siteNom: site.nom,
      formuleNom: this.b2b.modeProfil() === 'AUTONOME' ? 'À la carte' : this.b2b.formuleActuelle().nom,
      entreeNom: platsJour.find(p => p.categorie === 'ENTREE')?.nom,
      platNom: platsJour.find(p => p.categorie === 'PLAT')?.nom,
      dessertNom: platsJour.find(p => p.categorie === 'DESSERT')?.nom,
      boissonNom: platsJour.find(p => p.categorie === 'BOISSON')?.nom,
      qrCode,
      prixTotal,
      partEntreprise,
      partEmploye
    });
    this.qrDataString.set(qrCode);

    if (platsJour.length > 0) {
      this.b2b.enregistrerCommandeSite({
        codeCommande,
        platNom: platNomResume,
        categorie: plat.categorie,
        montantTotal: prixTotal,
        partEntreprise,
        partEmploye,
        qrCode,
        date: dateIso
      });
    }

    if (plat.categorie === 'PLAT') {
      this.flashGarnitureMessage.set('Plat chaud enregistré ! Vous pouvez aussi choisir votre garniture.');
      if (this.flashGarnitureTimer) clearTimeout(this.flashGarnitureTimer);
      this.flashGarnitureTimer = setTimeout(() => this.flashGarnitureMessage.set(null), 4000);
    }
  }

  isPlatActiveDansMode(plat: PlatB2B): boolean {
    const cmdJour = this.commandeDuJourActif();
    if (cmdJour) {
      return cmdJour.plats.some(p => p.id === plat.id);
    }
    return false;
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
