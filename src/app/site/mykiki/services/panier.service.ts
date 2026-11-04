import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/** Un mets du catalogue, tel qu'il est ajouté au panier. */
export interface ArticlePanier {
  produitId: number;
  nom: string;
  imageUrl?: string;
  prixUnitaire: number;
  quantite: number;
  /**
   * Délai minimum de préparation, en heures. Certains plats se commandent
   * deux jours à l'avance, d'autres une heure : c'est ce délai qui détermine
   * la date de retrait la plus proche acceptable (par défaut 48h).
   */
  delaiPreparationHeures?: number;
  /** Quantité minimale obligatoire par commande. */
  quantiteMinimale?: number;
  categorieId?: number;
  categorieNom?: string;
  garnituresCompatibles?: any[];
  estGarniture?: boolean;
}

const CLE_STOCKAGE = 'kiki_panier_v1';

/**
 * Panier client.
 *
 * L'état est conservé dans le localStorage : le client doit retrouver sa
 * sélection s'il ferme l'onglet avant de commander. Il sera transmis au
 * serveur au moment de la validation de commande, pas avant.
 */
@Injectable({ providedIn: 'root' })
export class PanierService {

  private articlesSubject = new BehaviorSubject<ArticlePanier[]>(this.lireStockage());
  articles$: Observable<ArticlePanier[]> = this.articlesSubject.asObservable();

  private nombreSubject = new BehaviorSubject<number>(this.compter(this.articlesSubject.value));
  /** Nombre total d'articles, pour la pastille du panier. */
  nombreArticles$: Observable<number> = this.nombreSubject.asObservable();

  get articles(): ArticlePanier[] {
    return this.articlesSubject.value;
  }

  get nombreArticles(): number {
    return this.nombreSubject.value;
  }

  get total(): number {
    return this.articles.reduce((somme, a) => somme + a.prixUnitaire * a.quantite, 0);
  }

  /** Retourne la quantité sélectionnée dans le panier pour un produit donné. */
  getQuantite(produitId: number): number {
    const article = this.articles.find(a => a.produitId === produitId);
    return article ? article.quantite : 0;
  }

  /**
   * Délai de préparation du panier : celui du plat le plus long.
   * C'est lui qui contraint la date de retrait la plus proche.
   */
  get delaiPreparationHeures(): number {
    return this.articles.reduce((max, a) => Math.max(max, a.delaiPreparationHeures || 0), 0);
  }

  /** Première date de retrait acceptable, compte tenu du délai du panier. */
  get premierRetraitPossible(): Date {
    const date = new Date();
    date.setHours(date.getHours() + this.delaiPreparationHeures);
    date.setSeconds(0, 0);
    return date;
  }

  ajouter(article: Omit<ArticlePanier, 'quantite'>, quantite = 1): void {
    const articles = [...this.articles];
    const existant = articles.find(a => a.produitId === article.produitId);
    if (existant) {
      existant.quantite += quantite;
    } else {
      articles.push({ ...article, quantite });
    }
    this.enregistrer(articles);
  }

  definirQuantite(produitId: number, quantite: number): void {
    if (quantite <= 0) {
      this.retirer(produitId);
      return;
    }
    const articles = this.articles.map(a =>
      a.produitId === produitId ? { ...a, quantite } : a);
    this.enregistrer(articles);
  }

  retirer(produitId: number): void {
    this.enregistrer(this.articles.filter(a => a.produitId !== produitId));
  }

  vider(): void {
    this.enregistrer([]);
  }

  private enregistrer(articles: ArticlePanier[]): void {
    this.articlesSubject.next(articles);
    this.nombreSubject.next(this.compter(articles));
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(articles));
    } catch {
      // Navigation privée ou stockage saturé : le panier reste utilisable
      // pour la session en cours, il ne sera simplement pas retrouvé ensuite.
    }
  }

  private lireStockage(): ArticlePanier[] {
    try {
      const brut = localStorage.getItem(CLE_STOCKAGE);
      const donnees = brut ? JSON.parse(brut) : [];
      return Array.isArray(donnees) ? donnees : [];
    } catch {
      return [];
    }
  }

  private compter(articles: ArticlePanier[]): number {
    return articles.length;
  }
}
