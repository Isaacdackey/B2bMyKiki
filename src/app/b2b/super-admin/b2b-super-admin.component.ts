import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bNavComponent } from '../shared/b2b-nav.component';
import { B2bStateService } from '../shared/b2b-state.service';
import { EntrepriseB2B, SiteB2B, PlatB2B, TypePrestationB2B, CategoriePlatB2B, PlanningMenuSiteB2B } from '../shared/b2b.models';

@Component({
  selector: 'app-b2b-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, B2bNavComponent],
  templateUrl: './b2b-super-admin.component.html',
  styleUrls: ['./b2b-super-admin.component.css']
})
export class B2bSuperAdminComponent {
  b2b = inject(B2bStateService);

  get activeSection() {
    return this.b2b.superAdminActiveSection;
  }

  allerASection(section: 'DASHBOARD' | 'ENTREPRISES' | 'CATALOGUE' | 'PLANNING' | 'SITES' | 'FACTURATION') {
    this.b2b.superAdminActiveSection.set(section as any);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Filtres Entreprises & Pagination
  searchEntreprise = signal<string>('');
  filtreArchiveEntreprise = signal<'TOUTES' | 'ACTIVES' | 'ARCHIVEES'>('ACTIVES');
  pageEntreprises = signal<number>(1);
  pageSizeEntreprises = signal<number>(3);

  // Filtre Date du Tableau de Bord (style inspiré de la capture)
  dateDebutDashboard = signal<string>('2026-11-12');
  dateFinDashboard = signal<string>('2026-11-12');
  periodeRapideDashboard = signal<'AUJOURD_HUI' | 'SEMAINE' | 'MOIS' | 'TRIMESTRE' | 'ANNEE'>('AUJOURD_HUI');
  dateAfficheeDashboard = 'jeudi 12 novembre 2026';

  // États d'interactivité des graphes (Survol / Tooltips & Zoom Courbe)
  hoveredLineIndex = signal<number | null>(null);
  hoveredVBarIndex = signal<number | null>(null);
  hoveredHBarIndex = signal<number | null>(null);
  hoveredTopProdIndex = signal<number | null>(null);

  // Zoom sur la courbe (plage d'index start / end)
  zoomStartIndex = signal<number>(0);
  zoomEndIndex = signal<number>(100);
  isDraggingZoom = signal<boolean>(false);
  dragStartIdx = signal<number | null>(null);

  selectionnerPeriodeRapide(periode: 'AUJOURD_HUI' | 'SEMAINE' | 'MOIS' | 'TRIMESTRE' | 'ANNEE') {
    this.periodeRapideDashboard.set(periode);
    this.reinitialiserZoomCourbe();
    if (periode === 'AUJOURD_HUI') {
      this.dateDebutDashboard.set('2026-11-12');
      this.dateFinDashboard.set('2026-11-12');
    } else if (periode === 'SEMAINE') {
      this.dateDebutDashboard.set('2026-11-09');
      this.dateFinDashboard.set('2026-11-15');
    } else if (periode === 'MOIS') {
      this.dateDebutDashboard.set('2026-11-01');
      this.dateFinDashboard.set('2026-11-30');
    } else if (periode === 'TRIMESTRE') {
      this.dateDebutDashboard.set('2026-10-01');
      this.dateFinDashboard.set('2026-12-31');
    } else if (periode === 'ANNEE') {
      this.dateDebutDashboard.set('2026-01-01');
      this.dateFinDashboard.set('2026-12-31');
    }
  }

  onDateDashboardChange() {
    this.reinitialiserZoomCourbe();
    if (this.dateDebutDashboard() === this.dateFinDashboard()) {
      this.periodeRapideDashboard.set('AUJOURD_HUI');
    } else {
      this.periodeRapideDashboard.set('SEMAINE');
    }
  }

  statsDashboard = computed(() => {
    const p = this.periodeRapideDashboard();
    if (p === 'AUJOURD_HUI') {
      return {
        ca: 2200000,
        caPrecedent: 1980000,
        variationCa: '+11,1%',
        isPositiveCa: true,
        commandes: 440,
        commandesPrecedent: 396,
        variationCmd: '+11,1%',
        isPositiveCmd: true,
        seriesPoints: [
          { label: '08:00', dateFull: '2026-11-12 · 08h00', total: 45, livrees: 42, annulees: 3, ca: 225000 },
          { label: '09:00', dateFull: '2026-11-12 · 09h00', total: 95, livrees: 91, annulees: 4, ca: 475000 },
          { label: '10:00', dateFull: '2026-11-12 · 10h00', total: 165, livrees: 160, annulees: 5, ca: 825000 },
          { label: '11:00', dateFull: '2026-11-12 · 11h00', total: 245, livrees: 238, annulees: 7, ca: 1225000 },
          { label: '12:00', dateFull: '2026-11-12 · 12h00', total: 361, livrees: 346, annulees: 15, ca: 1805000 },
          { label: '13:00', dateFull: '2026-11-12 · 13h00', total: 410, livrees: 398, annulees: 12, ca: 2050000 },
          { label: '14:00', dateFull: '2026-11-12 · 14h00', total: 432, livrees: 422, annulees: 10, ca: 2160000 },
          { label: '15:00', dateFull: '2026-11-12 · 15h00', total: 440, livrees: 432, annulees: 8, ca: 2200000 }
        ],
        revenusParEntreprise: [
          { nom: 'TotalEnergies Plateau', montant: 700000, pct: '31.8%', color: '#721513', heightPct: 92 },
          { nom: 'Sonatel Almadies', montant: 575000, pct: '26.1%', color: '#606C38', heightPct: 78 },
          { nom: 'CBAO Siège', montant: 425000, pct: '19.3%', color: '#C5A880', heightPct: 58 },
          { nom: 'Port Autonome Dakar', montant: 310000, pct: '14.1%', color: '#D97706', heightPct: 42 },
          { nom: 'Free Sénégal', montant: 190000, pct: '8.6%', color: '#E51D24', heightPct: 26 }
        ],
        commandesParPrestation: [
          { label: 'Livraison en barquettes (12:00)', count: 245, revenu: 1225000, pct: 92 },
          { label: 'Service sur place • Réfectoire (12:30)', count: 135, revenu: 675000, pct: 58 },
          { label: 'Cuisine & service sur place (13:00)', count: 60, revenu: 300000, pct: 28 }
        ],
        topProduits: [
          { rang: 1, nom: 'Thiéboudienne Penda Mbaye', qte: 148, ca: 740000, pct: 95 },
          { rang: 2, nom: 'Poulet Yassa Braisé au Feu de Bois', qte: 112, ca: 560000, pct: 76 },
          { rang: 3, nom: 'Mafé de Bœuf Mijoté aux Légumes', qte: 78, ca: 390000, pct: 54 },
          { rang: 4, nom: 'Pastels au Poisson & Crevettes', qte: 64, ca: 96000, pct: 44 },
          { rang: 5, nom: 'Bissap Frais Menthe (33cl)', qte: 52, ca: 52000, pct: 35 }
        ]
      };
    } else if (p === 'SEMAINE') {
      return {
        ca: 11450000,
        caPrecedent: 10600000,
        variationCa: '+8,0%',
        isPositiveCa: true,
        commandes: 2290,
        commandesPrecedent: 2120,
        variationCmd: '+8,0%',
        isPositiveCmd: true,
        seriesPoints: [
          { label: '2026-11-06', dateFull: '2026-11-06', total: 340, livrees: 328, annulees: 12, ca: 1700000 },
          { label: '2026-11-07', dateFull: '2026-11-07', total: 361, livrees: 344, annulees: 15, ca: 1805000 },
          { label: '2026-11-08', dateFull: '2026-11-08', total: 295, livrees: 285, annulees: 10, ca: 1475000 },
          { label: '2026-11-09', dateFull: '2026-11-09', total: 420, livrees: 412, annulees: 8, ca: 2100000 },
          { label: '2026-11-10', dateFull: '2026-11-10', total: 465, livrees: 454, annulees: 11, ca: 2325000 },
          { label: '2026-11-11', dateFull: '2026-11-11', total: 450, livrees: 441, annulees: 9, ca: 2250000 },
          { label: '2026-11-12', dateFull: '2026-11-12', total: 440, livrees: 432, annulees: 8, ca: 2200000 }
        ],
        revenusParEntreprise: [
          { nom: 'TotalEnergies Plateau', montant: 3650000, pct: '31.9%', color: '#721513', heightPct: 94 },
          { nom: 'Sonatel Almadies', montant: 2980000, pct: '26.0%', color: '#606C38', heightPct: 79 },
          { nom: 'CBAO Siège', montant: 2210000, pct: '19.3%', color: '#C5A880', heightPct: 60 },
          { nom: 'Port Autonome Dakar', montant: 1620000, pct: '14.1%', color: '#D97706', heightPct: 44 },
          { nom: 'Free Sénégal', montant: 990000, pct: '8.6%', color: '#E51D24', heightPct: 28 }
        ],
        commandesParPrestation: [
          { label: 'Livraison en barquettes (12:00)', count: 1280, revenu: 6400000, pct: 95 },
          { label: 'Service sur place • Réfectoire (12:30)', count: 690, revenu: 3450000, pct: 56 },
          { label: 'Cuisine & service sur place (13:00)', count: 320, revenu: 1600000, pct: 27 }
        ],
        topProduits: [
          { rang: 1, nom: 'Thiéboudienne Penda Mbaye', qte: 760, ca: 3800000, pct: 96 },
          { rang: 2, nom: 'Poulet Yassa Braisé au Feu de Bois', qte: 590, ca: 2950000, pct: 78 },
          { rang: 3, nom: 'Dibi d\'Agneau Kiki & Alloco', qte: 420, ca: 2100000, pct: 58 },
          { rang: 4, nom: 'Filet de Mérou Sauce Tomate', qte: 310, ca: 1550000, pct: 43 },
          { rang: 5, nom: 'Thiagree Onctueux à la Vanille', qte: 210, ca: 315000, pct: 30 }
        ]
      };
    } else {
      const mult = p === 'MOIS' ? 4.2 : p === 'TRIMESTRE' ? 12.5 : 48;
      const caCalc = Math.round(11450000 * mult);
      const caPrecCalc = Math.round(10600000 * mult);
      const cmdCalc = Math.round(2290 * mult);
      const cmdPrecCalc = Math.round(2120 * mult);
      return {
        ca: caCalc,
        caPrecedent: caPrecCalc,
        variationCa: '+14,2%',
        isPositiveCa: true,
        commandes: cmdCalc,
        commandesPrecedent: cmdPrecCalc,
        variationCmd: '+12,8%',
        isPositiveCmd: true,
        seriesPoints: [
          { label: '2026-11-01', dateFull: '2026-11-01', total: 310, livrees: 298, annulees: 12, ca: 1550000 },
          { label: '2026-11-03', dateFull: '2026-11-03', total: 385, livrees: 372, annulees: 13, ca: 1925000 },
          { label: '2026-11-05', dateFull: '2026-11-05', total: 430, livrees: 418, annulees: 12, ca: 2150000 },
          { label: '2026-11-07', dateFull: '2026-11-07', total: 361, livrees: 344, annulees: 15, ca: 1805000 },
          { label: '2026-11-09', dateFull: '2026-11-09', total: 415, livrees: 405, annulees: 10, ca: 2075000 },
          { label: '2026-11-11', dateFull: '2026-11-11', total: 460, livrees: 449, annulees: 11, ca: 2300000 },
          { label: '2026-11-13', dateFull: '2026-11-13', total: 490, livrees: 481, annulees: 9, ca: 2450000 },
          { label: '2026-11-15', dateFull: '2026-11-15', total: 515, livrees: 506, annulees: 9, ca: 2575000 }
        ],
        revenusParEntreprise: [
          { nom: 'TotalEnergies Plateau', montant: Math.round(caCalc * 0.32), pct: '32.0%', color: '#721513', heightPct: 95 },
          { nom: 'Sonatel Almadies', montant: Math.round(caCalc * 0.26), pct: '26.0%', color: '#606C38', heightPct: 80 },
          { nom: 'CBAO Siège', montant: Math.round(caCalc * 0.19), pct: '19.0%', color: '#C5A880', heightPct: 60 },
          { nom: 'Port Autonome Dakar', montant: Math.round(caCalc * 0.14), pct: '14.0%', color: '#D97706', heightPct: 45 },
          { nom: 'Free Sénégal', montant: Math.round(caCalc * 0.09), pct: '9.0%', color: '#E51D24', heightPct: 30 }
        ],
        commandesParPrestation: [
          { label: 'Livraison en barquettes (12:00)', count: Math.round(cmdCalc * 0.56), revenu: Math.round(caCalc * 0.56), pct: 95 },
          { label: 'Service sur place • Réfectoire (12:30)', count: Math.round(cmdCalc * 0.30), revenu: Math.round(caCalc * 0.30), pct: 56 },
          { label: 'Cuisine & service sur place (13:00)', count: Math.round(cmdCalc * 0.14), revenu: Math.round(caCalc * 0.14), pct: 28 }
        ],
        topProduits: [
          { rang: 1, nom: 'Thiéboudienne Penda Mbaye', qte: Math.round(760 * mult), ca: Math.round(3800000 * mult), pct: 96 },
          { rang: 2, nom: 'Poulet Yassa Braisé au Feu de Bois', qte: Math.round(590 * mult), ca: Math.round(2950000 * mult), pct: 78 },
          { rang: 3, nom: 'Dibi d\'Agneau Kiki & Alloco', qte: Math.round(420 * mult), ca: Math.round(2100000 * mult), pct: 58 },
          { rang: 4, nom: 'Filet de Mérou Sauce Tomate', qte: Math.round(310 * mult), ca: Math.round(1550000 * mult), pct: 43 },
          { rang: 5, nom: 'Thiagree Onctueux à la Vanille', qte: Math.round(210 * mult), ca: Math.round(315000 * mult), pct: 30 }
        ]
      };
    }
  });

  // Points filtrés par le zoom actif sur la courbe
  visibleSeriesPoints = computed(() => {
    const all = this.statsDashboard().seriesPoints;
    const start = Math.max(0, Math.min(this.zoomStartIndex(), all.length - 2));
    const end = Math.max(start + 2, Math.min(this.zoomEndIndex(), all.length));
    return all.slice(start, end);
  });

  isCourbeZoomee = computed(() => {
    const all = this.statsDashboard().seriesPoints;
    return this.zoomStartIndex() > 0 || this.zoomEndIndex() < all.length;
  });

  zoomInCourbe() {
    const all = this.statsDashboard().seriesPoints;
    const curStart = this.zoomStartIndex();
    const curEnd = Math.min(this.zoomEndIndex(), all.length);
    if (curEnd - curStart <= 3) return; // Garder au moins 3 points visibles
    const center = this.hoveredLineIndex() !== null ? curStart + this.hoveredLineIndex()! : Math.floor((curStart + curEnd) / 2);
    const nextSpan = Math.max(3, curEnd - curStart - 2);
    const newStart = Math.max(0, Math.min(all.length - nextSpan, Math.floor(center - nextSpan / 2)));
    this.zoomStartIndex.set(newStart);
    this.zoomEndIndex.set(newStart + nextSpan);
    this.hoveredLineIndex.set(null);
  }

  zoomOutCourbe() {
    const all = this.statsDashboard().seriesPoints;
    const curStart = this.zoomStartIndex();
    const curEnd = Math.min(this.zoomEndIndex(), all.length);
    const newStart = Math.max(0, curStart - 1);
    const newEnd = Math.min(all.length, curEnd + 1);
    this.zoomStartIndex.set(newStart);
    this.zoomEndIndex.set(newEnd);
    this.hoveredLineIndex.set(null);
  }

  reinitialiserZoomCourbe() {
    this.zoomStartIndex.set(0);
    this.zoomEndIndex.set(100);
    this.hoveredLineIndex.set(null);
  }

  onWheelLineChart(event: WheelEvent) {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomInCourbe();
    } else {
      this.zoomOutCourbe();
    }
  }

  // Coordonnées SVG calculées dynamiquement pour la courbe d'évolution
  lineChartGeometry = computed(() => {
    const pts = this.visibleSeriesPoints();
    const maxVal = Math.max(500, ...pts.map(p => p.total)) * 1.1;
    const xLeft = 45;
    const xRight = 535;
    const yTop = 22;
    const yBottom = 160;
    const width = xRight - xLeft;
    const height = yBottom - yTop;

    const coords = pts.map((pt, i) => {
      const x = pts.length > 1 ? xLeft + (i / (pts.length - 1)) * width : xLeft + width / 2;
      const yTotal = yBottom - (pt.total / maxVal) * height;
      const yLivrees = yBottom - (pt.livrees / maxVal) * height;
      const yAnnulees = yBottom - (pt.annulees / maxVal) * height;
      const pctX = ((x / 560) * 100);
      const pctY = ((yTotal / 190) * 100);
      return {
        ...pt,
        index: i,
        x,
        yTotal,
        yLivrees,
        yAnnulees,
        pctX,
        pctY
      };
    });

    const buildSmoothPath = (key: 'yTotal' | 'yLivrees' | 'yAnnulees') => {
      if (coords.length === 0) return '';
      if (coords.length === 1) return `M ${coords[0].x} ${coords[0][key]}`;
      let d = `M ${coords[0].x} ${coords[0][key]}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const curr = coords[i];
        const next = coords[i + 1];
        const ctrlX1 = curr.x + (next.x - curr.x) * 0.42;
        const ctrlY1 = curr[key];
        const ctrlX2 = curr.x + (next.x - curr.x) * 0.58;
        const ctrlY2 = next[key];
        d += ` C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${next.x} ${next[key]}`;
      }
      return d;
    };

    const pathTotal = buildSmoothPath('yTotal');
    const pathLivrees = buildSmoothPath('yLivrees');
    const pathAnnulees = buildSmoothPath('yAnnulees');

    const areaTotal = coords.length > 1
      ? `${pathTotal} L ${coords[coords.length - 1].x} ${yBottom} L ${coords[0].x} ${yBottom} Z`
      : '';
    const areaLivrees = coords.length > 1
      ? `${pathLivrees} L ${coords[coords.length - 1].x} ${yBottom} L ${coords[0].x} ${yBottom} Z`
      : '';

    const yTicks = [
      Math.round(maxVal),
      Math.round(maxVal * 0.75),
      Math.round(maxVal * 0.5),
      Math.round(maxVal * 0.25),
      0
    ];

    return {
      coords,
      pathTotal,
      pathLivrees,
      pathAnnulees,
      areaTotal,
      areaLivrees,
      yTicks
    };
  });

  hoveredLinePoint = computed(() => {
    const idx = this.hoveredLineIndex();
    const coords = this.lineChartGeometry().coords;
    if (idx === null || idx < 0 || idx >= coords.length) return null;
    return coords[idx];
  });

  dernieresCommandesDashboard = signal([
    { code: 'CMD-026934', employe: 'Babacar Ndiaye', entreprise: 'TotalEnergies Plateau', creneau: 'Déjeuner', dateHeure: '12/11 12:40', statut: 'Livré', montant: 5000 },
    { code: 'CMD-026933', employe: 'Fatou Fall', entreprise: 'TotalEnergies Plateau', creneau: 'Déjeuner', dateHeure: '12/11 12:38', statut: 'Livré', montant: 5000 },
    { code: 'CMD-026932', employe: 'Ousmane Wassa', entreprise: 'Sonatel Almadies', creneau: 'Déjeuner', dateHeure: '12/11 12:35', statut: 'Scanné', montant: 5000 },
    { code: 'CMD-026931', employe: 'Diayla Mbengue', entreprise: 'CBAO Siège', creneau: 'Déjeuner', dateHeure: '12/11 12:32', statut: 'Livré', montant: 5000 },
    { code: 'CMD-026930', employe: 'Mamadou Diallo', entreprise: 'TotalEnergies Bel-Air', creneau: 'Déjeuner', dateHeure: '12/11 12:29', statut: 'Livré', montant: 5000 },
    { code: 'CMD-026929', employe: 'Aminata Sow', entreprise: 'Port Autonome Dakar', creneau: 'Déjeuner', dateHeure: '12/11 12:24', statut: 'En cours', montant: 5000 },
    { code: 'CMD-026928', employe: 'Cheikh Diop', entreprise: 'Free Sénégal', creneau: 'Déjeuner', dateHeure: '12/11 12:18', statut: 'Livré', montant: 5000 },
    { code: 'CMD-026927', employe: 'Aïssatou Ba', entreprise: 'Sonatel Almadies', creneau: 'Déjeuner', dateHeure: '12/11 12:15', statut: 'Livré', montant: 5000 }
  ]);

  nbEntreprisesActives = computed(() => {
    return this.b2b.listeEntreprises().filter(e => !e.isArchivee).length;
  });

  nbEntreprisesArchivees = computed(() => {
    return this.b2b.listeEntreprises().filter(e => !!e.isArchivee).length;
  });

  entreprisesFiltrees = computed(() => {
    const q = this.searchEntreprise().toLowerCase().trim();
    const filtre = this.filtreArchiveEntreprise();

    return this.b2b.listeEntreprises().filter(ent => {
      const matchQ = !q || ent.nom.toLowerCase().includes(q) || ent.codeEntreprise.toLowerCase().includes(q);
      const matchArchive = filtre === 'TOUTES' ? true : filtre === 'ACTIVES' ? !ent.isArchivee : ent.isArchivee;
      return matchQ && matchArchive;
    });
  });

  totalPagesEntreprises = computed(() => {
    return Math.max(1, Math.ceil(this.entreprisesFiltrees().length / this.pageSizeEntreprises()));
  });

  entreprisesPaginees = computed(() => {
    const list = this.entreprisesFiltrees();
    const size = this.pageSizeEntreprises();
    const page = Math.min(this.pageEntreprises(), Math.max(1, Math.ceil(list.length / size)));
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  pagesEntreprisesArray = computed(() => {
    return Array.from({ length: this.totalPagesEntreprises() }, (_, i) => i + 1);
  });

  changerPageEntreprises(page: number) {
    if (page >= 1 && page <= this.totalPagesEntreprises()) {
      this.pageEntreprises.set(page);
    }
  }

  // Modal Nouvelle / Modification Entreprise
  showModalEntreprise = signal<boolean>(false);
  entrepriseEnEdition = signal<Partial<EntrepriseB2B>>({
    nom: '',
    codeEntreprise: '',
    ninea: '',
    rccm: '',
    adresse: '',
    emailContact: '',
    telephone: '+221 ',
    contactReferent: '',
    montantPriseEnChargeRepas: 5000,
    cutOffType: 'J_MOINS_1',
    cutOffHeure: '18:00',
    cadenceFacturation: 'MENSUELLE',
    typePrestation: 'CUISINE_SUR_PLACE',
    categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
  });
  isEditModeEntreprise = signal<boolean>(false);

  // Modal Paramètres (Types de prestation et Catégories personnalisables)
  showModalParametres = signal<boolean>(false);
  nouveauTypePrestation = signal<{ code: string; libelle: string; desc: string }>({
    code: '',
    libelle: '',
    desc: ''
  });
  nouvelleCategorie = signal<{ code: string; libelle: string; icone: string; couleur: string }>({
    code: '',
    libelle: '',
    icone: 'fa-utensils',
    couleur: '#721513'
  });

  // Modal Nouveau Site (maintenu si besoin pour rétrocompatibilité)
  showModalSite = signal<boolean>(false);
  entrepriseCibleSiteId = signal<string>('');
  siteEnEdition = signal<Partial<SiteB2B>>({
    nom: '',
    adresse: '',
    heureCutOff: '10:30',
    contactReferent: '',
    telephoneReferent: '+221 ',
    typePrestation: 'CUISINE_SUR_PLACE',
    categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
  });
  isEditModeSite = signal<boolean>(false);
  siteIdEnEdition = signal<string>('');

  // Modal Catalogue (Plat)
  showModalPlat = signal<boolean>(false);
  platEnEdition = signal<Partial<PlatB2B>>({
    nom: '',
    description: '',
    categorie: 'PLAT',
    prixUnitaire: 2800,
    image: '/assets/images/plats/p1.jpg',
    calories: 550
  });
  isEditModePlat = signal<boolean>(false);
  platIdEnEdition = signal<string>('');

  // Filtre Catalogue & Pagination
  filtreCategorieCatalogue = signal<'TOUS' | 'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON'>('TOUS');
  filtreArchivePlat = signal<'TOUS' | 'ACTIFS' | 'ARCHIVES'>('ACTIFS');
  pageCatalogue = signal<number>(1);
  pageSizeCatalogue = signal<number>(6);

  platsFiltres = computed(() => {
    const cat = this.filtreCategorieCatalogue();
    const arch = this.filtreArchivePlat();

    return this.b2b.catalogueJour().filter(p => {
      const matchCat = cat === 'TOUS' || p.categorie === cat;
      const matchArch = arch === 'TOUS' ? true : arch === 'ACTIFS' ? !p.isArchive : p.isArchive;
      return matchCat && matchArch;
    });
  });

  totalPagesCatalogue = computed(() => {
    return Math.max(1, Math.ceil(this.platsFiltres().length / this.pageSizeCatalogue()));
  });

  platsPagines = computed(() => {
    const list = this.platsFiltres();
    const size = this.pageSizeCatalogue();
    const page = Math.min(this.pageCatalogue(), Math.max(1, Math.ceil(list.length / size)));
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  pagesCatalogueArray = computed(() => {
    return Array.from({ length: this.totalPagesCatalogue() }, (_, i) => i + 1);
  });

  changerPageCatalogue(page: number) {
    if (page >= 1 && page <= this.totalPagesCatalogue()) {
      this.pageCatalogue.set(page);
    }
  }

  // Planning Multi-Sites Super Admin
  filtreSitePlanning = signal<string>('TOUS'); // 'TOUS' ou id spécifique (ex: 'site-1')

  tousLesSites = computed(() => {
    const list: { id: string; nom: string; entrepriseNom: string; codeEntreprise: string }[] = [];
    for (const ent of this.b2b.listeEntreprises()) {
      if (ent.sites && ent.sites.length > 0) {
        for (const s of ent.sites) {
          list.push({
            id: s.id,
            nom: s.nom,
            entrepriseNom: ent.nom,
            codeEntreprise: ent.codeEntreprise
          });
        }
      }
    }
    return list;
  });

  planningSemaineGlobal = signal<PlanningMenuSiteB2B[]>([
    // Menus Généraux / Tous les sites
    { id: 'sem-1', jour: 'Lundi', date: '03 Nov', cadence: 'HEBDO', theme: 'Tradition Sénégalaise', platVedette: 'Thiéboudienne Penda Mbaye', entreeProposee: 'Pastels au Poisson & Crevettes', dessertPropose: 'Thiagree Onctueux à la Vanille', boissonProposee: 'Bissap Frais Menthe', siteId: 'TOUS', siteNom: 'Tous les sites (Menu Standard)', totalPrevu: 410, statut: 'CLOTURE' },
    { id: 'sem-2', jour: 'Mardi (Aujourd\'hui)', date: '04 Nov', cadence: 'HEBDO', theme: 'Grillades & Fraîcheur Dakaroise', platVedette: 'Poulet Yassa Braisé au Feu de Bois', entreeProposee: 'Salade Niçoise au Thon Frais', dessertPropose: 'Salade de Fruits Exotiques', boissonProposee: 'Bouye & Pain de Singe', siteId: 'TOUS', siteNom: 'Tous les sites (Menu Standard)', totalPrevu: 440, statut: 'EN_PRODUCTION' },
    { id: 'sem-3', jour: 'Mercredi', date: '05 Nov', cadence: 'HEBDO', theme: 'Saveurs de l\'Atlantique', platVedette: 'Filet de Mérou Sauce Tomate Épicée', entreeProposee: 'Accras de Morue Dakaroise', dessertPropose: 'Fondant Chocolat Intense', boissonProposee: 'Jus de Gingembre & Ananas', siteId: 'TOUS', siteNom: 'Tous les sites (Menu Standard)', totalPrevu: 390, statut: 'VALIDE' },
    { id: 'sem-4', jour: 'Jeudi', date: '06 Nov', cadence: 'HEBDO', theme: 'Spécial Teranga & Rôtisserie', platVedette: 'Mafé de Bœuf Mijoté aux Légumes', entreeProposee: 'Velouté de Potiron & Coriandre', dessertPropose: 'Tartelette Mangue Caramélisée', boissonProposee: 'Cocktail Kiki Vitalité', siteId: 'TOUS', siteNom: 'Tous les sites (Menu Standard)', totalPrevu: 430, statut: 'PROGRAMME' },
    { id: 'sem-5', jour: 'Vendredi', date: '07 Nov', cadence: 'HEBDO', theme: 'Street Food Gourmet Sénégalais', platVedette: 'Dibi d\'Agneau Kiki & Alloco', entreeProposee: 'Fatayas Croustillants à la Viande', dessertPropose: 'Crème Brûlée Vanille Bourbon', boissonProposee: 'Nectar de Corossol', siteId: 'TOUS', siteNom: 'Tous les sites (Menu Standard)', totalPrevu: 470, statut: 'PROGRAMME' },

    // Menus Exclusifs / Spécifiques par Site
    { id: 'sem-tot-1', jour: 'Mardi (Aujourd\'hui)', date: '04 Nov', cadence: 'HEBDO', theme: 'VIP Total Plateau', platVedette: 'Capitaine Braisé & Riz Jasmin Parfumé', entreeProposee: 'Carpaccio de Saumon & Citron Vert', dessertPropose: 'Éclair Café Gourmand', boissonProposee: 'Jus de Passion Frais', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', entrepriseNom: 'TotalEnergies Sénégal', totalPrevu: 140, statut: 'EN_PRODUCTION' },
    { id: 'sem-tot-2', jour: 'Mercredi', date: '05 Nov', cadence: 'HEBDO', theme: 'Executive Dining', platVedette: 'Sombé de Lotte & Crevettes Géantes', entreeProposee: 'Salade Gourmet Chèvre Chaud', dessertPropose: 'Fondant Baobab', boissonProposee: 'Cocktail Agrumes', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', entrepriseNom: 'TotalEnergies Sénégal', totalPrevu: 135, statut: 'VALIDE' },
    { id: 'sem-depot-1', jour: 'Mardi (Aujourd\'hui)', date: '04 Nov', cadence: 'HEBDO', theme: 'Menu Express Portuaire', platVedette: 'Riz au Poisson Rouge Épicé', entreeProposee: 'Beignets Salés', dessertPropose: 'Yaourt Maison', boissonProposee: 'Bissap Glacé', siteId: 'site-2', siteNom: 'Dépôt Bel-Air / Port', entrepriseNom: 'TotalEnergies Sénégal', totalPrevu: 95, statut: 'EN_PRODUCTION' },
    { id: 'sem-sona-1', jour: 'Mardi (Aujourd\'hui)', date: '04 Nov', cadence: 'HEBDO', theme: 'High-Tech Lunch Pikine', platVedette: 'Cordon Bleu Maison & Riz Parfumé', entreeProposee: 'Salade Croquante au Poulet', dessertPropose: 'Tarte Citron Meringuée', boissonProposee: 'Bissap Blanc & Menthe', siteId: 'site-sona-1', siteNom: 'Siège Technopole Pikine', entrepriseNom: 'Sonatel Orange', totalPrevu: 180, statut: 'EN_PRODUCTION' }
  ]);

  planningFiltreParSite = computed(() => {
    const siteId = this.filtreSitePlanning();
    if (siteId === 'TOUS') {
      return this.planningSemaineGlobal();
    }
    return this.planningSemaineGlobal().filter(item => item.siteId === siteId || item.siteId === 'TOUS');
  });

  // Modal Planning Supervision
  showModalPlanning = signal<boolean>(false);
  isNouveauMenuPlanning = signal<boolean>(false);
  planningEnEdition = signal<Partial<PlanningMenuSiteB2B>>({
    jour: 'Lundi',
    date: '10 Nov',
    cadence: 'HEBDO',
    theme: '',
    platVedette: '',
    entreeProposee: '',
    dessertPropose: '',
    boissonProposee: '',
    siteId: 'TOUS',
    siteNom: 'Tous les sites (Global)',
    totalPrevu: 150,
    statut: 'PROGRAMME'
  });

  // Stats Globales Super Admin
  totalSitesActifs = computed(() => {
    return this.b2b.listeEntreprises().reduce((acc, e) => acc + (e.sites ? e.sites.length : 0), 0);
  });

  totalPlatsCatalogue = computed(() => this.b2b.catalogueJour().length);

  totalVolumeMensuelPrevu = computed(() => {
    return this.b2b.listeEntreprises().reduce((acc, e) => acc + (e.budgetMensuelAlloue || 0), 0);
  });

  // GESTION DU TYPE DE PRESTATION & DES CATÉGORIES
  onTypePrestationEntrepriseChange(type: string) {
    const trouv = this.b2b.typesPrestationConfigurables().find(t => t.code === type);
    if (trouv) {
      this.entrepriseEnEdition.update(e => ({
        ...e,
        typePrestation: type,
        categoriesAutorisees: [...trouv.categoriesDefaut]
      }));
    } else {
      this.entrepriseEnEdition.update(e => ({ ...e, typePrestation: type }));
    }
  }

  toggleCategorieEntreprise(cat: string) {
    this.entrepriseEnEdition.update(e => {
      const actuelles: string[] = e.categoriesAutorisees ? [...e.categoriesAutorisees] : ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'];
      const idx = actuelles.indexOf(cat);
      if (idx > -1) {
        if (actuelles.length === 1) return e; // Toujours garder au moins 1 catégorie
        actuelles.splice(idx, 1);
      } else {
        actuelles.push(cat);
      }
      return { ...e, categoriesAutorisees: actuelles };
    });
  }

  isCategorieEntrepriseActive(cat: string): boolean {
    const cats = this.entrepriseEnEdition().categoriesAutorisees;
    return !!cats?.includes(cat);
  }

  getLibellePrestation(code?: string): string {
    const trouv = this.b2b.typesPrestationConfigurables().find(t => t.code === code);
    return trouv ? trouv.libelle : (code || 'Service de Restauration B2B');
  }

  getLibelleCutOff(ent: Partial<EntrepriseB2B>): string {
    if (!ent.cutOffType) return ent.cutOffHeure || '18:00 (J-1)';
    const prefix = ent.cutOffType === 'J_MOINS_1' ? 'J - 1 (Veille)' : 'Jour J (Jour même)';
    return `${prefix} à ${ent.cutOffHeure || '18:00'}`;
  }

  // PARAMÈTRES PERSONNALISABLES
  ouvrirModalParametres() {
    this.nouveauTypePrestation.set({ code: '', libelle: '', desc: '' });
    this.nouvelleCategorie.set({ code: '', libelle: '', icone: 'fa-utensils', couleur: '#721513' });
    this.showModalParametres.set(true);
  }

  creerNouveauTypePrestation() {
    const tp = this.nouveauTypePrestation();
    if (!tp.libelle) {
      alert('Veuillez renseigner un libellé pour la prestation.');
      return;
    }
    const code = tp.code || tp.libelle.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    this.b2b.ajouterTypePrestation({
      code,
      libelle: tp.libelle,
      desc: tp.desc || 'Prestation sur mesure Kiki Traiteur',
      categoriesDefaut: ['PLAT', 'BOISSON']
    });
    this.nouveauTypePrestation.set({ code: '', libelle: '', desc: '' });
  }

  creerNouvelleCategorie() {
    const cat = this.nouvelleCategorie();
    if (!cat.libelle) {
      alert('Veuillez renseigner un libellé pour la catégorie.');
      return;
    }
    const code = cat.code || cat.libelle.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    this.b2b.ajouterCategorie({
      code,
      libelle: cat.libelle,
      icone: cat.icone || 'fa-utensils',
      couleur: cat.couleur || '#721513'
    });
    this.nouvelleCategorie.set({ code: '', libelle: '', icone: 'fa-utensils', couleur: '#721513' });
  }

  // ACTIONS ENTREPRISE (1 Site = 1 Entreprise)
  genererCodeAuto(nomEntreprise?: string): string {
    const base = (nomEntreprise || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const prefix = base.length >= 3 ? base.slice(0, 3) : 'ENT';
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${randomSuffix}`;
  }

  onNomEntrepriseChange(nom: string) {
    if (!this.isEditModeEntreprise()) {
      const nouveauCode = this.genererCodeAuto(nom);
      this.entrepriseEnEdition.update(actuel => ({
        ...actuel,
        codeEntreprise: nouveauCode
      }));
    }
  }

  regenererCodeEntreprise() {
    const code = this.genererCodeAuto(this.entrepriseEnEdition().nom);
    this.entrepriseEnEdition.update(actuel => ({
      ...actuel,
      codeEntreprise: code
    }));
  }

  ouvrirModalNouvelleEntreprise() {
    this.isEditModeEntreprise.set(false);
    this.entrepriseEnEdition.set({
      nom: '',
      codeEntreprise: this.genererCodeAuto(''),
      ninea: '',
      rccm: '',
      adresse: '',
      emailContact: '',
      telephone: '+221 ',
      contactReferent: '',
      montantPriseEnChargeRepas: 5000,
      cutOffType: 'J_MOINS_1',
      cutOffHeure: '18:00',
      cadenceFacturation: 'MENSUELLE',
      typePrestation: 'CUISINE_SUR_PLACE',
      categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
    });
    this.showModalEntreprise.set(true);
  }

  ouvrirModalModifierEntreprise(ent: EntrepriseB2B) {
    this.isEditModeEntreprise.set(true);
    this.entrepriseEnEdition.set({
      ...ent,
      rccm: ent.rccm || '',
      adresse: ent.adresse || (ent.sites && ent.sites[0] ? ent.sites[0].adresse : ''),
      contactReferent: ent.contactReferent || (ent.sites && ent.sites[0] ? ent.sites[0].contactReferent : ''),
      montantPriseEnChargeRepas: ent.montantPriseEnChargeRepas || 5000,
      cutOffType: ent.cutOffType || 'J_MOINS_1',
      cutOffHeure: ent.cutOffHeure || '18:00',
      typePrestation: ent.typePrestation || 'CUISINE_SUR_PLACE',
      categoriesAutorisees: ent.categoriesAutorisees ? [...ent.categoriesAutorisees] : ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
    });
    this.showModalEntreprise.set(true);
  }

  enregistrerEntreprise() {
    const val = this.entrepriseEnEdition();
    if (!val.nom || !val.codeEntreprise) {
      alert('Veuillez renseigner au moins le nom de l\'entreprise et son code.');
      return;
    }

    if (this.isEditModeEntreprise() && val.id) {
      this.b2b.modifierEntreprise(val.id, {
        ...val,
        sites: [
          {
            id: 'site-' + val.id,
            nom: val.nom!,
            adresse: val.adresse || 'Dakar',
            heureCutOff: `${val.cutOffHeure || '18:00'} (${val.cutOffType === 'JOUR_J' ? 'Jour J' : 'J-1'})`,
            contactReferent: val.contactReferent || 'Contact RH',
            telephoneReferent: val.telephone || '+221',
            typePrestation: val.typePrestation || 'CUISINE_SUR_PLACE',
            categoriesAutorisees: val.categoriesAutorisees || ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
          }
        ]
      });
    } else {
      this.b2b.ajouterEntreprise({
        nom: val.nom!,
        codeEntreprise: val.codeEntreprise!,
        ninea: val.ninea || '',
        rccm: val.rccm || '',
        adresse: val.adresse || '',
        emailContact: val.emailContact || '',
        telephone: val.telephone || '',
        contactReferent: val.contactReferent || '',
        montantPriseEnChargeRepas: val.montantPriseEnChargeRepas || 5000,
        tauxPriseEnCharge: 100,
        plafondJournalier: val.montantPriseEnChargeRepas || 5000,
        budgetMensuelAlloue: 15000000,
        tarifNegocieHtva: val.montantPriseEnChargeRepas || 5000,
        cadenceFacturation: val.cadenceFacturation || 'MENSUELLE',
        cutOffType: val.cutOffType || 'J_MOINS_1',
        cutOffHeure: val.cutOffHeure || '18:00',
        typePrestation: val.typePrestation || 'CUISINE_SUR_PLACE',
        categoriesAutorisees: val.categoriesAutorisees || ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'],
        isArchivee: false
      });
    }
    this.showModalEntreprise.set(false);
  }

  // ACTIONS SITES
  ouvrirModalAjoutSite(entrepriseId: string) {
    this.entrepriseCibleSiteId.set(entrepriseId);
    this.isEditModeSite.set(false);

    // Hériter par défaut du type de prestation de l'entreprise parente
    const entParente = this.b2b.listeEntreprises().find(e => e.id === entrepriseId);
    const typeDefaut: TypePrestationB2B = entParente?.typePrestation || 'COMPLETE';
    const catsDefaut: CategoriePlatB2B[] = entParente?.categoriesAutorisees ? [...entParente.categoriesAutorisees] : ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'];

    this.siteEnEdition.set({
      nom: '',
      adresse: '',
      heureCutOff: '10:30',
      contactReferent: '',
      telephoneReferent: '+221 ',
      typePrestation: typeDefaut,
      categoriesAutorisees: catsDefaut
    });
    this.showModalSite.set(true);
  }

  ouvrirModalModifierSite(entrepriseId: string, site: SiteB2B) {
    this.entrepriseCibleSiteId.set(entrepriseId);
    this.isEditModeSite.set(true);
    this.siteIdEnEdition.set(site.id);
    this.siteEnEdition.set({
      ...site,
      typePrestation: site.typePrestation || 'COMPLETE',
      categoriesAutorisees: site.categoriesAutorisees ? [...site.categoriesAutorisees] : ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
    });
    this.showModalSite.set(true);
  }

  enregistrerSite() {
    const s = this.siteEnEdition();
    const entId = this.entrepriseCibleSiteId();
    if (!s.nom || !s.adresse) {
      alert('Veuillez renseigner le nom du site et son adresse.');
      return;
    }

    if (this.isEditModeSite()) {
      this.b2b.modifierSite(entId, this.siteIdEnEdition(), s);
    } else {
      this.b2b.ajouterSiteAEntreprise(entId, {
        nom: s.nom!,
        adresse: s.adresse!,
        heureCutOff: s.heureCutOff || '10:30',
        contactReferent: s.contactReferent || 'Responsable Site',
        telephoneReferent: s.telephoneReferent || '+221 77 000 00 00',
        typePrestation: s.typePrestation || 'COMPLETE',
        categoriesAutorisees: s.categoriesAutorisees || ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'],
        creneauxDisponibles: ['12h00 - 12h45', '13h00 - 13h45']
      });
    }
    this.showModalSite.set(false);
  }

  // ACTIONS CATALOGUE
  ouvrirModalAjoutPlat() {
    this.isEditModePlat.set(false);
    this.platEnEdition.set({
      nom: '',
      description: '',
      categorie: 'PLAT',
      prixUnitaire: 2800,
      image: '/assets/images/plats/p1.jpg',
      calories: 550
    });
    this.showModalPlat.set(true);
  }

  ouvrirModalModifierPlat(plat: PlatB2B) {
    this.isEditModePlat.set(true);
    this.platIdEnEdition.set(plat.id);
    this.platEnEdition.set({ ...plat });
    this.showModalPlat.set(true);
  }

  enregistrerPlat() {
    const p = this.platEnEdition();
    if (!p.nom || !p.prixUnitaire) {
      alert('Veuillez renseigner le nom du met et son tarif.');
      return;
    }

    if (this.isEditModePlat()) {
      this.b2b.modifierPlatCatalogue(this.platIdEnEdition(), p);
    } else {
      this.b2b.ajouterPlatCatalogue({
        nom: p.nom!,
        description: p.description || '',
        categorie: p.categorie || 'PLAT',
        prixUnitaire: p.prixUnitaire || 2500,
        image: p.image || '/assets/images/plats/p1.jpg',
        calories: p.calories || 500
      });
    }
    this.showModalPlat.set(false);
  }

  // ACTIONS PLANNING SUPERVISION
  ouvrirModalNouveauMenuSite() {
    this.isNouveauMenuPlanning.set(true);
    const siteActif = this.filtreSitePlanning();
    const siteTrouve = this.tousLesSites().find(s => s.id === siteActif);

    this.planningEnEdition.set({
      jour: 'Lundi',
      date: '10 Nov',
      cadence: 'HEBDO',
      theme: 'Spécial Déjeuner Site',
      platVedette: '',
      entreeProposee: '',
      dessertPropose: '',
      boissonProposee: '',
      siteId: siteActif === 'TOUS' ? 'TOUS' : siteActif,
      siteNom: siteTrouve ? siteTrouve.nom : 'Tous les sites (Global)',
      entrepriseNom: siteTrouve ? siteTrouve.entrepriseNom : undefined,
      totalPrevu: 120,
      statut: 'PROGRAMME'
    });
    this.showModalPlanning.set(true);
  }

  ouvrirModalEditPlanningGlobal(item: PlanningMenuSiteB2B) {
    this.isNouveauMenuPlanning.set(false);
    this.planningEnEdition.set({ ...item });
    this.showModalPlanning.set(true);
  }

  onSitePlanningSelectChange(siteId: string) {
    if (siteId === 'TOUS') {
      this.planningEnEdition.update(p => ({
        ...p,
        siteId: 'TOUS',
        siteNom: 'Tous les sites (Global)',
        entrepriseNom: undefined
      }));
    } else {
      const siteTrouve = this.tousLesSites().find(s => s.id === siteId);
      if (siteTrouve) {
        this.planningEnEdition.update(p => ({
          ...p,
          siteId: siteTrouve.id,
          siteNom: siteTrouve.nom,
          entrepriseNom: siteTrouve.entrepriseNom
        }));
      }
    }
  }

  enregistrerPlanningGlobal() {
    const edit = this.planningEnEdition();
    if (!edit.theme || !edit.platVedette) {
      alert('Veuillez renseigner le thème et le plat vedette.');
      return;
    }

    if (this.isNouveauMenuPlanning()) {
      const nouveau: PlanningMenuSiteB2B = {
        id: 'menu-' + Date.now(),
        jour: edit.jour || 'Lundi',
        date: edit.date || '10 Nov',
        cadence: edit.cadence || 'HEBDO',
        theme: edit.theme,
        platVedette: edit.platVedette,
        entreeProposee: edit.entreeProposee,
        dessertPropose: edit.dessertPropose,
        boissonProposee: edit.boissonProposee,
        siteId: edit.siteId || 'TOUS',
        siteNom: edit.siteNom || 'Tous les sites',
        entrepriseNom: edit.entrepriseNom,
        totalPrevu: edit.totalPrevu || 100,
        statut: edit.statut || 'PROGRAMME'
      };
      this.planningSemaineGlobal.update(list => [nouveau, ...list]);
    } else if (edit.id) {
      this.planningSemaineGlobal.update(list => list.map(item => item.id === edit.id ? { ...item, ...(edit as PlanningMenuSiteB2B) } : item));
    }
    this.showModalPlanning.set(false);
  }

  supprimerMenuPlanning(id: string) {
    if (confirm('Voulez-vous supprimer ce menu planifié ?')) {
      this.planningSemaineGlobal.update(list => list.filter(item => item.id !== id));
    }
  }

  // ==============================================================
  // ÉTAPE 2 : GESTION DE L'ENTREPRISE (5 ONGLETS)
  // ==============================================================
  entrepriseEnGestion = signal<EntrepriseB2B | null>(null);
  gererActiveTab = signal<'INFOS' | 'UTILISATEURS' | 'MENU' | 'COMMANDES' | 'FACTURATION'>('INFOS');

  // Onglet 2 : Utilisateurs
  modalNouvelEmploye = signal<boolean>(false);
  employeEnCreation = signal({
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    departement: 'Opérations',
    tauxSubvention: 100
  });

  modalInvitationAdmin = signal<boolean>(false);
  invitationEnCreation = signal({
    nomComplet: '',
    email: '',
    role: 'RESPONSABLE_ENTREPRISE' as 'RESPONSABLE_ENTREPRISE' | 'RESPONSABLE_SITE_KIKI'
  });
  invitationGenereeLien = signal<string | null>(null);

  // Onglet 3 : Menu Planifié
  jourMenuActif = signal<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'>('Lundi');
  modalDupliquerMenu = signal<boolean>(false);
  jourCibleDuplication = signal<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'>('Mercredi');

  // Onglet 4 : Commandes
  dateDebutCommandes = signal<string>('2026-11-12');
  dateFinCommandes = signal<string>('2026-11-12');
  filtreStatutCommande = signal<'TOUS' | 'EN_COURS' | 'SCANNE' | 'LIVRE'>('TOUS');
  filtreCategorieCommande = signal<string>('TOUTES');
  filtrePlatCommande = signal<string>('TOUS');

  // Onglet 5 : Facturation
  dateDebutFacturation = signal<string>('2026-11-01');
  dateFinFacturation = signal<string>('2026-11-30');

  // Méthodes pour ouvrir / fermer la gestion de l'entreprise
  ouvrirGestionEntreprise(ent: EntrepriseB2B) {
    this.entrepriseEnGestion.set(ent);
    this.gererActiveTab.set('INFOS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  fermerGestionEntreprise() {
    this.entrepriseEnGestion.set(null);
  }

  // Effectif des employés subventionnés (taux > 0%) de l'entreprise en gestion
  nbEmployesSubventionnesEntreprise = computed(() => {
    const ent = this.entrepriseEnGestion();
    if (!ent) return 0;
    return this.b2b.listeEmployes().filter(e => e.tauxSubvention > 0).length;
  });

  // Employés de l'entreprise en gestion
  employesEntrepriseEnGestion = computed(() => {
    return this.b2b.listeEmployes();
  });

  // Invitations pour l'entreprise en gestion
  invitationsEntrepriseEnGestion = computed(() => {
    const ent = this.entrepriseEnGestion();
    if (!ent) return [];
    return this.b2b.listeInvitationsAdmins().filter(inv => inv.entrepriseId === ent.id || inv.entrepriseId === 'ent-001' || inv.entrepriseId === 'ent-1');
  });

  // Menu du jour actif pour l'entreprise en gestion
  menuJourActifEntreprise = computed(() => {
    const ent = this.entrepriseEnGestion();
    const jour = this.jourMenuActif();
    if (!ent) return null;
    return this.b2b.menusPlanifiesEntreprises().find(m => 
      (m.entrepriseId === ent.id || m.entrepriseId === 'ent-001' || m.entrepriseId === 'ent-1') && m.jourNom === jour
    ) || null;
  });

  // Catégories autorisées pour l'entreprise en gestion
  categoriesAutoriseesEntreprise = computed(() => {
    const ent = this.entrepriseEnGestion();
    if (!ent || !ent.categoriesAutorisees) return ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'];
    return ent.categoriesAutorisees;
  });

  // Lignes de menu filtrées par les catégories autorisées
  lignesMenuFiltreesParCategories = computed(() => {
    const menu = this.menuJourActifEntreprise();
    const catsAutorisees = this.categoriesAutoriseesEntreprise();
    if (!menu) return [];
    return menu.lignes.filter(l => catsAutorisees.includes(l.categorie));
  });

  // Statut de conformité du jour actif (Total prévu par catégorie >= nb employés subventionnés)
  statutConformiteJourActif = computed(() => {
    const lignes = this.lignesMenuFiltreesParCategories();
    const subventionnesCount = this.nbEmployesSubventionnesEntreprise();
    if (lignes.length === 0) return { statut: 'NON_SAISI', message: 'Aucun plat planifié pour ce jour' };

    const totalQuantites = lignes.reduce((s, l) => s + (l.quantitePrevue || 0), 0);
    if (totalQuantites === 0) {
      return { statut: 'NON_SAISI', message: 'Quantités non renseignées (menu non affiché aux collaborateurs)' };
    }

    const categories = Array.from(new Set(lignes.map(l => l.categorie)));
    for (const cat of categories) {
      const somme = lignes.filter(l => l.categorie === cat).reduce((s, l) => s + (l.quantitePrevue || 0), 0);
      if (somme < subventionnesCount) {
        return {
          statut: 'NON_CONFORME',
          message: `Non conforme : seulement ${somme} portions prévues en ${cat} pour ${subventionnesCount} employés subventionnés.`
        };
      }
    }

    return {
      statut: 'CONFORME',
      message: `Conforme : les quantités prévues (${totalQuantites} au total) couvrent l'effectif subventionné (${subventionnesCount} pers.).`
    };
  });

  // Modification quantité plat du jour
  onQuantitePlatChange(ligneId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10) || 0;
    const menu = this.menuJourActifEntreprise();
    if (menu) {
      this.b2b.updateQuantitePlatMenu(menu.id, ligneId, val, this.nbEmployesSubventionnesEntreprise());
    }
  }

  // Duplication menu
  lancerDuplicationMenu() {
    const menu = this.menuJourActifEntreprise();
    const ent = this.entrepriseEnGestion();
    if (!menu || !ent) return;
    this.b2b.dupliquerMenuJour(menu.id, this.jourCibleDuplication(), ent.id);
    this.jourMenuActif.set(this.jourCibleDuplication());
    this.modalDupliquerMenu.set(false);
  }

  // Création employé
  enregistrerNouvelEmploye() {
    const cur = this.employeEnCreation();
    const ent = this.entrepriseEnGestion();
    if (!cur.nom || !cur.prenom) {
      alert('Veuillez renseigner le nom et le prénom de l\'employé.');
      return;
    }
    const matricule = cur.matricule || `${ent?.codeEntreprise || 'EMP'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const email = cur.email || `${cur.prenom.toLowerCase()}.${cur.nom.toLowerCase()}@client.sn`;
    this.b2b.ajouterEmploye({
      matricule,
      nom: cur.nom,
      prenom: cur.prenom,
      email,
      telephone: cur.telephone || '+221 77 000 00 00',
      siteId: ent?.id || 'site-1',
      siteNom: ent?.nom || 'Siège',
      departement: cur.departement || 'Général',
      type: cur.tauxSubvention === 0 ? 'AUTONOME' : 'SUBVENTIONNE',
      tauxSubvention: cur.tauxSubvention,
      actif: true,
      repasConsommesMois: 0,
      montantPrisEnChargeMois: 0
    });
    this.modalNouvelEmploye.set(false);
    this.employeEnCreation.set({ matricule: '', nom: '', prenom: '', email: '', telephone: '', departement: 'Opérations', tauxSubvention: 100 });
  }

  importerFichierEmployes() {
    const ent = this.entrepriseEnGestion();
    const code = ent?.codeEntreprise || 'TOT';
    const importes = [
      { matricule: `${code}-9850`, nom: 'Sene', prenom: 'Awa', email: `a.sene@${ent?.codeEntreprise.toLowerCase()}.sn`, telephone: '+221 77 810 20 30', departement: 'Comptabilité', tauxSubvention: 100 },
      { matricule: `${code}-9851`, nom: 'Thiam', prenom: 'Moussa', email: `m.thiam@${ent?.codeEntreprise.toLowerCase()}.sn`, telephone: '+221 78 920 30 40', departement: 'Logistique', tauxSubvention: 50 },
      { matricule: `${code}-9852`, nom: 'Gueye', prenom: 'Ndeye', email: `n.gueye@${ent?.codeEntreprise.toLowerCase()}.sn`, telephone: '+221 76 112 23 34', departement: 'Marketing', tauxSubvention: 100 },
      { matricule: `${code}-EXT-04`, nom: 'Cisse', prenom: 'Djibril (Prestataire)', email: `d.cisse@prestataire.sn`, telephone: '+221 77 444 55 66', departement: 'Sécurité Informatique', tauxSubvention: 0 }
    ];
    importes.forEach(imp => {
      this.b2b.ajouterEmploye({
        ...imp,
        siteId: ent?.id || 'site-1',
        siteNom: ent?.nom || 'Siège',
        type: imp.tauxSubvention === 0 ? 'AUTONOME' : 'SUBVENTIONNE',
        actif: true,
        repasConsommesMois: 0,
        montantPrisEnChargeMois: 0
      });
    });
    alert(`Importation réussie : ${importes.length} collaborateurs ont été ajoutés avec leurs taux de prise en charge respectifs.`);
  }

  // Création invitation admin
  lancerInvitationAdmin() {
    const cur = this.invitationEnCreation();
    const ent = this.entrepriseEnGestion();
    if (!cur.email || !cur.nomComplet) {
      alert('Veuillez renseigner le nom et l\'adresse email du gestionnaire.');
      return;
    }
    if (!ent) return;
    const inv = this.b2b.creerInvitationAdmin(cur.email, cur.nomComplet, cur.role, ent);
    const lien = `https://kikitraiteur.sn/b2b/activation?token=${inv.tokenActivation}&email=${encodeURIComponent(inv.email)}`;
    this.invitationGenereeLien.set(lien);
  }

  fermerModalInvitation() {
    this.modalInvitationAdmin.set(false);
    this.invitationGenereeLien.set(null);
    this.invitationEnCreation.set({ nomComplet: '', email: '', role: 'RESPONSABLE_ENTREPRISE' });
  }

  copierLienActivation(lien: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lien);
      alert('Lien d\'activation copié dans le presse-papier !');
    } else {
      prompt('Copiez ce lien d\'activation :', lien);
    }
  }

  // Commandes filtrées de l'entreprise
  commandesFiltreesEntreprise = computed(() => {
    const ent = this.entrepriseEnGestion();
    if (!ent) return [];
    let list = this.b2b.listeCommandesSite().filter(c => c.entrepriseId === ent.id || c.entrepriseId === 'ent-001' || c.entrepriseId === 'ent-1');

    // Filtre période
    const debut = this.dateDebutCommandes();
    const fin = this.dateFinCommandes();
    if (debut && fin) {
      list = list.filter(c => c.date >= debut && c.date <= fin);
    }

    // Filtre statut
    const st = this.filtreStatutCommande();
    if (st !== 'TOUS') {
      list = list.filter(c => c.statut === st);
    }

    // Filtre catégorie
    const cat = this.filtreCategorieCommande();
    if (cat !== 'TOUTES') {
      list = list.filter(c => c.categorie === cat);
    }

    // Filtre plat
    const plat = this.filtrePlatCommande();
    if (plat !== 'TOUS') {
      list = list.filter(c => c.platNom === plat);
    }

    return list;
  });

  // Plats uniques dans les commandes
  platsUniquesCommandes = computed(() => {
    const cmds = this.b2b.listeCommandesSite();
    return Array.from(new Set(cmds.map(c => c.platNom)));
  });

  // Actions Statuts Commandes
  simulerScanCommande(cmdId: string) {
    this.b2b.scannerCommandeSite(cmdId);
  }

  marquerLivree(cmdId: string) {
    this.b2b.marquerCommandeLivree(cmdId);
  }

  // Facturation journalière filtrée
  lignesFacturationFiltrees = computed(() => {
    const debut = this.dateDebutFacturation();
    const fin = this.dateFinFacturation();
    return this.b2b.lignesFacturationEntreprise().filter(l => l.date >= debut && l.date <= fin);
  });

  totalFacturationPeriode = computed(() => {
    const lignes = this.lignesFacturationFiltrees();
    return lignes.reduce((acc, l) => ({
      repas: acc.repas + l.nbPlatsLivres,
      presents: acc.presents + l.nbPresents,
      montantTotal: acc.montantTotal + l.montantTotal,
      partEntreprise: acc.partEntreprise + l.montantPartEntreprise,
      partEmploye: acc.partEmploye + l.montantPartEmploye
    }), { repas: 0, presents: 0, montantTotal: 0, partEntreprise: 0, partEmploye: 0 });
  });
}


