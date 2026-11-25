import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SaTopbarComponent } from '../sa-topbar.component';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { PlatB2B, PlanningMenuSiteB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-sa-planning',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SaTopbarComponent],
  templateUrl: './sa-planning.component.html',
  styleUrls: ['../super-admin-shared.css']
})
export class SaPlanningComponent {
  b2b = inject(B2bStateService);

  constructor() {
  }

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

  planningSemaineGlobal = signal<PlanningMenuSiteB2B[]>([]);

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
  private readonly joursOrdre = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
  private readonly todayIndexSa = (new Date().getDay() + 6) % 7;
  jourPlanningGlobalActif = signal<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'>(
    this.joursOrdre[this.todayIndexSa]
  );
  weekOffsetSa = signal<number>(0);

  changerSemaineSa(delta: number): void {
    this.weekOffsetSa.update(w => w + delta);
  }

  semaineLabelSa = computed(() => {
    const offset = this.weekOffsetSa();
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - this.todayIndexSa + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const moisCourts = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const deb = `${String(monday.getDate()).padStart(2, '0')} ${moisCourts[monday.getMonth()]}`;
    const fin = `${String(sunday.getDate()).padStart(2, '0')} ${moisCourts[sunday.getMonth()]}`;
    return offset === 0 ? `Semaine en cours (${deb} - ${fin})` : `Semaine du ${deb} au ${fin}`;
  });

  datesSemaineMapSa = computed(() => {
    const offset = this.weekOffsetSa();
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - this.todayIndexSa + offset * 7);
    const moisCourts = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const map: Record<string, string> = {};
    this.joursOrdre.forEach((jour, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const label = `${String(d.getDate()).padStart(2, '0')} ${moisCourts[d.getMonth()]}`;
      map[jour] = label;
    });
    return map;
  });
  modeVuePlanning = signal<'semaine' | 'calendrier'>('semaine');
  moisCalendrierActif = signal<Date>(new Date());
  dateCalendrierSelectionnee = signal<string>(new Date().toISOString().slice(0, 10));

  private readonly joursSemaineNoms: Array<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'> = [
    'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'
  ];

  moisCalendrierLabel = computed(() => {
    const d = this.moisCalendrierActif();
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  joursCalendrierMois = computed(() => {
    const ref = this.moisCalendrierActif();
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Lundi = 0 ... Dimanche = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayIso = new Date().toISOString().slice(0, 10);
    const menus = this.b2b.menusPlanifiesEntreprises();

    const cells: Array<{
      dateNum: number;
      dateIso: string;
      inMonth: boolean;
      isToday: boolean;
      jourNom: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
      nbMets: number;
    }> = [];

    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(year, month, 1 - startOffset + i);
      const iso = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
      const dayIdx = (cellDate.getDay() + 6) % 7;
      const jourNom = this.joursSemaineNoms[dayIdx];
      const nbMets = menus.find(m => (m.entrepriseId === 'ent-001' || m.entrepriseId === 'GLOBAL') && m.jourNom === jourNom)?.lignes?.length || 0;
      cells.push({
        dateNum: cellDate.getDate(),
        dateIso: iso,
        inMonth: cellDate.getMonth() === month,
        isToday: iso === todayIso,
        jourNom,
        nbMets
      });
    }
    return cells;
  });

  changerMoisCalendrier(delta: number): void {
    const cur = this.moisCalendrierActif();
    this.moisCalendrierActif.set(new Date(cur.getFullYear(), cur.getMonth() + delta, 1));
  }

  selectionnerDateCalendrier(cell: {
    dateIso: string;
    inMonth: boolean;
    jourNom: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
  }): void {
    this.dateCalendrierSelectionnee.set(cell.dateIso);
    this.jourPlanningGlobalActif.set(cell.jourNom);
    if (!cell.inMonth) {
      const [y, m] = cell.dateIso.split('-').map(Number);
      this.moisCalendrierActif.set(new Date(y, m - 1, 1));
    }
  }
  modalAjouterPlatAuJourGlobal = signal<boolean>(false);
  categoriePlatAAjouter = signal<'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON'>('PLAT');

  // Plats du jour dans le planning modèle global (Lundi à Dimanche)
  menuModeleGlobalJourActif = computed(() => {
    const jour = this.jourPlanningGlobalActif();
    const menu = this.b2b.menusPlanifiesEntreprises().find(m => (m.entrepriseId === 'ent-001' || m.entrepriseId === 'GLOBAL') && m.jourNom === jour);
    if (!menu) return undefined;
    const archivedIds = new Set(this.b2b.catalogueJour().filter(p => !!p.isArchive).map(p => p.id));
    return {
      ...menu,
      lignes: menu.lignes.filter(l => !archivedIds.has(l.platId))
    };
  });

  // Plats disponibles dans le catalogue pour ajout au planning
  platsDisponiblesPourAjout = computed(() => {
    const cat = this.categoriePlatAAjouter();
    return this.b2b.catalogueJour().filter(p => !p.isArchive && p.categorie === cat);
  });

  ajouterPlatAuProgrammeGlobal(plat: PlatB2B) {
    const jour = this.jourPlanningGlobalActif();
    this.b2b.ajouterPlatMenuJour('ent-001', jour, plat, 35);
    this.modalAjouterPlatAuJourGlobal.set(false);
  }

  retirerPlatDuProgrammeGlobal(ligneId: string) {
    const jour = this.jourPlanningGlobalActif();
    this.b2b.supprimerLigneMenuJour(jour, ligneId);
  }

  deployerVersTousLesSites() {
    this.b2b.deployerProgrammationGlobaleVersEntreprises();
    this.b2b.showToast('Programmation globale synchronisée vers toutes les entreprises partenaires.', 'success');
  }

  // DUPLICATION & RECONDUCTION DU PLANNING GLOBAL
  modalDupliquerJourGlobal = signal<boolean>(false);
  jourCibleDuplicationGlobal = signal<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'>('Mardi');

  dupliquerJourGlobal() {
    const sourceJour = this.jourPlanningGlobalActif();
    const cibleJour = this.jourCibleDuplicationGlobal();
    if (sourceJour === cibleJour) {
      this.b2b.showToast('Veuillez sélectionner un jour de destination différent du jour source.', 'error');
      return;
    }

    const sourceMenu = this.b2b.menusPlanifiesEntreprises().find(m => (m.entrepriseId === 'ent-001' || m.entrepriseId === 'GLOBAL') && m.jourNom === sourceJour);
    if (!sourceMenu) return;

    this.b2b.dupliquerMenuJour(sourceMenu.id, cibleJour, sourceMenu.entrepriseId);

    this.modalDupliquerJourGlobal.set(false);
    this.jourPlanningGlobalActif.set(cibleJour);
    this.b2b.showToast(`Menu du ${sourceJour} dupliqué vers ${cibleJour} !`, 'success');
  }

  reconduireSemaineSuivante() {
    if (confirm('Voulez-vous reconduire l\'intégralité du programme hebdomadaire actuel sur la semaine suivante et synchroniser automatiquement vers les cantines partenaires ?')) {
      this.b2b.reconduireSemainePlanning('ent-001');
      this.b2b.showToast('Reconduction effectuée pour la semaine suivante !', 'success');
    }
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
      this.b2b.showToast('Veuillez renseigner le thème et le plat vedette.', 'error');
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

  getPlatImage(platId: string, fallback?: string): string {
    return this.b2b.catalogueJour().find(p => p.id === platId)?.image || fallback || '/assets/images/plats/p1.jpg';
  }
}
