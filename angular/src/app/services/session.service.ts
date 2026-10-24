import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { AuthenticationService } from './authentication.service';
import { ConnectivityService } from './connectivity.service';

export type SessionState = 'valid' | 'stale' | 'none';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly subject: BehaviorSubject<SessionState>;
  readonly state$: Observable<SessionState>;
  private refreshInFlight = false;

  constructor(private auth: AuthenticationService, private connectivity: ConnectivityService) {
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

  get signedIn(): boolean {
    return this.state !== 'none';
  }

  recompute(): void {
    this.subject.next(this.state);
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
