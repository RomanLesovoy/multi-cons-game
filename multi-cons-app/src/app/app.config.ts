import { ApplicationConfig, isDevMode, provideZoneChangeDetection, importProvidersFrom  } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { routes } from './app.routes';
const url = isDevMode() ? 'http://localhost:3000' : 'https://multi-cons-game.onrender.com';

const config: SocketIoConfig = { url, options: {} };

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(SocketIoModule.forRoot(config)),
  ]
};
