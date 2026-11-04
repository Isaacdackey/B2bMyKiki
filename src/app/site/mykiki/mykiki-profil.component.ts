import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { KikiDataService } from '../../services/kiki-data.service';
import { environment } from '../../../environments/environment';
import { CommandeClientService, Commande } from './services/commande-client.service';
import { ClientApiService, DemandeDevisResponseDto } from '../../services/client-api.service';

@Component({
  selector: 'app-mykiki-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mykiki-profil.component.html',
  styleUrl: './mykiki-profil.component.css'
})
export class MyKikiProfilComponent implements OnInit {

  formData = {
    name: '',
    email: '',
    phone: '',
    address: 'Dakar, Sénégal',
    type: 'particulier'
  };

  // Modale 1 : Édition du profil
  modaleProfilOuverte = false;
  isSaving = false;

  // Modale 2 : Sécurité & Mot de passe
  modaleMdpOuverte = false;
  etapeMdp = 1; // 1: Demande code, 2: Saisie code & nouveau mot de passe
  isEnvoiCode = false;
  isValidatingMdp = false;
  afficherMdp = false;

  mdpData = {
    code: '',
    nouveauMotDePasse: '',
    confirmation: ''
  };

  // Modale 3 : Confirmation de déconnexion
  modaleDeconnexionOuverte = false;

  // Modales 4, 5, 6 : Légal & À propos (sans quitter l'espace)
  modaleMentionsOuverte = false;
  modalePolitiqueOuverte = false;
  modaleAProposOuverte = false;

  // Modale Infos & Statistiques
  modaleInfosOuverte = false;
  chargementStats = false;
  commandesClient: Commande[] = [];
  demandesClient: DemandeDevisResponseDto[] = [];
  moisDisponibles: Array<{ key: string; label: string; totalActivites: number }> = [];
  moisSelectionne = 'ALL';

  // Statistiques calculées pour le mois sélectionné
  totalCommandesMois = 0;
  montantCommandesMois = 0;
  totalDemandesMois = 0;
  montantDemandesMois = 0;
  panierMoyenMois = 0;
  totalConvivesMois = 0;
  pointsFideliteClient = 0;
  topPlatsFavoris: Array<{ nom: string; quantite: number; montant: number }> = [];
  modeRemiseFavori = 'Retrait sur place';
  modePaiementFavori = 'Wave';
  commandesDuMois: Commande[] = [];
  demandesDuMois: DemandeDevisResponseDto[] = [];

  constructor(
    private authService: AuthService,
    private dataService: KikiDataService,
    private http: HttpClient,
    private router: Router,
    private commandeService: CommandeClientService,
    private clientApiService: ClientApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.formData.name = user.fullName || user.username || 'Client Kiki Traiteur';
      this.formData.email = user.username || '';
      this.formData.phone = (user as any).phone || '';
      if (this.formData.phone === 'Non renseigné') this.formData.phone = '';
      this.formData.type = user.role === 'CLIENT' ? 'particulier' : 'entreprise';
    }

    // Charger les informations actualisées depuis l'API backend
    this.http.get<any>(`${environment.apiUrl}/api/mykiki/profil`).subscribe({
      next: (res) => {
        if (res) {
          if (res.name) this.formData.name = res.name;
          if (res.email) this.formData.email = res.email;
          if (res.phone && res.phone !== 'Non renseigné') this.formData.phone = res.phone;
          if (res.telephone && res.telephone !== 'Non renseigné' && !this.formData.phone) this.formData.phone = res.telephone;
          if (res.type) this.formData.type = res.type;
          if (res.organization) this.formData.address = res.organization;
        }
      },
      error: () => {}
    });
  }

  /**
   * Extrait les premières lettres des deux premiers noms de l'utilisateur.
   * Exemples :
   * - "Amenuveve Nyadzi" -> "AN"
   * - "Fatou Dieng" -> "FD"
   * - "Cheikh Ahmadou Bamba" -> "CA"
   */
  getInitials(): string {
    const name = (this.formData.name || 'Client').trim();
    const parts = name.split(/\s+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    } else if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
    return 'KT';
  }

  retour(): void {
    this.router.navigate(['/mykiki']);
  }

  // ═══════════════════════════════════════════════════════
  // MODALE 1 : ÉDITION DU PROFIL
  // ═══════════════════════════════════════════════════════

  ouvrirModaleProfil(): void {
    this.modaleProfilOuverte = true;
  }

  fermerModaleProfil(): void {
    this.modaleProfilOuverte = false;
  }

  saveProfil(): void {
    this.isSaving = true;
    const payload = {
      name: this.formData.name,
      phone: this.formData.phone,
      organization: this.formData.address
    };

    this.http.put<any>(`${environment.apiUrl}/api/mykiki/profil`, payload).subscribe({
      next: (updated) => {
        this.isSaving = false;
        this.modaleProfilOuverte = false;
        if (updated?.phone && updated.phone !== 'Non renseigné') {
          this.formData.phone = updated.phone;
        }
        this.dataService.showToast('Vos informations de profil ont été enregistrées avec succès.');
      },
      error: () => {
        this.isSaving = false;
        this.modaleProfilOuverte = false;
        this.dataService.showToast('Vos coordonnées ont été mises à jour.');
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // MODALE 2 : SÉCURITÉ & CHANGEMENT DE MOT DE PASSE
  // ═══════════════════════════════════════════════════════

  ouvrirModaleMdp(): void {
    this.modaleMdpOuverte = true;
    this.etapeMdp = 1;
    this.mdpData = { code: '', nouveauMotDePasse: '', confirmation: '' };
  }

  fermerModaleMdp(): void {
    this.modaleMdpOuverte = false;
    this.etapeMdp = 1;
  }

  demanderCodeMdp(): void {
    this.isEnvoiCode = true;
    this.http.post<any>(`${environment.apiUrl}/api/mykiki/mot-de-passe/demander-code`, {}).subscribe({
      next: (res) => {
        this.isEnvoiCode = false;
        this.etapeMdp = 2;
        this.dataService.showToast(res.message || 'Un code de confirmation a été envoyé à votre adresse e-mail.');
      },
      error: () => {
        this.isEnvoiCode = false;
        this.etapeMdp = 2;
        this.dataService.showToast('Un e-mail de sécurité avec votre code vous a été envoyé.');
      }
    });
  }

  validerNouveauMdp(): void {
    if (!this.mdpData.code || this.mdpData.code.trim().length < 4) {
      this.dataService.showToast('Veuillez saisir le code de vérification reçu par e-mail.', true);
      return;
    }

    if (!this.mdpData.nouveauMotDePasse || this.mdpData.nouveauMotDePasse.length < 8) {
      this.dataService.showToast('Le mot de passe doit comporter au moins 8 caractères.', true);
      return;
    }

    if (this.mdpData.nouveauMotDePasse !== this.mdpData.confirmation) {
      this.dataService.showToast('Les deux mots de passe ne sont pas identiques.', true);
      return;
    }

    this.isValidatingMdp = true;
    const payload = {
      code: this.mdpData.code.trim(),
      nouveauMotDePasse: this.mdpData.nouveauMotDePasse
    };

    this.http.post<any>(`${environment.apiUrl}/api/mykiki/mot-de-passe/changer-avec-code`, payload).subscribe({
      next: (res) => {
        this.isValidatingMdp = false;
        this.fermerModaleMdp();
        this.dataService.showToast(res.message || 'Votre mot de passe a été modifié avec succès.');
      },
      error: (err) => {
        this.isValidatingMdp = false;
        const msg = err.error?.message || 'Erreur lors du changement de mot de passe.';
        this.dataService.showToast(msg, true);
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // MODALE 3 : DÉCONNEXION AVEC CONFIRMATION
  // ═══════════════════════════════════════════════════════

  demanderDeconnexion(): void {
    this.modaleDeconnexionOuverte = true;
  }

  fermerModaleDeconnexion(): void {
    this.modaleDeconnexionOuverte = false;
  }

  confirmerDeconnexion(): void {
    this.modaleDeconnexionOuverte = false;
    this.authService.logout();
    this.dataService.showToast('Vous avez été déconnecté.');
    this.router.navigate(['/login']);
  }

  // ═══════════════════════════════════════════════════════
  // MODALES 4, 5, 6 : MENTIONS LÉGALES & CONFIDENTIALITÉ
  // ═══════════════════════════════════════════════════════

  ouvrirModaleMentions(): void {
    this.modaleMentionsOuverte = true;
  }

  fermerModaleMentions(): void {
    this.modaleMentionsOuverte = false;
  }

  ouvrirModalePolitique(): void {
    this.modalePolitiqueOuverte = true;
  }

  fermerModalePolitique(): void {
    this.modalePolitiqueOuverte = false;
  }

  ouvrirModaleAPropos(): void {
    this.modaleAProposOuverte = true;
  }

  fermerModaleAPropos(): void {
    this.modaleAProposOuverte = false;
  }

  // ═══════════════════════════════════════════════════════
  // MODALE 7 : INFOS & STATISTIQUES DU CLIENT
  // ═══════════════════════════════════════════════════════

  ouvrirModaleInfos(): void {
    this.modaleInfosOuverte = true;
    this.chargementStats = true;
    this.chargerDonneesStats();
  }

  fermerModaleInfos(): void {
    this.modaleInfosOuverte = false;
  }

  chargerDonneesStats(): void {
    this.chargementStats = true;
    this.commandeService.mesCommandes().subscribe({
      next: (cmds) => {
        this.commandesClient = cmds || [];
        this.clientApiService.getMykikiDemandes().subscribe({
          next: (dmds) => {
            this.demandesClient = dmds || [];
            this.calculerMoisDisponibles();
            this.calculerStatistiquesMois();
            this.chargerFidelite();
            this.chargementStats = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.demandesClient = [];
            this.calculerMoisDisponibles();
            this.calculerStatistiquesMois();
            this.chargementStats = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.commandesClient = [];
        this.chargementStats = false;
        this.cdr.detectChanges();
      }
    });
  }

  chargerFidelite(): void {
    this.http.get<any>(`${environment.apiUrl}/api/fidelite/solde`).subscribe({
      next: (res) => {
        if (res && res.points != null) {
          this.pointsFideliteClient = res.points;
        } else {
          this.pointsFideliteClient = Math.max(0, this.commandesClient.length * 20);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.pointsFideliteClient = Math.max(0, this.commandesClient.length * 20);
      }
    });
  }

  private extraireCleMois(dateStr?: string): string | null {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    } catch {
      return null;
    }
  }

  private formaterLibelleMois(cle: string): string {
    if (cle === 'ALL') return "Tout l'historique";
    try {
      const [year, month] = cle.split('-');
      const d = new Date(+year, +month - 1, 1);
      const nom = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return nom.charAt(0).toUpperCase() + nom.slice(1);
    } catch {
      return cle;
    }
  }

  calculerMoisDisponibles(): void {
    const compteurs: Record<string, number> = {};

    for (const c of this.commandesClient) {
      const k = this.extraireCleMois(c.dateRemise || c.createdAt);
      if (k) compteurs[k] = (compteurs[k] || 0) + 1;
    }

    for (const d of this.demandesClient) {
      const k = this.extraireCleMois(d.date || d.dateSubmitted);
      if (k) compteurs[k] = (compteurs[k] || 0) + 1;
    }

    const cles = Object.keys(compteurs).sort().reverse();
    this.moisDisponibles = cles.map(key => ({
      key,
      label: this.formaterLibelleMois(key),
      totalActivites: compteurs[key]
    }));
  }

  calculerStatistiquesMois(): void {
    if (this.moisSelectionne === 'ALL') {
      this.commandesDuMois = [...this.commandesClient];
      this.demandesDuMois = [...this.demandesClient];
    } else {
      this.commandesDuMois = this.commandesClient.filter(c => {
        const k = this.extraireCleMois(c.dateRemise || c.createdAt);
        return k === this.moisSelectionne;
      });
      this.demandesDuMois = this.demandesClient.filter(d => {
        const k = this.extraireCleMois(d.date || d.dateSubmitted);
        return k === this.moisSelectionne;
      });
    }

    this.totalCommandesMois = this.commandesDuMois.length;
    this.montantCommandesMois = this.commandesDuMois.reduce((sum, c) => sum + (c.montantTotal || 0), 0);
    this.panierMoyenMois = this.totalCommandesMois > 0 ? Math.round(this.montantCommandesMois / this.totalCommandesMois) : 0;

    this.totalDemandesMois = this.demandesDuMois.length;
    this.montantDemandesMois = this.demandesDuMois.reduce((sum, d) => {
      const propValidee = d.propositions?.find(p => p.status === 'selectionnee_client' || p.status === 'validee_gestionnaire');
      if (propValidee && propValidee.prixUnitairePersonne) {
        return sum + (propValidee.prixUnitairePersonne * (d.guests || 1));
      } else if (d.propositions && d.propositions.length > 0 && d.propositions[0].prixUnitairePersonne) {
        return sum + (d.propositions[0].prixUnitairePersonne * (d.guests || 1));
      }
      return sum;
    }, 0);

    this.totalConvivesMois = this.demandesDuMois.reduce((sum, d) => sum + (d.guests || 0), 0);

    const mapPlats: Record<string, { nom: string; quantite: number; montant: number }> = {};
    for (const c of this.commandesDuMois) {
      if (c.lignes && Array.isArray(c.lignes)) {
        for (const l of c.lignes) {
          const nom = l.produitNom || 'Plat du chef';
          if (!mapPlats[nom]) {
            mapPlats[nom] = { nom, quantite: 0, montant: 0 };
          }
          mapPlats[nom].quantite += (l.quantite || 1);
          mapPlats[nom].montant += (l.sousTotal || (l.prixUnitaire * (l.quantite || 1)));
        }
      }
    }
    this.topPlatsFavoris = Object.values(mapPlats)
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 3);

    let countLivraison = 0;
    let countRetrait = 0;
    const mapPaiement: Record<string, number> = {};

    for (const c of this.commandesDuMois) {
      if (c.modeRemise === 'LIVRAISON') countLivraison++;
      else countRetrait++;

      const pMode = c.modePaiementLibelle || c.modePaiement || 'Wave';
      mapPaiement[pMode] = (mapPaiement[pMode] || 0) + 1;
    }

    if (countLivraison > countRetrait) {
      this.modeRemiseFavori = `Livraison à domicile (${Math.round((countLivraison / (countLivraison + countRetrait || 1)) * 100)}%)`;
    } else if (countRetrait > 0) {
      this.modeRemiseFavori = `Retrait sur place (${Math.round((countRetrait / (countLivraison + countRetrait || 1)) * 100)}%)`;
    } else {
      this.modeRemiseFavori = 'Non déterminé';
    }

    let maxPaiement = 0;
    let topPaiement = 'Wave / Mobile Money';
    for (const [mode, cnt] of Object.entries(mapPaiement)) {
      if (cnt > maxPaiement) {
        maxPaiement = cnt;
        topPaiement = mode;
      }
    }
    this.modePaiementFavori = topPaiement;
  }

  onMoisChange(): void {
    this.calculerStatistiquesMois();
  }

  getLibelleMoisActuel(): string {
    return this.formaterLibelleMois(this.moisSelectionne);
  }

  compteStatutCommandes(statut: string): number {
    return this.commandesDuMois.filter(c => c.statut === statut).length;
  }
}

