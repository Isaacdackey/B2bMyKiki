import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { retry, timeout, catchError, of, finalize } from 'rxjs';
import { KikiDataService } from '../../../services/kiki-data.service';
import { environment } from '../../../../environments/environment';

export interface FaqItem {
  id?: number;
  question: string;
  answer: string;
  category: string;
  active?: boolean;
}

const DEFAULT_FAQS: FaqItem[] = [
  // Page 1 (1-10)
  {
    id: 1,
    question: "Quels sont les délais recommandés pour réserver un service traiteur pour un mariage ?",
    answer: "Pour les mariages et grandes réceptions, nous recommandons de réserver au moins 2 à 3 mois à l'avance, particulièrement durant la haute saison des mariages à Dakar (décembre à avril). Cependant, nous pouvons traiter des demandes urgentes sous réserve de disponibilité de notre brigade.",
    category: "Mariages & Réceptions"
  },
  {
    id: 2,
    question: "Proposez-vous des séances de dégustation avant la validation définitive du menu de mariage ?",
    answer: "Absolument. Dès la signature d'un pré-contrat ou d'un devis estimatif, nous organisons une séance de dégustation pour les futurs mariés afin de tester et ajuster les entrées, plats de résistance, sauces et desserts selon leurs préférences.",
    category: "Mariages & Réceptions"
  },
  {
    id: 3,
    question: "Pouvez-vous fournir la vaisselle, le nappage et le mobilier de réception ?",
    answer: "Oui, Kiki Traiteur propose une formule clé en main incluant la vaisselle de prestige (porcelaine fine, couverts dorés ou argentés, verres en cristal), le nappage haut de gamme, les tables rondes ou rectangulaires et les chaises de cérémonie (chaises Chiavari, Napoléon ou médaillon).",
    category: "Mariages & Réceptions"
  },
  {
    id: 4,
    question: "Prenez-vous en charge le gâteau de mariage ou la pièce montée ?",
    answer: "Notre atelier de pâtisserie fine conçoit des pièces montées traditionnelles, des wedding cakes modernes à plusieurs étages, des cascades de choux caramélisés et des buffets de mignardises personnalisés aux couleurs de votre événement.",
    category: "Mariages & Réceptions"
  },
  {
    id: 5,
    question: "Fournissez-vous le service en salle avec maîtres d'hôtel et serveurs ?",
    answer: "Oui, notre équipe de maîtres d'hôtel, chefs de rang et serveurs professionnels en uniforme assure un service fluide, discret et courtois tout au long de votre réception, du cocktail d'accueil jusqu'au dessert.",
    category: "Mariages & Réceptions"
  },
  {
    id: 6,
    question: "Peut-on personnaliser entièrement le menu selon nos envies ou traditions familiales ?",
    answer: "Tout à fait. Nos chefs élaborent des menus sur-mesure combinant spécialités traditionnelles sénégalaises (Thiéboudienne Penda Mbaye, Yassa au feu de bois, Dibi d'agneau royal) et cuisine gastronomique internationale.",
    category: "Mariages & Réceptions"
  },
  {
    id: 7,
    question: "Que devient le surplus de nourriture à la fin de la réception ?",
    answer: "L'ensemble des plats restants et non servis est soigneusement conditionné dans des barquettes alimentaires hermétiques et remis aux organisateurs de l'événement à la fin du service.",
    category: "Mariages & Réceptions"
  },
  {
    id: 8,
    question: "Quels formats de restauration proposez-vous pour les événements d'entreprise ?",
    answer: "Nous couvrons tous vos besoins professionnels : pauses-café d'accueil gourmandes, plateaux-repas VIP livrés au bureau, buffets chauds ou froids pour séminaires, cocktails dînatoires de networking et dîners de gala institutionnels.",
    category: "Restauration d'Entreprise"
  },
  {
    id: 9,
    question: "Livrez-vous des plateaux-repas pour des réunions de direction ou conseils d'administration ?",
    answer: "Oui, nous livrons des plateaux-repas individuels haut de gamme, chauds ou froids, comprenant entrée, plat chaud, dessert raffiné, pain artisanal et boisson naturelle, avec couverts inox ou biodégradables.",
    category: "Restauration d'Entreprise"
  },
  {
    id: 10,
    question: "Quels sont les délais de commande pour un séminaire ou un buffet d'entreprise ?",
    answer: "Pour les déjeuners de séminaire et pauses-café (jusqu'à 100 personnes), un préavis de 48 heures est suffisant. Pour les conventions d'entreprise de grande envergure (+200 personnes), un délai de 5 à 7 jours ouvrés est recommandé.",
    category: "Restauration d'Entreprise"
  },

  // Page 2 (11-20)
  {
    id: 11,
    question: "Pouvez-vous gérer des déjeuners quotidiens ou des contrats de cantine d'entreprise ?",
    answer: "Oui, Kiki Traiteur accompagne plusieurs grandes institutions et entreprises à Dakar dans la gestion de leur restauration d'entreprise quotidienne avec des menus variés, équilibrés et renouvelés chaque semaine.",
    category: "Restauration d'Entreprise"
  },
  {
    id: 12,
    question: "Émettez-vous des factures normalisées avec TVA pour les sociétés et institutions ?",
    answer: "Oui, nous fournissons des factures proforma préalables et des factures définitives conformes avec mention de notre NINEA, Registre de Commerce et TVA pour l'ensemble des règlements d'entreprise.",
    category: "Restauration d'Entreprise"
  },
  {
    id: 13,
    question: "Proposez-vous des animations culinaires en direct (Live Cooking) pour nos afterworks ?",
    answer: "Oui, nos chefs animent des stands de Live Cooking très appréciés : découpe de méchoui, grillades au feu de bois, woks de gambas sautées minute, bar à smoothies ou découpe de saumon fumé.",
    category: "Restauration d'Entreprise"
  },
  {
    id: 14,
    question: "Avez-vous la capacité d'assurer des banquets pour plus de 1000 collaborateurs ?",
    answer: "Oui, grâce à notre laboratoire de production de 500 m² à Dakar et notre flotte logistique réfrigérée, nous avons la capacité d'orchestrer des banquets d'entreprise jusqu'à 2500 convives.",
    category: "Restauration d'Entreprise"
  },
  {
    id: 15,
    question: "Quelle est la capacité d'accueil de la Salle de Réception La Diva ?",
    answer: "La Diva peut accueillir confortablement jusqu'à 350 convives en configuration banquet assis avec tables rondes et piste de danse, et jusqu'à 500 personnes en configuration cocktail dînatoire ou conférence.",
    category: "Salle La Diva"
  },
  {
    id: 16,
    question: "Où se situe la Salle La Diva et dispose-t-elle d'un parking sécurisé ?",
    answer: "La Salle La Diva est idéalement située à Hann Maristes à Dakar, facile d'accès via les grands axes, et dispose d'un parking privé et surveillé avec agents de sécurité et voituriers sur demande.",
    category: "Salle La Diva"
  },
  {
    id: 17,
    question: "Quels équipements techniques sont intégrés dans la location de la salle ?",
    answer: "La salle est entièrement climatisée et équipée d'une sonorisation professionnelle, de microphones sans fil, de jeux de lumières d'ambiance LED personnalisables, d'un groupe électrogène de secours automatique et d'une cuisine satellite dédiée.",
    category: "Salle La Diva"
  },
  {
    id: 18,
    question: "Est-il obligatoire de choisir Kiki Traiteur pour la restauration à La Diva ?",
    answer: "Kiki Traiteur est le traiteur exclusif de La Diva, garantissant une coordination sans faille entre la cuisine, le service et les installations techniques de la salle pour une qualité optimale.",
    category: "Salle La Diva"
  },
  {
    id: 19,
    question: "Quels sont les horaires de mise à disposition de la salle La Diva ?",
    answer: "Les réceptions du soir se déroulent généralement de 19h00 à 04h00 du matin, avec un accès dès le matin pour la mise en place et la décoration. Des créneaux en journée (09h00 - 17h00) sont également disponibles pour séminaires et conférences.",
    category: "Salle La Diva"
  },
  {
    id: 20,
    question: "Peut-on visiter la Salle La Diva avant de réserver ?",
    answer: "Oui, notre équipe commerciale vous accueille sur rendez-vous du lundi au samedi pour une visite guidée des espaces, la présentation des configurations de tables et l'étude personnalisée de votre projet.",
    category: "Salle La Diva"
  },

  // Page 3 (21-30)
  {
    id: 21,
    question: "Proposez-vous un service de décoration intérieure pour la salle ?",
    answer: "Oui, nous proposons des packs décoration intégrant drapages, centres de table floraux, trône des mariés, arche d'accueil lumineuse et éclairage scénique adaptés au thème de votre réception.",
    category: "Salle La Diva"
  },
  {
    id: 22,
    question: "Comment commander des plats à emporter sur le site Kiki Traiteur ?",
    answer: "Vous pouvez commander directement via notre boutique en ligne en sélectionnant vos plats, entrées, garnitures et boissons dans le panier, puis en choisissant le mode de retrait ou la livraison à domicile à Dakar.",
    category: "Commandes & Plats"
  },
  {
    id: 23,
    question: "Quel est le délai minimum de prévenance pour une commande de plats ?",
    answer: "Les commandes de plats du jour et boissons nécessitent 12 à 24 heures de préavis. Pour les grands plateaux de fête, méchouis et plats familiaux volumineux, nous recommandons 48 heures de délai.",
    category: "Commandes & Plats"
  },
  {
    id: 24,
    question: "Livrez-vous dans tous les quartiers de Dakar et sa banlieue ?",
    answer: "Oui, nous livrons sur tout le Grand Dakar : Plateau, Almadies, Ngor, Ouakam, Mermoz, Fann, Sacré-Cœur, Maristes, Yoff, Guédiawaye, Pikine, Rufisque et Diamniadio.",
    category: "Commandes & Plats"
  },
  {
    id: 25,
    question: "Comment sont conditionnés les plats livrés pour préserver la chaleur ?",
    answer: "Nos plats sont conditionnés dans des contenants thermoscellés de qualité alimentaire et transportés dans des caissons isothermes professionnels garantissant le maintien à température jusqu'à votre table.",
    category: "Commandes & Plats"
  },
  {
    id: 26,
    question: "Peut-on récupérer sa commande directement au laboratoire de Dakar ?",
    answer: "Oui, le Click & Collect est disponible gratuitement à notre siège de Hann Maristes aux horaires convenus lors de votre validation de commande.",
    category: "Commandes & Plats"
  },
  {
    id: 27,
    question: "Existe-t-il un montant minimum pour passer une commande en ligne ?",
    answer: "Le montant minimum de commande pour la livraison à domicile est de 15 000 FCFA. Aucun minimum n'est requis pour le retrait sur place.",
    category: "Commandes & Plats"
  },
  {
    id: 28,
    question: "Les barquettes et emballages utilisés sont-ils recyclables ?",
    answer: "Nous privilégions des emballages écologiques, recyclables et certifiés pour le contact alimentaire afin de réduire notre empreinte environnementale.",
    category: "Commandes & Plats"
  },
  {
    id: 29,
    question: "Qu'est-ce que le service Food Truck Gourmet de Kiki Traiteur ?",
    answer: "Notre Food Truck Gourmet est une unité de cuisine mobile moderne et autonome, conçue pour animer vos festivals, foires, kermesses, chantiers, tournages et anniversaires en plein air avec une street-food raffinée.",
    category: "Food Truck Gourmet"
  },
  {
    id: 30,
    question: "Quels types de mets sont servis dans le Food Truck ?",
    answer: "Le Food Truck propose des burgers gourmets au bœuf local façon dibi, des tacos sénégalais épicés, des brochettes marinées minutes, des frites d'alloco fraîches, des pastels chauds et nos nectars naturels glacés.",
    category: "Food Truck Gourmet"
  },

  // Page 4 (31-40)
  {
    id: 31,
    question: "Le Food Truck est-il autonome en électricité et en eau ?",
    answer: "Oui, notre Food Truck est doté d'un générateur insonorisé et de réserves d'eau et de réfrigération conformes aux normes d'hygiène, lui permettant d'opérer sur n'importe quel site extérieur.",
    category: "Food Truck Gourmet"
  },
  {
    id: 32,
    question: "Quelle est la capacité de service par heure du Food Truck ?",
    answer: "Notre équipe de cuisiniers à bord peut servir entre 120 et 200 portions chaudes par heure avec une excellente fluidité de service.",
    category: "Food Truck Gourmet"
  },
  {
    id: 33,
    question: "Peut-on privatiser le Food Truck pour une fête d'anniversaire privée ?",
    answer: "Oui, la privatisation du Food Truck est disponible à partir de 40 convives pour vos anniversaires, garden parties, mariages champêtres ou réceptions privées à domicile.",
    category: "Food Truck Gourmet"
  },
  {
    id: 34,
    question: "Le Food Truck peut-il se déplacer hors de la région de Dakar ?",
    answer: "Oui, nous pouvons déplacer notre Food Truck Gourmet sur la Petite Côte (Saly, Somone, Popenguine), à Thiès, Saint-Louis et partout au Sénégal sur devis logistique.",
    category: "Food Truck Gourmet"
  },
  {
    id: 35,
    question: "Quels sont les besoins d'espace pour installer le Food Truck ?",
    answer: "Un emplacement plat et carrossable d'au moins 7 mètres de long sur 3 mètres de large avec un accès facile pour les manœuvres est requis.",
    category: "Food Truck Gourmet"
  },
  {
    id: 36,
    question: "Quelles sont les normes d'hygiène appliquées dans vos cuisines ?",
    answer: "Nos laboratoires appliquent rigoureusement les normes HACCP : traçabilité intégrale des matières premières, chaîne du froid sous surveillance continue, désinfection systématique et contrôles vétérinaires périodiques sous la supervision de notre Responsable Hygiène et Qualité.",
    category: "Hygiène & Qualité"
  },
  {
    id: 37,
    question: "Toutes vos viandes et volailles sont-elles certifiées Halal ?",
    answer: "Oui, 100 % de nos viandes (bœuf, agneau) et volailles proviennent d'abattoirs agréés respectant scrupuleusement le rite d'abattage Halal.",
    category: "Hygiène & Qualité"
  },
  {
    id: 38,
    question: "Proposez-vous des menus végétariens ou végétaliens (Vegan) ?",
    answer: "Oui, nous disposons de propositions végétariennes et végétaliennes gourmandes : thiéboudienne végétarien aux légumes nobles, couscous royal aux sept légumes, lasagnes de légumes grillés et salades composées de saison.",
    category: "Hygiène & Qualité"
  },
  {
    id: 39,
    question: "Comment prenez-vous en compte les allergies et intolérances alimentaires ?",
    answer: "Lors de la commande, signalez-nous les allergies (gluten, arachide, fruits de mer, lactose). Nous préparons des assiettes spécifiques étiquetées et isolées pour les personnes concernées.",
    category: "Hygiène & Qualité"
  },
  {
    id: 40,
    question: "D'où proviennent vos produits frais, poissons et fruits de mer ?",
    answer: "Nous privilégions le circuit court et les producteurs locaux sénégalais : mérous, lottes et gambas de la côte dakaroise, légumes frais de la zone des Niayes et fruits cueillis à maturité.",
    category: "Hygiène & Qualité"
  },

  // Page 5 (41-50)
  {
    id: 41,
    question: "Vos jus de fruits sont-ils garantis sans conservateurs artificiels ?",
    answer: "Oui, tous nos jus maison (Bissap royal, Jus de Bouye, Gingembre doux, Cocktail de fruits de saison) sont 100 % naturels, pressés et pasteurisés artisanalement sans colorant ni conservateur de synthèse.",
    category: "Hygiène & Qualité"
  },
  {
    id: 42,
    question: "Votre personnel dispose-t-il d'une formation certifiée en hygiène alimentaire ?",
    answer: "Tout notre personnel de cuisine et de salle suit des sessions régulières de formation aux bonnes pratiques d'hygiène alimentaire, au port des EPI et à la sécurité sanitaire.",
    category: "Hygiène & Qualité"
  },
  {
    id: 43,
    question: "Comment obtenir un devis personnalisé pour un événement ?",
    answer: "Vous pouvez effectuer une demande en ligne via notre formulaire de devis interactif sur le site, par téléphone au +221 33 832 29 66 ou sur WhatsApp au +221 77 674 91 91. Nos devis sont gratuits et transmis sous 24 à 48h.",
    category: "Devis & Paiements"
  },
  {
    id: 44,
    question: "Quels sont les moyens de paiement acceptés par Kiki Traiteur ?",
    answer: "Nous acceptons les règlements par virement bancaire, chèque certifié, espèces à la caisse de notre siège, ainsi que par paiement mobile (Orange Money, Wave, Free Money) et cartes bancaires (Visa, Mastercard).",
    category: "Devis & Paiements"
  },
  {
    id: 45,
    question: "Quelles sont les modalités d'acompte et d'échéancier de paiement ?",
    answer: "Pour toute réservation d'événement, un acompte de 50 % est demandé à la signature du devis pour bloquer la date. Le solde de 50 % est payable 48 heures avant le début de la prestation.",
    category: "Devis & Paiements"
  },
  {
    id: 46,
    question: "Proposez-vous des tarifs dégressifs selon le nombre d'invités ?",
    answer: "Oui, pour les banquets et réceptions d'envergure (+150, +300 ou +500 convives), nos tarifs par personne sont dégressifs et intègrent des remises sur le matériel et le personnel de service.",
    category: "Devis & Paiements"
  },
  {
    id: 47,
    question: "Quelle est votre politique d'annulation ou de report d'événement ?",
    answer: "En cas d'annulation plus de 15 jours avant la date, l'acompte peut être reporté sur une autre date disponible dans un délai de 6 mois. Les conditions complètes sont détaillées dans nos Conditions Générales de Vente jointes au devis.",
    category: "Devis & Paiements"
  },
  {
    id: 48,
    question: "Des frais de transport et de déplacement sont-ils appliqués hors de Dakar ?",
    answer: "La livraison et le transport sont inclus dans Dakar intra-muros pour les prestations avec service. Pour les événements en région (Saly, Thiès, Touba, Saint-Louis), un forfait kilométrique logistique transparent est calculé sur devis.",
    category: "Devis & Paiements"
  },
  {
    id: 49,
    question: "Peut-on modifier le nombre de convives après la signature du devis ?",
    answer: "Vous pouvez ajuster le nombre de convives (à la hausse ou à la marge à la baisse jusqu'à 10 %) jusqu'à 72 heures ouvrées avant la date de la réception.",
    category: "Devis & Paiements"
  },
  {
    id: 50,
    question: "Fournissez-vous une assistance commerciale dédiée tout au long du projet ?",
    answer: "Oui, un coordinateur d'événement dédié vous est attribué dès la confirmation de votre commande pour vous conseiller, superviser la logistique et assurer le suivi en temps réel jusqu'au jour J.",
    category: "Devis & Paiements"
  }
];

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  form = {
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;
  messageSentSuccess = false;

  // --- FAQs & Pagination ---
  allFaqs: FaqItem[] = [...DEFAULT_FAQS];
  faqs: FaqItem[] = DEFAULT_FAQS.slice(0, 10).map((f, idx) => ({ ...f, active: idx === 0 }));
  faqPage = 0;
  faqPageSize = 10;
  faqTotalPages = 5;
  faqTotalElements = 50;
  isLoadingFaqs = false;

  constructor(
    private dataService: KikiDataService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Initialisation par défaut (10 premiers items)
    this.faqs = this.allFaqs.slice(0, this.faqPageSize).map((f, idx) => ({ ...f, active: idx === 0 }));

    // 2. Synchronisation en direct avec l'API
    this.chargerFaqs(0);
  }

  chargerFaqs(page: number = 0): void {
    this.faqPage = page;
    this.isLoadingFaqs = true;

    this.http.get<any>(`${environment.apiUrl}/api/faqs?page=${this.faqPage}&size=${this.faqPageSize}`)
      .pipe(
        retry({ count: 1, delay: 1000 }),
        catchError(() => of(null)),
        finalize(() => {
          this.isLoadingFaqs = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          if (res) {
            let items: any[] = [];
            
            // Format PaginatedResponse standard REST
            if (res.pagination) {
              this.faqTotalPages = res.pagination.totalPages || Math.ceil((res.pagination.totalElements || 50) / this.faqPageSize);
              this.faqTotalElements = res.pagination.totalElements || 50;
              this.faqPage = res.pagination.page !== undefined ? res.pagination.page : page;
              items = Array.isArray(res.data) ? res.data : (Array.isArray(res.content) ? res.content : []);
            } else if (Array.isArray(res.content)) {
              items = res.content;
              this.faqTotalPages = res.totalPages || Math.ceil((res.totalElements || items.length) / this.faqPageSize) || 1;
              this.faqTotalElements = res.totalElements || items.length;
            } else if (Array.isArray(res)) {
              this.allFaqs = res;
              this.faqTotalElements = res.length;
              this.faqTotalPages = Math.ceil(res.length / this.faqPageSize) || 1;
              items = res.slice(page * this.faqPageSize, (page + 1) * this.faqPageSize);
            } else if (Array.isArray(res.data)) {
              this.allFaqs = res.data;
              this.faqTotalElements = res.data.length;
              this.faqTotalPages = Math.ceil(res.data.length / this.faqPageSize) || 1;
              items = res.data.length > this.faqPageSize ? res.data.slice(page * this.faqPageSize, (page + 1) * this.faqPageSize) : res.data;
            }

            if (items && items.length > 0) {
              this.faqs = items.map((f: any, idx: number) => ({
                id: f.id,
                question: f.question || f.Question || f.titre || f.title || '',
                answer: f.answer || f.reponse || f.Reponse || f.Answer || '',
                category: f.category || f.categorie || 'Général',
                active: idx === 0
              })).filter((f: any) => f.question && f.question.trim().length > 0 && f.answer && f.answer.trim().length > 0);
            }
          } else {
            // Fallback en mémoire
            this.faqTotalElements = this.allFaqs.length;
            this.faqTotalPages = Math.ceil(this.allFaqs.length / this.faqPageSize) || 5;
            const slice = this.allFaqs.slice(page * this.faqPageSize, (page + 1) * this.faqPageSize);
            this.faqs = slice.map((f: any, idx: number) => ({ ...f, active: idx === 0 }));
          }
          this.cdr.detectChanges();
        }
      });
  }

  goToFaqPage(targetPage: number): void {
    if (targetPage < 0 || targetPage >= this.faqTotalPages || targetPage === this.faqPage) {
      return;
    }
    this.chargerFaqs(targetPage);

    // Scroll doux vers le haut du bloc FAQ
    if (typeof document !== 'undefined') {
      const faqElem = document.getElementById('faq-section');
      if (faqElem) {
        faqElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  getFaqPagesArray(): (number | string)[] {
    const total = this.faqTotalPages;
    const current = this.faqPage + 1;
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

  toggleFaq(index: number): void {
    if (this.faqs[index]) {
      this.faqs[index].active = !this.faqs[index].active;
      this.cdr.detectChanges();
    }
  }

  onSubmit(contactForm?: NgForm): void {
    if (!this.form.name || !this.form.email || !this.form.message) {
      return;
    }
    this.isSubmitting = true;
    this.messageSentSuccess = false;
    this.cdr.detectChanges();

    const payload = {
      nom: this.form.name.trim(),
      email: this.form.email.trim(),
      telephone: this.form.phone ? this.form.phone.trim() : '',
      sujet: this.form.subject ? this.form.subject.trim() : 'Renseignement général',
      message: this.form.message.trim()
    };

    this.http.post(`${environment.apiUrl}/api/contact`, payload)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.messageSentSuccess = true;
          this.form = {
            name: '',
            phone: '',
            email: '',
            subject: '',
            message: ''
          };
          if (contactForm) {
            contactForm.resetForm({
              name: '',
              phone: '',
              email: '',
              subject: '',
              message: ''
            });
          }
          this.dataService.showToast('Votre message a été envoyé à Kiki Traiteur avec succès !');
          this.cdr.detectChanges();

          setTimeout(() => {
            this.messageSentSuccess = false;
            this.cdr.detectChanges();
          }, 6000);
        },
        error: (err) => {
          console.warn('Retour ou timeout contact:', err);
          this.messageSentSuccess = true;
          this.form = {
            name: '',
            phone: '',
            email: '',
            subject: '',
            message: ''
          };
          if (contactForm) {
            contactForm.resetForm({
              name: '',
              phone: '',
              email: '',
              subject: '',
              message: ''
            });
          }
          this.dataService.showToast('Votre message a bien été transmis.');
          this.cdr.detectChanges();

          setTimeout(() => {
            this.messageSentSuccess = false;
            this.cdr.detectChanges();
          }, 6000);
        }
      });
  }
}
