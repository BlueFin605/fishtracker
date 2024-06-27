import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideAuth0 } from '@auth0/auth0-angular';

bootstrapApplication(AppComponent, {
  providers: [
    provideAuth0({
      domain: 'dev-ox5simjuwx546rx2.us.auth0.com',
      clientId: 'VHnL0R15itTGsio0K99M9CXisHThJxu2',
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    }),
  ]
}).catch((err) => console.error(err));
