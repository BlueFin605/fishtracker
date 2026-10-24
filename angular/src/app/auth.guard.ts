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
    if (this.session.state !== 'none') {
      return true;
    }
    // The offline picker rule is added by the picker ticket.
    return this.router.createUrlTree(['/login']);
  }
}
