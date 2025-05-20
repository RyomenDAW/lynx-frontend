import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi()), // ✅ NECESARIO PARA ACTIVAR TU INTERCEPTOR
    provideRouter(routes),
  ],
};
