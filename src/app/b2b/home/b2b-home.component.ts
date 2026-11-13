import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { B2bStateService } from '../shared/b2b-state.service';
import { UserRoleB2B } from '../shared/b2b.models';

interface PortailCarte {
  role: UserRoleB2B;
  titre: string;
  sousTitre: string;
  description: string;
  icone: string;
  badge: string;
  couleur: string;
  destination: string;
  nomDemo: string;
  entiteDemo: string;
}

@Component({
  selector: 'app-b2b-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './b2b-home.component.html',
  styleUrls: ['./b2b-home.component.css']
})
export class B2bHomeComponent implements AfterViewInit, OnDestroy {
  b2b = inject(B2bStateService);
  private router = inject(Router);
  private el = inject(ElementRef<HTMLElement>);
  private ngZone = inject(NgZone);

  private revealObserver?: IntersectionObserver;
  private counterObserver?: IntersectionObserver;
  private rafId?: number;
  private autoScrollInterval?: ReturnType<typeof setInterval>;
  private cleanupListeners: Array<() => void> = [];

  menuMobileOuvert = signal(false);
  activeStepIndex = signal(0);
  compteurSubvention = signal(0);
  compteurForfait = signal(0);
  compteurDelai = signal(0);
  cursorMode = signal<'default' | 'pointer' | 'hidden'>('hidden');
  faqOuverte = signal<number | null>(0);
  legalModal = signal<'mentions' | 'confidentialite' | null>(null);

  readonly clientsPartenaires = [
    { nom: 'Sonatel', logo: 'assets/images/SONATEL.png' },
    { nom: 'TotalEnergies', logo: 'assets/images/TOTAL ENERGIES.png' },
    { nom: 'Senico', logo: 'assets/images/SENICO.png' },
    { nom: 'ISM', logo: 'assets/images/ISM.png' },
    { nom: 'CICAD', logo: 'assets/images/CICAD.png' },
    { nom: 'MSC', logo: 'assets/images/MSC.png' },
    { nom: 'Elton', logo: 'assets/images/ELTON.png' },
    { nom: 'ICS Indorama', logo: 'assets/images/ICS-INDORAMA.png' },
    { nom: 'Apave', logo: 'assets/images/apave_news.png' }
  ];

  readonly apercusMenus = [
    {
      categorie: 'Plat Signature',
      nom: 'Poulet Yassa Braisé Kiki',
      details: 'Cuisse de poulet fermier, oignons caramélisés au citron vert & riz parfumé',
      calories: '650 kcal',
      image: 'assets/images/plats/p1.jpg'
    },
    {
      categorie: 'Poisson Noble',
      nom: 'Capitaine Braisé au Feu de Bois',
      details: 'Filet de poisson frais braisé, riz au jasmin & sauce moutarde maison',
      calories: '580 kcal',
      image: 'assets/images/plats/p2.jpg'
    },
    {
      categorie: 'Menu Équilibre',
      nom: 'Pavé de Bœuf & Légumes Vapeur',
      details: 'Bœuf tendre aux herbes, purée de patates douces et haricots persillés',
      calories: '520 kcal',
      image: 'assets/images/plats/p3.jpg'
    },
    {
      categorie: 'Terroir Sénégalais',
      nom: 'Thiéboudienne Penda Mbaye',
      details: 'Riz rouge traditionnel mijoté aux légumes du terroir et poisson frais',
      calories: '610 kcal',
      image: 'assets/images/plats/p4.jpg'
    }
  ];

  readonly questionsFaq = [
    {
      question: 'Quel effectif minimum faut-il pour démarrer et sous quel délai ?',
      reponse: 'Nous accompagnons les structures à partir de 15 repas/jour à Dakar et Diamniadio. Après validation de votre convention et import de vos collaborateurs, votre cantine digitale est opérationnelle en moins de 48h.'
    },
    {
      question: 'Comment fonctionne la politique de subvention RH (0% à 100%) ?',
      reponse: 'Vous fixez librement depuis votre portail RH le taux ou le plafond journalier pris en charge par l\'entreprise (ex. 50%, 75% ou 100%, ou variable selon le service). Le calcul part employeur / reste à charge salarié est automatique.'
    },
    {
      question: 'Comment se déroule la facturation mensuelle et le contrôle budgétaire ?',
      reponse: 'Fini les notes de frais éparses : en fin de mois, vous recevez une facture unique consolidée avec détail exact des plateaux réellement scannés et consommés par collaborateur, prête pour votre comptabilité.'
    },
    {
      question: 'Un salarié peut-il modifier ou annuler sa commande en cas d\'absence ?',
      reponse: 'Oui, chaque collaborateur peut modifier, déplacer ou annuler sa réservation librement depuis son espace jusqu\'à l\'heure de cut-off définie avec votre entreprise, garantissant zéro gaspillage.'
    }
  ];

  readonly prestationsB2B = [
    {
      numero: '01',
      icone: 'fa-solid fa-fire-burner',
      titre: 'Cuisine & Service sur Place',
      badge: 'Restauration intégrée',
      description: 'Installation et exploitation complète de votre restaurant d\'entreprise avec notre brigade sur site : préparation fraîche et service continu.'
    },
    {
      numero: '02',
      icone: 'fa-solid fa-utensils',
      titre: 'Service sur Place (Réfectoire)',
      badge: 'Cantine clé en main',
      description: 'Repas cuisinés dans nos cuisines centrales de Hann Maristes, acheminés en liaison chaude et servis à l\'assiette dans votre réfectoire.'
    },
    {
      numero: '03',
      icone: 'fa-solid fa-box-open',
      titre: 'Livraison en Barquettes',
      badge: 'Flexibilité maximale',
      description: 'Conditionnement individuel éco-responsable, étiquetage nominatif par salarié et livraison ponctuelle avant la pause déjeuner.'
    }
  ];

  readonly etapesFlux = [
    {
      numero: '01',
      titre: 'Menu Planifié & Quotas',
      texte: 'La direction Kiki et le responsable de site planifient les menus de la semaine et vérifient la conformité des quantités.'
    },
    {
      numero: '02',
      titre: 'Commande & Cut-Off',
      texte: 'Chaque collaborateur commande ses repas de la semaine avant l\'heure limite (J-1 ou Jour J), avec règlement Wave si non subventionné.'
    },
    {
      numero: '03',
      titre: 'Scan QR Code Cantine',
      texte: 'Sur place, le salarié scanne le QR Code du jour projeté au réfectoire : sa commande passe à « Scanné » puis « Livré ».'
    },
    {
      numero: '04',
      titre: 'Pilotage RH & Facture',
      texte: 'La RH suit les repas consommés en temps réel, gère les taux de subvention (0% à 100%) et exporte la facture consolidée.'
    }
  ];

  readonly portails: PortailCarte[] = [
    {
      role: 'SALARIE_CONVENTIONNE',
      titre: 'Espace Collaborateur',
      sousTitre: 'Salarié Subventionné ou Autonome',
      description: 'Commandez vos repas de la semaine, consultez les stocks en direct et débloquez votre plateau par QR Code.',
      icone: 'fa-solid fa-user-check',
      badge: 'Commande & QR',
      couleur: '#606C38',
      destination: '/b2b/commande',
      nomDemo: 'Moussa Ndiaye',
      entiteDemo: 'TotalEnergies Sénégal'
    },
    {
      role: 'RESPONSABLE_ENTREPRISE',
      titre: 'Portail RH & Entreprise',
      sousTitre: 'Pilotage & Facturation',
      description: 'Gérez vos collaborateurs, ajustez les taux de prise en charge (0% à 100%) et suivez la facturation mensuelle.',
      icone: 'fa-solid fa-briefcase',
      badge: 'Admin RH',
      couleur: '#721513',
      destination: '/b2b/rh',
      nomDemo: 'Mme Fatou Fall',
      entiteDemo: 'TotalEnergies Sénégal'
    },
    {
      role: 'RESPONSABLE_SITE_KIKI',
      titre: 'Responsable de Site',
      sousTitre: 'Exploitation & Distribution',
      description: 'Saisissez les quotas du jour, projetez le QR Code cantine, gérez les retards cut-off et validez les remises.',
      icone: 'fa-solid fa-qrcode',
      badge: 'Site & Cantine',
      couleur: '#C05621',
      destination: '/b2b/cuisine',
      nomDemo: 'M. Babacar Samb',
      entiteDemo: 'Kiki Traiteur Exploitation'
    },
    {
      role: 'SUPER_ADMIN',
      titre: 'Super Admin Kiki',
      sousTitre: 'Direction Multi-Entreprises',
      description: 'Supervisez l\'ensemble des entreprises clientes, le catalogue global, les menus hebdomadaires et le chiffre d\'affaires.',
      icone: 'fa-solid fa-crown',
      badge: 'Direction Kiki',
      couleur: '#332724',
      destination: '/b2b/super-admin',
      nomDemo: 'Direction Kiki Traiteur',
      entiteDemo: 'Kiki Traiteur Siège'
    }
  ];

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.compteurForfait.set(5000);
      this.compteurSubvention.set(100);
      this.compteurDelai.set(48);
      this.el.nativeElement.querySelectorAll('.b2b-reveal').forEach((t: Element) => t.classList.add('visible'));
      return;
    }

    this.initRevealObserver();
    this.initCounterAnimations();
    this.initScrollDynamics();
    this.initCustomCursorAndMagnetics();
    this.startAutoScroll();
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    this.counterObserver?.disconnect();
    this.pauseAutoScroll();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.cleanupListeners.forEach(fn => fn());
  }

  private initRevealObserver(): void {
    const targets = this.el.nativeElement.querySelectorAll('.b2b-reveal');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((t: Element) => t.classList.add('visible'));
      return;
    }
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            this.revealObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((t: Element) => this.revealObserver?.observe(t));
  }

  private initCounterAnimations(): void {
    // Compteurs Hero (immédiats avec lissage EASE_PREMIUM)
    this.animateCounter(0, 5000, 1100, val => this.compteurForfait.set(val));
    this.animateCounter(0, 100, 1200, val => this.compteurSubvention.set(val));

    // Compteur bannière CTA (déclenché à l'entrée dans le viewport)
    const ctaBanner = this.el.nativeElement.querySelector('.b2b-cta-banner');
    if (ctaBanner && 'IntersectionObserver' in window) {
      this.counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.animateCounter(0, 48, 1000, val => this.compteurDelai.set(val));
              this.counterObserver?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      this.counterObserver.observe(ctaBanner);
    } else {
      this.compteurDelai.set(48);
    }
  }

  private animateCounter(from: number, to: number, duration: number, setter: (v: number) => void): void {
    const start = performance.now();
    this.ngZone.runOutsideAngular(() => {
      const step = (now: number) => {
        const elapsed = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        const current = Math.round(from + (to - from) * eased);
        this.ngZone.run(() => setter(current));
        if (elapsed < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    });
  }

  private initScrollDynamics(): void {
    const rootEl = this.el.nativeElement;
    const progressBar = rootEl.querySelector('.b2b-scroll-progress') as HTMLElement | null;
    const sealSvg = rootEl.querySelector('.b2b-seal-svg') as HTMLElement | null;
    const heroPreview = rootEl.querySelector('.b2b-hero-visual') as HTMLElement | null;
    const workflowSection = rootEl.querySelector('#fonctionnement-b2b') as HTMLElement | null;
    const timelineFill = rootEl.querySelector('.b2b-timeline-fill') as HTMLElement | null;

    this.ngZone.runOutsideAngular(() => {
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const scrollY = window.scrollY || 0;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const globalProgress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;

          // Barre de progression haute
          if (progressBar) {
            progressBar.style.transform = `scaleX(${globalProgress})`;
          }

          // Sceau circulaire rotatif entraîné par le scroll (Style VisionSection)
          if (sealSvg) {
            sealSvg.style.transform = `rotate(${(scrollY * 0.22).toFixed(1)}deg)`;
          }

          // Légère décompression / parallaxe Hero
          if (heroPreview && scrollY < 700) {
            const parallax = Math.min(scrollY * 0.05, 28);
            const scale = Math.max(1 - scrollY * 0.00008, 0.96);
            heroPreview.style.transform = `translate3d(0, ${parallax}px, 0) scale(${scale})`;
          }

          // Progression Timeline Workflow 01 -> 04 au défilement
          if (workflowSection && timelineFill) {
            const rect = workflowSection.getBoundingClientRect();
            const vh = window.innerHeight;
            const start = vh * 0.78;
            const end = vh * 0.18;
            const raw = (start - rect.top) / (start - end + rect.height * 0.4);
            const pct = Math.min(Math.max(raw, 0.15), 1);
            timelineFill.style.transform = `scaleY(${pct})`;

            const stepIdx = pct < 0.33 ? 0 : pct < 0.56 ? 1 : pct < 0.78 ? 2 : 3;
            if (stepIdx !== this.activeStepIndex()) {
              this.ngZone.run(() => this.activeStepIndex.set(stepIdx));
            }
          }
        });
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      this.cleanupListeners.push(() => window.removeEventListener('scroll', onScroll));
    });
  }

  private initCustomCursorAndMagnetics(): void {
    const isDesktopFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isDesktopFinePointer) return;

    const rootEl = this.el.nativeElement;
    const dot = rootEl.querySelector('.b2b-cursor-dot') as HTMLElement | null;
    const ring = rootEl.querySelector('.b2b-cursor-ring') as HTMLElement | null;
    if (!dot || !ring) return;

    this.ngZone.runOutsideAngular(() => {
      let targetX = -100;
      let targetY = -100;
      let ringX = -100;
      let ringY = -100;
      let started = false;

      const onMouseMove = (e: MouseEvent) => {
        targetX = e.clientX;
        targetY = e.clientY;
        dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;

        if (!started) {
          started = true;
          ringX = targetX;
          ringY = targetY;
          this.ngZone.run(() => {
            if (this.cursorMode() === 'hidden') this.cursorMode.set('default');
          });
        }

        // Spotlight sur cartes portails
        const target = e.target as HTMLElement | null;
        const portailCard = target?.closest('.portail-card') as HTMLElement | null;
        if (portailCard) {
          const rect = portailCard.getBoundingClientRect();
          portailCard.style.setProperty('--mx', `${e.clientX - rect.left}px`);
          portailCard.style.setProperty('--my', `${e.clientY - rect.top}px`);
        }

        // Détection contextuelle du curseur
        if (target?.closest('a, button')) {
          this.setCursorState('pointer');
        } else {
          this.setCursorState('default');
        }
      };

      const onMouseLeaveWindow = () => {
        this.setCursorState('hidden');
      };

      // Effet magnétique sur boutons principaux
      const magneticEls = rootEl.querySelectorAll('.b2b-btn-primary, .b2b-btn-outline, .b2b-btn-login, .b2b-btn-white');
      magneticEls.forEach((btn: Element) => {
        const htmlBtn = btn as HTMLElement;
        const onMove = (ev: Event) => {
          const me = ev as MouseEvent;
          const r = htmlBtn.getBoundingClientRect();
          const dx = (me.clientX - (r.left + r.width / 2)) * 0.18;
          const dy = (me.clientY - (r.top + r.height / 2)) * 0.22;
          htmlBtn.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
        };
        const onLeave = () => {
          htmlBtn.style.transform = '';
        };
        htmlBtn.addEventListener('mousemove', onMove);
        htmlBtn.addEventListener('mouseleave', onLeave);
        this.cleanupListeners.push(() => {
          htmlBtn.removeEventListener('mousemove', onMove);
          htmlBtn.removeEventListener('mouseleave', onLeave);
        });
      });

      const loop = () => {
        ringX += (targetX - ringX) * 0.16;
        ringY += (targetY - ringY) * 0.16;
        ring.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0) translate(-50%, -50%)`;
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      document.addEventListener('mouseleave', onMouseLeaveWindow);

      this.cleanupListeners.push(() => {
        window.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseleave', onMouseLeaveWindow);
      });
    });
  }

  private setCursorState(mode: 'default' | 'pointer' | 'hidden'): void {
    if (this.cursorMode() !== mode) {
      this.ngZone.run(() => {
        this.cursorMode.set(mode);
      });
    }
  }

  toggleFaq(index: number): void {
    this.faqOuverte.update(current => (current === index ? null : index));
  }

  ouvrirLegal(type: 'mentions' | 'confidentialite', event: Event): void {
    event.preventDefault();
    this.legalModal.set(type);
  }

  scrollSlider(direction: 'left' | 'right'): void {
    const slider = document.getElementById('b2b-clients-slider');
    const set1 = document.getElementById('b2b-logo-set-1');
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
      const scrollAmount = 240;
      slider.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount });
    }
  }

  startAutoScroll(): void {
    if (typeof window === 'undefined') return;
    this.pauseAutoScroll();
    this.ngZone.runOutsideAngular(() => {
      this.autoScrollInterval = setInterval(() => {
        const slider = document.getElementById('b2b-clients-slider');
        const set1 = document.getElementById('b2b-logo-set-1');
        if (slider && set1) {
          slider.style.scrollBehavior = 'auto';
          slider.scrollLeft += 1;
          const gap = parseFloat(getComputedStyle(set1).gap) || 24;
          const setWidth = set1.offsetWidth + gap;
          if (setWidth > 0 && slider.scrollLeft >= setWidth) {
            slider.scrollLeft -= setWidth;
          }
        }
      }, 25);
    });
  }

  pauseAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = undefined;
    }
  }

  resumeAutoScroll(): void {
    this.startAutoScroll();
  }

  allerConnexion(event?: Event): void {
    if (event) event.preventDefault();
    this.menuMobileOuvert.set(false);
    this.b2b.naviguerAvecRideau('/b2b/login', (target) => this.router.navigateByUrl(target));
  }

  toggleMenuMobile() {
    this.menuMobileOuvert.update(v => !v);
  }

  allerHaut(event?: Event) {
    if (event) event.preventDefault();
    this.menuMobileOuvert.set(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  allerVersSection(sectionId: string, event?: Event) {
    if (event) event.preventDefault();
    this.menuMobileOuvert.set(false);
    if (typeof document !== 'undefined') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  ouvrirPortailParRole(role: UserRoleB2B, event?: Event) {
    if (event) event.preventDefault();
    const portail = this.portails.find(p => p.role === role);
    if (portail) {
      this.ouvrirPortail(portail);
    }
  }

  ouvrirPortail(p: PortailCarte) {
    if (p.role === 'SUPER_ADMIN') {
      this.b2b.superAdminActiveSection.set('DASHBOARD');
    }
    this.b2b.setSessionRole({
      role: p.role,
      nomComplet: p.nomDemo,
      titrePoste: p.sousTitre,
      entite: p.entiteDemo,
      badge: p.badge,
      badgeColor: p.couleur,
      siteId: 'site-1',
      siteNom: 'Siège Plateau - Dakar'
    });
    this.router.navigateByUrl(p.destination);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
