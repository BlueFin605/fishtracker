import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router'; // Import RouterModule
import { routes } from './app/app.routes'; // Import the app.routes file
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS, withInterceptorsFromDi} from "@angular/common/http";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthInterceptor } from './app/services/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      // registering interceptors
        withInterceptorsFromDi()
      ),
      { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideRouter(routes),
    provideAnimationsAsync()
  ]
}).catch((err) => console.error(err));
