import { Injectable, InjectionToken, NgZone, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

export const RELOAD_PAGE = new InjectionToken<() => void>('RELOAD_PAGE', {
  providedIn: 'root',
  factory: () => () => document.location.reload(),
});

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private sw = inject(SwUpdate);
  private snackBar = inject(MatSnackBar);
  private reload = inject(RELOAD_PAGE);
  private ngZone = inject(NgZone);
  private started = false;
  private ready = false;

  /** True once a VERSION_READY has fired (an update is downloaded and waiting to be applied). */
  get updateReady(): boolean { return this.ready; }

  start(): void {
    if (this.started || !this.sw.isEnabled) return;
    this.started = true;
    this.sw.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        this.ready = true;
        this.ngZone.run(() => this.showPrompt());
      });
    // Timers/listeners run outside the zone so they never keep the app "unstable"
    // (which would delay service worker registration via registerWhenStable).
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void this.checkNow();
      });
      setInterval(() => void this.checkNow(), CHECK_INTERVAL_MS);
    });
  }

  async checkNow(): Promise<boolean> {
    if (!this.sw.isEnabled) return false;
    if (this.ready) return true;
    try { return await this.sw.checkForUpdate(); } catch { return false; }
  }

  showPrompt(): void {
    this.snackBar.open('New version available', 'Update')
      .onAction()
      .subscribe(async () => { await this.sw.activateUpdate(); this.reload(); });
  }
}
