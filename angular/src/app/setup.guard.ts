import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './services/api.service';
import { ConnectivityService } from './services/connectivity.service';
import { FishTrackerSettingsService } from './services/fish-tracker-settings.service';
import { SessionService } from './services/session.service';

@Injectable({
  providedIn: 'root'
})
export class SetupGuard implements CanActivate {
  private setupComplete: boolean = false;

  constructor(
    private settings: FishTrackerSettingsService,
    private apiService: ApiService,
    private connectivity: ConnectivityService,
    private session: SessionService,
    private router: Router,
  ) {}

  canActivate(): Promise<boolean | UrlTree> | boolean {
    if (this.setupComplete) {
      return true;
    }
    return this.check();
  }

  private async check(): Promise<boolean | UrlTree> {
    const cached = await this.settings.getCachedProfile();
    if (cached?.species?.length) {
      this.setupComplete = true;
      return true;
    }

    const offlineTree = () =>
      this.router.createUrlTree(['/offline'], { queryParams: { reason: 'setup' } });

    const online = !this.session.isProxy && (await this.connectivity.whenProbed());
    if (!online) return cached ? true : offlineTree();

    try {
      const profile = await firstValueFrom(this.apiService.getProfile());
      this.settings.primeCache(profile);
      if (!profile.species || profile.species.length === 0) {
        return this.router.createUrlTree(['/setup']);
      }
      this.setupComplete = true;
      return true;
    } catch {
      return cached ? true : offlineTree();
    }
  }
}
