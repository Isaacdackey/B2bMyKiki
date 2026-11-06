import { B2bNavComponent } from '../shared/b2b-nav.component';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../shared/b2b-state.service';
import { LigneProductionCuisine, BonLivraisonSite, CommandePersonnelleAutonome } from './b2b-cuisine.models';

@Component({
  selector: 'app-b2b-cuisine-production',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, B2bNavComponent],
  templateUrl: './b2b-cuisine-production.component.html',
  styleUrls: ['./b2b-cuisine-production.component.css']
})
export class B2bCuisineProductionComponent {
  b2b = inject(B2bStateService);

  // Onglet actif : 'PRODUCTION' | 'SCAN_QR' | 'AUTONOME' | 'BORDEREAUX' | 'PLANNING_SEMAINE'
  activeTab = signal<'PRODUCTION' | 'SCAN_QR' | 'AUTONOME' | 'BORDEREAUX' | 'PLANNING_SEMAINE'>('PRODUCTION');

  // SCANNER QR CODE RETRAIT (Exigé par le mentor)
  codeScanneInput = signal<string>('');
  dernierScanValide = signal<{ matricule: string; nom: string; site: string; plat: string; heure: string } | null>(null);
  scanMessage = signal<string | null>(null);
  nbTotalScannesAujourdhui = signal<number>(142);

  // COMMANDES PERSONNELLES AUTONOMES (Wave / Carte Bancaire) avec gestion des statuts
  commandesAutonomes = signal<CommandePersonnelleAutonome[]>([
    {
      id: 'cmd-aut-1',
      codeCommande: 'CMD-PERS-2041',
      clientNom: 'Nafi Diallo',
      telephone: '+221 77 450 11 22',
      siteNom: 'Siège Plateau - Dakar',
      articles: 'Thiéboudienne Penda Mbaye + Jus de Bouye',
      montantTotal: 3200,
      heurePrevue: '12h15',
      statut: 'EN_PREPARATION'
    },
    {
      id: 'cmd-aut-2',
      codeCommande: 'CMD-PERS-2042',
      clientNom: 'Amadou Bamba Diouf',
      telephone: '+221 78 510 33 44',
      siteNom: 'Siège Plateau - Dakar',
      articles: 'Poulet Yassa Braisé + Fondant Chocolat + Bissap',
      montantTotal: 4400,
      heurePrevue: '12h30',
      statut: 'PRET_AU_RETRAIT'
    },
    {
      id: 'cmd-aut-3',
      codeCommande: 'CMD-PERS-2043',
      clientNom: 'Khady Cissé',
      telephone: '+221 70 820 99 88',
      siteNom: 'Dépôt Bel-Air / Port',
      articles: 'Pastels au Thon + Capitaine Braisé Riz Jasmin',
      montantTotal: 4400,
      heurePrevue: '12h45',
      statut: 'EN_PREPARATION'
    },
    {
      id: 'cmd-aut-4',
      codeCommande: 'CMD-PERS-2039',
      clientNom: 'Ibrahima Gueye',
      telephone: '+221 76 612 87 65',
      siteNom: 'Siège Plateau - Dakar',
      articles: 'Salade Niçoise + Eau Kirène',
      montantTotal: 1600,
      heurePrevue: '12h00',
      statut: 'LIVRE'
    }
  ]);

  // Filtre par site
  selectedSiteId = signal<string>('site-1');

  // Modal d'émargement / BL
  selectedBL = signal<BonLivraisonSite | null>(null);
  showBLModal = signal<boolean>(false);

  // Feuilles de production consolidées calculées pour la brigade
  lignesProduction = signal<LigneProductionCuisine[]>([
    // PLATS CHAUDS
    { platId: 'p1', nomPlat: 'Poulet Yassa Braisé Kiki & Riz Parfumé', categorie: 'PLAT', quantiteTotale: 145, unite: 'portions', statut: 'EN_CUISSON' },
    { platId: 'p2', nomPlat: 'Capitaine Braisé & Riz Parfumé au Jasmin', categorie: 'PLAT', quantiteTotale: 98, unite: 'portions', statut: 'EN_CUISSON' },
    { platId: 'p3', nomPlat: 'Pavé de Bœuf aux Herbes & Purée de Patates Douces', categorie: 'PLAT', quantiteTotale: 62, unite: 'portions', statut: 'PREPARATION_TERMINEE' },
    { platId: 'p4', nomPlat: 'Thiéboudienne Penda Mbaye Royal (Riz Rouge)', categorie: 'PLAT', quantiteTotale: 115, unite: 'portions', statut: 'EN_ATTENTE' },

    // ENTRÉES
    { platId: 'e1', nomPlat: 'Salade Niçoise au Thon Frais', categorie: 'ENTREE', quantiteTotale: 180, unite: 'barquettes', statut: 'PREPARATION_TERMINEE' },
    { platId: 'e2', nomPlat: 'Pastels Dorés au Thon (x3)', categorie: 'ENTREE', quantiteTotale: 130, unite: 'portions (390 pcs)', statut: 'EN_CUISSON' },
    { platId: 'e3', nomPlat: 'Velouté de Légumes & Croûtons d\'Ail', categorie: 'ENTREE', quantiteTotale: 110, unite: 'bols thermos', statut: 'PREPARATION_TERMINEE' },

    // DESSERTS
    { platId: 'd1', nomPlat: 'Coupe de Fruits Exotiques Frais', categorie: 'DESSERT', quantiteTotale: 210, unite: 'pots fraîcheur', statut: 'PREPARATION_TERMINEE' },
    { platId: 'd2', nomPlat: 'Fondant au Chocolat Noir Intense', categorie: 'DESSERT', quantiteTotale: 140, unite: 'portions', statut: 'PREPARATION_TERMINEE' },
    { platId: 'd3', nomPlat: 'Yaourt Onctueux Fait Maison au Miel', categorie: 'DESSERT', quantiteTotale: 70, unite: 'pots verre', statut: 'PREPARATION_TERMINEE' },

    // BOISSONS
    { platId: 'b1', nomPlat: 'Jus Naturel de Bissap Frais Menthe', categorie: 'BOISSON', quantiteTotale: 195, unite: 'bouteilles 33cl', statut: 'PREPARATION_TERMINEE' },
    { platId: 'b2', nomPlat: 'Jus de Bouye Artisanal (Baobab)', categorie: 'BOISSON', quantiteTotale: 155, unite: 'bouteilles 33cl', statut: 'PREPARATION_TERMINEE' },
    { platId: 'b3', nomPlat: 'Eau Minérale Naturelle Kirène (50cl)', categorie: 'BOISSON', quantiteTotale: 70, unite: 'bouteilles', statut: 'PREPARATION_TERMINEE' }
  ]);

  // Bons de livraison par site
  bonsLivraison = signal<BonLivraisonSite[]>([
    {
      id: 'bl-01',
      numeroBL: 'BL-KT-202611-001',
      dateLivraison: 'Aujourd\'hui (Midi)',
      siteId: 'site-1',
      siteNom: 'Siège Plateau - Dakar',
      adresseLivraison: 'Boulevard de la République, Dakar Plateau (Réfectoire 4ème étage)',
      creneau: '12h00 - 12h30',
      contactReferent: 'M. Babacar Ndiaye (RH)',
      telephoneReferent: '+221 77 123 45 67',
      nbPlateauxTotal: 220,
      chauffeurLivreur: 'Mamadou Seck (Camionnette isotherme KT-01)',
      heureDepartPrevue: '11h15',
      statut: 'EXPEDIE',
      emargementEffectue: false,
      lignes: [
        { employeNom: 'Ndiaye Babacar', matricule: 'TOT-9842', detailPlateau: 'Salade Niçoise + Poulet Yassa + Coupe Fruits + Bissap', emargement: 'En attente' },
        { employeNom: 'Fall Fatou', matricule: 'TOT-9843', detailPlateau: 'Pastels Dorés + Capitaine Riz + Fondant Choco + Jus Bouye', emargement: 'En attente' },
        { employeNom: 'Sarr Khady', matricule: 'TOT-9847', detailPlateau: 'Velouté Légumes + Pavé de Bœuf + Yaourt Miel + Eau Kirène', emargement: 'En attente' }
      ]
    },
    {
      id: 'bl-02',
      numeroBL: 'BL-KT-202611-002',
      dateLivraison: 'Aujourd\'hui (Midi)',
      siteId: 'site-2',
      siteNom: 'Dépôt Bel-Air / Port',
      adresseLivraison: 'Zone Industrielle Bel-Air, Port Autonome de Dakar (Salle de pause)',
      creneau: '12h15 - 12h45',
      contactReferent: 'Mme Aminata Sow (Logistique)',
      telephoneReferent: '+221 78 234 56 78',
      nbPlateauxTotal: 135,
      chauffeurLivreur: 'Ousmane Diallo (Fourgon KT-03)',
      heureDepartPrevue: '11h00',
      statut: 'A_PREPARER',
      emargementEffectue: false,
      lignes: [
        { employeNom: 'Diallo Mamadou', matricule: 'TOT-9844', detailPlateau: 'Pastels Dorés + Thiéboudienne + Fondant Choco + Jus Bissap', emargement: 'En attente' },
        { employeNom: 'Sow Aminata', matricule: 'TOT-9845', detailPlateau: 'Salade Niçoise + Capitaine Riz + Coupe Fruits + Eau Kirène', emargement: 'En attente' }
      ]
    },
    {
      id: 'bl-03',
      numeroBL: 'BL-KT-202611-003',
      dateLivraison: 'Aujourd\'hui (Midi)',
      siteId: 'site-3',
      siteNom: 'Plateforme Diamniadio',
      adresseLivraison: 'Pôle Urbain de Diamniadio, Dakar',
      creneau: '12h30 - 13h00',
      contactReferent: 'M. Cheikh Diop',
      telephoneReferent: '+221 76 345 67 89',
      nbPlateauxTotal: 65,
      chauffeurLivreur: 'Souleymane Ba (KT-02)',
      heureDepartPrevue: '10h45',
      statut: 'A_PREPARER',
      emargementEffectue: false,
      lignes: [
        { employeNom: 'Diop Cheikh', matricule: 'TOT-9846', detailPlateau: 'Velouté Légumes + Poulet Yassa + Yaourt Miel + Jus Bouye', emargement: 'En attente' }
      ]
    }
  ]);

  // Planning Semaine
  planningSemaine = signal([
    { jour: 'Lundi', date: '03 Nov', theme: 'Tradition Sénégalaise', platVedette: 'Thiéboudienne Penda Mbaye / Poulet Yassa Braisé', statut: 'SERVI' },
    { jour: 'Mardi (Aujourd\'hui)', date: '04 Nov', theme: 'Grillades & Fraîcheur Dakaroise', platVedette: 'Poulet Yassa Braisé / Capitaine au Feu de Bois', statut: 'EN_COURS' },
    { jour: 'Mercredi', date: '05 Nov', theme: 'Saveurs de l\'Atlantique', platVedette: 'Filet de Mérou Sauce Tomate Épicée / Riz Jasmin', statut: 'VALIDE' },
    { jour: 'Jeudi', date: '06 Nov', theme: 'Spécial Teranga & Rôtisserie', platVedette: 'Mafé de Bœuf Mijoté / Cuisse de Pintade', statut: 'PROGRAMME' },
    { jour: 'Vendredi', date: '07 Nov', theme: 'Street Food Gourmet Sénégalais', platVedette: 'Dibi d\'Agneau Kiki & Frites de Patate Douce', statut: 'PROGRAMME' }
  ]);

  // Calculs totaux
  totalPortionsPlats = computed(() => {
    return this.lignesProduction()
      .filter(l => l.categorie === 'PLAT')
      .reduce((sum, l) => sum + l.quantiteTotale, 0);
  });

  totalPortionsEntrees = computed(() => {
    return this.lignesProduction()
      .filter(l => l.categorie === 'ENTREE')
      .reduce((sum, l) => sum + l.quantiteTotale, 0);
  });

  totalPlateauxSites = computed(() => {
    const list = this.bonsLivraison();
    if (!list || list.length === 0) return 420;
    const total = list.reduce((sum, bl) => sum + (bl.nbPlateauxTotal || 0), 0);
    return total > 0 ? total : 420;
  });

  // Pagination et Filtrage de la Brigade
  filtreCategorie = signal<'TOUS' | 'PLAT' | 'ENTREE' | 'DESSERT' | 'BOISSON'>('TOUS');
  pageIndex = signal<number>(1);
  pageSize = signal<number>(5);

  lignesFiltrees = computed(() => {
    const cat = this.filtreCategorie();
    const list = this.lignesProduction();
    if (cat === 'TOUS') return list;
    return list.filter(l => l.categorie === cat);
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.lignesFiltrees().length / this.pageSize()));
  });

  pagesArray = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  lignesPaginees = computed(() => {
    const start = (this.pageIndex() - 1) * this.pageSize();
    return this.lignesFiltrees().slice(start, start + this.pageSize());
  });

  indexDebut = computed(() => {
    if (this.lignesFiltrees().length === 0) return 0;
    return (this.pageIndex() - 1) * this.pageSize() + 1;
  });

  indexFin = computed(() => {
    return Math.min(this.pageIndex() * this.pageSize(), this.lignesFiltrees().length);
  });

  allerPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.pageIndex.set(p);
    }
  }

  pagePrecedente() {
    if (this.pageIndex() > 1) {
      this.pageIndex.update(p => p - 1);
    }
  }

  pageSuivante() {
    if (this.pageIndex() < this.totalPages()) {
      this.pageIndex.update(p => p + 1);
    }
  }

  changerPageSize(size: number) {
    this.pageSize.set(size);
    this.pageIndex.set(1);
  }

  filtrerParCategorie(cat: 'TOUS' | 'PLAT' | 'ENTREE' | 'DESSERT' | 'BOISSON') {
    this.filtreCategorie.set(cat);
    this.pageIndex.set(1);
  }

  // Actions
  changerStatutCuisson(platId: string) {
    this.lignesProduction.update(lignes => lignes.map(l => {
      if (l.platId === platId) {
        let nextStatut: 'EN_ATTENTE' | 'EN_CUISSON' | 'PREPARATION_TERMINEE' = 'EN_CUISSON';
        if (l.statut === 'EN_ATTENTE') nextStatut = 'EN_CUISSON';
        else if (l.statut === 'EN_CUISSON') nextStatut = 'PREPARATION_TERMINEE';
        else nextStatut = 'EN_ATTENTE';
        return { ...l, statut: nextStatut };
      }
      return l;
    }));
  }

  ouvrirBordereau(bl: BonLivraisonSite) {
    this.selectedBL.set(bl);
    this.showBLModal.set(true);
  }

  validerEmargement() {
    if (this.selectedBL()) {
      const blId = this.selectedBL()!.id;
      this.bonsLivraison.update(list => list.map(b => {
        if (b.id === blId) {
          return { ...b, statut: 'LIVRE', emargementEffectue: true };
        }
        return b;
      }));
      this.showBLModal.set(false);
    }
  }

  // MÉTHODES SCANNER QR CODE RETRAIT AU FOOD TRUCK / RÉFECTOIRE
  traiterScanQr(code?: string) {
    const raw = (code || this.codeScanneInput()).trim();
    if (!raw) return;

    // Simulation de validation d'un QR code KT-TOT-XXXX-SITE-DATE
    const parts = raw.split('-');
    const matricule = parts.length >= 3 ? `${parts[1]}-${parts[2]}` : 'TOT-9842';
    const siteNom = this.b2b.currentEntreprise().sites[0]?.nom || 'Siège Plateau - Dakar';

    this.dernierScanValide.set({
      matricule,
      nom: 'Collaborateur Enrôlé TotalEnergies',
      site: siteNom,
      plat: 'Formule Midi Complète (1E + 1P + 1D + 1B)',
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });

    this.nbTotalScannesAujourdhui.update(n => n + 1);
    this.scanMessage.set(`Plateau validé avec succès pour le matricule ${matricule} !`);
    this.codeScanneInput.set('');

    setTimeout(() => {
      this.scanMessage.set(null);
    }, 4000);
  }

  // GESTION DU STATUT DES COMMANDES PERSONNELLES (AUTONOMES)
  changerStatutAutonome(cmdId: string, nouveauStatut: 'EN_PREPARATION' | 'PRET_AU_RETRAIT' | 'LIVRE') {
    this.commandesAutonomes.update(list => list.map(cmd => {
      if (cmd.id === cmdId) {
        return { ...cmd, statut: nouveauStatut };
      }
      return cmd;
    }));
  }
}

