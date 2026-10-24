import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { ConnectivityService } from './services/connectivity.service';

@Injectable({
  providedIn: 'root'
})
export class OnlineOnlyGuard implements CanActivate {

  constructor(private connectivity: ConnectivityService, private router: Router) {}

  async canActivate(): Promise<boolean | UrlTree> {
    if (await this.connectivity.whenProbed()) {
      return true;
    }
    return this.router.createUrlTree(['/offline'], { queryParams: { reason: 'needs-connection' } });
  }
}
