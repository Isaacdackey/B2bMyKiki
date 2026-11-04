import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GestionnaireApiService, PrestationDto } from '../../../services/gestionnaire-api.service';

interface PrestationImage {
  url: string;
  alt: string;
  caption: string;
}

interface PrestationData {
  id: string;
  indexNum: string;
  tabTitle: string;
  subtitle: string;
  title: string;
  desc: string;
  showCatalogueCta?: boolean;
  images: PrestationImage[];
  currentPhotoIndex: number;
}

@Component({
  selector: 'app-prestations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prestations.component.html',
  styleUrl: './prestations.component.css'
})
export class PrestationsComponent implements OnInit {
  currentPrestationIndex = 0;
  loadingPrestations = false;

  private readonly DEFAULT_PRESTATIONS: PrestationData[] = [
    {
      id: 'corporate',
      indexNum: '01',
      tabTitle: 'Entreprises',
      subtitle: 'Entreprises & Institutions',
      title: "Restauration d'Entreprise",
      desc: "Des repas équilibrés, préparés avec des produits frais et locaux pour la gestion quotidienne ou événementielle de vos cantines et cocktails d'affaires à Dakar.",
      showCatalogueCta: false,
      currentPhotoIndex: 0,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200',
          alt: "Buffet d'entreprise traiteur",
          caption: "Buffet d'entreprise haut de gamme & service traiteur à Dakar"
        },
        {
          url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200',
          alt: "Plats chauds traiteur",
          caption: "Plats chauds et accompagnements locaux raffinés"
        },
        {
          url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1200',
          alt: "Cocktail dînatoire affaires",
          caption: "Cocktails dînatoires et séminaires de direction VIP"
        },
        {
          url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200',
          alt: "Plateau repas réunion",
          caption: "Plateaux repas gastronomiques pour réunions de direction"
        },
        {
          url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200',
          alt: "Pause-café et accueil entreprise",
          caption: "Accueil petit-déjeuner gourmand et pauses-café en entreprise"
        }
      ]
    },
    {
      id: 'events',
      indexNum: '02',
      tabTitle: 'Événementiel',
      subtitle: 'Grandes Réceptions',
      title: "Restauration Événementielle",
      desc: "Mariages, baptêmes, dîners de gala et banquets. Notre brigade culinaire conçoit des menus gastronomiques personnalisés qui séduiront le palais de vos convives.",
      showCatalogueCta: false,
      currentPhotoIndex: 0,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200',
          alt: "Réception mariage gala",
          caption: "Réception de mariage et banquets d'exception à Dakar"
        },
        {
          url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200',
          alt: "Dressage et art de la table",
          caption: "Art de la table & dressage protocolaire raffiné"
        },
        {
          url: 'https://images.unsplash.com/photo-1505232458627-537f8c476b5b?q=80&w=1200',
          alt: "Soirée de gala et célébrations",
          caption: "Soirée de gala et célébrations de prestige à Dakar"
        },
        {
          url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=1200',
          alt: "Cocktail champagne",
          caption: "Cocktail champagne et verrines gastronomiques savoureuses"
        },
        {
          url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1200',
          alt: "Pièces montées et pâtisserie",
          caption: "Pièces montées et créations pâtissières d'exception pour vos invités"
        }
      ]
    },
    {
      id: 'diva',
      indexNum: '03',
      tabTitle: 'Salle La Diva',
      subtitle: "Lieu d'Exception à Dakar",
      title: "Salle La Diva",
      desc: "Espace de réception exclusif modulable jusqu'à 250 personnes. Forfaits tout inclus comprenant la salle, la restauration, le service à table et les boissons.",
      showCatalogueCta: false,
      currentPhotoIndex: 0,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200',
          alt: "Salle La Diva vue d'ensemble",
          caption: "La Salle La Diva — jusqu'à 250 convives en banquet"
        },
        {
          url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200',
          alt: "Éclairage et sonorisation",
          caption: "Acoustique, jeux de lumières et mise en scène féerique"
        },
        {
          url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=1200',
          alt: "Réception clé en main",
          caption: "Réception clé en main avec service protocolaire à table"
        },
        {
          url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200',
          alt: "Configuration cocktail dînatoire",
          caption: "Configuration cocktail dînatoire moderne et chaleureuse"
        },
        {
          url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200',
          alt: "Décoration florale table d'honneur",
          caption: "Décoration florale et tables d'honneur personnalisées sur-mesure"
        }
      ]
    },
    {
      id: 'takeaway',
      indexNum: '04',
      tabTitle: 'À Emporter',
      subtitle: 'Service à Emporter & Livraison',
      title: "Plats à Emporter",
      desc: "Savourez la gastronomie de Kiki Traiteur dans le confort de votre maison ou au bureau. Une sélection de plats raffinés et créations culinaires du jour préparés avec le plus grand soin par notre brigade.",
      showCatalogueCta: true,
      currentPhotoIndex: 0,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200',
          alt: "Coffret repas gastronomique",
          caption: "Coffrets repas & plats individuels livrés ou à emporter"
        },
        {
          url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200',
          alt: "Plats chauds du jour",
          caption: "Plats chauds cuisinés le jour-même par nos chefs brigades"
        },
        {
          url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200',
          alt: "Plateau de douceurs et canapés",
          caption: "Sélection de douceurs et plateaux de canapés à partager"
        },
        {
          url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200',
          alt: "Grillades et spécialités sénégalaises",
          caption: "Grillades et spécialités sénégalaises revisitées avec passion"
        },
        {
          url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1200',
          alt: "Emballages éco-responsables",
          caption: "Emballages éco-responsables pour toutes vos commandes à emporter"
        }
      ]
    },
    {
      id: 'foodtruck',
      indexNum: '05',
      tabTitle: 'Food Truck',
      subtitle: 'Événements Festifs & Mobiles',
      title: "Food Truck Gourmet",
      desc: "Une cuisine de rue mobile festive, haut de gamme et conviviale pour vos retours de noces, festivals, tournages de films ou soirées d'entreprise détendues. Une expérience originale et mémorable.",
      showCatalogueCta: false,
      currentPhotoIndex: 0,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1565123409695-7b5ff624d177?q=80&w=1200',
          alt: "Animation Food Truck Gourmet",
          caption: "Food Truck Gourmet Kiki Traiteur en prestation mobile"
        },
        {
          url: 'https://images.unsplash.com/photo-1579618218290-00c5c36f5fbf?q=80&w=1200',
          alt: "Street food fine et burgers",
          caption: "Street food chic : burgers gourmets & mini-brochettes"
        },
        {
          url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200',
          alt: "Cuisine extérieure festive",
          caption: "Animation culinaire conviviale et festive sur site"
        },
        {
          url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200',
          alt: "Service rapide sur site",
          caption: "Service rapide et gourmand pour festivals et retours de noces"
        },
        {
          url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=1200',
          alt: "Spécialités nomades à partager",
          caption: "Créations culinaires nomades et tapas festives à partager"
        }
      ]
    }
  ];

  prestationsList: PrestationData[] = [...this.DEFAULT_PRESTATIONS];

  constructor(
    private apiService: GestionnaireApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerPrestations();
  }

  chargerPrestations(): void {
    this.loadingPrestations = true;
    this.apiService.getPrestationsPublic().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.prestationsList = data.map((p, idx) => {
            const indexStr = p.indexNum || ((idx + 1) < 10 ? `0${idx + 1}` : `${idx + 1}`);
            const imgs: PrestationImage[] = (p.images && p.images.length > 0)
              ? p.images.map(img => ({
                  url: img.url,
                  alt: img.alt || p.title,
                  caption: img.caption || p.title
                }))
              : [{
                  url: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200',
                  alt: p.title,
                  caption: p.title
                }];

            return {
              id: p.code || String(p.id || idx),
              indexNum: indexStr,
              tabTitle: p.tabTitle,
              subtitle: p.subtitle || '',
              title: p.title,
              desc: p.desc || p.description || '',
              showCatalogueCta: p.showCatalogueCta || p.code === 'takeaway',
              images: imgs,
              currentPhotoIndex: 0
            };
          });

          if (this.currentPrestationIndex >= this.prestationsList.length) {
            this.currentPrestationIndex = 0;
          }
        } else {
          this.prestationsList = [...this.DEFAULT_PRESTATIONS];
        }
        this.loadingPrestations = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Erreur chargement prestations:', err);
        this.prestationsList = [...this.DEFAULT_PRESTATIONS];
        this.loadingPrestations = false;
        this.cdr.detectChanges();
      }
    });
  }

  get currentPrestation(): PrestationData {
    return this.prestationsList[this.currentPrestationIndex] || this.prestationsList[0];
  }

  get currentPhoto(): PrestationImage | null {
    const prest = this.currentPrestation;
    if (!prest || !prest.images || prest.images.length === 0) return null;
    const idx = prest.currentPhotoIndex || 0;
    return prest.images[idx] || prest.images[0] || null;
  }

  /* Master Slider Controls */
  selectPrestation(index: number): void {
    if (index >= 0 && index < this.prestationsList.length) {
      this.currentPrestationIndex = index;
    }
  }

  nextPrestation(): void {
    if (this.prestationsList.length > 0) {
      this.currentPrestationIndex = (this.currentPrestationIndex + 1) % this.prestationsList.length;
    }
  }

  prevPrestation(): void {
    if (this.prestationsList.length > 0) {
      this.currentPrestationIndex =
        (this.currentPrestationIndex - 1 + this.prestationsList.length) % this.prestationsList.length;
    }
  }

  /* Photo Slider Controls (pour la prestation en cours) */
  nextPhoto(): void {
    const prest = this.currentPrestation;
    if (prest && prest.images && prest.images.length > 0) {
      prest.currentPhotoIndex = ((prest.currentPhotoIndex || 0) + 1) % prest.images.length;
    }
  }

  prevPhoto(): void {
    const prest = this.currentPrestation;
    if (prest && prest.images && prest.images.length > 0) {
      prest.currentPhotoIndex =
        ((prest.currentPhotoIndex || 0) - 1 + prest.images.length) % prest.images.length;
    }
  }

  goToPhoto(idx: number): void {
    const prest = this.currentPrestation;
    if (prest && prest.images && idx >= 0 && idx < prest.images.length) {
      prest.currentPhotoIndex = idx;
    }
  }

  /* Lightbox */
  lightboxOpen = false;
  lightboxImgSrc = '';
  lightboxCaption = '';

  openLightbox(src: string, caption?: string): void {
    this.lightboxImgSrc = src;
    this.lightboxCaption = caption || '';
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }
}
