import { Injectable, signal, computed } from '@angular/core';
import { EntrepriseB2B, SiteB2B, PlatB2B, FormuleRegle, EmployeB2B, SelectionRepas, CommandeHistoriqueB2B, LignePanierAutonome } from './b2b.models';

@Injectable({
  providedIn: 'root'
})
export class B2bStateService {
  // Mode profil employé simulé : SUBVENTIONNE (prise en charge RH 100%) ou AUTONOME (frais personnels, panier libre, Wave)
  modeProfil = signal<'SUBVENTIONNE' | 'AUTONOME'>('SUBVENTIONNE');

  // État de la Sidebar rétractable (Collapsed / Expanded) persisté
  isSidebarCollapsed = signal<boolean>(localStorage.getItem('b2b_sidebar_collapsed') === 'true');

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => {
      const next = !v;
      localStorage.setItem('b2b_sidebar_collapsed', String(next));
      return next;
    });
  }

  // Panier libre pour le salarié autonome / prestataire
  panierAutonome = signal<LignePanierAutonome[]>([]);

  // Entreprise active
  currentEntreprise = signal<EntrepriseB2B>({
    id: 'ent-001',
    nom: 'TotalEnergies Sénégal',
    codeEntreprise: 'TOT-SN',
    tauxPriseEnCharge: 100, // 100% prise en charge par l'entreprise
    plafondJournalier: 5000,
    budgetMensuelAlloue: 18500000,
    sites: [
      { 
        id: 'site-1', 
        nom: 'Siège Plateau - Dakar', 
        adresse: 'Boulevard de la République, Dakar Plateau', 
        heureCutOff: '10:30', 
        contactReferent: 'M. Babacar Ndiaye (RH)', 
        telephoneReferent: '+221 77 123 45 67',
        creneauxDisponibles: [
          '11h30 - 12h00 (Service Anticipé)',
          '12h00 - 12h30 (Premier Service)',
          '12h30 - 13h00 (Deuxième Service)',
          '13h00 - 13h30 (Troisième Service)',
          '13h30 - 14h00 (Service Tardif)',
          '14h00 - 14h30 (Dernier Service)'
        ]
      },
      { 
        id: 'site-2', 
        nom: 'Dépôt Bel-Air / Port', 
        adresse: 'Zone Industrielle Bel-Air, Port Autonome de Dakar', 
        heureCutOff: '09:45', 
        contactReferent: 'Mme Aminata Sow (Logistique)', 
        telephoneReferent: '+221 78 234 56 78',
        creneauxDisponibles: [
          '11h30 - 12h00 (Quart Matin)',
          '12h00 - 12h45 (Service Midi)',
          '13h00 - 13h45 (Service Relève)',
          '19h00 - 20h00 (Dîner Équipe de Nuit)'
        ]
      },
      { 
        id: 'site-3', 
        nom: 'Plateforme Diamniadio', 
        adresse: 'Pôle Urbain de Diamniadio, Dakar', 
        heureCutOff: '10:00', 
        contactReferent: 'M. Cheikh Diop', 
        telephoneReferent: '+221 76 345 67 89',
        creneauxDisponibles: [
          '12h00 - 12h30 (Premier Service)',
          '12h30 - 13h15 (Service Principal)',
          '13h15 - 14h00 (Service Décalé)'
        ]
      }
    ]
  });

  selectedSiteId = signal<string>('site-1');

  // Employé actif pour la commande
  currentEmploye = signal<EmployeB2B>({
    id: 'emp-101',
    matricule: 'TOT-9842',
    nom: 'Ndiaye',
    prenom: 'Babacar',
    email: 'b.ndiaye@totalenergies.sn',
    telephone: '+221 77 123 45 67',
    siteId: 'site-1',
    siteNom: 'Siège Plateau - Dakar',
    departement: 'Finance & Comptabilité',
    type: 'SUBVENTIONNE',
    actif: true,
    repasConsommesMois: 18,
    montantPrisEnChargeMois: 90000
  });

  // Annuaire des employés RH de l'entreprise
  listeEmployes = signal<EmployeB2B[]>([
    { id: 'emp-101', matricule: 'TOT-9842', nom: 'Ndiaye', prenom: 'Babacar', email: 'b.ndiaye@totalenergies.sn', telephone: '+221 77 123 45 67', siteId: 'site-1', siteNom: 'Siège Plateau', departement: 'Finance & Comptabilité', type: 'SUBVENTIONNE', actif: true, repasConsommesMois: 19, montantPrisEnChargeMois: 95000 },
    { id: 'emp-102', matricule: 'TOT-9843', nom: 'Fall', prenom: 'Fatou', email: 'f.fall@totalenergies.sn', telephone: '+221 78 456 78 90', siteId: 'site-1', siteNom: 'Siège Plateau', departement: 'Ressources Humaines', type: 'SUBVENTIONNE', actif: true, repasConsommesMois: 21, montantPrisEnChargeMois: 105000 },
    { id: 'emp-103', matricule: 'TOT-9844', nom: 'Diallo', prenom: 'Mamadou', email: 'm.diallo@totalenergies.sn', telephone: '+221 76 567 89 01', siteId: 'site-2', siteNom: 'Dépôt Bel-Air', departement: 'Opérations Maritimes', type: 'SUBVENTIONNE', actif: true, repasConsommesMois: 22, montantPrisEnChargeMois: 110000 },
    { id: 'emp-104', matricule: 'TOT-9845', nom: 'Sow', prenom: 'Aminata', email: 'a.sow@totalenergies.sn', telephone: '+221 77 678 90 12', siteId: 'site-2', siteNom: 'Dépôt Bel-Air', departement: 'Maintenance & Sécurité', type: 'SUBVENTIONNE', actif: true, repasConsommesMois: 17, montantPrisEnChargeMois: 85000 },
    { id: 'emp-105', matricule: 'TOT-9846', nom: 'Diop', prenom: 'Cheikh', email: 'c.diop@totalenergies.sn', telephone: '+221 78 789 01 23', siteId: 'site-3', siteNom: 'Plateforme Diamniadio', departement: 'Logistique & Transit', type: 'SUBVENTIONNE', actif: true, repasConsommesMois: 20, montantPrisEnChargeMois: 100000 },
    { id: 'emp-106', matricule: 'TOT-EXT-01', nom: 'Ba', prenom: 'Ousmane (Consultant)', email: 'o.ba@consultant.sn', telephone: '+221 76 890 12 34', siteId: 'site-1', siteNom: 'Siège Plateau', departement: 'Direction Projet IT', type: 'AUTONOME', actif: true, repasConsommesMois: 14, montantPrisEnChargeMois: 0 },
    { id: 'emp-107', matricule: 'TOT-9847', nom: 'Sarr', prenom: 'Khady', email: 'k.sarr@totalenergies.sn', telephone: '+221 77 901 23 45', siteId: 'site-1', siteNom: 'Siège Plateau', departement: 'Juridique & Conformité', type: 'SUBVENTIONNE', actif: true, repasConsommesMois: 18, montantPrisEnChargeMois: 90000 }
  ]);

  // Historique unifié des commandes individuelles pour rapprochement RH par site et par date
  historiqueCommandes = signal<CommandeHistoriqueB2B[]>([
    { id: 'CMD-101', date: '2026-11-06', heure: '10:14', matricule: 'TOT-9842', employeNom: 'Babacar Ndiaye', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Poulet Yassa Braisé Kiki', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-102', date: '2026-11-06', heure: '10:22', matricule: 'TOT-9843', employeNom: 'Fatou Fall', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Capitaine Braisé & Riz Jasmin', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-103', date: '2026-11-06', heure: '09:35', matricule: 'TOT-9844', employeNom: 'Mamadou Diallo', siteId: 'site-2', siteNom: 'Dépôt Bel-Air / Port', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Thiéboudienne Penda Mbaye', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-104', date: '2026-11-06', heure: '09:40', matricule: 'TOT-9845', employeNom: 'Aminata Sow', siteId: 'site-2', siteNom: 'Dépôt Bel-Air / Port', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Pavé de Bœuf aux Herbes', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-105', date: '2026-11-06', heure: '09:55', matricule: 'TOT-9846', employeNom: 'Cheikh Diop', siteId: 'site-3', siteNom: 'Plateforme Diamniadio', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Poulet Yassa Braisé Kiki', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-106', date: '2026-11-05', heure: '10:12', matricule: 'TOT-9847', employeNom: 'Khady Sarr', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Capitaine Braisé & Riz Jasmin', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-107', date: '2026-11-05', heure: '10:28', matricule: 'TOT-9842', employeNom: 'Babacar Ndiaye', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Pavé de Bœuf aux Herbes', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-108', date: '2026-11-05', heure: '09:30', matricule: 'TOT-9844', employeNom: 'Mamadou Diallo', siteId: 'site-2', siteNom: 'Dépôt Bel-Air / Port', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Poulet Yassa Braisé Kiki', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-109', date: '2026-11-04', heure: '10:15', matricule: 'TOT-9843', employeNom: 'Fatou Fall', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Thiéboudienne Penda Mbaye', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-110', date: '2026-11-04', heure: '09:42', matricule: 'TOT-9846', employeNom: 'Cheikh Diop', siteId: 'site-3', siteNom: 'Plateforme Diamniadio', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Capitaine Braisé & Riz Jasmin', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-111', date: '2026-10-30', heure: '10:20', matricule: 'TOT-9842', employeNom: 'Babacar Ndiaye', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Poulet Yassa Braisé Kiki', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-112', date: '2026-10-30', heure: '09:38', matricule: 'TOT-9845', employeNom: 'Aminata Sow', siteId: 'site-2', siteNom: 'Dépôt Bel-Air / Port', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Pavé de Bœuf aux Herbes', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' }
  ]);

  // Formule repas active
  formuleActuelle = signal<FormuleRegle>({
    id: 'formule-midi-complete',
    nom: 'Formule Déjeuner Équilibré B2B',
    description: '1 Entrée fraîche + 1 Plat Chaud du Chef + 1 Dessert + 1 Boisson rafraîchissante',
    prixForfait: 5000,
    quotas: {
      ENTREE: 1,
      PLAT: 1,
      DESSERT: 1,
      BOISSON: 1
    }
  });

  // Date de commande
  dateCommande = signal<Date>(new Date());

  // Catalogue du jour
  catalogueJour = signal<PlatB2B[]>([
    { id: 'e1', nom: 'Salade Niçoise au Thon Frais', description: 'Haricots verts, œufs durs, tomates, vinaigrette maison', categorie: 'ENTREE', prixUnitaire: 1200, image: '/assets/images/plats/e1.jpg', calories: 240 },
    { id: 'e2', nom: 'Pastels Dorés au Thon (x3)', description: 'Beignets croustillants servis avec sauce tomate piment doux', categorie: 'ENTREE', prixUnitaire: 1200, image: '/assets/images/plats/e2.jpg', calories: 310 },
    { id: 'e3', nom: 'Velouté de Légumes & Croûtons d\'Ail', description: 'Courgettes, carottes, pointe de crème fraîche', categorie: 'ENTREE', prixUnitaire: 1200, image: '/assets/images/plats/e3.jpg', calories: 180 },
    { id: 'p1', nom: 'Poulet Yassa Braisé Kiki & Riz Parfumé', description: 'Cuisse de poulet fermier marinée aux oignons caramélisés, citron vert et moutarde, riz parfumé', categorie: 'PLAT', prixUnitaire: 2800, image: '/assets/images/plats/p1.jpg', calories: 650 },
    { id: 'p2', nom: 'Capitaine Braisé & Riz Parfumé au Jasmin', description: 'Filet de poisson frais braisé au feu de bois, sauce moutarde oignon & piment', categorie: 'PLAT', prixUnitaire: 3200, image: '/assets/images/plats/p2.jpg', calories: 580 },
    { id: 'p3', nom: 'Plat Équilibré : Pavé de Bœuf aux Herbes & Légumes Vapeur', description: 'Bœuf tendre du boucher, purée de patates douces et haricots persillés', categorie: 'PLAT', prixUnitaire: 3000, image: '/assets/images/plats/p3.jpg', calories: 520 },
    { id: 'p4', nom: 'Thiéboudienne Penda Mbaye Royal (Riz Rouge)', description: 'Riz rouge traditionnel sénégalais mijoté aux légumes du terroir et poisson noble', categorie: 'PLAT', prixUnitaire: 2600, image: '/assets/images/plats/p4.jpg', calories: 610 },
    { id: 'd1', nom: 'Coupe de Fruits Exotiques Frais', description: 'Mangue kent, ananas pain de sucre, papaye arrosée de citron vert', categorie: 'DESSERT', prixUnitaire: 800, image: '/assets/images/plats/d1.jpg', calories: 120 },
    { id: 'd2', nom: 'Fondant au Chocolat Noir Intense & Cœur Coulant', description: 'Cacao noir pur d\'Afrique, crème anglaise vanillée', categorie: 'DESSERT', prixUnitaire: 1000, image: '/assets/images/plats/d2.jpg', calories: 340 },
    { id: 'd3', nom: 'Yaourt Onctueux Fait Maison au Miel', description: 'Lait entier local et miel de fleurs de savane', categorie: 'DESSERT', prixUnitaire: 800, image: '/assets/images/plats/d3.jpg', calories: 160 },
    { id: 'b1', nom: 'Jus Naturel de Bissap Frais Menthe', description: 'Infusion de fleurs d\'hibiscus, menthe sauvage, sans conservateur', categorie: 'BOISSON', prixUnitaire: 600, image: '/assets/images/plats/b1.jpg', calories: 90 },
    { id: 'b2', nom: 'Jus de Bouye Artisanal (Pain de Singe)', description: 'Pulpe naturelle de fruit de baobab onctueuse et vanillée', categorie: 'BOISSON', prixUnitaire: 600, image: '/assets/images/plats/b2.jpg', calories: 110 },
    { id: 'b3', nom: 'Eau Minérale Naturelle Kirène (50cl)', description: 'Bouteille individuelle capsule scellée', categorie: 'BOISSON', prixUnitaire: 400, image: '/assets/images/plats/b3.jpg', calories: 0 }
  ]);

  // Panier
  selection = signal<SelectionRepas>({
    entree: undefined,
    plat: undefined,
    dessert: undefined,
    boisson: undefined,
    supplements: []
  });

  creneauLivraison = signal<string>('12h00 - 12h30');

  // CALCULS COMPUTÉS
  siteActuel = computed(() => {
    const id = this.selectedSiteId();
    return this.currentEntreprise().sites.find(s => s.id === id) || this.currentEntreprise().sites[0];
  });

  creneauxSiteActuel = computed(() => {
    const site = this.siteActuel();
    if (site && site.creneauxDisponibles && site.creneauxDisponibles.length > 0) {
      return site.creneauxDisponibles;
    }
    return [
      '11h30 - 12h00 (Service Anticipé)',
      '12h00 - 12h30 (Premier Service)',
      '12h30 - 13h00 (Deuxième Service)',
      '13h00 - 13h30 (Troisième Service)',
      '13h30 - 14h00 (Service Tardif)',
      '14h00 - 14h30 (Dernier Service)',
      '19h00 - 20h00 (Dîner Équipe de Nuit)'
    ];
  });

  isFormuleComplete = computed(() => {
    const s = this.selection();
    return !!(s.entree && s.plat && s.dessert && s.boisson);
  });

  totalSupplements = computed(() => {
    return this.selection().supplements.reduce((sum, item) => sum + item.prixUnitaire, 0);
  });

  totalCommandeBrut = computed(() => {
    return this.formuleActuelle().prixForfait + this.totalSupplements();
  });

  partPriseEnChargeEntreprise = computed(() => {
    const emp = this.currentEmploye();
    if (emp.type === 'AUTONOME') return 0;
    const taux = this.currentEntreprise().tauxPriseEnCharge;
    return (this.formuleActuelle().prixForfait * taux) / 100;
  });

  resteAPayerEmploye = computed(() => {
    const brut = this.totalCommandeBrut();
    const subvention = this.partPriseEnChargeEntreprise();
    return Math.max(0, brut - subvention);
  });

  // COMPUTEDS PANIER AUTONOME (Frais personnels)
  totalPanierAutonome = computed(() => {
    return this.panierAutonome().reduce((sum, item) => sum + (item.plat.prixUnitaire * item.quantite), 0);
  });

  nbArticlesPanierAutonome = computed(() => {
    return this.panierAutonome().reduce((sum, item) => sum + item.quantite, 0);
  });

  // STATS DASHBOARD RH
  historiqueFacturationMois = signal([
    { id: 'sem-1', date: 'Semaine 44 (01 - 07 Nov)', siteNom: 'Siège Plateau - Dakar', nbRepasSubventionnes: 60, prixUnitaire: 5000, tauxSubvention: 100, partEntreprise: 300000 },
    { id: 'sem-2', date: 'Semaine 44 (01 - 07 Nov)', siteNom: 'Dépôt Bel-Air / Port', nbRepasSubventionnes: 45, prixUnitaire: 5000, tauxSubvention: 100, partEntreprise: 225000 },
    { id: 'sem-3', date: 'Semaine 44 (01 - 07 Nov)', siteNom: 'Plateforme Diamniadio', nbRepasSubventionnes: 30, prixUnitaire: 5000, tauxSubvention: 100, partEntreprise: 150000 },
    { id: 'sem-4', date: 'Semaine 45 (08 - 14 Nov)', siteNom: 'Siège Plateau - Dakar', nbRepasSubventionnes: 75, prixUnitaire: 5000, tauxSubvention: 100, partEntreprise: 375000 }
  ]);

  totalRepasMois = computed(() => {
    return this.historiqueCommandes().length * 15 + 180;
  });

  totalFactureMois = computed(() => {
    return this.totalRepasMois() * 5000;
  });

  tauxUtilisationBudget = computed(() => {
    const budget = this.currentEntreprise().budgetMensuelAlloue;
    if (!budget) return 0;
    return Math.round((this.totalFactureMois() / budget) * 100);
  });

  // ACTIONS RH
  ajouterEmploye(nouvelEmp: Partial<EmployeB2B>) {
    const site = this.currentEntreprise().sites.find(s => s.id === nouvelEmp.siteId);
    const emp: EmployeB2B = {
      id: 'emp-' + Date.now(),
      matricule: nouvelEmp.matricule || 'TOT-' + Math.floor(1000 + Math.random() * 9000),
      nom: nouvelEmp.nom || 'Nouveau',
      prenom: nouvelEmp.prenom || 'Employé',
      email: nouvelEmp.email || '',
      telephone: nouvelEmp.telephone || '',
      siteId: nouvelEmp.siteId || 'site-1',
      siteNom: site ? site.nom : 'Siège Plateau',
      departement: nouvelEmp.departement || 'Général',
      type: nouvelEmp.type || 'SUBVENTIONNE',
      actif: true,
      repasConsommesMois: 0,
      montantPrisEnChargeMois: 0
    };
    this.listeEmployes.update(list => [emp, ...list]);
  }

  toggleStatutEmploye(empId: string) {
    this.listeEmployes.update(list => list.map(emp => {
      if (emp.id === empId) {
        return { ...emp, actif: !emp.actif };
      }
      return emp;
    }));
  }

  // ACTIONS EMPLOYÉ
  selectSite(siteId: string) {
    this.selectedSiteId.set(siteId);
  }

  choisirPlat(plat: PlatB2B) {
    const sel = { ...this.selection() };
    switch (plat.categorie) {
      case 'ENTREE': sel.entree = plat; break;
      case 'PLAT': sel.plat = plat; break;
      case 'DESSERT': sel.dessert = plat; break;
      case 'BOISSON': sel.boisson = plat; break;
    }
    this.selection.set(sel);
  }

  toggleSupplement(plat: PlatB2B) {
    const sel = { ...this.selection() };
    const index = sel.supplements.findIndex(p => p.id === plat.id);
    if (index >= 0) {
      sel.supplements = sel.supplements.filter(p => p.id !== plat.id);
    } else {
      sel.supplements = [...sel.supplements, plat];
    }
    this.selection.set(sel);
  }

  isSupplementSelected(platId: string): boolean {
    return this.selection().supplements.some(p => p.id === platId);
  }

  changerTypeEmploye(type: 'SUBVENTIONNE' | 'AUTONOME') {
    const emp = { ...this.currentEmploye(), type };
    this.currentEmploye.set(emp);
  }

  reinitialiserSelection() {
    this.selection.set({
      entree: undefined,
      plat: undefined,
      dessert: undefined,
      boisson: undefined,
      supplements: []
    });
  }

  // ACTIONS PANIER AUTONOME (Employé non pris en charge / Wave direct)
  setModeProfil(mode: 'SUBVENTIONNE' | 'AUTONOME') {
    this.modeProfil.set(mode);
    if (mode === 'AUTONOME') {
      const consultant = this.listeEmployes().find(e => e.id === 'emp-106') || {
        id: 'emp-106',
        matricule: 'TOT-EXT-01',
        nom: 'Ba',
        prenom: 'Ousmane (Consultant)',
        email: 'o.ba@consultant.sn',
        telephone: '+221 76 890 12 34',
        siteId: 'site-1',
        siteNom: 'Siège Plateau',
        departement: 'Direction Projet IT',
        type: 'AUTONOME' as const,
        actif: true,
        repasConsommesMois: 14,
        montantPrisEnChargeMois: 0
      };
      this.currentEmploye.set(consultant);
    } else {
      const subventionne = this.listeEmployes().find(e => e.id === 'emp-101') || {
        id: 'emp-101',
        matricule: 'TOT-9842',
        nom: 'Ndiaye',
        prenom: 'Babacar',
        email: 'b.ndiaye@totalenergies.sn',
        telephone: '+221 77 123 45 67',
        siteId: 'site-1',
        siteNom: 'Siège Plateau - Dakar',
        departement: 'Finance & Comptabilité',
        type: 'SUBVENTIONNE' as const,
        actif: true,
        repasConsommesMois: 19,
        montantPrisEnChargeMois: 95000
      };
      this.currentEmploye.set(subventionne);
    }
  }

  ajouterAuPanierAutonome(plat: PlatB2B) {
    this.panierAutonome.update(items => {
      const existing = items.find(i => i.plat.id === plat.id);
      if (existing) {
        return items.map(i => i.plat.id === plat.id ? { ...i, quantite: i.quantite + 1 } : i);
      }
      return [...items, { plat, quantite: 1 }];
    });
  }

  retirerDuPanierAutonome(platId: string) {
    this.panierAutonome.update(items => {
      const existing = items.find(i => i.plat.id === platId);
      if (!existing) return items;
      if (existing.quantite > 1) {
        return items.map(i => i.plat.id === platId ? { ...i, quantite: i.quantite - 1 } : i);
      }
      return items.filter(i => i.plat.id !== platId);
    });
  }

  supprimerDuPanierAutonome(platId: string) {
    this.panierAutonome.update(items => items.filter(i => i.plat.id !== platId));
  }

  quantitePlatAutonome(platId: string): number {
    const item = this.panierAutonome().find(i => i.plat.id === platId);
    return item ? item.quantite : 0;
  }

  viderPanierAutonome() {
    this.panierAutonome.set([]);
  }
}
