import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';

@Component({
  selector: 'app-cuisine-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cuisine-menu.component.html',
  styleUrls: ['../cuisine-shared.css']
})
export class CuisineMenuComponent {
  b2b = inject(B2bStateService);
  constructor() {
    if (this.b2b.currentSession().role !== 'RESPONSABLE_SITE_KIKI') {
      this.b2b.setSessionRole({
        role: 'RESPONSABLE_SITE_KIKI',
        nomComplet: 'Moussa Kane (Gérant Cantine)',
        titrePoste: 'Responsable de Site Kiki Traiteur',
        entite: 'TotalEnergies Sénégal',
        siteId: 'site-1',
        siteNom: 'Siège Plateau - Dakar',
        badge: 'Gérant Exploitation Site',
        badgeColor: '#3D5A80'
      });
    }
  }

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
  private readonly todayIndexCuisine = (new Date().getDay() + 6) % 7;
  jourAujourdhui = this.joursSemaine[this.todayIndexCuisine];
  jourSelectionne = signal<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'>(
    this.jourAujourdhui
  );
  datesSemaineMapCuisine: Record<string, string> = this.buildDatesSemaineMapCuisine();

  private buildDatesSemaineMapCuisine(): Record<string, string> {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - this.todayIndexCuisine);
    const moisCourts = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const map: Record<string, string> = {};
    this.joursSemaine.forEach((jour, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      map[jour] = `${String(d.getDate()).padStart(2, '0')} ${moisCourts[d.getMonth()]}`;
    });
    return map;
  }

  changerJour(jour: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche') {
    this.jourSelectionne.set(jour);
  }

  menuJourActif = computed(() => {
    const jour = this.jourSelectionne();
    const menu = this.menusSemaine().find(m => m.jourNom === jour) || null;
    if (!menu) return null;
    const archivedIds = new Set(this.b2b.catalogueJour().filter(p => !!p.isArchive).map(p => p.id));
    return {
      ...menu,
      lignes: menu.lignes.filter(l => !archivedIds.has(l.platId))
    };
  });

  // GESTION DU QR CODE CANTINE DU JOUR À PROJETER (Grand Écran)
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

    this.b2b.ajouterPlatMenuJour(menuJour.entrepriseId, menuJour.jourNom, plat, this.quantiteInitialeAjout());
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

    this.b2b.supprimerLigneMenuJour(menuJour.id, ligneId);
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
}
