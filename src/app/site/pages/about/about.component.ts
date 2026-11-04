import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionnaireApiService } from '../../../services/gestionnaire-api.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit, OnDestroy {
  currentSpotIndex = 0;
  private autoSlideInterval: any;

  valeurs = [
    'Savoir-faire', 'Expérience', 'Notoriété', 'Professionnalisme', 
    'Convivialité', 'Loyauté', 'Fiabilité', 'Longévité', 
    'Compétence', 'Excellence', 'Restauration'
  ];

  videoSpots = [
    {
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-in-a-kitchen-41006-large.mp4',
      title: 'L\'Art Culinaire & Brigade de Cuisine',
      subtitle: 'Dans les coulisses de notre laboratoire gastronomique de Hann Maristes.'
    },
    {
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-serving-dinner-at-a-restaurant-41014-large.mp4',
      title: 'Réceptions & Mariages à La Diva',
      subtitle: 'L\'excellence du service et l\'élégance des tables dressées par Kiki Traiteur.'
    },
    {
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waiter-serving-champagne-glasses-41010-large.mp4',
      title: 'Banquets Institutionnels & Cocktails',
      subtitle: 'Un savoir-faire reconnu par les plus grandes institutions du Sénégal depuis 1997.'
    }
  ];

  directionTeam = [
    {
      name: 'Mme Christiane Lopez Diaw',
      role: 'Gérante (43 ans d\'expérience)',
      tag: 'Direction',
      image: '',
      desc: 'Visionnaire de l\'excellence, elle guide Kiki Traiteur vers les sommets du prestige.'
    },
    {
      name: 'Docteur Ignace Coly',
      role: 'Resp. Hygiène et Qualité',
      tag: 'Qualité',
      image: '',
      desc: 'Il veille à l\'application rigoureuse des principes HACCP à chaque étape.'
    },
    {
      name: 'Chef Amadou Ndiaye',
      role: 'Chef de Cuisine',
      tag: 'Gastronomie',
      image: '',
      desc: 'Il dirige notre brigade culinaire avec rigueur pour garantir nos standards d\'excellence.'
    },
    {
      name: 'Mr Daniel Diop',
      role: 'Directeur d\'Exploitation',
      tag: 'Opérations',
      image: '',
      desc: 'Il orchestre notre capacité opérationnelle, gérant la logistique complexe avec brio.'
    }
  ];

  extendedTeam: any[] = [];
  private teamAutoSlideInterval: any;
  private readonly CARD_WIDTH = 352; // 320px width + 32px gap
  private SET_SIZE = 4; // Nombre de membres par set

  constructor(private apiService: GestionnaireApiService) {}

  ngOnInit() {
    this.initialiserEquipe();
    this.chargerEquipeDepuisServeur();
    
    if (typeof window !== 'undefined') {
      this.autoSlideInterval = setInterval(() => {
        this.nextVideo();
      }, 5000);
      
      this.teamAutoSlideInterval = setInterval(() => {
        const track = document.querySelector('.team-track') as HTMLElement;
        if (track) {
          const setWidth = this.CARD_WIDTH * this.SET_SIZE;
          
          // Si on a dépassé le premier set, on recule silencieusement
          if (track.scrollLeft >= setWidth) {
            track.style.scrollBehavior = 'auto'; // Instantané
            track.scrollLeft = track.scrollLeft - setWidth;
            
            // On lance le scroll smooth juste après
            setTimeout(() => {
              track.style.scrollBehavior = 'smooth';
              track.scrollLeft += this.CARD_WIDTH;
            }, 50);
          } else {
            track.scrollBy({ left: this.CARD_WIDTH, behavior: 'smooth' });
          }
        }
      }, 3500);
    }
  }

  initialiserEquipe(): void {
    if (!this.directionTeam || this.directionTeam.length === 0) {
      this.extendedTeam = [];
      return;
    }
    this.SET_SIZE = this.directionTeam.length;
    // On duplique largement pour la boucle infinie fluide
    this.extendedTeam = [
      ...this.directionTeam, 
      ...this.directionTeam, 
      ...this.directionTeam, 
      ...this.directionTeam, 
      ...this.directionTeam
    ];
  }

  chargerEquipeDepuisServeur(): void {
    this.apiService.getMembresEquipePublic().subscribe(membres => {
      if (membres && membres.length > 0) {
        this.directionTeam = membres.map(m => ({
          name: m.nom,
          role: m.titre,
          tag: m.tag || 'Direction',
          image: m.photoUrl || '',
          desc: m.description || ''
        }));
        this.initialiserEquipe();
      }
    });
  }

  ngOnDestroy() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
    if (this.teamAutoSlideInterval) {
      clearInterval(this.teamAutoSlideInterval);
    }
  }

  scrollTeam(track: HTMLElement, direction: number) {
    const setWidth = this.CARD_WIDTH * this.SET_SIZE;
    
    if (direction < 0 && track.scrollLeft <= 0) {
      // Reculer à partir du début : on avance silencieusement avant de reculer
      track.style.scrollBehavior = 'auto';
      track.scrollLeft += setWidth;
      setTimeout(() => {
        track.style.scrollBehavior = 'smooth';
        track.scrollLeft -= this.CARD_WIDTH;
      }, 50);
      return;
    }
    
    if (direction > 0 && track.scrollLeft >= setWidth * 2) {
      // Avancer très loin : on recule silencieusement avant d'avancer
      track.style.scrollBehavior = 'auto';
      track.scrollLeft -= setWidth;
      setTimeout(() => {
        track.style.scrollBehavior = 'smooth';
        track.scrollLeft += this.CARD_WIDTH;
      }, 50);
      return;
    }

    track.style.scrollBehavior = 'smooth';
    track.scrollLeft += direction * this.CARD_WIDTH;
  }

  nextVideo() {
    this.currentSpotIndex = (this.currentSpotIndex + 1) % this.videoSpots.length;
  }

  prevVideo() {
    this.currentSpotIndex = (this.currentSpotIndex - 1 + this.videoSpots.length) % this.videoSpots.length;
  }

  goToVideo(index: number) {
    this.currentSpotIndex = index;
  }
}
