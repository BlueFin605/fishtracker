import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideAuth0 } from '@auth0/auth0-angular';
import { environment } from './environments/environment.development';

bootstrapApplication(AppComponent, {
  providers: [
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
