import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CommandeClientService, Commande } from './services/commande-client.service';
import { ClientApiService, DemandeDevisResponseDto, PropositionDto } from '../../services/client-api.service';
import { AuthService } from '../../core/services/auth.service';
import { KikiDataService } from '../../services/kiki-data.service';
import { CommandeStoreService, LivreurAssigne } from '../../services/commande-store.service';

export interface AvisCommande {
  commandeId: number;
  note: number;
  commentaire?: string;
  criteres?: string[];
  dateAvis: string;
}

@Component({
  selector: 'app-mykiki-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mykiki-commandes.component.html',
  styleUrl: './mykiki-commandes.component.css'
})
export class MyKikiCommandesComponent implements OnInit {
  ongletPrincipal: 'COMMANDES' | 'DEMANDES' = 'COMMANDES';

  // Commandes
  commandes: Commande[] = [];
  chargement = true;
  filtreActif = 'TOUTES';
  rechercheTexte = '';
  commandeDetail: Commande | null = null;
  modaleDetailOuverte = false;

  // Demandes de devis
  demandes: DemandeDevisResponseDto[] = [];
  chargementDemandes = false;
  nombrePropositionsEnAttente = 0;

  // Modale proposition
  modalePropositionOuverte = false;
  propositionCourante: PropositionDto | null = null;
  demandeCourante: DemandeDevisResponseDto | null = null;
  commentaireReponse = '';
  envoiReponse = false;

  // Notation
  modaleNotationOuverte = false;
  commandeSelectionneeNotation: Commande | null = null;
  noteChoisie = 5;
  survolNote = 0;
  commentaireAvis = '';
  criteresSelectionnes: string[] = [];
  readonly listeCriteres = [
    'Saveur des mets 😋',
    'Ponctualité de remise ⏱️',
    'Emballage soigné 🎁',
    'Accueil & amabilité 🤝',
    'Portions généreuses 🍽️'
  ];
  commandeANoter: Commande | null = null;

  readonly etapes = [
    { statut: 'EN_ATTENTE', libelle: 'En attente' },
    { statut: 'ACCEPTEE',   libelle: 'Validée' },
    { statut: 'EN_COURS',   libelle: 'En cuisine' },
    { statut: 'PRETE',      libelle: 'Prête' },
    { statut: 'TERMINEE',   libelle: 'Retirée / Livrée' }
  ];

  configFidelite: any = {
    pointsAvisClient: 20,
    delaiApparitionAvisHeures: 0,
    dureeValiditeAvisJours: 7
  };

  constructor(
    private api: CommandeClientService,
    private clientApi: ClientApiService,
    private auth: AuthService,
    private store: CommandeStoreService,
    private dataService: KikiDataService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  getClientName(target?: any): string {
    const user = this.auth.getCurrentUser();
    return target?.client?.name || target?.clientNom || target?.clientName || user?.fullName || 'Client';
  }

  getClientEmail(target?: any): string {
    const user = this.auth.getCurrentUser();
    return target?.client?.email || target?.clientEmail || (user as any)?.email || user?.username || 'client@kikitraiteur.com';
  }

  getClientPhone(target?: any): string {
    const user = this.auth.getCurrentUser();
    return target?.client?.phone || target?.clientTelephone || target?.clientPhone || (user as any)?.phone || '+221 77 000 00 00';
  }

  getInitials(name?: string): string {
    const target = (name || this.getClientName()).trim();
    if (!target) return 'CL';
    const parts = target.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.substring(0, 2).toUpperCase();
  }

  ngOnInit(): void {
    this.chargerCommandes();
    this.chargerDemandes();
    this.chargerConfigFidelite();
    this.checkQueryParams();
  }

  chargerConfigFidelite(): void {
    this.http.get<any>(`${environment.apiUrl}/api/fidelite/config`).subscribe({
      next: (cfg) => {
        if (cfg) {
          this.configFidelite = { ...this.configFidelite, ...cfg };
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      const cId = params['commandeId'] || params['cmdId'];
      const dId = params['demandeId'];
      const tab = params['tab'];

      if (tab === 'demandes' || tab === 'DEMANDES' || dId) {
        this.ongletPrincipal = 'DEMANDES';
        if (this.demandes.length === 0) {
          this.chargerDemandes();
        }
      } else if (tab === 'commandes' || tab === 'COMMANDES' || cId) {
        this.ongletPrincipal = 'COMMANDES';
      }

      if (cId) {
        this.ongletPrincipal = 'COMMANDES';
        if (this.commandes.length > 0) {
          const match = this.commandes.find(c => c.id?.toString() === cId.toString() || c.numero === cId);
          if (match) this.ouvrirDetail(match);
        }
      } else if (dId) {
        this.ongletPrincipal = 'DEMANDES';
        if (this.demandes.length > 0) {
          const match = this.demandes.find(d => d.id?.toString() === dId.toString());
          if (match) this.ouvrirDetailDemande(match);
        }
      }
    });
  }

  changerOngletPrincipal(onglet: 'COMMANDES' | 'DEMANDES'): void {
    this.ongletPrincipal = onglet;
    if (onglet === 'DEMANDES' && this.demandes.length === 0) {
      this.chargerDemandes();
    }
  }

  chargerCommandes(): void {
    this.chargement = true;
    this.api.mesCommandes().subscribe({
      next: (liste) => {
        this.commandes = liste || [];
        this.detecterCommandeANoter();
        this.chargement = false;
        this.checkQueryParams();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Erreur de chargement des commandes depuis le serveur', err);
        this.commandes = [];
        this.detecterCommandeANoter();
        this.chargement = false;
        this.checkQueryParams();
        this.cdr.detectChanges();
      }
    });
  }

  chargerDemandes(): void {
    this.chargementDemandes = true;
    this.clientApi.getMykikiDemandes().subscribe({
      next: (dems) => {
        this.demandes = dems || [];
        this.calculerPropositionsEnAttente();
        this.chargementDemandes = false;
        this.checkQueryParams();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Erreur chargement demandes depuis le serveur', err);
        this.demandes = [];
        this.chargementDemandes = false;
        this.cdr.detectChanges();
      }
    });
  }

  private calculerPropositionsEnAttente(): void {
    let count = 0;
    this.demandes.forEach(d => {
      if (this.aNouvelleProposition(d)) count++;
    });
    this.nombrePropositionsEnAttente = count;
  }

  isPropSelectionnee(p?: PropositionDto | null, demId?: number): boolean {
    if (!p) return false;
    const st = (p.status || '').toLowerCase();
    if (st === 'selectionnee_client' || st === 'selection_client' || st === 'validee_gestionnaire' || st === 'devis_valide' || st === 'choix_valides' || st === 'validee' || st === 'valide' || st === 'accepted') {
      return true;
    }
    if (typeof localStorage !== 'undefined') {
      if (p.id && localStorage.getItem('kiki_prop_choices_' + p.id)) {
        return true;
      }
      if (demId && localStorage.getItem('kiki_demande_choices_' + demId)) {
        return true;
      }
    }
    return false;
  }

  isPropRefusee(p?: PropositionDto | null, demId?: number): boolean {
    if (!p) return false;
    const st = (p.status || '').toLowerCase();
    if (st === 'refusee_client' || st === 'refusee' || st === 'refuse' || st === 'rejetee' || st === 'rejete' || st === 'non_retenue' || st === 'rejected') {
      return true;
    }
    if (typeof localStorage !== 'undefined') {
      if (p.id && localStorage.getItem('kiki_prop_refused_' + p.id)) {
        return true;
      }
      if (demId && localStorage.getItem('kiki_demande_refused_' + demId)) {
        return true;
      }
    }
    return false;
  }

  hasPropositionSelectionnee(d?: DemandeDevisResponseDto | null): boolean {
    if (!d) return false;
    const demStatus = (d.status || '').toUpperCase();
    if (demStatus === 'PROPOSITION_VALIDEE' || demStatus === 'SELECTION_CLIENT') {
      return true;
    }
    if (typeof localStorage !== 'undefined' && d.id) {
      if (localStorage.getItem('kiki_demande_choices_' + d.id)) return true;
    }
    if (d.propositions && d.propositions.length > 0) {
      return d.propositions.some(p => this.isPropSelectionnee(p, d.id));
    }
    return false;
  }

  aNouvelleProposition(d: DemandeDevisResponseDto): boolean {
    if (!d) return false;
    const demStatus = (d.status || '').toUpperCase();
    if (this.hasPropositionSelectionnee(d) 
        || demStatus === 'PROPOSITION_VALIDEE' 
        || demStatus === 'SELECTION_CLIENT'
        || demStatus === 'ACCEPTEE' 
        || demStatus === 'ACCEPTED' 
        || demStatus === 'ABOUTI' 
        || demStatus === 'ABOUTIS' 
        || demStatus === 'ANNULEE' 
        || demStatus === 'CANCELLED'
        || demStatus === 'REFUSEE_CLIENT'
        || demStatus === 'PROPOSITION_REFUSEE'
        || demStatus === 'REJECTED') {
      return false;
    }
    if (typeof localStorage !== 'undefined' && d.id) {
      const savedStatus = localStorage.getItem('kiki_demande_status_' + d.id);
      if (savedStatus === 'PROPOSITION_VALIDEE' || savedStatus === 'REFUSEE_CLIENT' || savedStatus === 'PROPOSITION_REFUSEE') {
        return false;
      }
    }
    // S'il y a des propositions
    if (d.propositions && d.propositions.length > 0) {
      // Le bandeau s'affiche UNIQUEMENT s'il existe au moins une proposition en attente
      return d.propositions.some(p => !this.isPropSelectionnee(p, d.id) && !this.isPropRefusee(p, d.id) && (p.status === 'envoyee' || p.status === 'vue' || !p.status));
    }
    return demStatus === 'PROPOSITION_ENVOYEE' || demStatus === 'PROPOSITIONS_ENVOYEES';
  }

  selectionsProposition: { [sectionId: string]: number[] } = {};

  toggleChoixItem(section: any, item: any, maxChoix: number = 1): void {
    if (this.isPropSelectionnee(this.propositionCourante, this.demandeCourante?.id)) {
      return; // Mode consultation en lecture seule
    }
    const secId = section && typeof section === 'object' ? section.id : section;
    const itId = item && typeof item === 'object' ? item.id : item;
    if (secId == null || itId == null) return;

    const key = String(secId);
    if (!this.selectionsProposition[key]) {
      this.selectionsProposition[key] = [];
    }
    const current = this.selectionsProposition[key];
    const index = current.findIndex(x => x === itId || x === Number(itId));
    if (index > -1) {
      current.splice(index, 1);
    } else {
      if (maxChoix <= 1) {
        this.selectionsProposition[key] = [itId];
      } else if (current.length < maxChoix) {
        this.selectionsProposition[key].push(itId);
      } else {
        this.selectionsProposition[key].shift();
        this.selectionsProposition[key].push(itId);
      }
    }
    this.cdr.detectChanges();
  }

  isItemSelected(section: any, item: any): boolean {
    if (!section || !item) return false;
    const secId = typeof section === 'object' ? section.id : section;
    const secNom = typeof section === 'object' ? section.nom : null;
    const itId = typeof item === 'object' ? item.id : item;
    const itNom = typeof item === 'object' ? item.nom : null;

    // 1. Recherche par section ID numérique ou string
    if (secId != null) {
      const list = this.selectionsProposition[secId] || this.selectionsProposition[String(secId)];
      if (Array.isArray(list)) {
        if (itId != null && (list.includes(itId) || list.includes(Number(itId)))) return true;
        if (itNom && list.some((x: any) => String(x).trim().toLowerCase() === itNom.trim().toLowerCase())) return true;
      }
    }

    // 2. Recherche par nom de section
    if (secNom && this.selectionsProposition[secNom]) {
      const list = this.selectionsProposition[secNom];
      if (Array.isArray(list)) {
        if (itNom && list.some((x: any) => String(x).trim().toLowerCase() === itNom.trim().toLowerCase())) return true;
        if (itId != null && (list.includes(itId) || list.includes(Number(itId)))) return true;
      }
    }

    // 3. Flag natif isSelected
    if (typeof item === 'object' && item.isSelected === true) return true;

    return false;
  }

  getSelectedCountForSection(section: any): number {
    if (!section || !section.items || !Array.isArray(section.items)) return 0;
    return section.items.filter((it: any) => this.isItemSelected(section, it)).length;
  }

  canValidateProposition(): boolean {
    if (!this.propositionCourante) return false;
    if (!this.propositionCourante.sections || this.propositionCourante.sections.length === 0) {
      return true; // Pas de sections imposées
    }
    // Chaque section ayant des mets DOIT avoir au moins 1 mets sélectionné
    return this.propositionCourante.sections.every(s => {
      if (!s.items || s.items.length === 0) return true;
      const count = this.getSelectedCountForSection(s);
      const max = s.maxChoix && s.maxChoix > 0 ? s.maxChoix : Infinity;
      return count >= 1 && count <= max;
    });
  }

  getMissingSectionsNames(): string[] {
    if (!this.propositionCourante || !this.propositionCourante.sections) return [];
    return this.propositionCourante.sections
      .filter(s => s.items && s.items.length > 0 && this.getSelectedCountForSection(s) === 0)
      .map(s => s.nom);
  }

  aAuMoinsUnChoix(): boolean {
    return this.canValidateProposition();
  }

  examinerProposition(d: DemandeDevisResponseDto, propSpecifique?: PropositionDto): void {
    this.demandeCourante = d;
    const prop = propSpecifique || (d.propositions && d.propositions.length > 0 ? d.propositions[0] : null);
    this.propositionCourante = prop;
    this.commentaireReponse = '';
    this.selectionsProposition = {};

    if (prop) {
      // 1. Tenter de charger depuis prop.clientSelection venant de la base de données
      if (prop.clientSelection) {
        try {
          const raw = typeof prop.clientSelection === 'string' ? JSON.parse(prop.clientSelection) : prop.clientSelection;
          if (raw && typeof raw === 'object') {
            const rawSelections = raw.selections || raw;
            if (prop.sections) {
              prop.sections.forEach(s => {
                const sIdKey = String(s.id);
                const itemsList = s.items || [];
                const chosenFromId = rawSelections[s.id] || rawSelections[sIdKey];
                const chosenFromNom = rawSelections[s.nom];

                if (!this.selectionsProposition[sIdKey]) {
                  this.selectionsProposition[sIdKey] = [];
                }

                if (Array.isArray(chosenFromId)) {
                  chosenFromId.forEach((v: any) => {
                    const num = Number(v);
                    if (!isNaN(num) && !this.selectionsProposition[sIdKey].includes(num)) {
                      this.selectionsProposition[sIdKey].push(num);
                    }
                  });
                }
                if (Array.isArray(chosenFromNom)) {
                  chosenFromNom.forEach((nom: any) => {
                    const found = itemsList.find(it => it.nom && it.nom.trim().toLowerCase() === String(nom).trim().toLowerCase());
                    if (found && found.id && !this.selectionsProposition[sIdKey].includes(found.id)) {
                      this.selectionsProposition[sIdKey].push(found.id);
                    }
                  });
                }
              });
            }
          }
        } catch (e) {
          console.warn('Erreur parsing clientSelection dans examinerProposition', e);
        }
      }

      // 2. Tenter depuis prop.choixClient venant du mapper
      const hasSelections = Object.values(this.selectionsProposition).some(arr => arr && arr.length > 0);
      if (!hasSelections && (prop as any).choixClient && Array.isArray((prop as any).choixClient) && prop.sections) {
        (prop as any).choixClient.forEach((bloc: any) => {
          const targetSec = prop.sections!.find(s => s.nom === bloc.sectionNom || String(s.id) === String(bloc.sectionNom));
          if (targetSec && bloc.items && Array.isArray(bloc.items)) {
            const sKey = String(targetSec.id);
            if (!this.selectionsProposition[sKey]) {
              this.selectionsProposition[sKey] = [];
            }
            bloc.items.forEach((itLabel: string) => {
              const cleanName = itLabel.split('(')[0].trim().toLowerCase();
              const matched = (targetSec.items || []).find(it => it.nom && it.nom.trim().toLowerCase() === cleanName);
              if (matched && matched.id && !this.selectionsProposition[sKey].includes(matched.id)) {
                this.selectionsProposition[sKey].push(matched.id);
              }
            });
          }
        });
      }

      // 3. Tenter depuis localStorage si toujours vide
      const stillEmpty = !Object.values(this.selectionsProposition).some(arr => arr && arr.length > 0);
      if (stillEmpty) {
        try {
          const savedProp = typeof localStorage !== 'undefined' ? localStorage.getItem('kiki_prop_choices_' + prop.id) : null;
          const savedDem = typeof localStorage !== 'undefined' ? localStorage.getItem('kiki_demande_choices_' + d.id) : null;
          const saved = savedProp || savedDem;
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.selections && typeof parsed.selections === 'object') {
              Object.keys(parsed.selections).forEach(k => {
                const arr = parsed.selections[k];
                if (Array.isArray(arr) && arr.length > 0) {
                  this.selectionsProposition[k] = arr;
                }
              });
            }
            if (parsed.comment) this.commentaireReponse = parsed.comment;
          }
        } catch (e) {}
      }

      // 4. Reconstituer depuis clientComment si toujours vide
      const afterLocalEmpty = !Object.values(this.selectionsProposition).some(arr => arr && arr.length > 0);
      if (afterLocalEmpty && prop.clientComment) {
        this.reconstituerChoixDepuisCommentaire(prop);
      }

      // 5. Reconstituer depuis les flags isSelected sur les items
      const afterCommentEmpty = !Object.values(this.selectionsProposition).some(arr => arr && arr.length > 0);
      if (afterCommentEmpty && prop.sections) {
        prop.sections.forEach(s => {
          const sKey = String(s.id);
          (s.items || []).forEach(it => {
            if ((it as any).isSelected === true) {
              if (!this.selectionsProposition[sKey]) {
                this.selectionsProposition[sKey] = [];
              }
              if (!this.selectionsProposition[sKey].includes(it.id)) {
                this.selectionsProposition[sKey].push(it.id);
              }
            }
          });
        });
      }
    }

    this.modalePropositionOuverte = true;
    this.modaleHistoriquePropositionsOuverte = false;
    this.cdr.detectChanges();
  }

  reconstituerChoixDepuisCommentaire(prop: PropositionDto): void {
    if (!prop || !prop.sections || !prop.clientComment) return;
    prop.sections.forEach(s => {
      const sKey = String(s.id);
      (s.items || []).forEach(it => {
        if (prop.clientComment!.includes(it.nom)) {
          if (!this.selectionsProposition[sKey]) {
            this.selectionsProposition[sKey] = [];
          }
          if (!this.selectionsProposition[sKey].includes(it.id)) {
            this.selectionsProposition[sKey].push(it.id);
          }
        }
      });
    });
  }

  getCommentaireAffiche(): string {
    if (this.commentaireReponse) return this.commentaireReponse;
    if (this.propositionCourante?.clientComment) {
      return this.propositionCourante.clientComment.replace(/\[Choix validés:[^\]]+\]/g, '').trim();
    }
    return '';
  }

  fermerModaleProposition(): void {
    this.modalePropositionOuverte = false;
    this.propositionCourante = null;
    this.demandeCourante = null;
  }

  accepterProposition(): void {
    if (!this.demandeCourante || !this.propositionCourante) return;

    if (!this.canValidateProposition()) {
      const missing = this.getMissingSectionsNames();
      this.dataService.showToast(
        `Veuillez sélectionner au moins un met dans chaque section (${missing.join(', ')}) avant d'envoyer votre validation.`,
        true
      );
      return;
    }

    this.envoiReponse = true;
    const propId = this.propositionCourante.id;
    const demId = this.demandeCourante.id;

    let payloadComment = this.commentaireReponse || '';
    const selectedSummary: string[] = [];
    const namedSelections: { [sectionNom: string]: string[] } = {};
    const detailedItems: any[] = [];

    if (this.propositionCourante.sections) {
      this.propositionCourante.sections.forEach(s => {
        const chosenItems = (s.items || []).filter(it => this.isItemSelected(s, it));
        if (chosenItems.length > 0) {
          selectedSummary.push(`${s.nom}: ${chosenItems.map(it => it.nom).join(', ')}`);
          namedSelections[s.nom] = chosenItems.map(it => it.nom);
          chosenItems.forEach(it => {
            detailedItems.push({
              id: it.id,
              nom: it.nom,
              description: it.description,
              sectionId: s.id,
              sectionNom: s.nom
            });
          });
        }
      });
    }

    if (selectedSummary.length > 0) {
      payloadComment = `[Choix validés: ${selectedSummary.join(' | ')}] ${payloadComment}`.trim();
    }

    const payloadSelectionObj = {
      ...this.selectionsProposition,
      ...namedSelections,
      selections: this.selectionsProposition,
      summary: selectedSummary,
      items: detailedItems,
      validatedAt: new Date().toISOString()
    };
    const selectionJsonString = JSON.stringify(payloadSelectionObj);

    // Persister localement pour réaffichage immédiat et pérenne
    try {
      const payloadCache = JSON.stringify({
        selections: this.selectionsProposition,
        comment: this.commentaireReponse,
        summary: selectedSummary,
        validatedAt: new Date().toISOString()
      });
      if (propId) {
        localStorage.setItem('kiki_prop_choices_' + propId, payloadCache);
        localStorage.removeItem('kiki_prop_refused_' + propId);
      }
      if (demId) {
        localStorage.setItem('kiki_demande_choices_' + demId, payloadCache);
        localStorage.setItem('kiki_demande_status_' + demId, 'PROPOSITION_VALIDEE');
        localStorage.removeItem('kiki_demande_refused_' + demId);
      }
    } catch (e) {}

    // Mise à jour synchrone de l'état local
    this.propositionCourante.status = 'selectionnee_client';
    this.propositionCourante.clientComment = payloadComment;
    this.propositionCourante.clientSelection = selectionJsonString;
    this.demandeCourante.status = 'PROPOSITION_VALIDEE';
    if (this.demandeCourante.propositions) {
      this.demandeCourante.propositions.forEach(p => {
        if (p.id === propId) {
          p.status = 'selectionnee_client';
          p.clientComment = payloadComment;
          p.clientSelection = selectionJsonString;
        } else {
          p.status = 'non_retenue';
        }
      });
    }

    // Mettre à jour également dans la liste principale des demandes
    const demItem = this.demandes.find(d => d.id === demId);
    if (demItem) {
      demItem.status = 'PROPOSITION_VALIDEE';
      if (demItem.propositions) {
        demItem.propositions.forEach(p => {
          if (p.id === propId) {
            p.status = 'selectionnee_client';
            p.clientComment = payloadComment;
            p.clientSelection = selectionJsonString;
          } else {
            p.status = 'non_retenue';
          }
        });
      }
    }

    this.calculerPropositionsEnAttente();
    this.cdr.detectChanges();

    this.clientApi.respondToProposition(demId, propId, {
      status: 'ACCEPTED',
      comment: payloadComment,
      selection: selectionJsonString
    }).subscribe({
      next: () => {
        this.dataService.showToast('Proposition acceptée et choix enregistrés ! Notre brigade prépare votre événement.');
        this.envoiReponse = false;
        this.fermerModaleProposition();
        this.chargerDemandes();
      },
      error: (err) => {
        console.warn('Fallback validerProposition suite à:', err);
        this.clientApi.validerProposition(demId, payloadComment, selectionJsonString).subscribe({
          next: () => {
            this.dataService.showToast('Proposition acceptée et choix enregistrés !');
            this.envoiReponse = false;
            this.fermerModaleProposition();
            this.chargerDemandes();
          },
          error: () => {
            this.clientApi.validerPropositionById(propId, { clientComment: payloadComment, clientSelection: selectionJsonString }).subscribe({
              next: () => {
                this.dataService.showToast('Proposition acceptée et choix enregistrés !');
                this.envoiReponse = false;
                this.fermerModaleProposition();
                this.chargerDemandes();
              },
              error: () => {
                this.dataService.showToast('Votre validation a bien été enregistrée.');
                this.envoiReponse = false;
                this.fermerModaleProposition();
                this.chargerDemandes();
              }
            });
          }
        });
      }
    });
  }

  refuserProposition(): void {
    if (!this.demandeCourante || !this.propositionCourante) return;
    this.envoiReponse = true;
    const propId = this.propositionCourante.id;
    const demId = this.demandeCourante.id;

    // Persister localement le refus
    try {
      if (propId) {
        localStorage.setItem('kiki_prop_refused_' + propId, 'true');
        localStorage.removeItem('kiki_prop_choices_' + propId);
      }
      if (demId) {
        localStorage.setItem('kiki_demande_refused_' + demId, 'true');
        localStorage.setItem('kiki_demande_status_' + demId, 'REFUSEE_CLIENT');
        localStorage.removeItem('kiki_demande_choices_' + demId);
      }
    } catch (e) {}

    this.propositionCourante.status = 'refusee_client';
    this.propositionCourante.clientComment = this.commentaireReponse;
    this.demandeCourante.status = 'REFUSEE_CLIENT';
    if (this.demandeCourante.propositions) {
      this.demandeCourante.propositions.forEach(p => {
        if (p.id === propId) {
          p.status = 'refusee_client';
          p.clientComment = this.commentaireReponse;
        }
      });
    }

    // Mettre à jour dans la liste principale
    const demItem = this.demandes.find(d => d.id === demId);
    if (demItem) {
      demItem.status = 'REFUSEE_CLIENT';
      if (demItem.propositions) {
        demItem.propositions.forEach(p => {
          if (p.id === propId) {
            p.status = 'refusee_client';
            p.clientComment = this.commentaireReponse;
          }
        });
      }
    }

    this.calculerPropositionsEnAttente();
    this.cdr.detectChanges();

    this.clientApi.respondToProposition(demId, propId, {
      status: 'REJECTED',
      comment: this.commentaireReponse
    }).subscribe({
      next: () => {
        this.dataService.showToast('Votre retour a été transmis à notre Chef pour révision.');
        this.envoiReponse = false;
        this.fermerModaleProposition();
        this.chargerDemandes();
      },
      error: () => {
        this.dataService.showToast('Votre retour a bien été enregistré.');
        this.envoiReponse = false;
        this.fermerModaleProposition();
        this.chargerDemandes();
      }
    });
  }

  libellePrestation(d: DemandeDevisResponseDto): string {
    if (d.prestationTitle && d.prestationTitle.trim()) {
      return d.prestationTitle;
    }
    const raw = d.prestationId || d.evenementNature || '';
    if (!raw) return 'Prestation Traiteur';
    
    const map: { [key: string]: string } = {
      'restauration-entreprise': 'Restauration d\'Entreprise',
      'mariage-reception': 'Mariage & Réception',
      'cocktail-dinatoire': 'Cocktail Dînatoire',
      'pause-cafe': 'Pause Café & Goûter',
      'reception-privee': 'Réception Privée',
      'plateaux-repas': 'Plateaux Repas',
      'evenement-sur-mesure': 'Événement Sur-Mesure'
    };
    if (map[raw.toLowerCase()]) return map[raw.toLowerCase()];
    
    return raw.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getStatutDemandeEffectif(demandeOrStatus: DemandeDevisResponseDto | string): string {
    if (!demandeOrStatus) return 'EN_ATTENTE';
    if (typeof demandeOrStatus === 'string') return demandeOrStatus;
    const d = demandeOrStatus;

    // 1. Si devis finalisé / accepté
    const demStatus = (d.status || '').toUpperCase();
    if (demStatus === 'ACCEPTEE' || demStatus === 'ACCEPTED' || demStatus === 'DEVIS_VALIDE' || demStatus === 'ABOUTI' || demStatus === 'ABOUTIS') {
      return 'ACCEPTEE';
    }

    // 2. Si une formule a été validée par le client
    if (this.hasPropositionSelectionnee(d) || demStatus === 'PROPOSITION_VALIDEE' || demStatus === 'SELECTION_CLIENT') {
      return 'PROPOSITION_VALIDEE';
    }

    // Local override
    if (typeof localStorage !== 'undefined' && d.id) {
      const savedStatus = localStorage.getItem('kiki_demande_status_' + d.id);
      if (savedStatus) return savedStatus;
    }

    // 3. Analyse des propositions existantes
    if (d.propositions && d.propositions.length > 0) {
      // S'il y a une proposition validée
      if (d.propositions.some(p => this.isPropSelectionnee(p, d.id))) {
        return 'PROPOSITION_VALIDEE';
      }
      // S'il y a une proposition en attente reçue du chef
      const hasEnAttente = d.propositions.some(p => (p.status === 'envoyee' || p.status === 'vue' || !p.status) && !this.isPropRefusee(p, d.id));
      if (hasEnAttente || demStatus === 'PROPOSITION_ENVOYEE' || demStatus === 'PROPOSITIONS_ENVOYEES') {
        return 'PROPOSITION_ENVOYEE';
      }

      // Si toutes les propositions ont été refusées par le client
      const allRefused = d.propositions.every(p => this.isPropRefusee(p, d.id));
      if (allRefused) {
        return 'PROPOSITION_REFUSEE';
      }
    }

    if (demStatus === 'REFUSEE_CLIENT' || demStatus === 'PROPOSITION_REFUSEE') {
      return 'PROPOSITION_REFUSEE';
    }

    if (demStatus === 'ANNULEE' || demStatus === 'CANCELLED' || demStatus === 'REJECTED') {
      return 'ANNULEE';
    }

    if (demStatus === 'PROPOSITION_ENVOYEE' || demStatus === 'PROPOSITIONS_ENVOYEES') {
      return 'PROPOSITION_ENVOYEE';
    }

    return d.status || 'EN_ATTENTE';
  }

  libelleStatutDemande(demandeOrStatus: DemandeDevisResponseDto | string): string {
    const st = this.getStatutDemandeEffectif(demandeOrStatus);
    switch (st?.toUpperCase()) {
      case 'EN_ATTENTE':
      case 'PENDING':
        return 'En étude';
      case 'PROPOSITION_ENVOYEE':
      case 'PROPOSITIONS_ENVOYEES':
      case 'PROPOSAL_SENT':
        return 'Proposition reçue';
      case 'PROPOSITION_VALIDEE':
      case 'SELECTION_CLIENT':
        return 'Proposition validée';
      case 'PROPOSITION_REFUSEE':
      case 'REFUSEE_CLIENT':
        return 'Proposition refusée';
      case 'ACCEPTEE':
      case 'ACCEPTED':
      case 'ABOUTI':
      case 'ABOUTIS':
      case 'DEVIS_VALIDE':
        return 'Devis accepté';
      case 'ANNULEE':
      case 'CANCELLED':
        return 'Annulée';
      default:
        return 'En étude';
    }
  }

  classeStatutDemande(demandeOrStatus: DemandeDevisResponseDto | string): string {
    const st = this.getStatutDemandeEffectif(demandeOrStatus);
    switch (st?.toUpperCase()) {
      case 'EN_ATTENTE':
      case 'PENDING':
        return 'st-attente';
      case 'PROPOSITION_ENVOYEE':
      case 'PROPOSITIONS_ENVOYEES':
      case 'PROPOSAL_SENT':
        return 'st-proposition';
      case 'PROPOSITION_VALIDEE':
      case 'SELECTION_CLIENT':
        return 'st-validee';
      case 'PROPOSITION_REFUSEE':
      case 'REFUSEE_CLIENT':
        return 'st-refusee';
      case 'ACCEPTEE':
      case 'ACCEPTED':
      case 'ABOUTI':
      case 'ABOUTIS':
      case 'DEVIS_VALIDE':
        return 'st-acceptee';
      case 'ANNULEE':
      case 'CANCELLED':
        return 'st-annulee';
      default:
        return 'st-attente';
    }
  }

  iconeStatutDemande(demandeOrStatus: DemandeDevisResponseDto | string): string {
    const st = this.getStatutDemandeEffectif(demandeOrStatus);
    switch (st?.toUpperCase()) {
      case 'EN_ATTENTE':
      case 'PENDING':
        return 'fa-hourglass-half';
      case 'PROPOSITION_ENVOYEE':
      case 'PROPOSAL_SENT':
        return 'fa-bell';
      case 'PROPOSITION_VALIDEE':
        return 'fa-check';
      case 'PROPOSITION_REFUSEE':
        return 'fa-rotate-left';
      case 'ACCEPTEE':
      case 'ACCEPTED':
        return 'fa-check-double';
      case 'ANNULEE':
      case 'CANCELLED':
        return 'fa-ban';
      default:
        return 'fa-circle-info';
    }
  }

  filtreDemandeActif = 'TOUTES';
  demandeSelectionnee: DemandeDevisResponseDto | null = null;
  modaleDetailDemandeOuverte = false;

  setFiltreDemande(f: string): void {
    this.filtreDemandeActif = f;
    this.filtrer();
  }

  compterStatutDemande(st: string): number {
    if (st === 'EN_ATTENTE') {
      return this.demandes.filter(d => (d.status || '').toUpperCase() === 'EN_ATTENTE' || (d.status || '').toUpperCase() === 'PENDING').length;
    }
    if (st === 'PROPOSITION_ENVOYEE') {
      return this.demandes.filter(d => this.aNouvelleProposition(d)).length;
    }
    if (st === 'ACCEPTEE') {
      return this.demandes.filter(d => {
        const s = (d.status || '').toUpperCase();
        return s === 'ACCEPTEE' || s === 'ACCEPTED' || s === 'PROPOSITION_VALIDEE';
      }).length;
    }
    if (st === 'ANNULEE') {
      return this.demandes.filter(d => (d.status || '').toUpperCase() === 'ANNULEE' || (d.status || '').toUpperCase() === 'CANCELLED').length;
    }
    return 0;
  }

  get demandesFiltrees(): DemandeDevisResponseDto[] {
    let res = [...this.demandes];
    if (this.filtreDemandeActif === 'EN_ATTENTE') {
      res = res.filter(d => (d.status || '').toUpperCase() === 'EN_ATTENTE' || (d.status || '').toUpperCase() === 'PENDING');
    } else if (this.filtreDemandeActif === 'PROPOSITION_ENVOYEE') {
      res = res.filter(d => this.aNouvelleProposition(d));
    } else if (this.filtreDemandeActif === 'ACCEPTEE') {
      res = res.filter(d => {
        const s = (d.status || '').toUpperCase();
        return s === 'ACCEPTEE' || s === 'ACCEPTED' || s === 'PROPOSITION_VALIDEE';
      });
    } else if (this.filtreDemandeActif === 'ANNULEE') {
      res = res.filter(d => (d.status || '').toUpperCase() === 'ANNULEE' || (d.status || '').toUpperCase() === 'CANCELLED');
    }
    return res;
  }

  ouvrirDetailDemande(d: DemandeDevisResponseDto): void {
    this.demandeSelectionnee = d;
    this.modaleDetailDemandeOuverte = true;
  }

  fermerDetailDemande(): void {
    this.modaleDetailDemandeOuverte = false;
    this.demandeSelectionnee = null;
  }

  // Modales Historique & Devis
  modaleHistoriquePropositionsOuverte = false;
  modaleDevisOuverte = false;
  devisCourant: DemandeDevisResponseDto | null = null;
  propositionsDemande: PropositionDto[] = [];
  chargementPropositionsDemande = false;

  isDemandeAboutie(d: DemandeDevisResponseDto | null | undefined): boolean {
    if (!d) return false;
    const st = (d.status || '').toUpperCase();
    if (st === 'ACCEPTEE' || st === 'ACCEPTED' || st === 'VALIDEE' || st === 'ABOUTI' || st === 'ABOUTIS' || st === 'DEVIS_VALIDE' || st === 'DEVIS_ENVOYE' || st === 'CONFIRMEE' || st === 'TERMINEE' || st === 'PROPOSITION_VALIDEE') {
      return true;
    }
    if (d.propositions && d.propositions.some(p => p.status === 'selectionnee_client' || p.status === 'validee_gestionnaire' || p.status === 'devis_valide')) {
      return true;
    }
    return false;
  }

  ouvrirHistoriquePropositions(d: DemandeDevisResponseDto): void {
    this.demandeCourante = d;
    this.propositionsDemande = d.propositions || [];
    this.modaleHistoriquePropositionsOuverte = true;
    
    if (!this.propositionsDemande || this.propositionsDemande.length === 0) {
      this.chargementPropositionsDemande = true;
      this.clientApi.getPropositions().subscribe({
        next: (allProps) => {
          this.propositionsDemande = (allProps || []).filter(p => p.demandeId === d.id || (p.demande && p.demande.id === d.id));
          this.chargementPropositionsDemande = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.chargementPropositionsDemande = false;
        }
      });
    }
  }

  fermerHistoriquePropositions(): void {
    this.modaleHistoriquePropositionsOuverte = false;
  }

  ouvrirDevis(d: DemandeDevisResponseDto): void {
    this.devisCourant = d;
    this.modaleDevisOuverte = true;
  }

  fermerDevis(): void {
    this.modaleDevisOuverte = false;
    this.devisCourant = null;
  }

  imprimerDevis(): void {
    window.print();
  }

  getPropositionRetenue(d: DemandeDevisResponseDto): PropositionDto | null {
    if (!d.propositions || d.propositions.length === 0) return null;
    const accepted = d.propositions.find(p => p.status === 'selectionnee_client' || p.status === 'validee_gestionnaire');
    return accepted || d.propositions[0];
  }

  calculerTotalDevis(d: DemandeDevisResponseDto): number {
    const prop = this.getPropositionRetenue(d);
    if (prop && prop.prixUnitairePersonne) {
      return prop.prixUnitairePersonne * (d.guests || 1);
    }
    return 0;
  }

  get commandesFiltrees(): Commande[] {
    let res = [...this.commandes];

    if (this.filtreActif === 'EN_ATTENTE') {
      res = res.filter(c => c.statut === 'EN_ATTENTE');
    } else if (this.filtreActif === 'EN_COURS') {
      res = res.filter(c => c.statut === 'ACCEPTEE' || c.statut === 'EN_COURS');
    } else if (this.filtreActif === 'PRETE') {
      res = res.filter(c => c.statut === 'PRETE');
    } else if (this.filtreActif === 'TERMINEE') {
      res = res.filter(c => c.statut === 'TERMINEE');
    }

    if (this.rechercheTexte.trim()) {
      const q = this.rechercheTexte.toLowerCase().trim();
      res = res.filter(c => 
        c.numero.toLowerCase().includes(q) ||
        (c.lignes && c.lignes.some(l => l.produitNom.toLowerCase().includes(q))) ||
        (c.adresseLivraison && c.adresseLivraison.toLowerCase().includes(q))
      );
    }

    return res;
  }

  filtrer(): void {
    this.cdr.detectChanges();
  }

  setFiltre(f: string): void {
    this.filtreActif = f;
    this.filtrer();
  }

  compterStatut(statut: string): number {
    return this.commandes.filter(c => c.statut === statut).length;
  }

  ouvrirDetail(c: Commande): void {
    this.commandeDetail = c;
    this.modaleDetailOuverte = true;
  }

  fermerDetail(): void {
    this.modaleDetailOuverte = false;
    this.commandeDetail = null;
  }

  getLivreur(commandeId: number): LivreurAssigne | null {
    return this.store.getLivreur(commandeId);
  }

  detecterCommandeANoter(): void {
    const termineeNonNotee = this.commandes.find(c => c.statut === 'TERMINEE' && !this.getAvis(c.id));
    this.commandeANoter = termineeNonNotee || null;
  }

  getAvis(commandeId: number): AvisCommande | null {
    try {
      const raw = localStorage.getItem(`kiki_avis_commande_${commandeId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  ouvrirNotation(c: Commande): void {
    this.commandeSelectionneeNotation = c;
    const existant = this.getAvis(c.id);
    if (existant) {
      this.noteChoisie = existant.note || 5;
      this.commentaireAvis = existant.commentaire || '';
      this.criteresSelectionnes = existant.criteres || [];
    } else {
      this.noteChoisie = 5;
      this.commentaireAvis = '';
      this.criteresSelectionnes = [];
    }
    this.survolNote = 0;
    this.modaleNotationOuverte = true;
  }

  fermerNotation(): void {
    this.modaleNotationOuverte = false;
    this.commandeSelectionneeNotation = null;
  }

  definirNote(note: number): void {
    this.noteChoisie = note;
  }

  toggleCritere(critere: string): void {
    const idx = this.criteresSelectionnes.indexOf(critere);
    if (idx >= 0) {
      this.criteresSelectionnes.splice(idx, 1);
    } else {
      this.criteresSelectionnes.push(critere);
    }
  }

  critereEstSelectionne(critere: string): boolean {
    return this.criteresSelectionnes.includes(critere);
  }

  libelleNote(n: number): string {
    switch (n) {
      case 1: return '1/5 — Décevant';
      case 2: return '2/5 — Passable';
      case 3: return '3/5 — Bon';
      case 4: return '4/5 — Très bon !';
      case 5: return '5/5 — Exceptionnel !';
      default: return 'Sélectionnez une note';
    }
  }

  peutNoterCommande(c: Commande): boolean {
    if (c.statut !== 'TERMINEE') return false;
    if (this.estCommandeNotee(c)) return false;

    const dateRefStr = c.dateRemise || c.createdAt;
    if (!dateRefStr) return true;

    const dateRef = new Date(dateRefStr).getTime();
    const now = Date.now();

    const delaiHeures = this.configFidelite?.delaiApparitionAvisHeures ?? 0;
    const dureeJours = this.configFidelite?.dureeValiditeAvisJours ?? 7;

    const dateApparition = dateRef + (delaiHeures * 60 * 60 * 1000);
    const dateExpiration = dateApparition + (dureeJours * 24 * 60 * 60 * 1000);

    if (now < dateApparition) return false;
    if (now > dateExpiration) return false;

    return true;
  }

  estCommandeNotee(c: Commande): boolean {
    return !!(this.getAvis(c.id) || (c.noteClientAvis && c.noteClientAvis > 0));
  }

  getNoteCommande(c: Commande): number {
    const local = this.getAvis(c.id);
    return local?.note || c.noteClientAvis || 5;
  }

  enregistrerAvis(): void {
    if (!this.commandeSelectionneeNotation || this.noteChoisie === 0) return;
    const cmdId = this.commandeSelectionneeNotation.id;
    const cmdNum = this.commandeSelectionneeNotation.numero;
    const avis: AvisCommande = {
      commandeId: cmdId,
      note: this.noteChoisie,
      commentaire: this.commentaireAvis.trim(),
      criteres: [...this.criteresSelectionnes],
      dateAvis: new Date().toISOString()
    };

    localStorage.setItem(`kiki_avis_commande_${cmdId}`, JSON.stringify(avis));
    this.commandeSelectionneeNotation.noteClientAvis = this.noteChoisie;
    this.api.noterCommande(cmdId, this.noteChoisie, this.commentaireAvis.trim()).subscribe();

    const ptsBonus = this.configFidelite?.pointsAvisClient ?? 20;
    const msg = ptsBonus > 0
      ? `Merci pour votre avis sur la commande ${cmdNum} ! Vous avez gagné +${ptsBonus} points de fidélité 🎁.`
      : `Merci pour votre avis sur la commande ${cmdNum} !`;

    this.dataService.showToast(msg);
    this.fermerNotation();
    this.detecterCommandeANoter();
    this.cdr.detectChanges();
  }

  indiceEtape(statut: string): number {
    return this.etapes.findIndex(e => e.statut === statut);
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

  iconeStatut(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'fa-clock';
      case 'ACCEPTEE':   return 'fa-check';
      case 'EN_COURS':   return 'fa-fire-burner';
      case 'PRETE':      return 'fa-box-open';
      case 'TERMINEE':   return 'fa-check-double';
      case 'ANNULEE':    return 'fa-ban';
      default:           return 'fa-circle-info';
    }
  }

  peutAnnulerCommande(c: Commande | null): boolean {
    if (!c) return false;
    return c.statut === 'EN_ATTENTE' || c.statut === 'ACCEPTEE';
  }

  demanderAnnulation(c: Commande): void {
    if (!this.peutAnnulerCommande(c)) return;

    const confirmation = confirm(`Êtes-vous sûr de vouloir annuler la commande ${c.numero} ?\nCette action notifiera immédiatement le gestionnaire.`);
    if (!confirmation) return;

    const motifSaisi = prompt('Motif de l\'annulation (facultatif) :', '') ?? '';

    this.api.annulerCommande(c.id, motifSaisi || 'Annulée à la demande du client').subscribe({
      next: () => {
        c.statut = 'ANNULEE';
        c.statutLibelle = 'Annulée';
        c.motifAnnulation = motifSaisi || 'Annulée par le client';
        this.dataService.showToast(`Votre commande ${c.numero} a été annulée. Le gestionnaire a été notifié.`);
        this.chargerCommandes();
        this.cdr.detectChanges();
      },
      error: () => {
        c.statut = 'ANNULEE';
        c.statutLibelle = 'Annulée';
        c.motifAnnulation = motifSaisi || 'Annulée par le client';
        this.dataService.showToast(`Votre commande ${c.numero} a été annulée.`);
        this.chargerCommandes();
        this.cdr.detectChanges();
      }
    });
  }
}
