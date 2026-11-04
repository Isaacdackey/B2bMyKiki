import { B2bNavComponent } from '../shared/b2b-nav.component';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../shared/b2b-state.service';
import { DemandeEvenementB2B, PropositionEvenement, LigneDevisDetaillee } from './b2b-evenements.models';

@Component({
  selector: 'app-b2b-evenements-devis',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, B2bNavComponent],
  templateUrl: './b2b-evenements-devis.component.html',
  styleUrls: ['./b2b-evenements-devis.component.css']
})
export class B2bEvenementsDevisComponent {
  b2b = inject(B2bStateService);

  // Onglet actif : 'NOUVELLE_DEMANDE' | 'MES_DEVIS' | 'ESPACE_GESTIONNAIRE'
  activeView = signal<'NOUVELLE_DEMANDE' | 'MES_DEVIS' | 'ESPACE_GESTIONNAIRE'>('MES_DEVIS');

  // Formulaire nouvelle demande
  formDemande = signal<Partial<DemandeEvenementB2B>>({
    typeEvenement: 'SALLE_DIVA_PRIVATISATION',
    lieuChoisi: 'SALLE_DIVA',
    dateEvenement: '2026-12-15',
    heureDebut: '18:30',
    heureFin: '23:30',
    nbConvives: 80,
    budgetEstime: 3500000,
    besoinsSpecifiques: ['Privatisation Salle Diva', 'Cocktail Dînatoire 15 pièces', 'Service en gants blancs', 'Équipement Sono & Vidéoprojecteur']
  });

  demandeEnvoyeeSucces = signal<boolean>(false);

  // Liste des demandes d'événements
  demandes = signal<DemandeEvenementB2B[]>([
    {
      id: 'dem-01',
      reference: 'DEV-KT-DIVA-2026-08',
      entrepriseNom: 'TotalEnergies Sénégal',
      demandeurNom: 'M. Babacar Ndiaye (Directeur RSE & Com)',
      demandeurEmail: 'b.ndiaye@totalenergies.sn',
      demandeurTelephone: '+221 77 123 45 67',
      typeEvenement: 'SALLE_DIVA_PRIVATISATION',
      lieuChoisi: 'SALLE_DIVA',
      dateEvenement: 'Jeudi 18 Décembre 2026',
      heureDebut: '19h00',
      heureFin: '00h00',
      nbConvives: 120,
      budgetEstime: 4500000,
      besoinsSpecifiques: ['Privatisation intégrale Salle Diva', 'Buffet Gastronomique Prestige', 'Bar à Champagne & Cocktails', 'Animation musicale Live Band'],
      statut: 'PROPOSITION_ENVOYEE',
      proposition: {
        id: 'prop-01',
        demandeId: 'dem-01',
        numeroDevis: 'PROP-DIVA-2026-1104',
        dateEmission: '04 Novembre 2026',
        validiteDate: '15 Novembre 2026 (10 jours)',
        gestionnaireNom: 'M. Kiki (Chef Traiteur & Sommelier)',
        statut: 'EN_ATTENTE_CLIENT',
        lignes: [
          { id: 'l1', designation: 'Privatisation Exclusive Salle Diva (19h - 01h)', description: 'Mise à disposition du salon de réception, climatisation, mobilier VIP et éclairage d\'ambiance tamisé', quantite: 1, unite: 'forfait soirée', prixUnitaire: 850000, totalHT: 850000 },
          { id: 'l2', designation: 'Cocktail Dînatoire Prestige Kiki Traiteur (18 pièces/pers.)', description: 'Atelier découpe jambon braisé, brochettes gambas marinées, verrines foie gras, canapés saumon fumé & macarons artisanaux', quantite: 120, unite: 'convives', prixUnitaire: 22000, totalHT: 2640000 },
          { id: 'l3', designation: 'Forfait Boissons Festives & Softs Illimités', description: 'Vins fins, jus de fruits tropicaux pressés minute (bissap, ananas menthe), eau minérale et champagne grand cru (1 bouteille / 3 pers)', quantite: 120, unite: 'forfaits boisson', prixUnitaire: 6500, totalHT: 780000 },
          { id: 'l4', designation: 'Maîtres d\'Hôtel & Brigade de Service', description: '1 maître d\'hôtel coordinateur + 5 serveurs en tenue d\'apparat gants blancs (5 heures de service)', quantite: 6, unite: 'personnels', prixUnitaire: 25000, totalHT: 150000 }
        ],
        totalHT: 4420000,
        tauxTVA: 18,
        remiseCommerciale: 220000,
        totalTTC: 4956000,
        acompteRequis: 2478000,
        commentairesChef: 'Option d\'accueil VIP avec tapis rouge et cocktail de bienvenue offerte pour nos partenaires TotalEnergies.'
      }
    },
    {
      id: 'dem-02',
      reference: 'DEV-KT-SEM-2026-12',
      entrepriseNom: 'TotalEnergies Sénégal',
      demandeurNom: 'Mme Aminata Sow (RH Formation)',
      demandeurEmail: 'a.sow@totalenergies.sn',
      demandeurTelephone: '+221 78 234 56 78',
      typeEvenement: 'SEMINAIRE',
      lieuChoisi: 'SITE_ENTREPRISE',
      dateEvenement: 'Vendredi 28 Novembre 2026',
      heureDebut: '08h30',
      heureFin: '17h00',
      nbConvives: 45,
      budgetEstime: 1200000,
      besoinsSpecifiques: ['Pause-café d\'accueil viennoiseries', 'Déjeuner assis 3 plats', 'Pause-café après-midi'],
      statut: 'CONFIRMEE',
      proposition: {
        id: 'prop-02',
        demandeId: 'dem-02',
        numeroDevis: 'PROP-SEM-2026-1098',
        dateEmission: '28 Octobre 2026',
        validiteDate: '05 Novembre 2026',
        gestionnaireNom: 'Service Commercial Kiki Traiteur',
        statut: 'ACCEPTEE',
        lignes: [
          { id: 'l21', designation: 'Pack Journée Séminaire Cadres Supérieurs', description: 'Double pause-café gourmande + déjeuner 3 services sur site', quantite: 45, unite: 'participants', prixUnitaire: 24000, totalHT: 1080000 }
        ],
        totalHT: 1080000,
        tauxTVA: 18,
        remiseCommerciale: 0,
        totalTTC: 1274400,
        acompteRequis: 637200,
        commentairesChef: 'Devis validé et acompte réglé par virement bancaire.'
      }
    }
  ]);

  // Consultation modale du devis chiffré
  devisEnConsultation = signal<PropositionEvenement | null>(null);
  showDevisModal = signal<boolean>(false);
  devisAccepteConfirmation = signal<boolean>(false);

  ouvrirDevis(prop: PropositionEvenement) {
    this.devisEnConsultation.set(prop);
    this.devisAccepteConfirmation.set(false);
    this.showDevisModal.set(true);
  }

  validerPropositionClient() {
    if (this.devisEnConsultation()) {
      const propId = this.devisEnConsultation()!.id;
      this.demandes.update(list => list.map(d => {
        if (d.proposition?.id === propId) {
          const updatedProp: PropositionEvenement = { ...d.proposition, statut: 'ACCEPTEE' };
          return { ...d, statut: 'CONFIRMEE', proposition: updatedProp };
        }
        return d;
      }));
      this.devisAccepteConfirmation.set(true);
      setTimeout(() => {
        this.showDevisModal.set(false);
      }, 2500);
    }
  }

  soumettreNouvelleDemande() {
    const f = this.formDemande();
    const nouvelle: DemandeEvenementB2B = {
      id: 'dem-' + Date.now(),
      reference: 'DEV-KT-DIVA-' + Math.floor(1000 + Math.random() * 9000),
      entrepriseNom: this.b2b.currentEntreprise().nom,
      demandeurNom: this.b2b.currentEmploye().prenom + ' ' + this.b2b.currentEmploye().nom,
      demandeurEmail: this.b2b.currentEmploye().email,
      demandeurTelephone: this.b2b.currentEmploye().telephone,
      typeEvenement: f.typeEvenement || 'SALLE_DIVA_PRIVATISATION',
      lieuChoisi: f.lieuChoisi || 'SALLE_DIVA',
      dateEvenement: f.dateEvenement || '2026-12-20',
      heureDebut: f.heureDebut || '19:00',
      heureFin: f.heureFin || '23:30',
      nbConvives: f.nbConvives || 50,
      budgetEstime: f.budgetEstime || 2000000,
      besoinsSpecifiques: f.besoinsSpecifiques || ['Privatisation Salle Diva', 'Buffet dînatoire'],
      statut: 'EN_ETUDE'
    };

    this.demandes.update(l => [nouvelle, ...l]);
    this.demandeEnvoyeeSucces.set(true);
    setTimeout(() => {
      this.demandeEnvoyeeSucces.set(false);
      this.activeView.set('MES_DEVIS');
    }, 2000);
  }
}

