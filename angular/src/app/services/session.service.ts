import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { AuthenticationService } from './authentication.service';
import { ConnectivityService } from './connectivity.service';
import { IndexedDbService } from './offline/indexed-db.service';
import { LocalUsersRegistry } from './local-users-registry.service';

const PROXY_KEY = 'proxy_sub';

export type SessionState = 'valid' | 'stale' | 'none';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly subject: BehaviorSubject<SessionState>;
  readonly state$: Observable<SessionState>;
  private refreshInFlight = false;

  proxySub: string | null = null;

  constructor(
    private auth: AuthenticationService,
    private connectivity: ConnectivityService,
    private db: IndexedDbService,
    private registry: LocalUsersRegistry,
  ) {
    this.restoreProxy();
    this.subject = new BehaviorSubject<SessionState>(this.state);
    this.state$ = this.subject.asObservable().pipe(distinctUntilChanged());

    this.auth.accessToken$.subscribe(() => this.recompute());
    this.connectivity.online$.subscribe(online => {
      if (online) this.maybeRefresh();
    });
  }

  get state(): SessionState {
    if (environment.bypassAuth) return 'valid';
    if (this.idTokenValid()) return 'valid';
    return localStorage.getItem('refresh_token') ? 'stale' : 'none';
  }

  get isProxy(): boolean {
    return this.proxySub !== null;
  }

  get signedIn(): boolean {
    return this.state !== 'none' || this.isProxy;
  }

  get displayName(): string {
    if (this.proxySub) return this.registry.find(this.proxySub)?.name ?? '';
    return this.auth.userDisplayName;
  }

  get displayEmail(): string {
    if (this.proxySub) return this.registry.find(this.proxySub)?.email ?? '';
    return this.auth.userEmail;
  }

  enterProxy(sub: string): void {
    this.proxySub = sub;
    try {
      sessionStorage.setItem(PROXY_KEY, sub);
    } catch {
      // storage unavailable
    }
    this.db.setProxySubject(sub);
  }

  exitProxy(): void {
    this.proxySub = null;
    try {
      sessionStorage.removeItem(PROXY_KEY);
    } catch {
      // storage unavailable
    }
    this.db.setProxySubject(null);
  }

  recompute(): void {
    const state = this.state;
    if (state !== 'none' && this.isProxy) this.exitProxy();
    this.subject.next(state);
  }

  private restoreProxy(): void {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(PROXY_KEY);
    } catch {
      // storage unavailable
    }
    if (!stored) return;
    if (this.state === 'none') {
      this.enterProxy(stored);
    } else {
      try {
        sessionStorage.removeItem(PROXY_KEY);
      } catch {
        // storage unavailable
      }
    }
  }

  private idTokenValid(): boolean {
    const token = localStorage.getItem('id_token');
    if (!token) return false;
    try {
      const decoded: { exp?: number } = jwtDecode(token);
      return typeof decoded.exp === 'number' && decoded.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }

  private maybeRefresh(): void {
    if (this.refreshInFlight || this.state !== 'stale') return;
    this.refreshInFlight = true;
    this.auth.refreshToken().subscribe({
      next: () => {
        this.refreshInFlight = false;
        this.recompute();
      },
      error: () => {
        this.refreshInFlight = false;
        this.recompute();
      },
    });
  }
}
