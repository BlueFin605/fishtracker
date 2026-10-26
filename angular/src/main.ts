import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router'; // Import RouterModule
import { routes } from './app/app.routes'; // Import the app.routes file
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS, withInterceptorsFromDi, withXhr } from "@angular/common/http";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode, provideAppInitializer, inject } from '@angular/core';
import { AuthInterceptor } from './app/services/auth.interceptor';
import { PersistentStorageService } from './app/services/persistent-storage.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withXhr(), 
      // registering interceptors
        withInterceptorsFromDi()
      ),
      { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideRouter(routes),
    provideAnimationsAsync(),
    provideAppInitializer(() => { void inject(PersistentStorageService).request(); }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
}).catch((err) => console.error(err));
