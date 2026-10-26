import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { environment } from '../../environments/environment';

const PROBE_TIMEOUT_MS = 3000;
const RECHECK_INTERVAL_MS = 30000;

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly subject = new BehaviorSubject<boolean>(navigator.onLine);
  readonly online$ = this.subject.asObservable().pipe(distinctUntilChanged());

  private readonly firstProbe: Promise<boolean>;

  constructor(private ngZone: NgZone) {
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('online', () => void this.check());
      window.addEventListener('offline', () => void this.check());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void this.check();
      });
      setInterval(() => void this.check(), RECHECK_INTERVAL_MS);
    });
    this.firstProbe = this.check();
  }

  /** Resolves with the current state once the first real probe has completed. */
  whenProbed(): Promise<boolean> {
    return this.firstProbe.then(() => this.subject.value);
  }

  isOnline(): boolean {
    return this.subject.value;
  }

  async check(): Promise<boolean> {
    if (!navigator.onLine) {
      this.set(false);
      return false;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
    try {
      await fetch(environment.apiUrl, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
      this.set(true);
      return true;
    } catch {
      this.set(false);
      return false;
    } finally {
      clearTimeout(t);
    }
  }

  private set(v: boolean): void {
    this.ngZone.run(() => this.subject.next(v));
  }
}
