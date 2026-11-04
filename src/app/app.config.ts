import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

import { routes } from './app.routes';

// Sans cet enregistrement, les pipes date et number rendent en anglais :
// « Monday 14 March » et « 1,500 » au lieu de « lundi 14 mars » et « 1 500 ».
registerLocaleData(localeFr, 'fr');
registerLocaleData(localeFr, 'fr-FR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ]
};

