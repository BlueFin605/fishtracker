import { Component, inject } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { SessionService } from '../../services/session.service';

@Component({
  standalone: true,
  selector: 'app-offline-banner',
  template: `
    @if (session.isProxy) {
      <div class="offline-banner">
        <span>Offline as {{ session.displayName }} — sign in to sync</span>
        <button type="button"
                [disabled]="!connectivity.isOnline()"
                [title]="connectivity.isOnline() ? '' : 'Needs a connection'"
                (click)="authService.signIn()">Sign in</button>
      </div>
    }
  `,
  styles: [`
    .offline-banner { display: flex; gap: 1rem; align-items: center; justify-content: center;
      padding: 0.5rem 1rem; background: #fff3cd; color: #664d03; }
  `]
})
export class OfflineBannerComponent {
  session = inject(SessionService);
  authService = inject(AuthenticationService);
  connectivity = inject(ConnectivityService);
}
