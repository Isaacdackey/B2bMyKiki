import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse } from './auth.service';

/**
 * Même forme que LoginResponse : la session s'ouvre avec le même code, quel
 * que soit le mode d'authentification. Seul `nouveauCompte` est spécifique.
 */
export interface ReponseConnexionGoogle extends LoginResponse {
  nouveauCompte: boolean;
}

/**
 * Connexion « Continuer avec Google », pour les clients MyKiki.
 *
 * Charge la bibliothèque Google Identity Services à la demande, puis échange
 * le jeton d'identité obtenu contre un JWT Kiki Traiteur. Le jeton Google
 * n'est jamais utilisé directement : c'est le serveur qui en vérifie la
 * signature avant d'ouvrir une session.
 */
@Injectable({ providedIn: 'root' })
export class GoogleConnexionService {

  private readonly base = `${environment.apiUrl}/api/auth/google`;
  private scriptCharge = false;
  private clientId: string | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Le serveur indique s'il dispose d'un identifiant client OAuth, et le
   * fournit. Cet identifiant est public : il désigne l'application, il ne
   * l'authentifie pas.
   */
  estDisponible(): Observable<{ disponible: boolean; clientId: string | null }> {
    return this.http.get<{ disponible: boolean; clientId: string | null }>(`${this.base}/disponible`);
  }

  connecter(credential: string): Observable<ReponseConnexionGoogle> {
    return this.http.post<ReponseConnexionGoogle>(this.base, { credential });
  }

  /**
   * Affiche le bouton Google dans l'élément fourni.
   *
   * @param clientId identifiant client OAuth du projet Google Cloud
   * @param cible    élément hôte du bouton
   * @param surJeton appelé avec le jeton d'identité une fois l'utilisateur choisi
   */
  async afficherBouton(clientId: string, cible: HTMLElement,
                       surJeton: (credential: string) => void): Promise<void> {
    this.clientId = clientId;
    await this.chargerScript();

    const google = (window as any).google;
    if (!google?.accounts?.id) {
      throw new Error('Bibliothèque Google Identity indisponible.');
    }

    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (reponse: { credential: string }) => surJeton(reponse.credential)
    });

    // Déterminer la largeur exacte du bouton de connexion associé pour un alignement parfait
    const conteneurProche = cible.closest('.login-card, .login-page-container, .login-box, .auth-container, .register-card, body');
    const boutonConnexion = conteneurProche?.querySelector('.btn-login-red, .login-btn, .btn-submit-register, button[type="submit"]') as HTMLElement | null;
    
    let largeur = boutonConnexion?.offsetWidth || cible.parentElement?.clientWidth || cible.clientWidth || 300;
    // L'API Google Identity n'accepte une largeur numérique qu'entre 200 et 400 pixels
    largeur = Math.min(400, Math.max(200, Math.round(largeur)));

    google.accounts.id.renderButton(cible, {
      theme: 'outline',
      size: 'large',
      width: largeur,
      text: 'continue_with',
      locale: 'fr',
      shape: 'pill'
    });
  }

  /** Charge le script une seule fois, même si plusieurs pages l'utilisent. */
  private chargerScript(): Promise<void> {
    if (this.scriptCharge) {
      return Promise.resolve();
    }
    return new Promise<void>((resoudre, rejeter) => {
      const existant = document.getElementById('google-identity-services');
      if (existant) {
        this.scriptCharge = true;
        resoudre();
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => { this.scriptCharge = true; resoudre(); };
      script.onerror = () => rejeter(new Error('Chargement du script Google impossible.'));
      document.head.appendChild(script);
    });
  }
}
