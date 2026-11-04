import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Le jeton ne part que vers notre API. Il ne doit jamais fuiter vers un
  // domaine tiers (Cloudinary, polices, images externes...).
  const apiUrl = environment.apiUrl || '';
  const isApiRequest = (apiUrl && req.url.startsWith(apiUrl)) || req.url.startsWith('/api/') || req.url.includes('/api/');

  if (!isApiRequest) {
    return next(req);
  }

  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 = session absente ou expirée : il faut se reconnecter sur les routes privées.
      const isPublicPath = req.url.includes('/api/faqs') ||
                           req.url.includes('/api/testimonials') ||
                           req.url.includes('/api/mykiki/catalogue') ||
                           req.url.includes('/api/prestations') ||
                           req.url.includes('/api/auth/');

      if (error.status === 401 && !isPublicPath) {
        authService.logout();
        router.navigate(['/login'], { queryParams: { expired: true } });
      }
      return throwError(() => error);
    })
  );
};
