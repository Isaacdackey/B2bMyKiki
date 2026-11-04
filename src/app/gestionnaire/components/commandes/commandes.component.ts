import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GestionnaireApiService, CommandeDto } from '../../../services/gestionnaire-api.service';
import { KikiDataService } from '../../../services/kiki-data.service';
import { AdminPersonnelService, AdminUserResponse } from '../../services/admin-personnel.service';
import { CommandeStoreService, LivreurAssigne, InfoDisponibiliteLivreur } from '../../../services/commande-store.service';

interface FiltreStatut {
  valeur: string;
  libelle: string;
  icone: string;
  couleur: string;
  bgCouleur: string;
}

@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commandes.component.html',
  styleUrl: './commandes.component.css'
})
export class CommandesComponent implements OnInit {

  commandes: CommandeDto[] = [];
  toutesCommandes: CommandeDto[] = [];
  compteurs: Record<string, number> = {};
  chargement = false;

  // Recherche & Filtres
  rechercheTexte = '';
  filtreStatut = 'TOUTES';

  // Filtre par Date pour les statistiques et la liste (Par défaut : Jour J)
  periodeDate = 'AUJOURDHUI'; // 'AUJOURDHUI' | '7_JOURS' | 'CE_MOIS' | 'TOUTES' | 'PERSONNALISE'
  dateDebut = '';
  dateFin = '';
  libellePeriodeActive = 'Aujourd\'hui';

  // Pagination
  page = 1;
  taillePage = 20;
  totalElements = 0;
  totalPages = 1;

  /** Ordre du parcours métier avec couleurs vives */
  readonly filtres: FiltreStatut[] = [
    { valeur: 'TOUTES',     libelle: 'Toutes',        icone: 'fa-list',          couleur: '#1E293B', bgCouleur: '#F1F5F9' },
    { valeur: 'EN_ATTENTE', libelle: 'En attente',    icone: 'fa-clock',         couleur: '#B45309', bgCouleur: '#FEF3C7' },
    { valeur: 'ACCEPTEE',   libelle: 'Acceptées',     icone: 'fa-check',         couleur: '#1D4ED8', bgCouleur: '#DBEAFE' },
    { valeur: 'EN_COURS',   libelle: 'En préparation', icone: 'fa-fire-burner',  couleur: '#6D28D9', bgCouleur: '#EDE9FE' },
    { valeur: 'PRETE',      libelle: 'Prêtes',        icone: 'fa-box-open',      couleur: '#15803D', bgCouleur: '#DCFCE7' },
    { valeur: 'TERMINEE',   libelle: 'Terminées',     icone: 'fa-check-double',  couleur: '#047857', bgCouleur: '#D1FAE5' },
    { valeur: 'ANNULEE',    libelle: 'Annulées',      icone: 'fa-ban',           couleur: '#B91C1C', bgCouleur: '#FEE2E2' }
  ];

  // Statistiques KPI (Style Image 4 avec Couleurs Vives)
  statsCommandesPeriode = 0;
  statsTotalVentes = 0;
  statsSoldeEncaisse = 0;
  statsSoldeRestant = 0;

  // Détail
  commandeDetail: CommandeDto | null = null;

  // Modale Panier (Mets et Quantités)
  modalePanierOuverte = false;
  commandePourPanier: CommandeDto | null = null;

  // Confirmation de changement de statut
  confirmationOuverte = false;
  commandeCible: CommandeDto | null = null;
  statutCible = '';
  motifAnnulation = '';
  fraisLivraisonSaisie = 0;
  enCoursDeTraitement = false;

  // Édition des frais de livraison depuis la fiche détail
  editionFraisLivraison = false;
  fraisLivraisonDetail = 0;

  // Attribution / Assignation d'un livreur / chauffeur
  personnels: AdminUserResponse[] = [];
  chauffeurs: AdminUserResponse[] = [];
  modaleLivreurOuverte = false;
  commandePourLivreur: CommandeDto | null = null;
  chauffeurSelectionneId: number | null = null;
  instructionsLivraison = '';

  constructor(
    private api: GestionnaireApiService,
    private store: CommandeStoreService,
    private personnelService: AdminPersonnelService,
    private dataService: KikiDataService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initialiserDates();
    this.charger();
    this.chargerPersonnels();
    this.checkQueryParams();

    // Écouter les mises à jour du store en temps réel
    this.store.commandes$.subscribe(liste => {
      this.toutesCommandes = liste || [];
      this.appliquerFiltresLocaux();
      this.calculerStats();
      this.checkQueryParams();
      this.cdr.detectChanges();
    });
  }

  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      const cId = params['commandeId'] || params['id'] || params['numero'];
      if (cId && this.toutesCommandes.length > 0) {
        const match = this.toutesCommandes.find(c => c.id?.toString() === cId.toString() || c.numero === cId);
        if (match) {
          this.ouvrirDetail(match);
        }
      }
    });
  }

  private initialiserDates(): void {
    this.dateDebut = '';
    this.dateFin = '';
    this.periodeDate = 'TOUTES';
    this.libellePeriodeActive = 'Toutes les dates';
  }

  charger(): void {
    this.chargement = true;
    this.api.getCommandes(this.filtreStatut, undefined, this.page - 1, this.taillePage)
      .subscribe({
        next: (res) => {
          if (res && Array.isArray(res.content)) {
            this.toutesCommandes = res.content;
            this.store.synchroniserListeDepuisBackend(res.content);
          } else {
            this.toutesCommandes = this.store.getCommandes();
          }
          this.totalElements = res?.totalElements || this.toutesCommandes.length;
          this.totalPages = Math.max(1, res?.totalPages || Math.ceil(this.totalElements / this.taillePage));
          this.appliquerFiltresLocaux();
          this.calculerStats();
          this.actualiserCompteurs();
          this.chargement = false;
          this.checkQueryParams();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur chargement commandes', err);
          this.toutesCommandes = this.store.getCommandes();
          this.appliquerFiltresLocaux();
          this.calculerStats();
          this.actualiserCompteurs();
          this.chargement = false;
          this.checkQueryParams();
          this.cdr.detectChanges();
        }
      });
  }

  // ══════════════════════════════════════════════════════
  // GESTION DU FILTRE PAR DATE
  // ══════════════════════════════════════════════════════

  selectionnerPeriodeDate(periode: string): void {
    this.periodeDate = periode;
    const ajd = new Date();
    const strAjd = ajd.toISOString().slice(0, 10);

    if (periode === 'AUJOURDHUI') {
      this.dateDebut = strAjd;
      this.dateFin = strAjd;
      this.libellePeriodeActive = 'Aujourd\'hui';
    } else if (periode === '7_JOURS') {
      const d = new Date(ajd.getTime() - 7 * 24 * 3600 * 1000);
      this.dateDebut = d.toISOString().slice(0, 10);
      this.dateFin = strAjd;
      this.libellePeriodeActive = '7 derniers jours';
    } else if (periode === 'CE_MOIS') {
      const premier = new Date(ajd.getFullYear(), ajd.getMonth(), 1);
      this.dateDebut = premier.toISOString().slice(0, 10);
      this.dateFin = strAjd;
      this.libellePeriodeActive = 'Ce mois-ci';
    } else if (periode === 'TOUTES') {
      this.dateDebut = '';
      this.dateFin = '';
      this.libellePeriodeActive = 'Toutes les dates';
    } else if (periode === 'PERSONNALISE') {
      this.libellePeriodeActive = `Du ${this.dateDebut || '...'} au ${this.dateFin || '...'}`;
    }

    this.appliquerFiltresLocaux();
    this.calculerStats();
  }

  appliquerPeriodePersonnalisee(): void {
    if (!this.dateDebut || !this.dateFin) return;
    this.periodeDate = 'PERSONNALISE';
    this.libellePeriodeActive = `Du ${this.dateDebut} au ${this.dateFin}`;
    this.appliquerFiltresLocaux();
    this.calculerStats();
  }

  private estDansPeriode(dateStr: string): boolean {
    if (this.periodeDate === 'TOUTES' || (!this.dateDebut && !this.dateFin)) return true;
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    if (this.dateDebut && d < this.dateDebut) return false;
    if (this.dateFin && d > this.dateFin) return false;
    return true;
  }

  // ══════════════════════════════════════════════════════
  // CALCUL DES STATISTIQUES KPI DYNAMIQUES
  // ══════════════════════════════════════════════════════

  calculerStats(): void {
    const liste = this.toutesCommandes.filter(c => this.estDansPeriode(c.createdAt || c.dateRemise));

    this.statsCommandesPeriode = liste.length;
    this.statsTotalVentes = liste
      .filter(c => c.statut !== 'ANNULEE')
      .reduce((sum, c) => sum + (c.montantTotal || 0), 0);

    this.statsSoldeEncaisse = this.statsTotalVentes;
    this.statsSoldeRestant = 0;
  }

  actualiserCompteurs(): void {
    const base = this.toutesCommandes.filter(c => this.estDansPeriode(c.createdAt || c.dateRemise));
    this.compteurs = {
      TOUTES: base.length,
      EN_ATTENTE: base.filter(c => c.statut === 'EN_ATTENTE').length,
      ACCEPTEE: base.filter(c => c.statut === 'ACCEPTEE').length,
      EN_COURS: base.filter(c => c.statut === 'EN_COURS').length,
      PRETE: base.filter(c => c.statut === 'PRETE').length,
      TERMINEE: base.filter(c => c.statut === 'TERMINEE').length,
      ANNULEE: base.filter(c => c.statut === 'ANNULEE').length
    };
  }

  appliquerFiltresLocaux(): void {
    let res = [...this.toutesCommandes];

    // Filtre par date
    res = res.filter(c => this.estDansPeriode(c.createdAt || c.dateRemise));

    // Filtre par statut
    if (this.filtreStatut !== 'TOUTES') {
      res = res.filter(c => c.statut === this.filtreStatut);
    }

    // Filtre par recherche texte
    if (this.rechercheTexte.trim()) {
      const q = this.rechercheTexte.toLowerCase().trim();
      res = res.filter(c =>
        c.numero.toLowerCase().includes(q) ||
        (c.clientNom && c.clientNom.toLowerCase().includes(q)) ||
        (c.clientTelephone && c.clientTelephone.includes(q)) ||
        (c.adresseLivraison && c.adresseLivraison.toLowerCase().includes(q)) ||
        (c.lignes && c.lignes.some(l => l.produitNom.toLowerCase().includes(q)))
      );
    }

    this.totalElements = res.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.taillePage));

    const start = (this.page - 1) * this.taillePage;
    this.commandes = res.slice(start, start + this.taillePage);
    this.actualiserCompteurs();
  }

  // ══════════════════════════════════════════════════════
  // GESTION DU PERSONNEL & LIVREURS
  // ══════════════════════════════════════════════════════

  chargerPersonnels(): void {
    this.personnelService.getAllStaff(0, 150).subscribe({
      next: (res) => {
        this.personnels = res?.content || [];
        this.filtrerChauffeurs();
      },
      error: () => {
        this.personnels = [
          { id: 1, username: 'amadou.diallo', fullName: 'Amadou Diallo', role: 'CHAUFFEUR', poste: 'Chauffeur', departement: 'Chauffeur', customLoginSlug: 'amadou', active: true, tempPasswordChangeRequired: false, createdAt: '', lastLoginAt: '' },
          { id: 2, username: 'ibrahima.ndiaye', fullName: 'Ibrahima Ndiaye', role: 'CHAUFFEUR', poste: 'Chauffeur', departement: 'Chauffeur', customLoginSlug: 'ibrahima', active: true, tempPasswordChangeRequired: false, createdAt: '', lastLoginAt: '' },
          { id: 3, username: 'moussa.fall', fullName: 'Moussa Fall', role: 'CHAUFFEUR', poste: 'Chauffeur', departement: 'Chauffeur', customLoginSlug: 'moussa', active: true, tempPasswordChangeRequired: false, createdAt: '', lastLoginAt: '' }
        ];
        this.filtrerChauffeurs();
      }
    });
  }

  private filtrerChauffeurs(): void {
    this.chauffeurs = this.personnels.filter(p => {
      const r = (p.role || '').toUpperCase();
      const poste = (p.poste || '').toUpperCase();
      const dep = (p.departement || '').toUpperCase();
      return r.includes('CHAUFFEUR') || r.includes('LIVREUR') ||
             poste.includes('CHAUFFEUR') || poste.includes('LIVREUR') || poste === 'CH' ||
             dep.includes('CHAUFFEUR') || dep.includes('LIVREUR') || dep === 'CH';
    });

    if (this.chauffeurs.length === 0) {
      this.chauffeurs = this.personnels;
    }
  }

  getLivreur(commandeId: number): LivreurAssigne | null {
    return this.store.getLivreur(commandeId);
  }

  getDisponibiliteChauffeur(chauffeurId: number): InfoDisponibiliteLivreur {
    return this.store.getDisponibiliteLivreur(chauffeurId, this.toutesCommandes);
  }

  ouvrirAssignationLivreur(c: CommandeDto, event?: Event): void {
    if (event) event.stopPropagation();
    if (c.statut !== 'PRETE' && !this.getLivreur(c.id)) {
      this.dataService.showToast('L\'assignation d\'un livreur n\'est possible que lorsque la commande est prête.', true);
      return;
    }
    this.commandePourLivreur = c;
    const existant = this.getLivreur(c.id);
    this.chauffeurSelectionneId = existant ? existant.chauffeurId : (this.chauffeurs[0]?.id || null);
    this.instructionsLivraison = existant?.instructions || '';
    this.modaleLivreurOuverte = true;
  }

  fermerAssignationLivreur(): void {
    this.modaleLivreurOuverte = false;
    this.commandePourLivreur = null;
  }

  confirmerAssignationLivreur(): void {
    if (!this.commandePourLivreur || !this.chauffeurSelectionneId) return;
    const ch = this.personnels.find(p => p.id === this.chauffeurSelectionneId);
    if (!ch) return;

    const liv: LivreurAssigne = {
      chauffeurId: ch.id,
      chauffeurNom: ch.fullName || ch.username,
      chauffeurRole: ch._roleLabel || ch.role || 'Livreur',
      telephone: ch.telephone || ch.phone || '',
      dateAssignation: new Date().toISOString(),
      instructions: this.instructionsLivraison.trim() || undefined
    };

    const cmdId = this.commandePourLivreur.id;
    const cmdNum = this.commandePourLivreur.numero;

    this.api.assignerLivreur(cmdId, this.chauffeurSelectionneId, this.instructionsLivraison).subscribe({
      next: (maj) => {
        this.store.assignerLivreur(cmdId, liv);
        if (maj) this.store.synchroniserCommandeDepuisBackend(maj);
        this.dataService.showToast(`Livreur ${liv.chauffeurNom} assigné à la commande ${cmdNum}`);
        this.fermerAssignationLivreur();
        this.appliquerFiltresLocaux();
        this.cdr.detectChanges();
      },
      error: () => {
        this.store.assignerLivreur(cmdId, liv);
        this.dataService.showToast(`Livreur ${liv.chauffeurNom} assigné à la commande ${cmdNum}`);
        this.fermerAssignationLivreur();
        this.appliquerFiltresLocaux();
        this.cdr.detectChanges();
      }
    });
  }

  retirerLivreur(commandeId: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.api.assignerLivreur(commandeId, null).subscribe({
      next: (maj) => {
        this.store.retirerLivreur(commandeId);
        if (maj) this.store.synchroniserCommandeDepuisBackend(maj);
        this.dataService.showToast('Livreur retiré de la commande');
        this.appliquerFiltresLocaux();
        this.cdr.detectChanges();
      },
      error: () => {
        this.store.retirerLivreur(commandeId);
        this.dataService.showToast('Livreur retiré de la commande');
        this.appliquerFiltresLocaux();
        this.cdr.detectChanges();
      }
    });
  }

  // ══════════════════════════════════════════════════════
  // GESTION DES STATUTS DE COMMANDE
  // ══════════════════════════════════════════════════════

  demanderChangement(c: CommandeDto, statutCible: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.commandeCible = c;
    this.statutCible = statutCible;
    this.motifAnnulation = '';
    this.fraisLivraisonSaisie = c.fraisLivraison || 0;
    this.confirmationOuverte = true;
  }

  fermerConfirmation(): void {
    this.confirmationOuverte = false;
    this.commandeCible = null;
    this.statutCible = '';
  }

  confirmerChangement(): void {
    if (!this.commandeCible || !this.statutCible) return;

    this.enCoursDeTraitement = true;
    const frais = (this.commandeCible.modeRemise === 'LIVRAISON' && this.statutCible === 'ACCEPTEE')
      ? this.fraisLivraisonSaisie
      : undefined;

    this.api.changerStatutCommande(this.commandeCible.id, this.statutCible, this.motifAnnulation || undefined, frais)
      .subscribe({
        next: (miseAJour) => {
          this.dataService.showToast(`Commande ${miseAJour.numero} passée à l'état "${miseAJour.statutLibelle}"`);
          this.enCoursDeTraitement = false;
          this.fermerConfirmation();
          this.appliquerFiltresLocaux();
          this.calculerStats();
          this.cdr.detectChanges();
        },
        error: () => {
          this.enCoursDeTraitement = false;
          this.fermerConfirmation();
          this.appliquerFiltresLocaux();
          this.calculerStats();
          this.cdr.detectChanges();
        }
      });
  }

  // ══════════════════════════════════════════════════════
  // DÉTAIL D'UNE COMMANDE
  // ══════════════════════════════════════════════════════

  ouvrirDetail(c: CommandeDto): void {
    const lignesInitiales = (c.lignes && c.lignes.length > 0) ? c.lignes : (this.store.getCommandeById(c.id)?.lignes || []);
    this.commandeDetail = { ...c, lignes: lignesInitiales };
    this.editionFraisLivraison = false;
    this.fraisLivraisonDetail = c.fraisLivraison || 0;
    this.cdr.detectChanges();

    this.api.getCommande(c.id).subscribe({
      next: (full) => {
        if (full) {
          const lignes = (full.lignes && full.lignes.length > 0) 
            ? full.lignes 
            : (lignesInitiales.length > 0 ? lignesInitiales : (this.store.getCommandeById(c.id)?.lignes || []));
          this.commandeDetail = { ...c, ...full, lignes };
          this.fraisLivraisonDetail = full.fraisLivraison || c.fraisLivraison || 0;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
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

  fermerDetail(): void {
    this.commandeDetail = null;
    this.editionFraisLivraison = false;
  }

  ouvrirModalePanier(c: CommandeDto | null, event?: Event): void {
    if (event) event.stopPropagation();
    if (!c) return;
    this.commandePourPanier = c;
    this.modalePanierOuverte = true;
    this.cdr.detectChanges();

    if (!c.lignes || c.lignes.length === 0) {
      this.api.getCommande(c.id).subscribe({
        next: (full) => {
          if (full && full.lignes && full.lignes.length > 0) {
            this.commandePourPanier = { ...c, ...full };
            if (this.commandeDetail && this.commandeDetail.id === c.id) {
              this.commandeDetail.lignes = full.lignes;
            }
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.cdr.detectChanges();
        }
      });
    }
  }

  fermerModalePanier(): void {
    this.modalePanierOuverte = false;
    this.commandePourPanier = null;
    this.cdr.detectChanges();
  }

  enregistrerFraisLivraisonDetail(): void {
    if (!this.commandeDetail) return;
    const cmd = this.commandeDetail;
    this.api.definirFraisLivraison(cmd.id, this.fraisLivraisonDetail)
      .subscribe({
        next: (maj) => {
          this.commandeDetail = maj;
          this.editionFraisLivraison = false;
          this.dataService.showToast('Frais de livraison mis à jour');
          this.appliquerFiltresLocaux();
          this.calculerStats();
        },
        error: () => {
          this.store.mettreAJourFraisLivraison(cmd.id, this.fraisLivraisonDetail);
          if (this.commandeDetail) {
            this.commandeDetail.fraisLivraison = this.fraisLivraisonDetail;
            this.commandeDetail.montantTotal = (this.commandeDetail.montantProduits || 0) + this.fraisLivraisonDetail;
          }
          this.editionFraisLivraison = false;
          this.dataService.showToast('Frais de livraison enregistrés');
          this.appliquerFiltresLocaux();
          this.calculerStats();
        }
      });
  }

  // ══════════════════════════════════════════════════════
  // HELPERS & PAGINATION
  // ══════════════════════════════════════════════════════

  selectionnerFiltre(valeur: string): void {
    this.filtreStatut = valeur;
    this.page = 1;
    this.appliquerFiltresLocaux();
  }

  getModePaiementLogo(mode: string | undefined): string {
    const m = (mode || '').toUpperCase();
    if (m === 'WAVE') {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZaeFi3xAkC86Ui29AojMASpYfFMPLDzf-1hTcDVS-0Q&s=10';
    }
    if (m === 'ORANGE_MONEY') {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkuwenMWEMEqLrjTBw59HU3cAqXn5JcznidoH8agbSKg&s=10';
    }
    if (m === 'CARTE_BANCAIRE') {
      return 'https://cdn-icons-png.flaticon.com/512/633/633611.png';
    }
    return 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png';
  }

  getModePaiementLibelle(mode: string | undefined): string {
    const m = (mode || '').toUpperCase();
    switch (m) {
      case 'WAVE': return 'Wave';
      case 'ORANGE_MONEY': return 'Orange Money';
      case 'CARTE_BANCAIRE': return 'Carte bancaire';
      case 'ESPECES':
      case 'ESPECES_A_LA_LIVRAISON':
      case 'ESPECES_AU_RETRAIT':
        return 'En espèces';
      default: return mode || 'En espèces';
    }
  }

  compteur(statut: string): number {
    return this.compteurs[statut] || 0;
  }

  changerPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.appliquerFiltresLocaux();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getDebut(): number {
    return this.totalElements === 0 ? 0 : (this.page - 1) * this.taillePage + 1;
  }

  getFin(): number {
    return Math.min(this.page * this.taillePage, this.totalElements);
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

  estUrgente(c: CommandeDto): boolean {
    if (c.statut === 'TERMINEE' || c.statut === 'ANNULEE' || c.statut === 'PRETE') return false;
    if (!c.dateRemise) return false;
    const fin = new Date(c.dateRemise).getTime();
    const diffHeures = (fin - Date.now()) / (3600 * 1000);
    return diffHeures <= (c.delaiPreparationHeures || 2);
  }

  classeStatut(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'st-attente';
      case 'ACCEPTEE':   return 'st-acceptee';
      case 'EN_COURS':   return 'st-cours';
      case 'PRETE':      return 'st-prete';
      case 'TERMINEE':   return 'st-terminee';
      case 'ANNULEE':    return 'st-annulee';
      default:           return 'st-attente';
    }
  }

  libelleStatutCible(statut: string): string {
    switch (statut) {
      case 'ACCEPTEE': return 'Accepter';
      case 'EN_COURS': return 'En cuisine';
      case 'PRETE':    return 'Marquer prête';
      case 'TERMINEE': return 'Remise / Livrée';
      case 'ANNULEE':  return 'Annuler';
      default: return statut;
    }
  }

  iconeChangement(statut: string): string {
    switch (statut) {
      case 'ACCEPTEE': return 'fa-check';
      case 'EN_COURS': return 'fa-fire-burner';
      case 'PRETE':    return 'fa-box-open';
      case 'TERMINEE': return 'fa-handshake';
      case 'ANNULEE':  return 'fa-ban';
      default: return 'fa-arrow-right';
    }
  }

  // ══════════════════════════════════════════════════════
  // MODALE CRÉATION DE COMMANDE PAR LE GESTIONNAIRE
  // ══════════════════════════════════════════════════════
  modaleCreationOuverte = false;
  creationEnCours = false;

  // Catalogue & Produits pour la sélection
  produitsCatalogue: any[] = [];
  categoriesCatalogue: any[] = [];
  chargementCatalogue = false;
  rechercheMetTexte = '';
  categorieMetFiltre = 'TOUTES';

  // Fichier clients pour sélection ou création
  clients: any[] = [];
  chargementClients = false;
  rechercheClientTexte = '';

  // Mode sélection client : 'EXISTANT' | 'NOUVEAU'
  modeClientCreation: 'EXISTANT' | 'NOUVEAU' = 'EXISTANT';
  clientSelectionne: any | null = null;

  // Données du nouveau client (si modeClientCreation === 'NOUVEAU')
  nouveauClient = {
    nom: '',
    telephone: '',
    email: '',
    type: 'particulier', // 'particulier' | 'entreprise'
    organization: ''
  };

  // Panier de la commande en cours de création
  lignesCreation: {
    produitId?: number;
    produitNom: string;
    prixUnitaire: number;
    quantite: number;
    sousTotal: number;
    imageUrl?: string;
    delaiPreparationHeures?: number;
  }[] = [];

  // Paramètres de livraison & retrait
  modeRemiseCreation: 'RETRAIT' | 'LIVRAISON' = 'RETRAIT';
  dateRemiseCreation = '';
  adresseLivraisonCreation = '';
  fraisLivraisonCreation = 0;

  // Garnitures & Accompagnements
  garnituresChoisiesCreation: { garniture: any; quantite: number }[] = [];
  rechercheGarnitureTexte = '';

  // Modalités de règlement & statuts
  modePaiementCreation = 'ESPECES';
  statutCommandeCreation = 'ACCEPTEE'; // 'ACCEPTEE' | 'EN_ATTENTE'
  noteCommandeCreation = '';

  ouvrirModaleCreation(): void {
    this.modaleCreationOuverte = true;
    this.reinitialiserFormulaireCreation();
    this.chargerCataloguePourCreation();
    this.chargerClientsPourCreation();
  }

  fermerModaleCreation(): void {
    if (this.creationEnCours) return;
    this.modaleCreationOuverte = false;
  }

  reinitialiserFormulaireCreation(): void {
    this.modeClientCreation = 'EXISTANT';
    this.clientSelectionne = null;
    this.rechercheClientTexte = '';
    this.nouveauClient = {
      nom: '',
      telephone: '',
      email: '',
      type: 'particulier',
      organization: ''
    };
    this.lignesCreation = [];
    this.garnituresChoisiesCreation = [];
    this.rechercheGarnitureTexte = '';
    this.modeRemiseCreation = 'RETRAIT';
    this.fraisLivraisonCreation = 0;
    this.adresseLivraisonCreation = '';
    this.modePaiementCreation = 'ESPECES';
    this.statutCommandeCreation = 'ACCEPTEE';
    this.noteCommandeCreation = '';
    this.rechercheMetTexte = '';
    this.categorieMetFiltre = 'TOUTES';

    // Date par défaut : demain à 12h00
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    const pad = (n: number) => n < 10 ? '0' + n : '' + n;
    this.dateRemiseCreation = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  chargerCataloguePourCreation(): void {
    if (this.produitsCatalogue.length > 0) return;
    this.chargementCatalogue = true;
    this.api.getProduits().subscribe({
      next: (produits) => {
        this.produitsCatalogue = (produits || []).filter(p => !p.archive);
        this.chargementCatalogue = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.chargementCatalogue = false;
        this.cdr.detectChanges();
      }
    });

    this.api.getCategories().subscribe({
      next: (cats) => {
        this.categoriesCatalogue = (cats || []).filter(c => !c.archivee);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  chargerClientsPourCreation(): void {
    if (this.clients.length > 0) return;
    this.chargementClients = true;
    this.api.getAllClients(0, 500).subscribe({
      next: (res) => {
        this.clients = res?.content || (Array.isArray(res) ? res : []);
        this.chargementClients = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.chargementClients = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filtrage des clients pour l'autocomplétion / sélection
  get clientsFiltresCreation(): any[] {
    if (!this.rechercheClientTexte) return this.clients.slice(0, 8);
    const q = this.rechercheClientTexte.toLowerCase().trim();
    return this.clients.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.telephone && c.telephone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.organization && c.organization.toLowerCase().includes(q))
    ).slice(0, 15);
  }

  selectionnerClient(c: any): void {
    this.clientSelectionne = c;
    this.rechercheClientTexte = '';
  }

  changerModeClient(mode: 'EXISTANT' | 'NOUVEAU'): void {
    this.modeClientCreation = mode;
  }

  // Filtrage des mets du catalogue
  get metsFiltresCreation(): any[] {
    return this.produitsCatalogue.filter(p => {
      if (this.categorieMetFiltre !== 'TOUTES') {
        const catId = p.categorieId;
        const catNom = p.categorieNom || '';
        const matchId = String(catId) === String(this.categorieMetFiltre);
        const matchNom = catNom.toLowerCase() === this.categorieMetFiltre.toLowerCase();
        if (!matchId && !matchNom) return false;
      }
      if (this.rechercheMetTexte) {
        const q = this.rechercheMetTexte.toLowerCase().trim();
        const nom = (p.nom || '').toLowerCase();
        const cat = (p.categorieNom || '').toLowerCase();
        if (!nom.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    });
  }

  ajouterMetAuPanier(produit: any): void {
    const existant = this.lignesCreation.find(l => l.produitId === produit.id);
    if (existant) {
      existant.quantite += 1;
      existant.sousTotal = existant.quantite * existant.prixUnitaire;
    } else {
      this.lignesCreation.push({
        produitId: produit.id,
        produitNom: produit.nom,
        prixUnitaire: produit.prix || 0,
        quantite: 1,
        sousTotal: produit.prix || 0,
        imageUrl: produit.imageUrl,
        delaiPreparationHeures: produit.delaiPreparationHeures
      });
    }
  }

  modifierQuantiteLigneCreation(ligne: any, delta: number): void {
    ligne.quantite += delta;
    if (ligne.quantite <= 0) {
      this.supprimerLigneCreation(ligne);
    } else {
      ligne.sousTotal = ligne.quantite * ligne.prixUnitaire;
    }
  }

  supprimerLigneCreation(ligne: any): void {
    const idx = this.lignesCreation.indexOf(ligne);
    if (idx >= 0) {
      this.lignesCreation.splice(idx, 1);
    }
  }

  // ─── Logique Garnitures & Accompagnements ───
  get catalogueGarnitures(): any[] {
    return this.produitsCatalogue.filter(p => {
      const cat = (p.categorieNom || '').toLowerCase();
      const nom = (p.nom || '').toLowerCase();
      const estCatGarniture = cat.includes('garniture') || cat.includes('accompagnement');
      const estPlatOuEntree = cat.includes('plat') || cat.includes('chaud') || cat.includes('entrée') || cat.includes('entree') ||
                              cat.includes('salé') || cat.includes('canapé') || cat.includes('boisson') || cat.includes('dessert') ||
                              nom.includes('méchoui') || nom.includes('mechoui') || nom.includes('poulet');
      return (estCatGarniture && !estPlatOuEntree) || p.estGarniture === true;
    });
  }

  get platsChaudsDansCreation(): any[] {
    return this.lignesCreation.filter(l => {
      const refProd = this.produitsCatalogue.find(p => p.id === l.produitId);
      const cat = (refProd?.categorieNom || '').toLowerCase();
      const garnitures = (refProd?.garnituresCompatibles && refProd.garnituresCompatibles.length > 0)
        ? refProd.garnituresCompatibles : [];

      const estExclu = cat.includes('salé') || cat.includes('sale') || cat.includes('canapé') || cat.includes('canape') ||
                       cat.includes('finger') || cat.includes('amuse') || cat.includes('pièce') || cat.includes('piece') ||
                       cat.includes('entrée') || cat.includes('entree') || cat.includes('salade') ||
                       cat.includes('jus') || cat.includes('boisson') || cat.includes('cocktail') || cat.includes('vin') ||
                       cat.includes('dessert') || cat.includes('douceur') || cat.includes('patisserie') || cat.includes('sucre') || cat.includes('sucré') ||
                       cat.includes('garniture') || cat.includes('accompagnement');

      if (estExclu) return false;
      if (garnitures && garnitures.length > 0) return true;

      return cat.includes('plat') || cat.includes('chaud') || cat.includes('repas') ||
             cat.includes('grill') || cat.includes('viande') || cat.includes('poisson') || cat.includes('méchoui') || cat.includes('mechoui');
    });
  }

  get entreesEtPlatsChaudsDansCreation(): any[] {
    return this.platsChaudsDansCreation;
  }

  get quotaGarnituresOffertesCreation(): number {
    return this.platsChaudsDansCreation.reduce((sum, l) => sum + (l.quantite || 1), 0);
  }

  get garnituresCompatiblesCreation(): any[] {
    const map = new Map<number, any>();
    for (const plat of this.entreesEtPlatsChaudsDansCreation) {
      const refProd = this.produitsCatalogue.find(p => p.id === plat.produitId);
      const garnitures = refProd?.garnituresCompatibles;
      if (garnitures && garnitures.length > 0) {
        for (const g of garnitures) {
          if (g && g.id) {
            map.set(g.id, g);
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

  get garnituresCompatiblesFiltreesCreation(): any[] {
    const list = this.garnituresCompatiblesCreation;
    const q = (this.rechercheGarnitureTexte || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter(g =>
      (g.nom && g.nom.toLowerCase().includes(q)) ||
      (g.description && g.description.toLowerCase().includes(q))
    );
  }

  get totalGarnituresChoisiesCreation(): number {
    return this.garnituresChoisiesCreation.reduce((sum, it) => sum + it.quantite, 0);
  }

  get nombreGarnituresOffertesUtiliseesCreation(): number {
    return Math.min(this.totalGarnituresChoisiesCreation, this.quotaGarnituresOffertesCreation);
  }

  get surplusGarnituresPayantesCreation(): number {
    return Math.max(0, this.totalGarnituresChoisiesCreation - this.quotaGarnituresOffertesCreation);
  }

  get coutSurplusGarnituresCreation(): number {
    if (this.surplusGarnituresPayantesCreation <= 0) return 0;
    const portions: number[] = [];
    for (const item of this.garnituresChoisiesCreation) {
      const prix = item.garniture.prix || 0;
      for (let i = 0; i < item.quantite; i++) {
        portions.push(prix);
      }
    }
    portions.sort((a, b) => b - a);
    const portionsPayantes = portions.slice(this.quotaGarnituresOffertesCreation);
    return portionsPayantes.reduce((sum, p) => sum + p, 0);
  }

  getQuantiteGarnitureCreation(garnitureId: number): number {
    const item = this.garnituresChoisiesCreation.find(g => g.garniture.id === garnitureId);
    return item ? item.quantite : 0;
  }

  modifierQuantiteGarnitureCreation(garniture: any, delta: number): void {
    const existant = this.garnituresChoisiesCreation.find(g => g.garniture.id === garniture.id);
    const nouvelleQte = (existant ? existant.quantite : 0) + delta;
    if (nouvelleQte <= 0) {
      this.garnituresChoisiesCreation = this.garnituresChoisiesCreation.filter(g => g.garniture.id !== garniture.id);
    } else {
      if (existant) {
        existant.quantite = nouvelleQte;
      } else {
        this.garnituresChoisiesCreation.push({ garniture, quantite: nouvelleQte });
      }
    }
  }

  changerModeRemiseCreation(mode: 'RETRAIT' | 'LIVRAISON'): void {
    this.modeRemiseCreation = mode;
    if (mode === 'LIVRAISON') {
      if (!this.fraisLivraisonCreation) {
        this.fraisLivraisonCreation = 2000;
      }
    } else {
      this.fraisLivraisonCreation = 0;
    }
  }

  get totalMetsCreation(): number {
    return this.lignesCreation.reduce((sum, l) => sum + (l.sousTotal || 0), 0);
  }

  get totalGlobalCreation(): number {
    return this.totalMetsCreation + this.coutSurplusGarnituresCreation + (this.modeRemiseCreation === 'LIVRAISON' ? (this.fraisLivraisonCreation || 0) : 0);
  }

  validerCreationCommande(): void {
    // 1. Validation Client
    if (this.modeClientCreation === 'EXISTANT') {
      if (!this.clientSelectionne) {
        this.dataService.showToast('Veuillez sélectionner un client dans la liste.', true);
        return;
      }
    } else {
      if (!this.nouveauClient.nom.trim()) {
        this.dataService.showToast('Le nom et prénom du client sont requis.', true);
        return;
      }
      if (!this.nouveauClient.telephone.trim()) {
        this.dataService.showToast('Le numéro de téléphone du client est requis.', true);
        return;
      }
      if (this.nouveauClient.type === 'entreprise' && !this.nouveauClient.organization?.trim()) {
        this.dataService.showToast('Veuillez renseigner le nom de l\'entreprise.', true);
        return;
      }
    }

    // 2. Validation Panier
    if (this.lignesCreation.length === 0) {
      this.dataService.showToast('Veuillez ajouter au moins un met à la commande.', true);
      return;
    }

    // 3. Validation Remise & Date
    if (!this.dateRemiseCreation) {
      this.dataService.showToast('Veuillez définir la date et l\'heure de retrait ou livraison.', true);
      return;
    }

    if (this.modeRemiseCreation === 'LIVRAISON' && !this.adresseLivraisonCreation.trim()) {
      this.dataService.showToast('Veuillez saisir l\'adresse de livraison.', true);
      return;
    }

    this.creationEnCours = true;

    // Le paiement est obligatoire -> la commande créée est systématiquement enregistrée comme PAYEE
    const statutPaiement = 'PAYEE';

    // Construction des lignes de commande (Mets + Garnitures)
    const lignesPayload: any[] = [
      ...this.lignesCreation.map(l => ({
        produitId: l.produitId,
        produitNom: l.produitNom,
        prixUnitaire: l.prixUnitaire,
        quantite: l.quantite
      }))
    ];

    if (this.garnituresChoisiesCreation.length > 0) {
      let gratuitesRestantes = this.quotaGarnituresOffertesCreation;
      for (const g of this.garnituresChoisiesCreation) {
        if (g.quantite <= 0) continue;
        const prixBase = g.garniture.prix || 0;
        const qteGratuite = Math.min(g.quantite, gratuitesRestantes);
        const qtePayante = g.quantite - qteGratuite;
        gratuitesRestantes -= qteGratuite;

        if (qteGratuite > 0) {
          lignesPayload.push({
            produitId: g.garniture.id,
            produitNom: `[Accompagnement] ${g.garniture.nom}`,
            prixUnitaire: 0,
            quantite: qteGratuite
          });
        }
        if (qtePayante > 0) {
          lignesPayload.push({
            produitId: g.garniture.id,
            produitNom: `[Accompagnement] ${g.garniture.nom}`,
            prixUnitaire: prixBase,
            quantite: qtePayante
          });
        }
      }
    }

    const payload: any = {
      modeRemise: this.modeRemiseCreation,
      modePaiement: this.modePaiementCreation,
      dateRemise: this.dateRemiseCreation,
      adresseLivraison: this.modeRemiseCreation === 'LIVRAISON' ? this.adresseLivraisonCreation.trim() : null,
      fraisLivraison: this.modeRemiseCreation === 'LIVRAISON' ? (this.fraisLivraisonCreation || 2000) : 0,
      statutPaiement: statutPaiement,
      statutCommande: this.statutCommandeCreation,
      noteClient: this.noteCommandeCreation.trim() || null,
      lignes: lignesPayload
    };

    if (this.modeClientCreation === 'EXISTANT') {
      payload.clientId = this.clientSelectionne.id;
      payload.clientNom = this.clientSelectionne.name;
      payload.clientTelephone = this.clientSelectionne.phone || this.clientSelectionne.telephone;
      payload.clientEmail = this.clientSelectionne.email;
    } else {
      payload.client = {
        nom: this.nouveauClient.nom.trim(),
        telephone: this.nouveauClient.telephone.trim(),
        email: this.nouveauClient.email.trim() || null,
        type: this.nouveauClient.type,
        organization: this.nouveauClient.organization?.trim() || null
      };
      payload.clientNom = this.nouveauClient.nom.trim();
      payload.clientTelephone = this.nouveauClient.telephone.trim();
      payload.clientEmail = this.nouveauClient.email.trim() || null;
    }

    this.api.creerCommandeGestionnaire(payload).subscribe({
      next: (nouvelleCmd) => {
        this.creationEnCours = false;
        this.modaleCreationOuverte = false;
        this.dataService.showToast(`Commande ${nouvelleCmd.numero || ''} créée avec succès !`);
        this.charger();
        if (this.modeClientCreation === 'NOUVEAU') {
          this.clients = [];
          this.chargerClientsPourCreation();
        }
      },
      error: (err) => {
        this.creationEnCours = false;
        console.error('Erreur lors de la création de la commande', err);
        const msg = err?.error?.message || err?.message || 'Erreur lors de la création de la commande.';
        this.dataService.showToast(msg, true);
      }
    });
  }
}

