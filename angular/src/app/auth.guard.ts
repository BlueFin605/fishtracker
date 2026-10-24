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

  canActivate(): boolean | Promise<boolean | UrlTree> {
    if (this.session.state !== 'none' || this.session.isProxy) {
      return true;
    }
    return this.routeSignedOut();
  }

  private async routeSignedOut(): Promise<UrlTree> {
    // navigator.onLine can lie (signal, no data); wait for a real probe.
    if (await this.connectivity.whenProbed()) {
      return this.router.createUrlTree(['/login']);
    }
    return this.router.createUrlTree(['/offline-user']);
  }
}
