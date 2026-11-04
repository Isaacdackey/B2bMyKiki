import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Guard pour l'espace back-office (Admin + Gestionnaire + Personnel) */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (!auth.isBackOfficeUser()) {
    router.navigate(['/login'], { queryParams: { forbidden: true } });
    return false;
  }

  // Forcer le changement de mot de passe si nécessaire
  if (auth.needsPasswordChange() && !state.url.includes('change-password')) {
    router.navigate(['/change-password']);
    return false;
  }

  return true;
};

/** Guard strict ADMIN only */
export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (!auth.isAdmin()) {
    router.navigate(['/gestionnaire/dashboard'], { queryParams: { forbidden: true } });
    return false;
  }

  return true;
};

/** Guard pour l'espace MyKiki (clients uniquement) */
export const clientGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login-client'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (!auth.isClient()) {
    router.navigate(['/login-client']);
    return false;
  }

  return true;
};
