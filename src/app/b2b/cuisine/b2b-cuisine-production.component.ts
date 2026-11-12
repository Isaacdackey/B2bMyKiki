import { B2bNavComponent } from '../shared/b2b-nav.component';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../shared/b2b-state.service';
import { EntrepriseB2B, EmployeB2B, CommandeEntrepriseSite, FacturationLigneJournaliere, MenuPlanifieJourEntreprise, ReclamationCutOffB2B } from '../shared/b2b.models';

@Component({
  selector: 'app-b2b-cuisine-production',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, B2bNavComponent],
  templateUrl: './b2b-cuisine-production.component.html',
  styleUrls: ['./b2b-cuisine-production.component.css']
})
export class B2bCuisineProductionComponent {
  b2b = inject(B2bStateService);

  // Synchronisation avec l'onglet actif
  get activeTab() {
    return this.b2b.cuisineActiveTab;
  }

  setTab(tab: 'INFOS' | 'UTILISATEURS' | 'MENU' | 'COMMANDES' | 'FACTURATION' | 'RECLAMATIONS' | 'PROJECTION_QR') {
    this.b2b.cuisineActiveTab.set(tab);
  }

  // Entreprise & Site géré par le Responsable de Site Kiki
  entreprise = computed(() => this.b2b.currentEntreprise());

  // Utilisateurs du site géré
  employesSite = computed(() => {
    const entId = this.entreprise().id;
    return this.b2b.listeEmployes().filter(e => {
      return (e.siteNom && e.siteNom.toLowerCase().includes('plateau')) || e.siteId === 'site-1';
    });
  });

  employesSubventionnesCount = computed(() => {
    return this.employesSite().filter(e => e.type === 'SUBVENTIONNE' && e.actif).length;
  });

  // Plats du Catalogue Global pour ajout/remplacement
  catalogueGlobal = computed(() => this.b2b.catalogueJour().filter(p => !p.isArchive));

  // Menus de la semaine pour l'entreprise
  menusSemaine = computed(() => {
    const entId = this.entreprise().id;
    return this.b2b.menusPlanifiesEntreprises().filter(m => m.entrepriseId === entId);
  });

  joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
  jourSelectionne = signal<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'>('Jeudi');

  changerJour(jour: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche') {
    this.jourSelectionne.set(jour);
  }

  menuJourActif = computed(() => {
    const jour = this.jourSelectionne();
    return this.menusSemaine().find(m => m.jourNom === jour) || null;
  });

  // GESTION DU QR CODE CANTINE DU JOUR À PROJETER (Grand Écran)
  showModalProjection = signal<boolean>(false);
  qrCantineString = computed(() => {
    const ent = this.entreprise();
    const today = new Date().toISOString().slice(0, 10);
    return `KT-CANTINE-${ent.codeEntreprise || 'TOT'}-${today}`;
  });

  // Matrice 25x25 pour le QR Code Cantine projeté
  qrCantineMatrix = computed(() => {
    return this.generateQrMatrix(this.qrCantineString());
  });

  ouvrirModalProjection() {
    this.showModalProjection.set(true);
  }

  fermerModalProjection() {
    this.showModalProjection.set(false);
  }

  // SIMULER SCAN D'UN EMPLOYÉ (Quand un employé scanne le QR code du jour à la cantine)
  simulerScanEmploye(cmdId: string) {
    this.b2b.scannerCommandeSite(cmdId);
  }

  // MARQUER LIVRÉ (Autorisé uniquement si la commande est à l'état 'SCANNE')
  marquerLivre(cmdId: string) {
    this.b2b.marquerCommandeLivree(cmdId);
  }

  // COMMANDES DU JOUR POUR LE SITE
  commandesSite = computed(() => {
    const entId = this.entreprise().id;
    return this.b2b.listeCommandesSite().filter(c => c.entrepriseId === entId);
  });

  commandesScanneesCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'SCANNE').length;
  });

  commandesLivreesCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'LIVRE').length;
  });

  commandesEnAttenteCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'EN_COURS').length;
  });

  // GESTION DES RÉCLAMATIONS RETARDATAIRES (Cut-off dépassé)
  reclamations = computed(() => {
    const entId = this.entreprise().id;
    return this.b2b.listeReclamations().filter(r => r.entrepriseId === entId);
  });

  reclamationsEnAttenteCount = computed(() => {
    return this.reclamations().filter(r => r.statut === 'EN_ATTENTE').length;
  });

  debloquerEmploye(reclamationId: string) {
    this.b2b.debloquerReclamation(reclamationId);
  }

  // FACTURATION JOURNALIÈRE DU SITE
  facturationJournaliere = computed<FacturationLigneJournaliere[]>(() => {
    return this.b2b.lignesFacturationEntreprise();
  });

  totalFactureMoisSite = computed<number>(() => {
    return this.facturationJournaliere().reduce((sum: number, l: FacturationLigneJournaliere) => sum + (l.montantPartEntreprise || 0), 0);
  });

  totalPlatsLivresMoisSite = computed<number>(() => {
    return this.facturationJournaliere().reduce((sum: number, l: FacturationLigneJournaliere) => sum + (l.nbPlatsLivres || 0), 0);
  });

  // MODAL AJOUT PLAT AU MENU
  showModalAjoutPlat = signal<boolean>(false);
  platSelectionnePourAjout = signal<string>('');
  quantiteInitialeAjout = signal<number>(40);

  ouvrirModalAjoutPlat() {
    this.platSelectionnePourAjout.set('');
    this.quantiteInitialeAjout.set(this.employesSubventionnesCount() || 40);
    this.showModalAjoutPlat.set(true);
  }

  fermerModalAjoutPlat() {
    this.showModalAjoutPlat.set(false);
  }

  confirmerAjoutPlat() {
    const platId = this.platSelectionnePourAjout();
    const plat = this.catalogueGlobal().find(p => p.id === platId);
    const menuJour = this.menuJourActif();
    if (!plat || !menuJour) return;

    this.b2b.menusPlanifiesEntreprises.update(list => list.map(m => {
      if (m.id === menuJour.id) {
        const newLine = {
          id: 'l-' + Date.now(),
          categorie: plat.categorie,
          platId: plat.id,
          nomPlat: plat.nom,
          image: plat.image,
          quantitePrevue: this.quantiteInitialeAjout(),
          disponible: true
        };
        const newLignes = [...m.lignes, newLine];
        return {
          ...m,
          lignes: newLignes,
          quantitesSaisies: true
        };
      }
      return m;
    }));

    this.fermerModalAjoutPlat();
  }

  // MODIFICATION DE QUANTITÉ PAR PLAT
  onQuantiteChange(ligneId: string, nouvelleQuantite: number) {
    const menuJour = this.menuJourActif();
    if (!menuJour) return;
    this.b2b.updateQuantitePlatMenu(menuJour.id, ligneId, nouvelleQuantite, this.employesSubventionnesCount());
  }

  supprimerLigneMenu(ligneId: string) {
    const menuJour = this.menuJourActif();
    if (!menuJour) return;

    this.b2b.menusPlanifiesEntreprises.update(list => list.map(m => {
      if (m.id === menuJour.id) {
        return {
          ...m,
          lignes: m.lignes.filter(l => l.id !== ligneId)
        };
      }
      return m;
    }));
  }

  // CALCUL DE CONFORMITÉ PAR CATÉGORIE POUR LE JOUR SÉLECTIONNÉ
  getSommeCategorie(cat: string): number {
    const m = this.menuJourActif();
    if (!m) return 0;
    return m.lignes.filter(l => l.categorie === cat).reduce((sum, l) => sum + (l.quantitePrevue || 0), 0);
  }

  isCategorieConforme(cat: string): boolean {
    const somme = this.getSommeCategorie(cat);
    return somme >= this.employesSubventionnesCount();
  }

  getLibellePrestation(type: string): string {
    const found = this.b2b.typesPrestationConfigurables().find(p => p.code === type);
    return found ? found.libelle : type;
  }

  getLibelleCutOff(e: EntrepriseB2B): string {
    const moment = e.cutOffType === 'J_MOINS_1' ? 'La veille (J-1)' : 'Le jour même (Jour J)';
    return `${e.cutOffHeure} (${moment})`;
  }

  // Génération de QR Code SVG Haute Précision
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
