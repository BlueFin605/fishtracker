import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { SessionService } from './services/session.service';

/** /offline-user is only meaningful when there is no session at all. */
@Injectable({ providedIn: 'root' })
export class OfflineUserGuard implements CanActivate {
  constructor(private session: SessionService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.session.state === 'none') {
      return true;
    }
    return this.router.createUrlTree(['/trips']);
  }
}
