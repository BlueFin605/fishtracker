import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideAuth0 } from '@auth0/auth0-angular';
import { environment } from './environments/environment';
import { RouterModule, provideRouter } from '@angular/router'; // Import RouterModule
import { routes } from './app/app.routes'; // Import the app.routes file
import { provideHttpClient } from "@angular/common/http";

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    provideAuth0({
      domain: environment.auth0Domain,
      clientId: environment.auth0ClientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
        scope: "save:catch read:catch create:trip",
        audience: "https://fishtracker.bluefin605.com"
      }
    }),
  ]
}).catch((err) => console.error(err));
