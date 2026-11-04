import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { retry } from 'rxjs';
import { KikiDataService } from '../../../services/kiki-data.service';
import { environment } from '../../../../environments/environment';

export const DEFAULT_REALISATIONS = [
  {
    title: "Dîner de Gala Prestige - SONATEL",
    category: "Restauration d'Entreprise",
    description: "Service protocolaire gastronomique et cocktail VIP pour 500 collaborateurs à la Salle La Diva.",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200",
    guests: "500 invités",
    location: "Salle La Diva, Dakar"
  },
  {
    title: "Mariage Royal & Scénographie Florale",
    category: "Événementiel Privé",
    description: "Organisation complète, dîner assis raffiné et mise en lumière d'exception pour un mariage inoubliable.",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200",
    guests: "300 convives",
    location: "Dakar, Sénégal"
  },
  {
    title: "Sommet Économique International",
    category: "Institutionnel",
    description: "Catering de haut niveau, buffets et pauses-café gourmandes pour délégations diplomatiques.",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200",
    guests: "800 participants",
    location: "CICAD / Dakar"
  },
  {
    title: "Cocktails Dînatoires d'Entreprise",
    category: "Cocktail VIP",
    description: "Assortiment de verrines, canapés gastronomiques et animations culinaires en direct par notre brigade.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200",
    guests: "250 invités",
    location: "Plateau, Dakar"
  }
];

export const DEFAULT_TESTIMONIALS = [
  {
    quote: "Kiki Traiteur a sublimé notre dîner de gala annuel. Une organisation sans faille et une gastronomie saluée par l'ensemble de nos 400 convives et délégations.",
    initials: "SO",
    author: "Direction Générale SONATEL",
    role: "Direction Générale SONATEL",
    stars: 5
  },
  {
    quote: "La Salle La Diva combinée au service traiteur a rendu notre mariage féerique. La délicatesse des mets et l'attention de la brigade ont émerveillé tous nos invités.",
    initials: "AD",
    author: "Aïcha & David Diop",
    role: "Mariage d'Exception à La Diva",
    stars: 5
  },
  {
    quote: "Partenaire régulier pour nos déjeuners exécutifs et pauses gourmandes, la fraîcheur des produits du terroir et le raffinement sont toujours au rendez-vous.",
    initials: "TI",
    author: "TotalEnergies Marketing Sénégal",
    role: "Comité Exécutif",
    stars: 5
  }
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  selectedCat = 'all';
  activePrestation: string | null = 'corporate';
  currentTestimonial = 0;
  currentRealisation = 0;
  private timer: any;
  private realisationTimer: any;
  private autoScrollInterval: any;

  isContactFormVisible = false;

  clientLogos = [
    'CICAD.png',
    'ELTON.png',
    'ICS-INDORAMA.png',
    'ISM.png',
    'MSC.png',
    'SENICO.png',
    'SONATEL.png',
    'TOTAL ENERGIES.png',
    'apave_news.png'
  ];

  testimonials: any[] = [...DEFAULT_TESTIMONIALS];
  realisationSlides: any[] = [...DEFAULT_REALISATIONS];

  testimonialPage = 0;
  testimonialPageSize = 10;
  testimonialTotalPages = 1;
  testimonialTotalElements = 3;
  totalPageList: number[] = [1];
  isLoadingTestimonials = false;

  // --- Lightbox Grand Format ---
  lightboxSlide: any | null = null;

  constructor(private dataService: KikiDataService, private http: HttpClient) {}

  selectPrestation(prestationKey: string): void {
    this.activePrestation = prestationKey;
  }

  scrollSlider(direction: 'left' | 'right') {
    const slider = document.getElementById('clients-slider');
    const set1 = document.getElementById('logo-set-1');
    if (slider && set1) {
      const gap = parseFloat(getComputedStyle(set1).gap) || 24;
      const setWidth = set1.offsetWidth + gap;

      slider.style.scrollBehavior = 'auto';
      
      if (direction === 'left' && slider.scrollLeft <= 0) {
         slider.scrollLeft += setWidth;
      } else if (direction === 'right' && slider.scrollLeft >= setWidth * 2) {
         slider.scrollLeft -= setWidth;
      }
      
      void slider.offsetWidth;
      slider.style.scrollBehavior = 'smooth';
      const scrollAmount = 260;
      slider.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount });
    }
  }

  startAutoScroll() {
    if (typeof window !== 'undefined') {
      this.autoScrollInterval = setInterval(() => {
        const slider = document.getElementById('clients-slider');
        const set1 = document.getElementById('logo-set-1');
        if (slider && set1) {
          slider.style.scrollBehavior = 'auto';
          slider.scrollLeft += 1;
          
          const gap = parseFloat(getComputedStyle(set1).gap) || 24;
          const setWidth = set1.offsetWidth + gap;
          if (slider.scrollLeft >= setWidth) {
             slider.scrollLeft -= setWidth; 
          }
        }
      }, 25);
    }
  }

  pauseAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }

  resumeAutoScroll() {
    this.startAutoScroll();
  }

  getStarsArray(n: number): number[] {
    const count = Math.max(1, Math.min(5, Number(n) || 5));
    return Array.from({ length: count }, (_, i) => i);
  }

  ngOnInit(): void {
    this.startAutoScroll();
    
    // 1. Chargement instantané depuis le cache local s'il existe
    try {
      const cachedT = localStorage.getItem('kiki_cached_testimonials');
      if (cachedT) {
        const parsed = JSON.parse(cachedT);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.testimonials = parsed;
        }
      }
      const cachedR = localStorage.getItem('kiki_cached_realisations');
      if (cachedR) {
        const parsed = JSON.parse(cachedR);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.realisationSlides = parsed;
        }
      }
    } catch (e) {}

    // 2. Synchronisation en direct via l'endpoint /api/accueil
    this.chargerAccueil(0);

    this.startTestimonialsTimer();
    this.startRealisationTimer();
  }

  chargerAccueil(page: number = 0): void {
    this.isLoadingTestimonials = true;
    this.http.get<any>(`${environment.apiUrl}/api/accueil?page=${page}&size=${this.testimonialPageSize}`)
      .pipe(retry({ count: 2, delay: 1000 }))
      .subscribe({
        next: (res) => {
          this.isLoadingTestimonials = false;
          
          if (res?.pagination?.testimonials) {
            this.testimonialTotalPages = res.pagination.testimonials.totalPages;
            this.testimonialTotalElements = res.pagination.testimonials.totalElements;
            this.testimonialPage = res.pagination.testimonials.page;
          } else if (res?.totalPages !== undefined) {
            this.testimonialTotalPages = res.totalPages;
            this.testimonialTotalElements = res.totalElements || 0;
            this.testimonialPage = res.page !== undefined ? res.page : page;
            this.totalPageList = res.totalPageList || [];
          }

          const accueilData = res?.data || res;
          
          // Traitement des témoignages
          const rawList = Array.isArray(accueilData?.Testimonials) ? accueilData.Testimonials : (Array.isArray(accueilData?.testimonials) ? accueilData.testimonials : (Array.isArray(accueilData?.temoignages) ? accueilData.temoignages : (Array.isArray(accueilData?.t) ? accueilData.t : (Array.isArray(res) ? res : []))));
          if (rawList && rawList.length > 0) {
            const mappedT = rawList.map((t: any) => {
              const nom = t.clientName || t.nomClient || t.NomClient || t.nom_client || t.author || 'Client Kiki Traiteur';
              const cleanNom = String(nom || '').trim();
              const parts = cleanNom.split(/\s+/).filter(Boolean);
              const ini = parts.length > 1
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : (cleanNom.substring(0, 2).toUpperCase() || 'KT');
              
              const citation = t.content || t.Content || t.temoignage || t.Temoignage || t.TEMOIGNAGE || t.quote || t.Quote || t.text || '';
              const roleClient = t.role || t.Role || t.clientRole || t.clientTitle || t.titreFonction || t.titre_fonction || 'Client Kiki Traiteur';
              const note = parseInt(t.rating || t.Rating || t.note || t.Note || t.stars) || 5;

              return {
                quote: citation,
                initials: ini,
                author: nom,
                role: roleClient,
                stars: note
              };
            }).filter((item: any) => item.quote && item.quote.trim().length > 0);

            if (mappedT.length > 0) {
              this.testimonials = mappedT;
              this.currentTestimonial = 0;
              try {
                if (this.testimonialPage === 0) {
                  localStorage.setItem('kiki_cached_testimonials', JSON.stringify(this.testimonials));
                }
              } catch (e) {}
            }
          }

          // Traitement des réalisations
          const rawRealisations = Array.isArray(accueilData?.Realisations) ? accueilData.Realisations : (Array.isArray(accueilData?.realisations) ? accueilData.realisations : (Array.isArray(accueilData?.r) ? accueilData.r : null));
          if (rawRealisations && rawRealisations.length > 0) {
            this.traiterRealisations(rawRealisations);
          }
        },
        error: (err) => {
          this.isLoadingTestimonials = false;
          this.chargerTestimonialsFallback();
          this.chargerRealisations();
        }
      });
  }

  chargerTestimonialsFallback(): void {
    this.http.get<any>(`${environment.apiUrl}/api/testimonials`)
      .pipe(retry({ count: 1, delay: 1000 }))
      .subscribe({
        next: (res) => {
          const rawList = Array.isArray(res) ? res : (res && Array.isArray(res.content) ? res.content : (res && Array.isArray(res.value) ? res.value : (res && Array.isArray(res.data) ? res.data : [])));
          if (rawList && rawList.length > 0) {
            const mapped = rawList.map((t: any) => {
              const nom = t.clientName || t.nomClient || t.author || 'Client Kiki Traiteur';
              const cleanNom = String(nom || '').trim();
              const parts = cleanNom.split(/\s+/).filter(Boolean);
              const ini = parts.length > 1
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : (cleanNom.substring(0, 2).toUpperCase() || 'KT');
              const citation = t.content || t.temoignage || t.quote || t.text || '';
              const roleClient = t.role || t.clientRole || 'Client Kiki Traiteur';
              const note = parseInt(t.rating || t.stars) || 5;
              return { quote: citation, initials: ini, author: nom, role: roleClient, stars: note };
            }).filter((item: any) => item.quote && item.quote.trim().length > 0);

            if (mapped.length > 0) {
              this.testimonials = mapped;
            }
          }
        },
        error: () => {}
      });
  }

  traiterRealisations(medias: any): void {
    let list: any[] = [];
    if (Array.isArray(medias)) {
      list = medias;
    } else if (medias && medias.data) {
      list = medias.data.Realisations || medias.data.realisations || medias.data.items || (Array.isArray(medias.data) ? medias.data : []);
    }
    if (!list || !Array.isArray(list) || list.length === 0) {
      return;
    }

    const photos = list.filter(m => {
      const nomEvent = (m.evenementNom || '').toLowerCase().trim();
      const estProduit = nomEvent === 'produits' || nomEvent === 'produit' || nomEvent === 'catalogue' || nomEvent === 'plats' || nomEvent === 'mets';
      const estImage = !m.type || m.type.toUpperCase() === 'IMAGE';
      const estVisible = m.visiblePublic !== false;
      return !estProduit && estImage && estVisible && m.url;
    });

    if (photos.length === 0) {
      return;
    }

    const groupes = new Map<string, any[]>();
    for (const p of photos) {
      const titre = p.evenementNom?.trim() || 'Événement Kiki Traiteur';
      if (!groupes.has(titre)) {
        groupes.set(titre, []);
      }
      groupes.get(titre)!.push(p);
    }

    const albumsList = Array.from(groupes.values());
    const maxPhotos = Math.max(...albumsList.map(a => a.length), 0);
    const entrelaces: any[] = [];

    for (let i = 0; i < maxPhotos; i++) {
      for (const albumPhotos of albumsList) {
        if (i < albumPhotos.length) {
          entrelaces.push(albumPhotos[i]);
        }
      }
    }

    const dynamicSlides = entrelaces.map(m => {
      const catLabel = this.determinerCategorie(m);
      const convives = m.nombreConvives
        ? (m.nombreConvives.includes(' ') ? m.nombreConvives : `${m.nombreConvives} invités`)
        : 'Sur mesure';
      return {
        title: m.evenementNom || 'Prestation d’Exception',
        category: catLabel,
        description: m.description || 'Prestation gastronomique et service traiteur d’exception orchestré par Kiki Traiteur.',
        image: m.url,
        guests: convives,
        location: m.lieu ? m.lieu : 'Dakar, Sénégal'
      };
    });

    if (dynamicSlides.length > 0) {
      this.realisationSlides = dynamicSlides;
      if (this.currentRealisation >= this.realisationSlides.length) {
        this.currentRealisation = 0;
      }
      try {
        localStorage.setItem('kiki_cached_realisations', JSON.stringify(this.realisationSlides));
      } catch (e) {}
    }
  }

  chargerRealisations(): void {
    try {
      const cached = localStorage.getItem('kiki_cached_realisations');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.realisationSlides = parsed;
        }
      }
    } catch (e) {}

    this.http.get<any>(`${environment.apiUrl}/api/realisations`)
      .pipe(retry({ count: 1, delay: 1000 }))
      .subscribe({
        next: (medias) => this.traiterRealisations(medias),
        error: () => {}
      });
  }

  determinerCategorie(m: any): string {
    if (m.typeEvenement && m.typeEvenement.trim().length > 0) {
      return m.typeEvenement;
    }
    const type = (m.typeEvenement || '').toLowerCase();
    const nom = (m.evenementNom || '').toLowerCase();
    const lieu = (m.lieu || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    const full = `${type} ${nom} ${lieu} ${desc}`;

    if (full.includes('diva') || full.includes('salle diva')) return 'Salle La Diva';
    if (full.includes('food truck') || full.includes('foodtruck')) return 'Food Truck Gourmet';
    if (full.includes('emporter') || full.includes('takeaway')) return 'Plats à Emporter';
    if (full.includes('plat') || full.includes('mets') || full.includes('gastronomie') || full.includes('buffet')) return 'Plats & Gastronomie';
    if (full.includes('entreprise') || full.includes('corporate') || full.includes('séminaire') || full.includes('institutionnel') || full.includes('gala')) return "Restauration d'Entreprise";
    if (full.includes('mariage') || full.includes('anniversaire') || full.includes('cocktail')) return 'Événements';
    return 'Événementiel';
  }

  startTestimonialsTimer(): void {
    this.pauseTestimonials();
    this.timer = setInterval(() => {
      if (this.testimonials && this.testimonials.length > 1) {
        this.nextTestimonial();
      }
    }, 5000);
  }

  pauseTestimonials(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resumeTestimonials(): void {
    this.startTestimonialsTimer();
  }

  startRealisationTimer(): void {
    this.pauseRealisationTimer();
    this.realisationTimer = setInterval(() => {
      if (this.realisationSlides && this.realisationSlides.length > 1) {
        this.nextRealisation();
      }
    }, 5000);
  }

  pauseRealisationTimer(): void {
    if (this.realisationTimer) {
      clearInterval(this.realisationTimer);
      this.realisationTimer = null;
    }
  }

  resumeRealisationTimer(): void {
    this.startRealisationTimer();
  }

  getTestimonialTransform(): string {
    const len = this.testimonials ? this.testimonials.length : 0;
    if (len <= 1) return 'translateX(0%)';
    const safeIndex = Math.max(0, Math.min(this.currentTestimonial, len - 1));
    return `translateX(-${safeIndex * 100}%)`;
  }

  getRealisationTransform(): string {
    const len = this.realisationSlides ? this.realisationSlides.length : 0;
    if (len <= 1) return 'translateX(0%)';
    const safeIndex = Math.max(0, Math.min(this.currentRealisation, len - 1));
    return `translateX(-${safeIndex * 100}%)`;
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.realisationTimer) {
      clearInterval(this.realisationTimer);
    }
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }

  filterCat(cat: string): void {
    this.selectedCat = cat;
  }

  isShown(cat: string): boolean {
    return this.selectedCat === 'all' || this.selectedCat === cat;
  }

  nextTestimonial(): void {
    if (!this.testimonials || this.testimonials.length === 0) return;
    this.currentTestimonial = (this.currentTestimonial + 1) % this.testimonials.length;
  }

  prevTestimonial(): void {
    if (!this.testimonials || this.testimonials.length === 0) return;
    this.currentTestimonial = (this.currentTestimonial - 1 + this.testimonials.length) % this.testimonials.length;
  }

  goToTestimonial(index: number): void {
    this.currentTestimonial = index;
  }

  goToTestimonialPage(targetPage: number): void {
    if (targetPage < 0 || targetPage >= this.testimonialTotalPages || targetPage === this.testimonialPage) {
      return;
    }
    this.chargerAccueil(targetPage);
  }

  getTestimonialPagesArray(): (number | string)[] {
    const total = this.testimonialTotalPages;
    const current = this.testimonialPage + 1;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  ouvrirLightbox(slide: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.lightboxSlide = slide;
    this.pauseRealisationTimer();
  }

  fermerLightbox(): void {
    this.lightboxSlide = null;
    this.resumeRealisationTimer();
  }

  get indexLightboxActuel(): number {
    if (!this.lightboxSlide) return -1;
    return this.realisationSlides.findIndex(s => s.image === this.lightboxSlide?.image || s.title === this.lightboxSlide?.title);
  }

  prevLightbox(event?: Event): void {
    if (event) event.stopPropagation();
    const idx = this.indexLightboxActuel;
    if (idx > 0) {
      this.lightboxSlide = this.realisationSlides[idx - 1];
    } else if (this.realisationSlides.length > 0) {
      this.lightboxSlide = this.realisationSlides[this.realisationSlides.length - 1];
    }
  }

  nextLightbox(event?: Event): void {
    if (event) event.stopPropagation();
    const idx = this.indexLightboxActuel;
    if (idx >= 0 && idx < this.realisationSlides.length - 1) {
      this.lightboxSlide = this.realisationSlides[idx + 1];
    } else if (this.realisationSlides.length > 0) {
      this.lightboxSlide = this.realisationSlides[0];
    }
  }

  @HostListener('document:keydown', ['$event'])
  surToucheClavier(event: KeyboardEvent): void {
    if (this.lightboxSlide) {
      if (event.key === 'Escape') {
        this.fermerLightbox();
      } else if (event.key === 'ArrowLeft') {
        this.prevLightbox();
      } else if (event.key === 'ArrowRight') {
        this.nextLightbox();
      }
    }
  }

  nextRealisation(): void {
    if (!this.realisationSlides || this.realisationSlides.length === 0) return;
    this.currentRealisation = (this.currentRealisation + 1) % this.realisationSlides.length;
  }

  prevRealisation(): void {
    if (!this.realisationSlides || this.realisationSlides.length === 0) return;
    this.currentRealisation = (this.currentRealisation - 1 + this.realisationSlides.length) % this.realisationSlides.length;
  }

  goToRealisation(index: number): void {
    this.currentRealisation = index;
  }

  onPlayVideo(e: Event): void {
    e.preventDefault();
    this.dataService.showToast('Lecture vidéo : Kiki Traiteur depuis 1997.');
  }
}
