import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { B2bStateService } from './b2b-state.service';
import { UserRoleB2B } from './b2b.models';

export function b2bRoleGuard(allowedRoles: UserRoleB2B[]): CanActivateFn {
  return () => {
    const b2b = inject(B2bStateService);
    const router = inject(Router);
    const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('b2b_jwt_token');

    if (!hasToken) {
      b2b.showToast('Session expirée ou non connectée. Veuillez vous authentifier.', 'error');
      return router.createUrlTree(['/b2b/login']);
    }

    const role = b2b.currentSession().role;
    if (!allowedRoles.includes(role)) {
      b2b.showToast('Accès refusé pour ce profil utilisateur.', 'error');
      return router.createUrlTree(['/b2b/login']);
    }

    return true;
  };
}
