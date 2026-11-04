import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { KikiDataService } from '../../../services/kiki-data.service';
import { ClientApiService } from '../../../services/client-api.service';

@Component({
  selector: 'app-devis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devis.component.html',
  styleUrl: './devis.component.css'
})
export class DevisComponent implements OnInit {
  currentStep = 1;

  form = {
    clientType: 'particulier',
    organization: '',
    prestationId: 'restauration-entreprise',
    evenementNature: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    guests: 50,
    locationType: 'salle-diva',
    locationDetails: 'Salle La Diva, Dakar',
    name: '',
    phone: '',
    email: '',
    message: ''
  };

  prestationsList = [
    { id: 'restauration-entreprise', label: 'Restauration d\'Entreprise', desc: 'Des repas équilibrés pour vos équipes et vos collaborateurs.', icon: 'fa-briefcase' },
    { id: 'evenementiel', label: 'Événementiel', desc: 'Mariage - Baptême - Séminaire - Cocktail - Pause-café - Déjeuner - Dîner de gala', icon: 'fa-glass-cheers' }
  ];

  eventNatures = [
    'Mariage',
    'Baptême',
    'Séminaire',
    'Cocktail',
    'Pause-café',
    'Déjeuner',
    'Dîner de gala'
  ];

  isSubmitting = false;
  isLocating = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: KikiDataService,
    private clientApi: ClientApiService
  ) {}

  onGuestsChange(): void {
    // Aucune restriction sur le nombre de convives pour la Salle La Diva
  }

  onPhoneFocus(): void {
    if (!this.form.phone || !this.form.phone.trim()) {
      this.form.phone = '+221';
    }
  }

  onPhoneInput(event: any): void {
    let val = event.target.value || '';
    if (!val.startsWith('+221')) {
      if (val.startsWith('221')) {
        val = '+' + val;
      } else if (val.startsWith('00221')) {
        val = '+221' + val.substring(5);
      } else if (val.startsWith('+')) {
        // user typing
      } else {
        val = '+221' + val;
      }
      this.form.phone = val;
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['prestation']) {
        this.form.prestationId = params['prestation'];
      }
    });
  }

  getLocation(): void {
    if (navigator.geolocation) {
      this.isLocating = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.isLocating = false;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.form.locationDetails = `https://www.google.com/maps?q=${lat},${lng}`;
          this.dataService.showToast('Localisation importée avec succès !');
        },
        (error) => {
          this.isLocating = false;
          this.dataService.showToast('Erreur de localisation. Veuillez vérifier vos permissions GPS.');
        }
      );
    } else {
      this.dataService.showToast("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  }

  setClientType(type: 'particulier' | 'entreprise'): void {
    this.form.clientType = type;
    if (type === 'particulier') {
      this.form.organization = '';
    }
  }

  selectPrestation(id: string): void {
    this.form.prestationId = id;
  }

  selectLocationType(type: string, label: string): void {
    this.form.locationType = type;
    if (type === 'salle-diva') {
      this.form.locationDetails = 'Salle La Diva, Dakar';
    } else {
      this.form.locationDetails = '';
    }
  }

  getLocationDisplay(): string {
    if (this.form.locationType === 'salle-diva') return 'Salle de Banquet (La DIVA)';
    return `Autre : ${this.form.locationDetails || 'À définir'}`;
  }

  getPrestationLabel(id: string): string {
    const found = this.prestationsList.find(p => p.id === id);
    return found ? found.label : 'Événementiel';
  }

  isStep1Valid(): boolean {
    if (this.form.clientType === 'entreprise' && !this.form.organization.trim()) {
      return false;
    }
    return true;
  }

  isStep2Valid(): boolean {
    if (!this.form.name.trim() || !this.form.phone.trim() || !this.form.email.trim()) {
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneCleaned = this.form.phone.replace(/\s+/g, '');
    const phoneRegex = /^(\+221|00221)?(7[05678]|33)\d{7}$/;
    if (!emailRegex.test(this.form.email.trim())) {
      return false;
    }
    if (!phoneRegex.test(phoneCleaned)) {
      return false;
    }
    return true;
  }

  isStep3Valid(): boolean {
    if (!this.form.prestationId) return false;
    if (this.form.prestationId === 'evenementiel' && !this.form.evenementNature) {
      return false;
    }
    return true;
  }

  isStep4Valid(): boolean {
    if (!this.form.date || !this.form.time || this.form.guests < 10) {
      return false;
    }
    const today = new Date().toISOString().split('T')[0];
    if (this.form.date < today) {
      return false;
    }
    return true;
  }

  isStep5Valid(): boolean {
    if (this.form.locationType === 'autre' && !this.form.locationDetails.trim()) {
      return false;
    }
    return !!this.form.locationType;
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || step === 1) {
      this.currentStep = step;
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.isStep1Valid()) {
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const phoneCleaned = this.form.phone.replace(/\s+/g, '');
      const phoneRegex = /^(\+221|00221)?(7[05678]|33)\d{7}$/;
      if (this.form.email.trim() && !emailRegex.test(this.form.email.trim())) {
        this.dataService.showToast("Erreur : Format de l'adresse email invalide.");
        return;
      }
      if (this.form.phone.trim() && !phoneRegex.test(phoneCleaned)) {
        this.dataService.showToast("Erreur : Le téléphone doit être un numéro sénégalais valide (ex: +221 77 777 77 77).");
        return;
      }
      if (this.isStep2Valid()) {
        this.currentStep = 3;
      }
    } else if (this.currentStep === 3 && this.isStep3Valid()) {
      this.currentStep = 4;
    } else if (this.currentStep === 4) {
      const today = new Date().toISOString().split('T')[0];
      if (this.form.date && this.form.date < today) {
        this.dataService.showToast("Erreur : La date de l'événement ne peut pas être antérieure à la date du jour.");
        return;
      }
      if (this.isStep4Valid()) {
        this.currentStep = 5;
      }
    } else if (this.currentStep === 5 && this.isStep5Valid()) {
      this.currentStep = 6;
    }
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }

  getStepIcon(step: number): string {
    switch(step) {
      case 1: return 'fa-user';
      case 2: return 'fa-id-card';
      case 3: return 'fa-concierge-bell';
      case 4: return 'fa-calendar-alt';
      case 5: return 'fa-map-marker-alt';
      case 6: return 'fa-clipboard-check';
      default: return 'fa-check';
    }
  }

  getStepName(step: number): string {
    switch(step) {
      case 1: return 'PROFIL';
      case 2: return 'CONTACT';
      case 3: return 'PRESTATION';
      case 4: return 'DATE & CONVIVES';
      case 5: return 'LIEU';
      case 6: return 'RÉCAPITULATIF';
      default: return 'DEVIS';
    }
  }

  getStepSubtitle(step: number): string {
    switch(step) {
      case 1: return 'Qui êtes-vous ?';
      case 2: return 'Vos coordonnées';
      case 3: return 'Quelle prestation ?';
      case 4: return 'Date & Convives';
      case 5: return 'Lieu de l\'événement';
      case 6: return 'Vérification finale';
      default: return 'Demande de devis';
    }
  }

  getStepTitle(step: number): string {
    switch(step) {
      case 1: return 'Profil (Qui êtes-vous ?)';
      case 2: return 'Vos coordonnées';
      case 3: return 'Prestation souhaitée';
      case 4: return 'Date & Convives';
      case 5: return 'Lieu de l\'événement';
      case 6: return 'Récapitulatif de votre demande';
      default: return 'Demande de devis';
    }
  }

  onSubmit(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.dataService.showToast('Envoi de votre demande en cours...', false);

    const cleanedPhone = (this.form.phone || '').replace(/\s+/g, '').trim();

    const payload = {
      name: (this.form.name && this.form.name.trim()) ? this.form.name : 'Client Kiki Traiteur',
      email: (this.form.email && this.form.email.trim()) ? this.form.email : 'client@kikitraiteur.com',
      phone: cleanedPhone || '+221770000000',
      clientType: this.form.clientType || 'particulier',
      organization: this.form.organization || '',
      prestationId: this.form.prestationId || 'restauration-entreprise',
      date: this.form.date || new Date().toISOString().split('T')[0],
      time: this.form.time || '19:00',
      guests: Number(this.form.guests) || 50,
      locationType: this.form.locationType || 'autre',
      locationDetails: this.form.locationDetails || 'Dakar',
      evenementNature: this.form.evenementNature || '',
      message: `${this.getLocationDisplay()} | Prestation: ${this.getPrestationLabel(this.form.prestationId)} ${this.form.evenementNature ? '('+this.form.evenementNature+')' : ''} | ${this.form.message || 'RAS'}`
    };

    // Simule une attente UX de 1.5s maximum pour garantir une réponse ultra-rapide côté client
    const successTimeoutId = setTimeout(() => {
      this.isSubmitting = false;
      this.dataService.addRequest({
        clientId: this.form.clientType === 'entreprise' ? 'cli_2' : 'cli_1',
        prestationId: this.form.prestationId,
        date: `${this.form.date} à ${this.form.time}`,
        guests: Number(this.form.guests),
        isInstitution: this.form.clientType === 'entreprise',
        organization: this.form.organization,
        message: `${this.getLocationDisplay()} | ${this.form.evenementNature ? '('+this.form.evenementNature+')' : ''} | ${this.form.message}`
      });
      this.dataService.showToast('Votre demande de devis a été envoyée avec succès !');
      this.resetForm();
      this.router.navigate(['/']);
    }, 1500);

    this.clientApi.creerDemandeDevis(payload).subscribe({
      next: (res) => {
        console.log('Réponse API Neon DB (devis créé):', res);
      },
      error: (err) => {
        // En cas d'erreur API, on annule le succès UX simulé et on affiche l'erreur
        clearTimeout(successTimeoutId);
        this.isSubmitting = false;
        if (err.status === 400 && err.error) {
          const errorMsg = err.error.message || (err.error.messages ? Object.values(err.error.messages).join(' | ') : 'Erreur de validation des données.');
          this.dataService.showToast('Attention : ' + errorMsg, true);
        } else {
          console.error('Erreur appel API (fallback local active):', err);
          this.dataService.showToast('Erreur serveur inattendue. Veuillez réessayer.', true);
        }
      }
    });
  }

  private getPrestationTitle(id: string): string {
    const prestas: { [key: string]: string } = {
      'evenementiel': 'Restauration Événementielle',
      'takeaway': 'Plat à Emporter',
      'restauration-entreprise': "Restauration d'Entreprise"
    };
    return prestas[id] || id;
  }

  private resetForm(): void {
    this.currentStep = 1;
    this.form = {
      clientType: 'particulier',
      organization: '',
      prestationId: 'restauration-entreprise',
      evenementNature: '',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      guests: 50,
      locationType: 'salle-diva',
      locationDetails: 'Salle La Diva, Dakar',
      name: '',
      phone: '',
      email: '',
      message: ''
    };
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }
}
