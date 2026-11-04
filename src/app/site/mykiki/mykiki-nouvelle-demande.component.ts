import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { KikiDataService } from '../../services/kiki-data.service';
import { ClientApiService } from '../../services/client-api.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mykiki-nouvelle-demande',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mykiki-nouvelle-demande.component.html',
  styleUrl: './mykiki-nouvelle-demande.component.css'
})
export class MyKikiNouvelleDemandeComponent implements OnInit {
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
  clientSansTelephone = false;
  aTenteSoumettre = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: KikiDataService,
    private clientApi: ClientApiService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  onGuestsChange(): void {
    // Aucune restriction sur le nombre de convives pour Salle La Diva
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.form.name = user.fullName || user.username || '';
      this.form.email = user.username || '';
      const initialPhone = (user as any).phone || '';
      if (initialPhone && initialPhone !== 'Non renseigné') {
        this.form.phone = this.formaterTelephone(initialPhone);
      }
    }

    // Charger les infos client actualisées pour vérifier si le téléphone manque (ex: compte Google)
    this.http.get<any>(`${environment.apiUrl}/api/mykiki/profil`).subscribe({
      next: (res) => {
        if (res) {
          const tel = (res.phone || res.telephone || '').trim();
          if (!tel || tel === 'Non renseigné') {
            this.clientSansTelephone = true;
          } else {
            this.clientSansTelephone = false;
            if (!this.form.phone) {
              this.form.phone = this.formaterTelephone(tel);
            }
          }
          if (res.name && !this.form.name) {
            this.form.name = res.name;
          }
        }
      },
      error: () => {}
    });

    this.route.queryParams.subscribe(params => {
      if (params['prestation']) {
        this.form.prestationId = params['prestation'];
      }
      if (params['guests']) {
        this.form.guests = Number(params['guests']) || 50;
      }
      if (params['nature']) {
        this.form.evenementNature = params['nature'];
      }
      if (params['location']) {
        this.form.locationDetails = params['location'];
      }
    });
  }

  formaterTelephone(val: string): string {
    if (!val) return '';
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('221') && digits.length > 9) {
      digits = digits.substring(3);
    }
    digits = digits.substring(0, 9);
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.substring(0, 2)} ${digits.substring(2)}`;
    } else if (digits.length <= 7) {
      return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
    } else {
      return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5, 7)} ${digits.substring(7, 9)}`;
    }
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.phone = this.formaterTelephone(input.value);
    input.value = this.form.phone;
  }

  get digitsPhone(): string {
    return (this.form.phone || '').replace(/\D/g, '');
  }

  isPhoneValid(): boolean {
    return this.digitsPhone.length === 9;
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
    if (!this.form.prestationId) return false;
    if (this.form.prestationId === 'evenementiel' && !this.form.evenementNature) {
      return false;
    }
    return true;
  }

  isStep2Valid(): boolean {
    if (!this.form.date || !this.form.time || this.form.guests < 10) {
      return false;
    }
    const today = new Date().toISOString().split('T')[0];
    if (this.form.date < today) {
      return false;
    }
    return true;
  }

  isStep3Valid(): boolean {
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
      const today = new Date().toISOString().split('T')[0];
      if (this.form.date && this.form.date < today) {
        this.dataService.showToast("Erreur : La date de l'événement ne peut pas être antérieure à la date du jour.");
        return;
      }
      if (this.isStep2Valid()) {
        this.currentStep = 3;
      }
    } else if (this.currentStep === 3 && this.isStep3Valid()) {
      this.currentStep = 4;
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
      case 1: return 'fa-concierge-bell';
      case 2: return 'fa-calendar-alt';
      case 3: return 'fa-map-marker-alt';
      case 4: return 'fa-clipboard-check';
      default: return 'fa-check';
    }
  }

  getStepName(step: number): string {
    switch(step) {
      case 1: return 'PRESTATION';
      case 2: return 'DATE & CONVIVES';
      case 3: return 'LIEU';
      case 4: return 'RÉCAPITULATIF';
      default: return 'DEVIS';
    }
  }

  getStepSubtitle(step: number): string {
    switch(step) {
      case 1: return 'Quelle prestation ?';
      case 2: return 'Date & Convives';
      case 3: return 'Lieu de l\'événement';
      case 4: return 'Vérification finale';
      default: return 'Demande de devis';
    }
  }

  getStepTitle(step: number): string {
    switch(step) {
      case 1: return 'Prestation souhaitée';
      case 2: return 'Date & Convives';
      case 3: return 'Lieu de l\'événement';
      case 4: return 'Récapitulatif de votre demande';
      default: return 'Demande de devis';
    }
  }

  onSubmit(): void {
    if (this.isSubmitting) return;
    this.aTenteSoumettre = true;

    if (!this.isPhoneValid()) {
      this.dataService.showToast('Numéro de téléphone obligatoire : 9 chiffres requis (ex : 77 123 45 67).', true);
      return;
    }

    this.isSubmitting = true;
    this.dataService.showToast('Envoi de votre demande en cours...', false);

    const cleanedPhone = this.digitsPhone;

    // Si client Google sans téléphone, synchroniser son profil
    if (this.clientSansTelephone) {
      this.http.put<any>(`${environment.apiUrl}/api/mykiki/profil`, {
        phone: cleanedPhone
      }).subscribe({
        next: () => { this.clientSansTelephone = false; },
        error: () => {}
      });
    }

    const payload = {
      name: (this.form.name && this.form.name.trim()) ? this.form.name : 'Client Kiki Traiteur',
      email: (this.form.email && this.form.email.trim()) ? this.form.email : 'client@kikitraiteur.com',
      phone: cleanedPhone,
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

    this.clientApi.creerDemandeDevis(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.dataService.showToast('Votre demande de devis a été transmise avec succès !');
        this.router.navigate(['/mykiki/demandes']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const errorMsg = err?.error?.message || (err?.error?.messages ? Object.values(err.error.messages).join(' | ') : 'Erreur de validation des données.');
        this.dataService.showToast('Attention : ' + errorMsg, true);
        console.error('Erreur appel API:', err);
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
