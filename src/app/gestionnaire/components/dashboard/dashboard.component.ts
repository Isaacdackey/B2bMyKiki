import { Component, ViewEncapsulation, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { KikiDataService } from '../../../services/kiki-data.service';
import { GestionnaireApiService, DashboardStatsDto, DashboardResponseDto, CommandeDto, LigneCommandeDto, ProduitDto } from '../../../services/gestionnaire-api.service';
import { CommandeStoreService } from '../../../services/commande-store.service';

export type DashboardViewMode = 'DEMANDES' | 'COMMANDES' | 'SYNTHESE';

export interface CalendarDay {
  dayNumber: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvent: boolean;
  eventCount: number;
  events: any[];
}

export interface PrestationStat {
  id: string;
  nom: string;
  count: number;
  pourcentage: number;
  couleur: string;
  icone: string;
}

export interface TopProduitStat {
  nom: string;
  id?: number;
  categorie?: string;
  prix?: number;
  quantite: number;
  chiffreAffaires: number;
  commandesCount: number;
  pourcentage: number;
  rang: number;
  disponible?: boolean;
}

export interface ChartCurveResult {
  path: string;
  areaPath: string;
  points: { x: number; y: number; val: number; displayVal: string; label: string; isLast: boolean }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // Données unifiées du tableau de bord reçues en un appel d'API
  dashboardData: DashboardResponseDto | null = null;

  // Option active du Tableau de Bord (1: Demandes, 2: Commandes, ou Synthèse)
  vueActive: DashboardViewMode = 'DEMANDES';

  // Navigation temporelle
  currentYear = new Date().getFullYear();
  currentMonthIndex = new Date().getMonth();
  currentMonthLabel = '';
  periodeFiltre: 'MOIS' | 'TRIMESTRE' | 'ANNEE' | 'GLOBAL' = 'MOIS';

  // Données brutes
  requests: any[] = [];
  commandes: CommandeDto[] = [];
  clients: any[] = [];
  tousProduits: ProduitDto[] = [];
  dashboardStats: DashboardStatsDto | null = null;
  isLoading = false;

  // Filtre de courbe Demandes (Exclusif aux 4 types de prestations officielles)
  selectedDemandesFilter = 'Toutes';
  demandesFilterTabs = ['Toutes', 'Salle La Diva', 'Restauration Entreprise', 'Événements', 'Food Truck'];

  // Modal Voir plus / Classement complet des mets
  showModalTousLesMets = false;
  rechercheMets = '';
  filtreClassementMets: 'TOUS' | 'COMMANDES' | 'NON_COMMANDES' = 'TOUS';

  // Filtre de courbe Commandes
  selectedCommandesMetric: 'CA' | 'VOLUME' = 'CA';

  // Filtre de courbe Synthèse
  selectedSyntheseMetric: 'VOLUME' | 'CA' = 'VOLUME';

  // Calendrier
  calendarDays: CalendarDay[] = [];
  selectedCalendarDate: CalendarDay | null = null;

  constructor(
    private dataService: KikiDataService,
    private apiService: GestionnaireApiService,
    private store: CommandeStoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateCurrentMonthLabel();
    this.genererCalendrier();
    this.chargerToutesDonnees();

    // Écoute en temps réel des commandes
    this.store.commandes$.subscribe(cmds => {
      if (cmds && cmds.length > 0) {
        this.commandes = cmds;
        this.cdr.detectChanges();
      }
    });
  }

  setVue(vue: DashboardViewMode): void {
    this.vueActive = vue;
    this.cdr.detectChanges();
  }

  // ═══════════════════════════════════════════════════════════
  // FORMATTAGE & ABRÉVIATION (k / M avec virgule ex: 9,5k)
  // ═══════════════════════════════════════════════════════════

  formatSommeAbregee(val: number | undefined | null): string {
    if (val == null || val === 0) return '0 F';
    const absVal = Math.abs(val);
    if (absVal >= 1000000) {
      const m = val / 1000000;
      const str = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', ',');
      return `${str}M F`;
    }
    if (absVal >= 1000) {
      const k = val / 1000;
      const str = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace('.', ',');
      return `${str}k F`;
    }
    return val.toLocaleString('fr-FR') + ' F';
  }

  formatNombreAbrege(val: number | undefined | null): string {
    if (val == null || val === 0) return '0';
    const absVal = Math.abs(val);
    if (absVal >= 1000000) {
      const m = val / 1000000;
      const str = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', ',');
      return `${str}M`;
    }
    if (absVal >= 1000) {
      const k = val / 1000;
      const str = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace('.', ',');
      return `${str}k`;
    }
    return val.toString();
  }

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION DATE
  // ═══════════════════════════════════════════════════════════

  updateCurrentMonthLabel(): void {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    this.currentMonthLabel = `${months[this.currentMonthIndex]} ${this.currentYear}`;
  }

  prevMonth(): void {
    this.currentMonthIndex--;
    if (this.currentMonthIndex < 0) {
      this.currentMonthIndex = 11;
      this.currentYear--;
    }
    this.updateCurrentMonthLabel();
    this.chargerToutesDonnees();
  }

  nextMonth(): void {
    this.currentMonthIndex++;
    if (this.currentMonthIndex > 11) {
      this.currentMonthIndex = 0;
      this.currentYear++;
    }
    this.updateCurrentMonthLabel();
    this.chargerToutesDonnees();
  }

  getMonthInputValue(): string {
    const m = (this.currentMonthIndex + 1) < 10 ? `0${this.currentMonthIndex + 1}` : `${this.currentMonthIndex + 1}`;
    return `${this.currentYear}-${m}`;
  }

  onMonthInputChange(event: any): void {
    const val = event.target.value;
    if (val && val.includes('-')) {
      const parts = val.split('-');
      this.currentYear = parseInt(parts[0], 10);
      this.currentMonthIndex = parseInt(parts[1], 10) - 1;
      this.updateCurrentMonthLabel();
      this.chargerToutesDonnees();
    }
  }

  chargerToutesDonnees(): void {
    this.isLoading = true;

    // Appel unique qui regroupe TOUTES les informations du tableau de bord
    this.apiService.getDashboardOverview(this.currentYear, this.currentMonthIndex + 1).subscribe({
      next: (data: DashboardResponseDto) => {
        this.dashboardData = data;
        if (data.statsDemandes?.recentesDemandes) {
          this.requests = data.statsDemandes.recentesDemandes;
        }
        if (data.statsCommandes?.recentesCommandes) {
          this.commandes = data.statsCommandes.recentesCommandes;
        }
        this.isLoading = false;
        this.genererCalendrier();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement dashboard unifié:', err);
        this.isLoading = false;
        this.genererCalendrier();
        this.cdr.detectChanges();
      }
    });
  }

  recalculerStats(): void {
    if (this.dashboardData) {
      return;
    }
    const monthReqs = this.getRequestsForCurrentMonth();

    const totalRequests = monthReqs.length;
    const acceptedRequests = monthReqs.filter(r => 
      ['abouti', 'aboutis', 'confirmed', 'devis_confirme'].includes((r.status || '').toLowerCase())
    ).length;
    const pendingRequests = monthReqs.filter(r => 
      ['acceptee', 'accepted', 'approved', 'proposition_envoyee', 'propositions_envoyees', 'envoyee', 'proposition_validee', 'selection_client'].includes((r.status || '').toLowerCase())
    ).length;
    const urgentRequests = monthReqs.filter(r => 
      ['en_attente', 'pending', 'new', ''].includes((r.status || '').toLowerCase())
    ).length;
    const rejectedRequests = monthReqs.filter(r => 
      ['refusee', 'refusee_client', 'refused', 'annulee', 'cancelled', 'rejected'].includes((r.status || '').toLowerCase())
    ).length;
    const conversionRate = totalRequests > 0 ? Math.round((acceptedRequests / totalRequests) * 100) : 0;

    const totalClients = this.clients.length;
    const particuliersCount = this.clients.filter(c => (c.type || c.clientType || 'particulier').toLowerCase() === 'particulier').length;
    const entreprisesCount = this.clients.filter(c => ['entreprise', 'institution'].includes((c.type || c.clientType || '').toLowerCase())).length;

    this.dashboardStats = {
      totalRequests,
      acceptedRequests,
      pendingRequests,
      rejectedRequests,
      urgentRequests,
      conversionRate,
      totalRevenue: acceptedRequests * 500000,
      totalClients,
      particuliersCount,
      entreprisesCount,
      recentRequests: monthReqs.slice(0, 5)
    };

    this.cdr.detectChanges();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 1 : STATISTIQUES DES DEMANDES (PRESTATIONS & DEVIS)
  // ═══════════════════════════════════════════════════════════

  getRequestsForCurrentMonth(): any[] {
    if (this.dashboardData?.statsDemandes?.recentesDemandes) {
      return this.dashboardData.statsDemandes.recentesDemandes;
    }
    const yStr = String(this.currentYear);
    const mStr = (this.currentMonthIndex + 1) < 10 ? `0${this.currentMonthIndex + 1}` : `${this.currentMonthIndex + 1}`;
    const prefix = `${yStr}-${mStr}`;
    return this.requests.filter(r => {
      const dateVal = r.dateSubmitted || r.date || r.createdAt || (r as any).dateCreation || '';
      return String(dateVal).startsWith(prefix);
    });
  }

  get statsDemandes() {
    if (this.dashboardData?.statsDemandes) {
      return this.dashboardData.statsDemandes;
    }
    const reqs = this.getRequestsForCurrentMonth();
    const total = reqs.length;
    const abouties = reqs.filter(r => ['abouti', 'aboutis', 'confirmed', 'devis_confirme'].includes((r.status || '').toLowerCase())).length;
    const enCours = reqs.filter(r => ['acceptee', 'accepted', 'approved', 'proposition_envoyee', 'propositions_envoyees', 'envoyee', 'proposition_validee', 'selection_client'].includes((r.status || '').toLowerCase())).length;
    const urgentes = reqs.filter(r => ['en_attente', 'pending', 'new', ''].includes((r.status || '').toLowerCase())).length;
    const refusees = reqs.filter(r => ['refusee', 'refusee_client', 'refused', 'annulee', 'cancelled', 'rejected'].includes((r.status || '').toLowerCase())).length;
    const tauxConversion = total > 0 ? Math.round((abouties / total) * 100) : 0;
    
    // CA prévisionnel devis confirmés
    const caPrevisionnel = reqs.reduce((acc, r) => {
      const g = r.guests || 20;
      const basePrice = (r.prestationId === 'salle-diva' || (r.prestationTitle && r.prestationTitle.toLowerCase().includes('diva'))) ? 350000 : (g * 15000);
      return acc + (['abouti', 'confirmed', 'devis_confirme'].includes((r.status || '').toLowerCase()) ? basePrice : 0);
    }, 0);

    return {
      total,
      abouties,
      enCours,
      urgentes,
      refusees,
      tauxConversion,
      caPrevisionnel,
      repartitionPrestations: [],
      occupationSalleDiva: [],
      conflitsCount: 0,
      roomBlockedCount: 0,
      recentesDemandes: []
    };
  }

  isPrestationMatch(r: any, categoryId: string): boolean {
    const pId = (r.prestationId || '').toLowerCase();
    const pTitle = (r.prestationTitle || '').toLowerCase();
    const locType = (r.locationType || '').toLowerCase();
    const msg = (r.message || '').toLowerCase();

    if (categoryId === 'salle-diva') {
      return pId === 'salle-diva' || pId.includes('salle') || pId.includes('diva') || pTitle.includes('diva') || locType.includes('diva') || msg.includes('la diva') || msg.includes('salle');
    }
    if (categoryId === 'restauration-entreprise') {
      return pId === 'restauration-entreprise' || pId.includes('entreprise') || pId.includes('restauration') || pId.includes('traiteur') || pTitle.includes('entreprise') || pTitle.includes('traiteur');
    }
    if (categoryId === 'evenementiel') {
      return pId === 'evenementiel' || pId.includes('evenement') || pId.includes('mariage') || pId.includes('gala') || pTitle.includes('événement') || pTitle.includes('evenement') || (r.evenementNature && r.evenementNature.length > 0);
    }
    if (categoryId === 'foodtruck') {
      return pId === 'foodtruck' || pId.includes('truck') || pTitle.includes('truck') || msg.includes('truck');
    }
    return false;
  }

  getPrestationsStats(): PrestationStat[] {
    if (this.dashboardData?.statsDemandes?.repartitionPrestations?.length) {
      return this.dashboardData.statsDemandes.repartitionPrestations;
    }
    const reqs = this.getRequestsForCurrentMonth();
    const total = reqs.length;

    const definitions = [
      { id: 'salle-diva', nom: 'Salle La Diva', couleur: '#7A1C1C', icone: 'fa-champagne-glasses' },
      { id: 'restauration-entreprise', nom: "Restauration d'Entreprise", couleur: '#D97706', icone: 'fa-building' },
      { id: 'evenementiel', nom: "Organisation d'Événements", couleur: '#2563EB', icone: 'fa-cake-candles' },
      { id: 'foodtruck', nom: 'Food Truck Gourmet', couleur: '#059669', icone: 'fa-truck' }
    ];

    return definitions.map(d => {
      const count = reqs.filter(r => this.isPrestationMatch(r, d.id)).length;
      const pourcentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        ...d,
        count,
        pourcentage
      };
    });
  }

  getActiveConflictsCount(): number {
    if (this.dashboardData?.statsDemandes) {
      return this.dashboardData.statsDemandes.conflitsCount;
    }
    const reqs = this.getRequestsForCurrentMonth();
    if (reqs.length === 0) return 0;
    const divaReqs = reqs.filter(r => this.isPrestationMatch(r, 'salle-diva'));
    const seen = new Set<string>();
    const conflicting = new Set<string>();
    for (const r of divaReqs) {
       if (!r.date) continue;
       const key = r.date + '_' + (r.time || '');
       if (seen.has(key)) conflicting.add(key);
       else seen.add(key);
    }
    return conflicting.size;
  }

  getRoomBlockedCount(): number {
    if (this.dashboardData?.statsDemandes) {
      return this.dashboardData.statsDemandes.roomBlockedCount;
    }
    const reqs = this.getRequestsForCurrentMonth();
    return reqs.filter(r => this.isPrestationMatch(r, 'salle-diva') && 
                            ['accepted', 'approved', 'abouti', 'confirmed'].includes(r.status)).length;
  }

  getOccupationSalleDiva(): any[] {
    if (this.dashboardData?.statsDemandes?.occupationSalleDiva?.length) {
      return this.dashboardData.statsDemandes.occupationSalleDiva;
    }
    const monthReqs = this.getRequestsForCurrentMonth();
    const divaReqs = monthReqs.filter(r => 
      this.isPrestationMatch(r, 'salle-diva') &&
      ['accepted', 'approved', 'abouti', 'confirmed'].includes((r.status || '').toLowerCase()) &&
      r.date
    );

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const enrichies = divaReqs.map(r => {
      const d = new Date(r.date);
      const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: r.id,
        dateBrute: d,
        date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
        client: r.clientName || 'Client Réservé',
        heure: r.time || '18:00',
        invites: r.guests ? `${r.guests} convives` : '50 convives',
        joursRestants: diffDays,
        couleur: diffDays < 0 ? '#94A3B8' : (diffDays <= 3 ? '#DC2626' : (diffDays <= 7 ? '#D97706' : '#059669'))
      };
    });

    return enrichies
      .sort((a, b) => a.dateBrute.getTime() - b.dateBrute.getTime())
      .slice(0, 4);
  }

  libelleEcheance(jours: number): string {
    if (jours === 0) return "Aujourd'hui";
    if (jours === 1) return 'Demain';
    if (jours > 1) return `Dans ${jours} jours`;
    return 'Passé';
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 2 : STATISTIQUES DES COMMANDES & CLASSEMENT DES METS
  // ═══════════════════════════════════════════════════════════

  getCommandesForCurrentMonth(): CommandeDto[] {
    if (this.dashboardData?.statsCommandes?.recentesCommandes) {
      return this.dashboardData.statsCommandes.recentesCommandes;
    }
    const yStr = String(this.currentYear);
    const mStr = (this.currentMonthIndex + 1) < 10 ? `0${this.currentMonthIndex + 1}` : `${this.currentMonthIndex + 1}`;
    const prefix = `${yStr}-${mStr}`;
    return this.commandes.filter(c => {
      const d = c.createdAt || c.dateRemise || (c as any).dateCreation || '';
      return String(d).startsWith(prefix);
    });
  }

  get statsCommandes() {
    if (this.dashboardData?.statsCommandes) {
      return this.dashboardData.statsCommandes;
    }
    const list = this.getCommandesForCurrentMonth();
    const total = list.length;
    
    const totalVentes = list.reduce((acc, c) => acc + (c.montantTotal || 0), 0);
    const soldeEncaisse = list.filter(c => c.statutPaiement === 'PAYEE').reduce((acc, c) => acc + (c.montantTotal || 0), 0);
    const soldeRestant = list.filter(c => c.statutPaiement !== 'PAYEE' && c.statut !== 'ANNULEE').reduce((acc, c) => acc + (c.montantTotal || 0), 0);
    const panierMoyen = total > 0 ? Math.round(totalVentes / total) : 0;

    const terminees = list.filter(c => c.statut === 'TERMINEE').length;
    const tauxLivrees = total > 0 ? Math.round((terminees / total) * 100) : 0;

    // Statuts
    const enAttente = list.filter(c => c.statut === 'EN_ATTENTE').length;
    const acceptees = list.filter(c => c.statut === 'ACCEPTEE').length;
    const enPreparation = list.filter(c => c.statut === 'EN_COURS').length;
    const pretes = list.filter(c => c.statut === 'PRETE').length;
    const annulees = list.filter(c => c.statut === 'ANNULEE').length;

    // Répartition Remise
    const livraisons = list.filter(c => c.modeRemise === 'LIVRAISON').length;
    const retraits = list.filter(c => c.modeRemise !== 'LIVRAISON').length;
    const pctLivraison = total > 0 ? Math.round((livraisons / total) * 100) : 0;
    const pctRetrait = total > 0 ? (100 - pctLivraison) : 0;

    // Répartition Paiement
    const payees = list.filter(c => c.statutPaiement === 'PAYEE').length;
    const aEncaisser = total - payees;
    const pctPayee = total > 0 ? Math.round((payees / total) * 100) : 0;
    const pctAEncaisser = total > 0 ? (100 - pctPayee) : 0;

    return {
      total,
      totalVentes,
      soldeEncaisse,
      soldeRestant,
      panierMoyen,
      tauxLivrees,
      enAttente,
      acceptees,
      enPreparation,
      pretes,
      terminees,
      annulees,
      livraisons,
      retraits,
      pctLivraison,
      pctRetrait,
      pctPayee,
      pctAEncaisser,
      recentesCommandes: [],
      topProduits: []
    };
  }

  getLignesCommande(c: CommandeDto | null): LigneCommandeDto[] {
    if (!c) return [];
    if (c.lignes && Array.isArray(c.lignes) && c.lignes.length > 0) return c.lignes;
    if ((c as any).articles && Array.isArray((c as any).articles) && (c as any).articles.length > 0) {
      return (c as any).articles.map((a: any) => ({
        produitId: a.produitId || a.id,
        produitNom: a.produitNom || a.nom || a.title || 'Met Gastronomique',
        prixUnitaire: Number(a.prixUnitaire || a.prix || 0),
        quantite: Number(a.quantite || a.quantity || 1),
        sousTotal: Number(a.sousTotal || (a.prixUnitaire ? a.prixUnitaire * a.quantite : 0))
      }));
    }
    const fromStore = this.store.getCommandeById(c.id);
    if (fromStore?.lignes && Array.isArray(fromStore.lignes) && fromStore.lignes.length > 0) {
      return fromStore.lignes;
    }
    return [];
  }

  /**
   * Classement exhaustif de TOUS les mets du catalogue pour le mois sélectionné,
   * classés du 1er plus commandé ce mois jusqu'au dernier non commandé (0 vente).
   */
  getAllProduitsClassement(): TopProduitStat[] {
    if (this.dashboardData?.classementMets && this.dashboardData.classementMets.length > 0) {
      return this.dashboardData.classementMets;
    }
    const activeCmds = this.getCommandesForCurrentMonth().filter(c => c.statut !== 'ANNULEE');
    const salesMap = new Map<string, { quantite: number; ca: number; count: number; id?: number; prix?: number; categorie?: string }>();

    for (const cmd of activeCmds) {
      const lignes = this.getLignesCommande(cmd);
      for (const l of lignes) {
        const nom = (l.produitNom || (l as any).nom || 'Met').trim();
        const qte = Number(l.quantite) || 1;
        const pu = Number(l.prixUnitaire) || 0;
        const st = Number(l.sousTotal) || (pu > 0 ? pu * qte : 0);
        const key = nom.toLowerCase();

        if (salesMap.has(key)) {
          const cur = salesMap.get(key)!;
          cur.quantite += qte;
          cur.ca += st;
          cur.count += 1;
          if (l.produitId && !cur.id) cur.id = l.produitId;
          if (pu > 0 && !cur.prix) cur.prix = pu;
        } else {
          salesMap.set(key, {
            quantite: qte,
            ca: st,
            count: 1,
            id: l.produitId,
            prix: pu
          });
        }
      }
    }

    const allKnownProducts = new Map<string, TopProduitStat>();

    // 1. Produits enregistrés dans le catalogue
    for (const p of this.tousProduits) {
      const nomKey = p.nom.trim().toLowerCase();
      const sales = salesMap.get(nomKey);
      const qte = sales ? sales.quantite : 0;
      const ca = sales ? sales.ca : 0;
      const cmdCount = sales ? sales.count : 0;

      allKnownProducts.set(nomKey, {
        nom: p.nom,
        id: p.id,
        categorie: p.categorieNom || 'Catalogue',
        prix: p.prix || 0,
        quantite: qte,
        chiffreAffaires: ca,
        commandesCount: cmdCount,
        pourcentage: 0,
        rang: 0,
        disponible: p.disponible !== false
      });
    }

    // 2. Produits présents dans les commandes qui ne seraient pas encore dans this.tousProduits
    for (const [key, s] of salesMap.entries()) {
      if (!allKnownProducts.has(key)) {
        let properName = key;
        for (const cmd of activeCmds) {
          const matched = this.getLignesCommande(cmd).find(l => (l.produitNom || '').toLowerCase() === key);
          if (matched && matched.produitNom) {
            properName = matched.produitNom;
            break;
          }
        }
        allKnownProducts.set(key, {
          nom: properName,
          id: s.id,
          categorie: s.categorie || 'Plats',
          prix: s.prix || (s.quantite > 0 ? Math.round(s.ca / s.quantite) : 0),
          quantite: s.quantite,
          chiffreAffaires: s.ca,
          commandesCount: s.count,
          pourcentage: 0,
          rang: 0,
          disponible: true
        });
      }
    }

    const list = Array.from(allKnownProducts.values());
    const commandees = list.filter(p => p.quantite > 0).sort((a, b) => {
      if (b.quantite !== a.quantite) return b.quantite - a.quantite;
      return b.chiffreAffaires - a.chiffreAffaires;
    });

    const nonCommandees = list.filter(p => p.quantite === 0).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

    const sortedAll = [...commandees, ...nonCommandees];
    const maxQte = commandees[0]?.quantite || 1;

    return sortedAll.map((item, idx) => ({
      ...item,
      rang: idx + 1,
      pourcentage: item.quantite > 0 ? Math.min(100, Math.max(12, Math.round((item.quantite / maxQte) * 100))) : 0
    }));
  }

  getTop5ProduitsCommandes(): TopProduitStat[] {
    if (this.dashboardData?.statsCommandes?.topProduits?.length) {
      return this.dashboardData.statsCommandes.topProduits;
    }
    return this.getAllProduitsClassement().slice(0, 5);
  }

  getTopProduitsCommandes(): TopProduitStat[] {
    return this.getTop5ProduitsCommandes();
  }

  getProduitsClassementFiltres(): TopProduitStat[] {
    let list = this.getAllProduitsClassement();

    if (this.filtreClassementMets === 'COMMANDES') {
      list = list.filter(p => p.quantite > 0);
    } else if (this.filtreClassementMets === 'NON_COMMANDES') {
      list = list.filter(p => p.quantite === 0);
    }

    if (this.rechercheMets && this.rechercheMets.trim().length > 0) {
      const q = this.rechercheMets.trim().toLowerCase();
      list = list.filter(p => 
        p.nom.toLowerCase().includes(q) || 
        (p.categorie && p.categorie.toLowerCase().includes(q))
      );
    }

    return list;
  }

  getCountMetsCommandes(): number {
    return this.getAllProduitsClassement().filter(p => p.quantite > 0).length;
  }

  getCountMetsNonCommandes(): number {
    return this.getAllProduitsClassement().filter(p => p.quantite === 0).length;
  }

  getCommandesRecentes(): CommandeDto[] {
    if (this.dashboardData?.statsCommandes?.recentesCommandes?.length) {
      return this.dashboardData.statsCommandes.recentesCommandes;
    }
    const monthCmds = this.getCommandesForCurrentMonth();
    return [...monthCmds]
      .sort((a, b) => (new Date(b.createdAt || b.dateRemise || 0).getTime()) - (new Date(a.createdAt || a.dateRemise || 0).getTime()))
      .slice(0, 5);
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 3 : SYNTHÈSE GLOBALE & STATS CUMULÉES
  // ═══════════════════════════════════════════════════════════

  get syntheseDemandesPct(): number {
    if (this.dashboardData?.statsSynthese) {
      return this.dashboardData.statsSynthese.syntheseDemandesPct;
    }
    const sum = (this.statsDemandes.total || 0) + (this.statsCommandes.total || 0);
    return sum > 0 ? Math.round((this.statsDemandes.total / sum) * 100) : 50;
  }

  get syntheseCommandesPct(): number {
    if (this.dashboardData?.statsSynthese) {
      return this.dashboardData.statsSynthese.syntheseCommandesPct;
    }
    const sum = (this.statsDemandes.total || 0) + (this.statsCommandes.total || 0);
    return sum > 0 ? Math.round((this.statsCommandes.total / sum) * 100) : 50;
  }

  get caGlobalTotal(): number {
    if (this.dashboardData?.statsSynthese) {
      return this.dashboardData.statsSynthese.caGlobalTotal;
    }
    return (this.statsDemandes.caPrevisionnel || 0) + (this.statsCommandes.totalVentes || 0);
  }

  get volumeActiviteGlobal(): number {
    if (this.dashboardData?.statsSynthese) {
      return this.dashboardData.statsSynthese.volumeActiviteGlobal;
    }
    return (this.statsDemandes.total || 0) + (this.statsCommandes.total || 0);
  }

  // Verdict de l'équilibre des activités
  get equilibreVerdict(): { titre: string; description: string; icone: string; classe: string } {
    if (this.dashboardData?.statsSynthese?.equilibreVerdict) {
      return this.dashboardData.statsSynthese.equilibreVerdict;
    }
    const dPct = this.syntheseDemandesPct;
    if (dPct >= 40 && dPct <= 60) {
      return {
        titre: 'Activités Parfaitement Équilibrées',
        description: 'Harmonie optimale entre le pôle Traiteur/Événements et les Ventes Directes.',
        icone: 'fa-scale-balanced',
        classe: 'equilibre-parfait'
      };
    } else if (dPct > 60) {
      return {
        titre: 'Forte Dynamique Pôle Traiteur & Devis',
        description: `Le pôle Événements et Salle Diva génère ${dPct}% du flux commercial global.`,
        icone: 'fa-champagne-glasses',
        classe: 'equilibre-traiteur'
      };
    } else {
      return {
        titre: 'Forte Dynamique Vente Directe de Mets',
        description: `Le pôle Commandes en ligne représente ${this.syntheseCommandesPct}% des opérations.`,
        icone: 'fa-bag-shopping',
        classe: 'equilibre-commandes'
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 4 : CALENDRIER INTERACTIF DU MOIS
  // ═══════════════════════════════════════════════════════════

  genererCalendrier(): void {
    const days: CalendarDay[] = [];
    const year = this.currentYear;
    const month = this.currentMonthIndex;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Dimanche
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentActualMonth = today.getFullYear() === year && today.getMonth() === month;

    // Jours du mois précédent
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthDays - i,
        dateStr: '',
        isCurrentMonth: false,
        isToday: false,
        hasEvent: false,
        eventCount: 0,
        events: []
      });
    }

    // Jours du mois en cours
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dStr = `${year}-${(month + 1) < 10 ? '0' + (month + 1) : (month + 1)}-${d < 10 ? '0' + d : d}`;
      let dayEvents: any[] = [];
      if (this.dashboardData?.calendarEvents && this.dashboardData.calendarEvents.length > 0) {
        dayEvents = this.dashboardData.calendarEvents.filter(e => e.date === dStr);
      } else {
        dayEvents = this.requests.filter(r => r.date === dStr || (r.dateSubmitted && String(r.dateSubmitted).startsWith(dStr)));
      }
      
      days.push({
        dayNumber: d,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: isCurrentActualMonth && today.getDate() === d,
        hasEvent: dayEvents.length > 0,
        eventCount: dayEvents.length,
        events: dayEvents
      });
    }

    // Compléter la fin du mois
    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0);
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dayNumber: i,
        dateStr: '',
        isCurrentMonth: false,
        isToday: false,
        hasEvent: false,
        eventCount: 0,
        events: []
      });
    }

    this.calendarDays = days;
  }

  selectCalendarDay(day: CalendarDay): void {
    if (day.isCurrentMonth) {
      this.selectedCalendarDate = day;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 5 : COURBES SVG & GRAPHIQUES LISSÉS (MONOTONE SPLINE NON-NÉGATIF)
  // ═══════════════════════════════════════════════════════════

  getChartMonthList(): { label: string; datePrefix: string; isCurrentMonth: boolean; monthIndex: number }[] {
    const res = [];
    const monthsNames = ['JAN.', 'FÉV.', 'MAR.', 'AVR.', 'MAI', 'JUIN', 'JUIL.', 'AOÛT', 'SEP.', 'OCT.', 'NOV.', 'DÉC.'];
    const y = this.currentYear;
    for (let m = 0; m < 12; m++) {
      const mStr = (m + 1) < 10 ? `0${m + 1}` : `${m + 1}`;
      res.push({
        label: monthsNames[m],
        datePrefix: `${y}-${mStr}`,
        isCurrentMonth: m === this.currentMonthIndex,
        monthIndex: m
      });
    }
    return res;
  }

  getDemandesChartData(): number[] {
    if (this.selectedDemandesFilter === 'Toutes' && this.dashboardData?.charts?.demandesParMois?.length === 12) {
      return this.dashboardData.charts.demandesParMois;
    }
    const monthList = this.getChartMonthList();
    const data = [];
    for (const m of monthList) {
      const monthReqs = this.requests.filter(r => (r.dateSubmitted || r.date || '').startsWith(m.datePrefix));
      let count = 0;
      if (this.selectedDemandesFilter === 'Toutes') {
        count = monthReqs.length;
      } else {
        const filterMap: { [key: string]: string } = {
          'Salle La Diva': 'salle-diva',
          'La Diva': 'salle-diva',
          'Restauration Entreprise': 'restauration-entreprise',
          'Traiteur': 'restauration-entreprise',
          'Événements': 'evenementiel',
          'Food Truck': 'foodtruck'
        };
        const mappedCat = filterMap[this.selectedDemandesFilter] || 'salle-diva';
        count = monthReqs.filter(r => this.isPrestationMatch(r, mappedCat)).length;
      }
      data.push(count);
    }
    return data;
  }

  getCommandesChartData(): number[] {
    if (this.selectedCommandesMetric === 'CA' && this.dashboardData?.charts?.caCommandesParMois?.length === 12) {
      return this.dashboardData.charts.caCommandesParMois;
    }
    if (this.selectedCommandesMetric === 'VOLUME' && this.dashboardData?.charts?.commandesParMois?.length === 12) {
      return this.dashboardData.charts.commandesParMois;
    }
    const monthList = this.getChartMonthList();
    const data = [];
    for (const m of monthList) {
      const monthCmds = this.commandes.filter(c => (c.createdAt || c.dateRemise || '').startsWith(m.datePrefix));
      if (this.selectedCommandesMetric === 'CA') {
        const sum = monthCmds.reduce((acc, c) => acc + (c.montantTotal || 0), 0);
        data.push(sum);
      } else {
        data.push(monthCmds.length);
      }
    }
    return data;
  }

  /**
   * Générateur de courbe lisse Fritsch-Carlson Monotone Spline :
   * - STRICTEMENT NON-NÉGATIF : ne descend JAMAIS sous l'axe d'abscisse (baselineY).
   * - Monotonie préservée : aucune oscillation sous 0 ni dépassement au-dessus des pics.
   */
  getSmoothBezierPath(values: number[], height: number = 140, startY: number = 30, isCurrency: boolean = false, customMax?: number): ChartCurveResult {
    const rawMax = Math.max(...values, 0);
    let maxVal = customMax || (rawMax <= 0 ? 5 : (rawMax < 5 ? 5 : (Math.ceil(rawMax / 5) * 5)));
    if (isCurrency && !customMax) {
      maxVal = rawMax <= 0 ? 100000 : (Math.ceil(rawMax / 50000) * 50000);
    }
    
    const baselineY = startY + height;
    const topY = startY;
    const monthList = this.getChartMonthList();
    const n = values.length;

    // 1. Calcul des points de données
    const pts = values.map((val, i) => {
      const safeVal = Math.max(0, val || 0);
      const ratio = maxVal > 0 ? safeVal / maxVal : 0;
      const y = baselineY - (Math.min(1, Math.max(0, ratio)) * height);
      const x = 45 + (i * 59);
      
      let displayVal = safeVal.toString();
      if (isCurrency) {
        displayVal = this.formatSommeAbregee(safeVal);
      } else if (safeVal >= 1000) {
        displayVal = this.formatNombreAbrege(safeVal);
      }

      return {
        x,
        y: Math.min(baselineY, Math.max(topY, y)),
        val: safeVal,
        displayVal,
        label: monthList[i] ? monthList[i].label : '',
        isCurrentMonth: monthList[i] ? monthList[i].isCurrentMonth : false,
        isLast: i === n - 1
      };
    });

    if (pts.length < 2) {
      return { path: '', areaPath: '', points: pts };
    }

    // 2. Calcul des pentes Fritsch-Carlson
    const deltas: number[] = [];
    const dxs: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x;
      const dy = pts[i + 1].y - pts[i].y;
      dxs.push(dx);
      deltas.push(dy / dx);
    }

    const m: number[] = new Array(n).fill(0);
    m[0] = deltas[0];
    m[n - 1] = deltas[n - 2];

    for (let i = 1; i < n - 1; i++) {
      if (deltas[i - 1] * deltas[i] <= 0) {
        m[i] = 0;
      } else {
        m[i] = (deltas[i - 1] + deltas[i]) / 2;
      }
    }

    for (let i = 0; i < n - 1; i++) {
      if (Math.abs(deltas[i]) < 1e-6) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        const alpha = m[i] / deltas[i];
        const beta = m[i + 1] / deltas[i];
        const dist = alpha * alpha + beta * beta;
        if (dist > 9) {
          const tau = 3 / Math.sqrt(dist);
          m[i] = tau * alpha * deltas[i];
          m[i + 1] = tau * beta * deltas[i];
        }
      }
    }

    for (let i = 0; i < n; i++) {
      if (pts[i].val === 0) {
        if (i === 0 && pts[1].val === 0) m[i] = 0;
        else if (i === n - 1 && pts[n - 2].val === 0) m[i] = 0;
        else if (i > 0 && i < n - 1 && (pts[i - 1].val === 0 || pts[i + 1].val === 0)) m[i] = 0;
      }
    }

    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < n - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const dx = dxs[i];

      let cp1x = p1.x + dx / 3;
      let cp1y = p1.y + (m[i] * dx) / 3;

      let cp2x = p2.x - dx / 3;
      let cp2y = p2.y - (m[i + 1] * dx) / 3;

      if (p1.val === 0 && p2.val === 0) {
        cp1y = baselineY;
        cp2y = baselineY;
      } else {
        cp1y = Math.min(baselineY, Math.max(topY, cp1y));
        cp2y = Math.min(baselineY, Math.max(topY, cp2y));
      }

      path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }

    const areaPath = `${path} L ${pts[pts.length - 1].x.toFixed(2)},${baselineY} L ${pts[0].x.toFixed(2)},${baselineY} Z`;

    return { path, areaPath, points: pts };
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 5 : GRAPHES EN BARRES / HISTOGRAMMES MODERNES (12 MOIS DE L'ANNÉE)
  // ═══════════════════════════════════════════════════════════

  getDemandesBarData(): { bars: any[]; maxVal: number } {
    const values = this.getDemandesChartData();
    const monthList = this.getChartMonthList();
    const rawMax = Math.max(...values, 0);
    const maxVal = rawMax <= 0 ? 5 : (rawMax < 5 ? 5 : Math.ceil(rawMax / 5) * 5);
    const baselineY = 170;
    const maxHeight = 135;
    const width = 6;
    const trackWidth = 14;

    const bars = values.map((val, i) => {
      const safeVal = Math.max(0, val || 0);
      const ratio = maxVal > 0 ? safeVal / maxVal : 0;
      const barHeight = safeVal > 0 ? Math.max(8, ratio * maxHeight) : 3;
      const y = baselineY - barHeight;
      const center = 45 + (i * 59);
      const x = center - width / 2;
      const trackX = center - trackWidth / 2;
      return {
        monthLabel: monthList[i] ? monthList[i].label : '',
        val: safeVal,
        displayVal: this.formatNombreAbrege(safeVal),
        height: barHeight,
        y,
        x,
        trackX,
        width,
        trackWidth,
        center,
        isCurrentMonth: monthList[i] ? monthList[i].isCurrentMonth : false,
        isLast: i === values.length - 1
      };
    });

    return { bars, maxVal };
  }

  getCommandesBarData(): { bars: any[]; maxVal: number; isCurrency: boolean } {
    const values = this.getCommandesChartData();
    const monthList = this.getChartMonthList();
    const isCurrency = this.selectedCommandesMetric === 'CA';
    const rawMax = Math.max(...values, 0);
    const maxVal = isCurrency
      ? (rawMax <= 0 ? 100000 : Math.ceil(rawMax / 50000) * 50000)
      : (rawMax <= 0 ? 5 : (rawMax < 5 ? 5 : Math.ceil(rawMax / 5) * 5));
    const baselineY = 170;
    const maxHeight = 135;
    const width = 10;
    const trackWidth = 18;

    const bars = values.map((val, i) => {
      const safeVal = Math.max(0, val || 0);
      const ratio = maxVal > 0 ? safeVal / maxVal : 0;
      const barHeight = safeVal > 0 ? Math.max(8, ratio * maxHeight) : 3;
      const y = baselineY - barHeight;
      const center = 45 + (i * 59);
      const x = center - width / 2;
      const trackX = center - trackWidth / 2;
      const displayVal = isCurrency ? this.formatSommeAbregee(safeVal) : this.formatNombreAbrege(safeVal);
      return {
        monthLabel: monthList[i] ? monthList[i].label : '',
        val: safeVal,
        displayVal,
        height: barHeight,
        y,
        x,
        trackX,
        width,
        trackWidth,
        center,
        isCurrentMonth: monthList[i] ? monthList[i].isCurrentMonth : false,
        isLast: i === values.length - 1
      };
    });

    return { bars, maxVal, isCurrency };
  }

  getSyntheseDualBarData(): { groups: any[]; chartMax: number; isCurrency: boolean } {
    const monthList = this.getChartMonthList();
    const isCurrency = this.selectedSyntheseMetric === 'CA';
    
    let demandesData: number[] = [];
    let commandesData: number[] = [];

    if (isCurrency) {
      if (this.dashboardData?.charts?.caDemandesParMois?.length === 12 && this.dashboardData?.charts?.caCommandesParMois?.length === 12) {
        demandesData = this.dashboardData.charts.caDemandesParMois;
        commandesData = this.dashboardData.charts.caCommandesParMois;
      } else {
        demandesData = monthList.map(m => {
          const reqs = this.requests.filter(r => (r.dateSubmitted || r.date || '').startsWith(m.datePrefix));
          return reqs.reduce((acc, r) => {
            const g = r.guests || 20;
            const basePrice = r.prestationId === 'salle-diva' ? 350000 : (g * 15000);
            return acc + (['abouti', 'confirmed', 'devis_confirme'].includes((r.status || '').toLowerCase()) ? basePrice : 0);
          }, 0);
        });

        commandesData = monthList.map(m => {
          const cmds = this.commandes.filter(c => (c.createdAt || c.dateRemise || '').startsWith(m.datePrefix));
          return cmds.reduce((acc, c) => acc + (c.montantTotal || 0), 0);
        });
      }
    } else {
      if (this.dashboardData?.charts?.demandesParMois?.length === 12 && this.dashboardData?.charts?.commandesParMois?.length === 12) {
        demandesData = this.dashboardData.charts.demandesParMois;
        commandesData = this.dashboardData.charts.commandesParMois;
      } else {
        demandesData = this.getDemandesChartData();
        commandesData = monthList.map(m => 
          this.commandes.filter(c => (c.createdAt || c.dateRemise || '').startsWith(m.datePrefix)).length
        );
      }
    }

    const maxVal = Math.max(...demandesData, ...commandesData, 5);
    const chartMax = isCurrency 
      ? (maxVal <= 0 ? 100000 : Math.ceil(maxVal / 50000) * 50000)
      : (maxVal < 5 ? 5 : Math.ceil(maxVal / 5) * 5);

    const baselineY = 170;
    const maxHeight = 135;
    const barW = 6;
    const trackWidth = 20;

    const groups = monthList.map((m, i) => {
      const dVal = Math.max(0, demandesData[i] || 0);
      const cVal = Math.max(0, commandesData[i] || 0);

      const dRatio = chartMax > 0 ? dVal / chartMax : 0;
      const cRatio = chartMax > 0 ? cVal / chartMax : 0;

      const dHeight = dVal > 0 ? Math.max(6, dRatio * maxHeight) : 3;
      const cHeight = cVal > 0 ? Math.max(6, cRatio * maxHeight) : 3;
      const center = 45 + (i * 59);

      return {
        monthLabel: m.label,
        center,
        trackX: center - trackWidth / 2,
        trackWidth,
        isCurrentMonth: m.isCurrentMonth,
        demande: {
          x: center - barW - 1.5,
          y: baselineY - dHeight,
          width: barW,
          height: dHeight,
          val: dVal,
          displayVal: isCurrency ? this.formatSommeAbregee(dVal) : this.formatNombreAbrege(dVal)
        },
        commande: {
          x: center + 1.5,
          y: baselineY - cHeight,
          width: barW,
          height: cHeight,
          val: cVal,
          displayVal: isCurrency ? this.formatSommeAbregee(cVal) : this.formatNombreAbrege(cVal)
        }
      };
    });

    return { groups, chartMax, isCurrency };
  }
}

