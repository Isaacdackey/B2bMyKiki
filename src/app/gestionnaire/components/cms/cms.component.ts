import { Component, ViewEncapsulation, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { GestionnaireDataService } from '../../services/gestionnaire-data.service';
import { KikiDataService } from '../../../services/kiki-data.service';
import { GestionnaireApiService, MembreEquipeDto, ContactMessageDto, PrestationDto, PrestationImageDto } from '../../../services/gestionnaire-api.service';
import { CloudinaryService } from '../../../services/cloudinary.service';

@Component({
  selector: 'app-cms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cms.component.html',
  styleUrl: './cms.component.css'
})
export class CmsComponent implements OnInit {
  faqs: any[] = [];
  testimonials: any[] = [];
  cmsFilterTab: 'PRESTATIONS' | 'EQUIPE' | 'FAQS' | 'TESTIMONIALS' | 'MESSAGES' | 'ALL' = 'PRESTATIONS';

  // --- Prestations (Page Nos Prestations / Carrousel Master) ---
  prestations: PrestationDto[] = [];
  recherchePrestation = '';
  chargementPrestations = false;
  showModalPrestation = false;
  isEditingPrestation = false;
  isSubmittingPrestation = false;
  isUploadingPrestationPhotos = false;

  showModalApercuPrestation = false;
  apercuPrestation: PrestationDto | null = null;
  apercuPrestationPhotoIndex = 0;
  apercuPrestationDepuisFormulaire = false;

  showModalDetailsPrestation = false;
  prestationDetails: PrestationDto | null = null;

  showDeletePrestationModal = false;
  prestationToDelete: PrestationDto | null = null;

  prestationFormData: PrestationDto = {
    id: undefined,
    code: '',
    indexNum: '01',
    tabTitle: '',
    subtitle: '',
    title: '',
    description: '',
    ordreAffichage: 10,
    actif: true,
    showCatalogueCta: false,
    images: []
  };

  // --- FAQs ---
  faqPage = 1;
  faqPageSize = 10;
  showFaqModal = false;
  isEditingFaq = false;
  faqForm = { id: '', question: '', answer: '', category: 'Général' };
  showDeleteFaqModal = false;
  faqToDelete: string | null = null;

  // --- Testimonials ---
  testimonialPage = 1;
  testimonialPageSize = 10;
  showTestimonialModal = false;
  isEditingTestimonial = false;
  testimonialForm = { id: '', text: '', clientName: '', clientTitle: '', stars: 5 };
  showDeleteTestimonialModal = false;
  testimonialToDelete: string | null = null;

  // --- Équipe Administrative & Direction (Site Public) ---
  membresEquipe: MembreEquipeDto[] = [];
  rechercheEquipe = '';
  chargementEquipe = false;
  showModalMembre = false;
  isEditingMembre = false;
  isSubmittingMembre = false;
  isUploadingPhoto = false;

  showModalApercu = false;
  apercuMembre: MembreEquipeDto | null = null;
  apercuDepuisFormulaire = false;

  showModalDetailsMembre = false;
  membreDetails: MembreEquipeDto | null = null;

  showDeleteMembreModal = false;
  membreToDelete: MembreEquipeDto | null = null;

  membreFormData: any = {
    id: null,
    nom: '',
    titre: '',
    description: '',
    photoUrl: '',
    tag: 'Direction',
    ordreAffichage: 10,
    actif: true
  };

  // --- Messages "Nous écrire" ---
  messagesContact: ContactMessageDto[] = [];
  rechercheMessages = '';
  filtreStatutMessage: 'TOUS' | 'NON_TRAITES' | 'TRAITES' = 'TOUS';
  messageDetails: ContactMessageDto | null = null;
  showModalDetailsMessage = false;
  messageToDelete: ContactMessageDto | null = null;
  showDeleteMessageModal = false;
  messagesPage = 1;
  messagesPageSize = 10;
  loadingMessages = false;

  private readonly DEFAULT_EQUIPE: MembreEquipeDto[] = [
    {
      nom: 'Mme Christiane Lopez Diaw',
      titre: 'Gérante (43 ans d\'expérience)',
      tag: 'Direction',
      description: 'Visionnaire de l\'excellence, elle guide Kiki Traiteur vers les sommets du prestige.',
      photoUrl: '',
      ordreAffichage: 1,
      actif: true
    },
    {
      nom: 'Docteur Ignace Coly',
      titre: 'Resp. Hygiène et Qualité',
      tag: 'Qualité',
      description: 'Il veille à l\'application rigoureuse des principes HACCP à chaque étape.',
      photoUrl: '',
      ordreAffichage: 2,
      actif: true
    },
    {
      nom: 'Chef Amadou Ndiaye',
      titre: 'Chef de Cuisine',
      tag: 'Gastronomie',
      description: 'Il dirige notre brigade culinaire avec rigueur pour garantir nos standards d\'excellence.',
      photoUrl: '',
      ordreAffichage: 3,
      actif: true
    },
    {
      nom: 'Mr Daniel Diop',
      titre: 'Directeur d\'Exploitation',
      tag: 'Opérations',
      description: 'Il orchestre notre capacité opérationnelle, gérant la logistique complexe avec brio.',
      photoUrl: '',
      ordreAffichage: 4,
      actif: true
    }
  ];

  private readonly DEFAULT_PRESTATIONS_CMS: PrestationDto[] = [
    {
      code: 'corporate',
      indexNum: '01',
      tabTitle: 'Entreprises',
      subtitle: 'Entreprises & Institutions',
      title: "Restauration d'Entreprise",
      description: "Des repas équilibrés, préparés avec des produits frais et locaux pour la gestion quotidienne ou événementielle de vos cantines et cocktails d'affaires à Dakar.",
      ordreAffichage: 1,
      actif: true,
      showCatalogueCta: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200', alt: "Buffet d'entreprise traiteur", caption: "Buffet d'entreprise haut de gamme & service traiteur à Dakar", ordreAffichage: 1 },
        { url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200', alt: "Plats chauds traiteur", caption: "Plats chauds et accompagnements locaux raffinés", ordreAffichage: 2 },
        { url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1200', alt: "Cocktail dînatoire affaires", caption: "Cocktails dînatoires et séminaires de direction VIP", ordreAffichage: 3 },
        { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200', alt: "Plateau repas réunion", caption: "Plateaux repas gastronomiques pour réunions de direction", ordreAffichage: 4 },
        { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200', alt: "Pause-café et accueil entreprise", caption: "Accueil petit-déjeuner gourmand et pauses-café en entreprise", ordreAffichage: 5 }
      ]
    },
    {
      code: 'events',
      indexNum: '02',
      tabTitle: 'Événementiel',
      subtitle: 'Grandes Réceptions',
      title: "Restauration Événementielle",
      description: "Mariages, baptêmes, dîners de gala et banquets. Notre brigade culinaire conçoit des menus gastronomiques personnalisés qui séduiront le palais de vos convives.",
      ordreAffichage: 2,
      actif: true,
      showCatalogueCta: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200', alt: "Réception mariage gala", caption: "Réception de mariage et banquets d'exception à Dakar", ordreAffichage: 1 },
        { url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200', alt: "Dressage et art de la table", caption: "Art de la table & dressage protocolaire raffiné", ordreAffichage: 2 },
        { url: 'https://images.unsplash.com/photo-1505232458627-537f8c476b5b?q=80&w=1200', alt: "Soirée de gala et célébrations", caption: "Soirée de gala et célébrations de prestige à Dakar", ordreAffichage: 3 },
        { url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=1200', alt: "Cocktail champagne", caption: "Cocktail champagne et verrines gastronomiques savoureuses", ordreAffichage: 4 },
        { url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1200', alt: "Pièces montées et pâtisserie", caption: "Pièces montées et créations pâtissières d'exception pour vos invités", ordreAffichage: 5 }
      ]
    },
    {
      code: 'diva',
      indexNum: '03',
      tabTitle: 'Salle La Diva',
      subtitle: "Lieu d'Exception à Dakar",
      title: "Salle La Diva",
      description: "Espace de réception exclusif modulable jusqu'à 250 personnes. Forfaits tout inclus comprenant la salle, la restauration, le service à table et les boissons.",
      ordreAffichage: 3,
      actif: true,
      showCatalogueCta: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200', alt: "Salle La Diva vue d'ensemble", caption: "La Salle La Diva — jusqu'à 250 convives en banquet", ordreAffichage: 1 },
        { url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200', alt: "Éclairage et sonorisation", caption: "Acoustique, jeux de lumières et mise en scène féerique", ordreAffichage: 2 },
        { url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=1200', alt: "Réception clé en main", caption: "Réception clé en main avec service protocolaire à table", ordreAffichage: 3 },
        { url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200', alt: "Configuration cocktail dînatoire", caption: "Configuration cocktail dînatoire moderne et chaleureuse", ordreAffichage: 4 },
        { url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200', alt: "Décoration florale table d'honneur", caption: "Décoration florale et tables d'honneur personnalisées sur-mesure", ordreAffichage: 5 }
      ]
    },
    {
      code: 'takeaway',
      indexNum: '04',
      tabTitle: 'À Emporter',
      subtitle: 'Service à Emporter & Livraison',
      title: "Plats à Emporter",
      description: "Savourez la gastronomie de Kiki Traiteur dans le confort de votre maison ou au bureau. Une sélection de plats raffinés et créations culinaires du jour préparés avec le plus grand soin par notre brigade.",
      ordreAffichage: 4,
      actif: true,
      showCatalogueCta: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200', alt: "Coffret repas gastronomique", caption: "Coffrets repas & plats individuels livrés ou à emporter", ordreAffichage: 1 },
        { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200', alt: "Plats chauds du jour", caption: "Plats chauds cuisinés le jour-même par nos chefs brigades", ordreAffichage: 2 },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200', alt: "Plateau de douceurs et canapés", caption: "Sélection de douceurs et plateaux de canapés à partager", ordreAffichage: 3 },
        { url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200', alt: "Grillades et spécialités sénégalaises", caption: "Grillades et spécialités sénégalaises revisitées avec passion", ordreAffichage: 4 },
        { url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1200', alt: "Emballages éco-responsables", caption: "Emballages éco-responsables pour toutes vos commandes à emporter", ordreAffichage: 5 }
      ]
    },
    {
      code: 'foodtruck',
      indexNum: '05',
      tabTitle: 'Food Truck',
      subtitle: 'Événements Festifs & Mobiles',
      title: "Food Truck Gourmet",
      description: "Une cuisine de rue mobile festive, haut de gamme et conviviale pour vos retours de noces, festivals, tournages de films ou soirées d'entreprise détendues. Une expérience originale et mémorable.",
      ordreAffichage: 5,
      actif: true,
      showCatalogueCta: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1565123409695-7b5ff624d177?q=80&w=1200', alt: "Animation Food Truck Gourmet", caption: "Food Truck Gourmet Kiki Traiteur en prestation mobile", ordreAffichage: 1 },
        { url: 'https://images.unsplash.com/photo-1579618218290-00c5c36f5fbf?q=80&w=1200', alt: "Street food fine et burgers", caption: "Street food chic : burgers gourmets & mini-brochettes", ordreAffichage: 2 },
        { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200', alt: "Cuisine extérieure festive", caption: "Animation culinaire conviviale et festive sur site", ordreAffichage: 3 },
        { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200', alt: "Service rapide sur site", caption: "Service rapide et gourmand pour festivals et retours de noces", ordreAffichage: 4 },
        { url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=1200', alt: "Spécialités nomades à partager", caption: "Créations culinaires nomades et tapas festives à partager", ordreAffichage: 5 }
      ]
    }
  ];

  constructor(
    public gData: GestionnaireDataService,
    private dataService: KikiDataService,
    private apiService: GestionnaireApiService,
    private cloudinaryService: CloudinaryService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.gData.loadAll();
    this.gData.faqs$.subscribe(f => this.faqs = f);
    this.gData.testimonials$.subscribe(t => this.testimonials = t);
    this.chargerPrestations();
    this.chargerMembresEquipe();
    this.chargerMessagesContact();

    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        const tab = params['tab'].toUpperCase();
        if (tab === 'PRESTATIONS' || tab === 'MESSAGES' || tab === 'FAQS' || tab === 'TESTIMONIALS' || tab === 'EQUIPE') {
          this.cmsFilterTab = tab as any;
        }
      }
    });
  }

  // =========================================================================
  // ── PRESTATIONS (PAGE NOS PRESTATIONS & MASTER SLIDER) ───────────────────
  // =========================================================================

  chargerPrestations(): void {
    this.chargementPrestations = true;
    this.apiService.getPrestationsGestionnaire().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.prestations = data;
        } else {
          this.prestations = [...this.DEFAULT_PRESTATIONS_CMS];
        }
        this.chargementPrestations = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Erreur chargement prestations CMS, utilisation du fallback:', err);
        this.prestations = [...this.DEFAULT_PRESTATIONS_CMS];
        this.chargementPrestations = false;
        this.cdr.detectChanges();
      }
    });
  }

  get prestationsFiltrees(): PrestationDto[] {
    const q = (this.recherchePrestation || '').trim().toLowerCase();
    if (!q) return this.prestations;
    return this.prestations.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.subtitle || '').toLowerCase().includes(q) ||
      (p.tabTitle || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.desc || '').toLowerCase().includes(q)
    );
  }

  ouvrirModalCreerPrestation(): void {
    this.isEditingPrestation = false;
    this.isSubmittingPrestation = false;
    this.isUploadingPrestationPhotos = false;
    const nextOrdre = (this.prestations.length + 1) * 10;
    const nextIdxNum = (this.prestations.length + 1) < 10 ? `0${this.prestations.length + 1}` : `${this.prestations.length + 1}`;
    this.prestationFormData = {
      id: undefined,
      code: '',
      indexNum: nextIdxNum,
      tabTitle: '',
      subtitle: '',
      title: '',
      description: '',
      ordreAffichage: nextOrdre,
      actif: true,
      showCatalogueCta: false,
      images: []
    };
    this.showModalPrestation = true;
  }

  ouvrirModalEditerPrestation(p: PrestationDto): void {
    this.isEditingPrestation = true;
    this.isSubmittingPrestation = false;
    this.isUploadingPrestationPhotos = false;
    this.prestationFormData = {
      id: p.id,
      code: p.code || '',
      indexNum: p.indexNum || '01',
      tabTitle: p.tabTitle || '',
      subtitle: p.subtitle || '',
      title: p.title || '',
      description: p.description || p.desc || '',
      ordreAffichage: p.ordreAffichage !== undefined ? p.ordreAffichage : 10,
      actif: p.actif !== false,
      showCatalogueCta: !!p.showCatalogueCta,
      images: p.images ? p.images.map(img => ({ ...img })) : []
    };
    this.showModalPrestation = true;
  }

  fermerModalPrestation(): void {
    this.showModalPrestation = false;
    this.isSubmittingPrestation = false;
    this.isUploadingPrestationPhotos = false;
  }

  surSelectionPhotosPrestation(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files || files.length === 0) return;

    this.isUploadingPrestationPhotos = true;
    const uploadObservables = files.map(file => this.cloudinaryService.uploadImage(file, 'prestations'));

    forkJoin(uploadObservables).subscribe({
      next: (urls: string[]) => {
        urls.forEach((url, i) => {
          this.prestationFormData.images.push({
            url: url,
            caption: files[i]?.name ? files[i].name.replace(/\.[^/.]+$/, '') : this.prestationFormData.title,
            alt: this.prestationFormData.title || 'Photo prestation',
            ordreAffichage: this.prestationFormData.images.length + 1
          });
        });
        this.isUploadingPrestationPhotos = false;
        this.dataService.showToast(`${urls.length} photo(s) téléversée(s) avec succès !`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur upload photos prestation:', err);
        this.isUploadingPrestationPhotos = false;
        this.dataService.showToast("Erreur lors de l'envoi des photos.", true);
        this.cdr.detectChanges();
      }
    });
    input.value = '';
  }

  supprimerPhotoPrestation(index: number): void {
    this.prestationFormData.images.splice(index, 1);
    this.prestationFormData.images.forEach((img, idx) => img.ordreAffichage = idx + 1);
    this.cdr.detectChanges();
  }

  monterPhotoPrestation(index: number): void {
    if (index <= 0) return;
    const temp = this.prestationFormData.images[index];
    this.prestationFormData.images[index] = this.prestationFormData.images[index - 1];
    this.prestationFormData.images[index - 1] = temp;
    this.prestationFormData.images.forEach((img, idx) => img.ordreAffichage = idx + 1);
    this.cdr.detectChanges();
  }

  descendrePhotoPrestation(index: number): void {
    if (index >= this.prestationFormData.images.length - 1) return;
    const temp = this.prestationFormData.images[index];
    this.prestationFormData.images[index] = this.prestationFormData.images[index + 1];
    this.prestationFormData.images[index + 1] = temp;
    this.prestationFormData.images.forEach((img, idx) => img.ordreAffichage = idx + 1);
    this.cdr.detectChanges();
  }

  sauvegarderPrestation(): void {
    if (!this.prestationFormData.title || !this.prestationFormData.tabTitle) {
      this.dataService.showToast('Veuillez renseigner au moins le titre de la prestation et le nom dans les onglets.', true);
      return;
    }

    if (!this.prestationFormData.images || this.prestationFormData.images.length === 0) {
      this.dataService.showToast('Veuillez ajouter au moins une photo pour cette prestation.', true);
      return;
    }

    this.isSubmittingPrestation = true;
    if (this.isEditingPrestation && this.prestationFormData.id) {
      this.apiService.modifierPrestation(this.prestationFormData.id, this.prestationFormData).subscribe({
        next: () => {
          this.isSubmittingPrestation = false;
          this.dataService.showToast('Prestation mise à jour avec succès.');
          this.fermerModalPrestation();
          this.chargerPrestations();
        },
        error: (err) => {
          this.isSubmittingPrestation = false;
          this.dataService.showToast(err.error?.message || 'Erreur lors de la modification.', true);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.apiService.creerPrestation(this.prestationFormData).subscribe({
        next: () => {
          this.isSubmittingPrestation = false;
          this.dataService.showToast('Prestation créée avec succès.');
          this.fermerModalPrestation();
          this.chargerPrestations();
        },
        error: (err) => {
          this.isSubmittingPrestation = false;
          this.dataService.showToast(err.error?.message || "Erreur lors de la création.", true);
          this.cdr.detectChanges();
        }
      });
    }
  }

  toggleActifPrestation(p: PrestationDto, event?: Event): void {
    if (event) event.stopPropagation();
    const ancientEtat = p.actif !== false;
    const nouvelEtat = !ancientEtat;
    p.actif = nouvelEtat;
    this.cdr.detectChanges();

    if (!p.id) {
      const clone = { ...p, actif: nouvelEtat };
      this.apiService.creerPrestation(clone).subscribe({
        next: (saved) => {
          p.id = saved.id;
          this.dataService.showToast(nouvelEtat ? `« ${p.title} » est maintenant visible sur le site.` : `« ${p.title} » est masqué du site.`);
        },
        error: (err) => {
          p.actif = ancientEtat;
          this.dataService.showToast('Erreur lors du changement de statut.', true);
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.apiService.togglePrestationActif(p.id, nouvelEtat).subscribe({
      next: () => {
        this.dataService.showToast(nouvelEtat ? `« ${p.title} » est maintenant visible sur le site.` : `« ${p.title} » est masqué du site.`);
      },
      error: (err) => {
        p.actif = ancientEtat;
        this.dataService.showToast('Erreur lors du changement de statut.', true);
        this.cdr.detectChanges();
      }
    });
  }

  deletePrestation(p: PrestationDto): void {
    this.prestationToDelete = p;
    this.showDeletePrestationModal = true;
  }

  closeDeletePrestationModal(): void {
    this.showDeletePrestationModal = false;
    this.prestationToDelete = null;
  }

  confirmDeletePrestation(): void {
    if (!this.prestationToDelete) return;
    const p = this.prestationToDelete;
    if (!p.id) {
      this.prestations = this.prestations.filter(x => x !== p);
      this.dataService.showToast('Prestation retirée.');
      this.closeDeletePrestationModal();
      return;
    }
    this.apiService.supprimerPrestation(p.id).subscribe({
      next: () => {
        this.dataService.showToast('Prestation supprimée avec succès.');
        this.closeDeletePrestationModal();
        this.chargerPrestations();
      },
      error: (err) => {
        this.dataService.showToast(err.error?.message || 'Erreur lors de la suppression.', true);
        this.closeDeletePrestationModal();
      }
    });
  }

  // --- Aperçu Prestation ---

  ouvrirApercuPrestation(p: PrestationDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.apercuPrestation = { ...p, images: p.images ? p.images.map(img => ({ ...img })) : [] };
    this.apercuPrestationPhotoIndex = 0;
    this.apercuPrestationDepuisFormulaire = false;
    this.showModalApercuPrestation = true;
    this.cdr.detectChanges();
  }

  ouvrirApercuDirectFormulairePrestation(): void {
    this.apercuPrestation = {
      ...this.prestationFormData,
      title: this.prestationFormData.title?.trim() || 'Titre de la prestation',
      tabTitle: this.prestationFormData.tabTitle?.trim() || 'Onglet',
      subtitle: this.prestationFormData.subtitle?.trim() || 'Sous-titre / Catégorie',
      description: this.prestationFormData.description?.trim() || 'Description détaillée de la prestation traiteur...',
      images: this.prestationFormData.images && this.prestationFormData.images.length > 0
        ? this.prestationFormData.images.map(img => ({ ...img }))
        : [{ url: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200', caption: 'Photo par défaut', alt: 'Aperçu' }]
    };
    this.apercuPrestationPhotoIndex = 0;
    this.apercuPrestationDepuisFormulaire = true;
    this.showModalApercuPrestation = true;
    this.cdr.detectChanges();
  }

  fermerApercuPrestation(): void {
    this.showModalApercuPrestation = false;
    this.apercuPrestation = null;
    this.apercuPrestationPhotoIndex = 0;
    this.apercuPrestationDepuisFormulaire = false;
    this.cdr.detectChanges();
  }

  enregistrerDepuisApercuPrestation(): void {
    this.fermerApercuPrestation();
    this.sauvegarderPrestation();
  }

  apercuPrestationNextPhoto(): void {
    if (this.apercuPrestation?.images && this.apercuPrestation.images.length > 0) {
      this.apercuPrestationPhotoIndex = (this.apercuPrestationPhotoIndex + 1) % this.apercuPrestation.images.length;
    }
  }

  apercuPrestationPrevPhoto(): void {
    if (this.apercuPrestation?.images && this.apercuPrestation.images.length > 0) {
      this.apercuPrestationPhotoIndex = (this.apercuPrestationPhotoIndex - 1 + this.apercuPrestation.images.length) % this.apercuPrestation.images.length;
    }
  }

  apercuPrestationGoToPhoto(idx: number): void {
    if (this.apercuPrestation?.images && idx >= 0 && idx < this.apercuPrestation.images.length) {
      this.apercuPrestationPhotoIndex = idx;
    }
  }

  getApercuPrestationCurrentPhoto(): PrestationImageDto | null {
    if (!this.apercuPrestation?.images || this.apercuPrestation.images.length === 0) return null;
    return this.apercuPrestation.images[this.apercuPrestationPhotoIndex] || this.apercuPrestation.images[0] || null;
  }

  // =========================================================================
  // ── FAQ ──────────────────────────────────────────────────────────────────
  // =========================================================================

  getFaqsForPage(): any[] {
    const start = (this.faqPage - 1) * this.faqPageSize;
    return this.faqs.slice(start, start + this.faqPageSize);
  }

  getFaqTotalPages(): number {
    return Math.max(1, Math.ceil(this.faqs.length / this.faqPageSize));
  }

  getFaqPageArray(): (number | string)[] {
    return this.getPaginationArray(this.faqPage, this.getFaqTotalPages());
  }

  openAddFaqModal(): void {
    this.isEditingFaq = false;
    this.faqForm = { id: '', question: '', answer: '', category: 'Général' };
    this.showFaqModal = true;
  }

  openEditFaqModal(f: any): void {
    this.isEditingFaq = true;
    this.faqForm = { id: f.id, question: f.question, answer: f.answer, category: f.category || 'Général' };
    this.showFaqModal = true;
  }

  closeFaqModal(): void {
    this.showFaqModal = false;
  }

  submitFaq(): void {
    if (!this.faqForm.question || !this.faqForm.answer) {
      this.dataService.showToast('Veuillez remplir la question et la réponse.', true);
      return;
    }
    const payload = { question: this.faqForm.question, answer: this.faqForm.answer, category: this.faqForm.category };
    if (this.isEditingFaq) {
      const idx = this.faqs.findIndex(f => f.id === this.faqForm.id);
      if (idx !== -1) this.faqs[idx] = { ...this.faqs[idx], ...payload };
      this.apiService.updateFaq(this.faqForm.id, payload).subscribe({
        next: () => {
          this.dataService.showToast('FAQ mise à jour.');
          this.gData.loadAll();
        },
        error: () => {
          this.dataService.showToast('Erreur lors de la mise à jour de la FAQ.', true);
          this.gData.loadAll();
        }
      });
    } else {
      const newFaq = { id: Date.now().toString(), ...payload };
      this.faqs.unshift(newFaq);
      this.faqPage = 1;
      this.apiService.createFaq(payload).subscribe({
        next: () => {
          this.dataService.showToast('FAQ créée.');
          this.gData.loadAll();
        },
        error: () => {
          this.dataService.showToast('Erreur lors de la création de la FAQ.', true);
          this.gData.loadAll();
        }
      });
    }
    this.showFaqModal = false;
  }

  getBadgeStyle(category: string): any {
    const cat = (category || 'Général').toLowerCase().trim();
    if (cat.includes('réservation') || cat.includes('reservation')) return { 'background-color': '#EF4444', 'color': 'white' };
    if (cat.includes('salle') || cat.includes('diva')) return { 'background-color': '#10B981', 'color': 'white' };
    if (cat.includes('traiteur') || cat.includes('buffet')) return { 'background-color': '#EAB308', 'color': 'white' };
    if (cat.includes('paiement') || cat.includes('prix')) return { 'background-color': '#3B82F6', 'color': 'white' };
    return { 'background-color': '#8B5CF6', 'color': 'white' };
  }

  deleteFaq(id: string): void {
    this.faqToDelete = id;
    this.showDeleteFaqModal = true;
  }
  
  closeDeleteFaqModal(): void {
    this.showDeleteFaqModal = false;
    this.faqToDelete = null;
  }

  confirmDeleteFaq(): void {
    if (!this.faqToDelete) return;
    const id = this.faqToDelete;
    this.faqs = this.faqs.filter(f => f.id !== id);
    this.apiService.deleteFaq(id).subscribe({
      next: () => {
        this.dataService.showToast('FAQ supprimée.');
        this.gData.loadAll();
        this.closeDeleteFaqModal();
      },
      error: () => {
        this.dataService.showToast('Erreur lors de la suppression de la FAQ.', true);
        this.gData.loadAll();
        this.closeDeleteFaqModal();
      }
    });
  }

  // =========================================================================
  // ── TESTIMONIALS ─────────────────────────────────────────────────────────
  // =========================================================================

  getTestimonialsForPage(): any[] {
    const start = (this.testimonialPage - 1) * this.testimonialPageSize;
    return this.testimonials.slice(start, start + this.testimonialPageSize);
  }

  getTestimonialTotalPages(): number {
    return Math.max(1, Math.ceil(this.testimonials.length / this.testimonialPageSize));
  }

  getTestimonialPageArray(): (number | string)[] {
    return this.getPaginationArray(this.testimonialPage, this.getTestimonialTotalPages());
  }

  getStarsArray(n: number): number[] {
    return Array.from({ length: n || 5 }, (_, i) => i);
  }

  openAddTestimonialModal(): void {
    this.isEditingTestimonial = false;
    this.testimonialForm = { id: '', text: '', clientName: '', clientTitle: '', stars: 5 };
    this.showTestimonialModal = true;
  }

  openEditTestimonialModal(t: any): void {
    this.isEditingTestimonial = true;
    this.testimonialForm = { id: t.id, text: t.text, clientName: t.clientName, clientTitle: t.clientTitle, stars: t.stars || 5 };
    this.showTestimonialModal = true;
  }

  closeTestimonialModal(): void {
    this.showTestimonialModal = false;
  }

  submitTestimonial(): void {
    if (!this.testimonialForm.text || !this.testimonialForm.clientName) {
      this.dataService.showToast('Veuillez remplir le témoignage et le nom du client.', true);
      return;
    }
    const payload = { content: this.testimonialForm.text, clientName: this.testimonialForm.clientName, role: this.testimonialForm.clientTitle, rating: this.testimonialForm.stars };
    
    if (this.isEditingTestimonial) {
      const idx = this.testimonials.findIndex(t => String(t.id) === String(this.testimonialForm.id));
      if (idx !== -1) {
        this.testimonials[idx].text = payload.content;
        this.testimonials[idx].clientName = payload.clientName;
        this.testimonials[idx].clientTitle = payload.role;
        this.testimonials[idx].stars = payload.rating;
      }
      this.apiService.updateTestimonial(this.testimonialForm.id, payload).subscribe({
        next: () => {
          this.dataService.showToast('Témoignage mis à jour.');
          this.gData.loadAll();
        },
        error: () => {
          this.dataService.showToast('Erreur lors de la mise à jour du témoignage.', true);
          this.gData.loadAll();
        }
      });
    } else {
      const newTestimonial = { id: Date.now().toString(), text: payload.content, clientName: payload.clientName, clientTitle: payload.role, stars: payload.rating };
      this.testimonials.unshift(newTestimonial);
      this.testimonialPage = 1;
      this.apiService.createTestimonial(payload).subscribe({
        next: () => {
          this.dataService.showToast('Témoignage ajouté.');
          this.gData.loadAll();
        },
        error: () => {
          this.dataService.showToast("Erreur lors de l'ajout du témoignage.", true);
          this.gData.loadAll();
        }
      });
    }
    this.showTestimonialModal = false;
  }

  deleteTestimonial(id: string): void {
    this.testimonialToDelete = id;
    this.showDeleteTestimonialModal = true;
  }
  
  closeDeleteTestimonialModal(): void {
    this.showDeleteTestimonialModal = false;
    this.testimonialToDelete = null;
  }

  confirmDeleteTestimonial(): void {
    if (!this.testimonialToDelete) return;
    const id = this.testimonialToDelete;
    this.testimonials = this.testimonials.filter(t => String(t.id) !== String(id));
    this.apiService.deleteTestimonial(id).subscribe({
      next: () => {
        this.dataService.showToast('Témoignage supprimé.');
        this.gData.loadAll();
        this.closeDeleteTestimonialModal();
      },
      error: () => {
        this.dataService.showToast('Erreur lors de la suppression du témoignage.', true);
        this.gData.loadAll();
        this.closeDeleteTestimonialModal();
      }
    });
  }

  // =========================================================================
  // ── ÉQUIPE ADMINISTRATIVE & DIRECTION (SITE PUBLIC) ──────────────────────
  // =========================================================================

  chargerMembresEquipe(): void {
    this.chargementEquipe = true;
    this.apiService.getMembresEquipeGestionnaire().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.membresEquipe = data;
        } else {
          // Si la base est vide, afficher les membres par défaut du site
          this.membresEquipe = [...this.DEFAULT_EQUIPE];
        }
        this.chargementEquipe = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Erreur chargement membres équipe, utilisation du fallback:', err);
        this.membresEquipe = [...this.DEFAULT_EQUIPE];
        this.chargementEquipe = false;
        this.cdr.detectChanges();
      }
    });
  }

  get membresEquipeFiltres(): MembreEquipeDto[] {
    const q = (this.rechercheEquipe || '').trim().toLowerCase();
    if (!q) return this.membresEquipe;
    return this.membresEquipe.filter(m =>
      (m.nom || '').toLowerCase().includes(q) ||
      (m.titre || '').toLowerCase().includes(q) ||
      (m.tag || '').toLowerCase().includes(q) ||
      (m.description || '').toLowerCase().includes(q)
    );
  }

  ouvrirModalCreerMembre(): void {
    this.isEditingMembre = false;
    this.isSubmittingMembre = false;
    this.isUploadingPhoto = false;
    this.membreFormData = {
      nom: '',
      titre: '',
      description: '',
      photoUrl: '',
      tag: 'Direction',
      ordreAffichage: (this.membresEquipe.length + 1) * 10,
      actif: true
    };
    this.showModalMembre = true;
  }

  ouvrirModalEditerMembre(m: MembreEquipeDto): void {
    this.isEditingMembre = true;
    this.isSubmittingMembre = false;
    this.isUploadingPhoto = false;
    this.membreFormData = {
      id: m.id,
      nom: m.nom,
      titre: m.titre,
      description: m.description || '',
      photoUrl: m.photoUrl || '',
      tag: m.tag || 'Direction',
      ordreAffichage: m.ordreAffichage || 0,
      actif: m.actif !== false
    };
    this.showModalMembre = true;
  }

  fermerModalMembre(): void {
    this.showModalMembre = false;
    this.isSubmittingMembre = false;
    this.isUploadingPhoto = false;
  }

  surSelectionPhotoMembre(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingPhoto = true;
    this.cloudinaryService.uploadImage(file, 'equipe').subscribe({
      next: (url) => {
        this.membreFormData.photoUrl = url;
        this.isUploadingPhoto = false;
        this.dataService.showToast('Photo enregistrée avec succès !');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur upload photo membre:', err);
        this.isUploadingPhoto = false;
        this.dataService.showToast("Erreur lors de l'envoi de la photo.", true);
        this.cdr.detectChanges();
      }
    });
    input.value = '';
  }

  sauvegarderMembreEquipe(): void {
    if (!this.membreFormData.nom || !this.membreFormData.titre) {
      this.dataService.showToast('Veuillez renseigner au moins le nom et le titre/poste.', true);
      return;
    }

    this.isSubmittingMembre = true;
    if (this.isEditingMembre && this.membreFormData.id) {
      this.apiService.modifierMembreEquipe(this.membreFormData.id, this.membreFormData).subscribe({
        next: () => {
          this.isSubmittingMembre = false;
          this.dataService.showToast('Membre mis à jour avec succès.');
          this.fermerModalMembre();
          this.chargerMembresEquipe();
        },
        error: (err) => {
          this.isSubmittingMembre = false;
          this.dataService.showToast(err.error?.message || 'Erreur lors de la modification.', true);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.apiService.creerMembreEquipe(this.membreFormData).subscribe({
        next: () => {
          this.isSubmittingMembre = false;
          this.dataService.showToast('Membre enregistré avec succès.');
          this.fermerModalMembre();
          this.chargerMembresEquipe();
        },
        error: (err) => {
          this.isSubmittingMembre = false;
          this.dataService.showToast(err.error?.message || "Erreur lors de l'enregistrement.", true);
          this.cdr.detectChanges();
        }
      });
    }
  }

  toggleActifMembre(m: MembreEquipeDto, event?: Event): void {
    if (event) event.stopPropagation();
    const ancientEtat = m.actif !== false;
    const nouvelEtat = !ancientEtat;

    // Mise à jour instantanée / optimiste
    m.actif = nouvelEtat;
    this.cdr.detectChanges();

    if (!m.id) {
      // Pour un membre par défaut non encore persisté, on le persiste avec l'état actif
      const clone: MembreEquipeDto = { ...m, actif: nouvelEtat };
      this.apiService.creerMembreEquipe(clone).subscribe({
        next: (saved) => {
          m.id = saved.id;
          this.dataService.showToast(
            nouvelEtat
              ? `« ${m.nom} » est maintenant visible sur le site.`
              : `« ${m.nom} » est masqué du site.`
          );
        },
        error: (err) => {
          console.error('Erreur sauvegarde membre:', err);
          m.actif = ancientEtat;
          this.dataService.showToast('Erreur lors du changement de visibilité.', true);
          this.cdr.detectChanges();
        }
      });
      return;
    }

    const clone: MembreEquipeDto = { ...m, actif: nouvelEtat };
    this.apiService.modifierMembreEquipe(m.id, clone).subscribe({
      next: () => {
        this.dataService.showToast(
          nouvelEtat
            ? `« ${m.nom} » est maintenant visible sur le site.`
            : `« ${m.nom} » est masqué du site.`
        );
      },
      error: (err) => {
        console.error('Erreur bascule visibilité membre:', err);
        m.actif = ancientEtat;
        this.dataService.showToast('Erreur lors du changement de visibilité.', true);
        this.cdr.detectChanges();
      }
    });
  }

  // --- Détails du membre ---

  ouvrirDetailsMembre(m: MembreEquipeDto): void {
    this.membreDetails = { ...m };
    this.showModalDetailsMembre = true;
    this.cdr.detectChanges();
  }

  fermerDetailsMembre(): void {
    this.showModalDetailsMembre = false;
    this.membreDetails = null;
    this.cdr.detectChanges();
  }

  editerDepuisDetails(): void {
    if (this.membreDetails) {
      const target = this.membresEquipe.find(x => (x.id && x.id === this.membreDetails?.id) || x.nom === this.membreDetails?.nom) || this.membreDetails;
      this.fermerDetailsMembre();
      this.ouvrirModalEditerMembre(target);
    }
  }

  apercuDepuisDetails(): void {
    if (this.membreDetails) {
      const target = this.membreDetails;
      this.fermerDetailsMembre();
      this.ouvrirApercu(target);
    }
  }

  getPoleBadgeStyle(pole: string | undefined): { bg: string, color: string, border: string, icon: string } {
    const p = (pole || 'Direction').toLowerCase().trim();
    if (p.includes('direction')) {
      return { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', icon: 'fa-crown' };
    }
    if (p.includes('qualité') || p.includes('qualite') || p.includes('haccp') || p.includes('hygiène') || p.includes('hygiene')) {
      return { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', icon: 'fa-shield-alt' };
    }
    if (p.includes('gastro') || p.includes('cuis') || p.includes('chef')) {
      return { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', icon: 'fa-utensils' };
    }
    if (p.includes('opér') || p.includes('oper') || p.includes('logist')) {
      return { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', icon: 'fa-cogs' };
    }
    if (p.includes('admin')) {
      return { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE', icon: 'fa-briefcase' };
    }
    if (p.includes('comm')) {
      return { bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3', icon: 'fa-handshake' };
    }
    return { bg: '#F1F5F9', color: '#334155', border: '#CBD5E1', icon: 'fa-tag' };
  }

  // --- Aperçu direct sur le site ---

  ouvrirApercu(m: MembreEquipeDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.apercuMembre = { ...m };
    this.apercuDepuisFormulaire = false;
    this.showModalApercu = true;
    this.cdr.detectChanges();
  }

  ouvrirApercuDirectFormulaire(): void {
    this.apercuMembre = {
      ...this.membreFormData,
      nom: this.membreFormData.nom?.trim() || 'Nom et Prénom',
      titre: this.membreFormData.titre?.trim() || 'Titre / Rôle public',
      tag: this.membreFormData.tag?.trim() || 'Direction',
      description: this.membreFormData.description?.trim() || 'Description du rôle et des engagements au sein de Kiki Traiteur...'
    };
    this.apercuDepuisFormulaire = true;
    this.showModalApercu = true;
    this.cdr.detectChanges();
  }

  fermerApercu(): void {
    this.showModalApercu = false;
    this.apercuMembre = null;
    this.apercuDepuisFormulaire = false;
    this.cdr.detectChanges();
  }

  enregistrerDepuisApercu(): void {
    this.fermerApercu();
    this.sauvegarderMembreEquipe();
  }

  deleteMembre(m: MembreEquipeDto): void {
    this.membreToDelete = m;
    this.showDeleteMembreModal = true;
  }

  closeDeleteMembreModal(): void {
    this.showDeleteMembreModal = false;
    this.membreToDelete = null;
  }

  confirmDeleteMembre(): void {
    if (!this.membreToDelete) return;
    const m = this.membreToDelete;
    if (!m.id) {
      this.membresEquipe = this.membresEquipe.filter(x => x !== m);
      this.dataService.showToast('Membre retiré.');
      this.closeDeleteMembreModal();
      return;
    }
    this.apiService.supprimerMembreEquipe(m.id).subscribe({
      next: () => {
        this.dataService.showToast('Membre supprimé avec succès.');
        this.closeDeleteMembreModal();
        this.chargerMembresEquipe();
      },
      error: (err) => {
        this.dataService.showToast(err.error?.message || 'Erreur lors de la suppression.', true);
        this.closeDeleteMembreModal();
      }
    });
  }

  // =========================================================================
  // ── MESSAGES CONTACT "NOUS ÉCRIRE" ────────────────────────────────────────
  // =========================================================================

  chargerMessagesContact(): void {
    this.loadingMessages = true;
    this.apiService.getMessagesContact().subscribe({
      next: (msgs) => {
        this.messagesContact = msgs || [];
        this.loadingMessages = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Erreur chargement messages contact:', err);
        this.loadingMessages = false;
        this.cdr.detectChanges();
      }
    });
  }

  get messagesContactFiltres(): ContactMessageDto[] {
    let list = this.messagesContact;
    if (this.filtreStatutMessage === 'NON_TRAITES') {
      list = list.filter(m => !m.traite);
    } else if (this.filtreStatutMessage === 'TRAITES') {
      list = list.filter(m => m.traite);
    }

    const q = (this.rechercheMessages || '').toLowerCase().trim();
    if (!q) return list;

    return list.filter(m =>
      (m.nom && m.nom.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.telephone && m.telephone.toLowerCase().includes(q)) ||
      (m.sujet && m.sujet.toLowerCase().includes(q)) ||
      (m.message && m.message.toLowerCase().includes(q))
    );
  }

  getMessagesForPage(): ContactMessageDto[] {
    const start = (this.messagesPage - 1) * this.messagesPageSize;
    return this.messagesContactFiltres.slice(start, start + this.messagesPageSize);
  }

  getMessagesTotalPages(): number {
    return Math.max(1, Math.ceil(this.messagesContactFiltres.length / this.messagesPageSize));
  }

  getMessagesPageArray(): (number | string)[] {
    return this.getPaginationArray(this.messagesPage, this.getMessagesTotalPages());
  }

  getUnreadMessagesCount(): number {
    return this.messagesContact.filter(m => !m.traite).length;
  }

  ouvrirDetailsMessage(m: ContactMessageDto): void {
    this.messageDetails = { ...m };
    this.showModalDetailsMessage = true;
    this.cdr.detectChanges();
  }

  fermerDetailsMessage(): void {
    this.showModalDetailsMessage = false;
    this.messageDetails = null;
    this.cdr.detectChanges();
  }

  toggleTraite(m: ContactMessageDto, event?: Event): void {
    if (event) event.stopPropagation();
    if (!m.id) return;
    const nouveauStatut = !m.traite;
    this.apiService.toggleMessageTraite(m.id, nouveauStatut).subscribe({
      next: (updated) => {
        m.traite = nouveauStatut;
        if (this.messageDetails && this.messageDetails.id === m.id) {
          this.messageDetails.traite = nouveauStatut;
        }
        this.dataService.showToast(nouveauStatut ? 'Message marqué comme traité.' : 'Message marqué comme non traité.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.dataService.showToast('Erreur lors du changement de statut.', true);
      }
    });
  }

  deleteMessage(m: ContactMessageDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.messageToDelete = m;
    this.showDeleteMessageModal = true;
  }

  closeDeleteMessageModal(): void {
    this.showDeleteMessageModal = false;
    this.messageToDelete = null;
  }

  confirmDeleteMessage(): void {
    if (!this.messageToDelete || !this.messageToDelete.id) return;
    const id = this.messageToDelete.id;
    this.apiService.supprimerMessageContact(id).subscribe({
      next: () => {
        this.messagesContact = this.messagesContact.filter(x => x.id !== id);
        if (this.messageDetails && this.messageDetails.id === id) {
          this.fermerDetailsMessage();
        }
        this.closeDeleteMessageModal();
        this.dataService.showToast('Message supprimé.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.dataService.showToast('Erreur lors de la suppression du message.', true);
        this.closeDeleteMessageModal();
      }
    });
  }

  copierTelephone(tel: string | undefined, event?: Event): void {
    if (event) event.stopPropagation();
    if (!tel) return;
    navigator.clipboard.writeText(tel).then(() => {
      this.dataService.showToast(`Numéro ${tel} copié dans le presse-papier !`);
    }).catch(() => {
      this.dataService.showToast(`Numéro : ${tel}`);
    });
  }

  getWhatsAppLink(tel: string | undefined): string {
    if (!tel) return '';
    const digits = tel.replace(/[^0-9]/g, '');
    const num = digits.startsWith('221') ? digits : (digits.length === 9 ? '221' + digits : digits);
    return `https://wa.me/${num}`;
  }

  // =========================================================================
  // ── UTILITAIRES ──────────────────────────────────────────────────────────
  // =========================================================================

  getPaginationArray(currentPage: number, totalPages: number): (number | string)[] {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i == 1 || i == totalPages || (i >= currentPage - delta && i < currentPage + delta + 1)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }
}
