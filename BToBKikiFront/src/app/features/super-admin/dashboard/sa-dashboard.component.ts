import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SaTopbarComponent } from '../sa-topbar.component';
import { B2bPeriodFilterComponent, PeriodeFilterChange, PeriodeFilterType } from '../../../b2b/shared/b2b-period-filter.component';
import { CountUpDirective } from '../../../b2b/shared/count-up.directive';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { PlanningMenuSiteB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-sa-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SaTopbarComponent, B2bPeriodFilterComponent, CountUpDirective],
  templateUrl: './sa-dashboard.component.html',
  styleUrls: ['../super-admin-shared.css']
})
export class SaDashboardComponent {
  b2b = inject(B2bStateService);
  private router = inject(Router);

  constructor() {
    if (this.b2b.currentSession().role !== 'SUPER_ADMIN') {
      this.b2b.setSessionRole({
        role: 'SUPER_ADMIN', nomComplet: 'Direction Kiki Traiteur', titrePoste: 'Super Admin Kiki (Global)',
        entite: 'Kiki Traiteur B2B', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar',
        badge: 'Direction Générale', badgeColor: '#721513'
      });
    }
  }

  allerASection(section: 'DASHBOARD' | 'ENTREPRISES' | 'CATALOGUE' | 'PLANNING' | 'SITES' | 'FACTURATION') {
    const map: Record<string, string> = {
      DASHBOARD: '/b2b/super-admin/dashboard', ENTREPRISES: '/b2b/super-admin/entreprises',
      SITES: '/b2b/super-admin/entreprises', CATALOGUE: '/b2b/super-admin/catalogue', PLANNING: '/b2b/super-admin/planning'
    };
    this.router.navigate([map[section] || '/b2b/super-admin/dashboard']);
    if (typeof window !== 'undefined') { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  dateDebutDashboard = signal<string>('2026-11-12');
  dateFinDashboard = signal<string>('2026-11-12');
  periodeRapideDashboard = signal<PeriodeFilterType>('JOUR');
  dashboardAnimKey = signal<number>(0);

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

  onPeriodeDashboardChange(ev: PeriodeFilterChange) {
    this.periodeRapideDashboard.set(ev.periode);
    this.dateDebutDashboard.set(ev.dateDebut);
    this.dateFinDashboard.set(ev.dateFin);
    this.reinitialiserZoomCourbe();
    this.dashboardAnimKey.update(k => k + 1);
  }

  statsDashboard = computed(() => {
    const p = this.periodeRapideDashboard();
    if (p === 'JOUR') {
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
      let mult = 4.2;
      if (p === 'ANNEE') {
        mult = 48;
      } else if (p === 'PERSONNALISE') {
        const d1 = new Date(this.dateDebutDashboard() + 'T00:00:00');
        const d2 = new Date(this.dateFinDashboard() + 'T00:00:00');
        const diffDays = !isNaN(d1.getTime()) && !isNaN(d2.getTime())
          ? Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1)
          : 7;
        mult = Math.max(0.2, diffDays / 7);
      }
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

  totalSitesActifs = computed(() => {
    return this.b2b.listeEntreprises().reduce((acc, e) => acc + (e.sites ? e.sites.length : 0), 0);
  });

  totalPlatsCatalogue = computed(() => this.b2b.catalogueJour().length);

  totalVolumeMensuelPrevu = computed(() => {
    return this.b2b.listeEntreprises().reduce((acc, e) => acc + (e.budgetMensuelAlloue || 0), 0);
  });

}

