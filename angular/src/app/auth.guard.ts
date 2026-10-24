import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { SessionService } from './services/session.service';
import { ConnectivityService } from './services/connectivity.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private session: SessionService,
    private connectivity: ConnectivityService,
    private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.session.state !== 'none' || this.session.isProxy) {
      return true;
    }
    if (this.connectivity.isOnline()) {
      return this.router.createUrlTree(['/login']);
    }
    return this.router.createUrlTree(['/offline-user']);
  }
}
