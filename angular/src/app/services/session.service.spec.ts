import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthenticationService } from './authentication.service';
import { ConnectivityService } from './connectivity.service';
import { SessionService, SessionState } from './session.service';

function makeJwt(payload: object): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
}
const now = () => Math.floor(Date.now() / 1000);
const validToken = () => makeJwt({ exp: now() + 3600, sub: 'u1' });
const expiredToken = () => makeJwt({ exp: now() - 10, sub: 'u1' });

describe('SessionService', () => {
  let online$: BehaviorSubject<boolean>;
  let accessToken$: Subject<string>;
  let auth: { refreshToken: jasmine.Spy; accessToken$: Subject<string> };

  function create(): SessionService {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthenticationService, useValue: auth },
        {
          provide: ConnectivityService,
          useValue: { online$, isOnline: () => online$.value },
        },
      ],
    });
    return TestBed.inject(SessionService);
  }

  beforeEach(() => {
    localStorage.clear();
    online$ = new BehaviorSubject<boolean>(false);
    accessToken$ = new Subject<string>();
    auth = { refreshToken: jasmine.createSpy('refreshToken').and.returnValue(of('a')), accessToken$ };
  });

  afterEach(() => {
    localStorage.clear();
    (environment as any).bypassAuth = false;
  });

  describe('state', () => {
    it('is valid with an unexpired id token', () => {
      localStorage.setItem('id_token', validToken());
      const s = create();
      expect(s.state).toBe('valid');
      expect(s.signedIn).toBeTrue();
    });

    it('is stale with expired id token and a refresh token', () => {
      localStorage.setItem('id_token', expiredToken());
      localStorage.setItem('refresh_token', 'r');
      const s = create();
      expect(s.state).toBe('stale');
      expect(s.signedIn).toBeTrue();
    });

    it('is none with expired id token and no refresh token', () => {
      localStorage.setItem('id_token', expiredToken());
      const s = create();
      expect(s.state).toBe('none');
      expect(s.signedIn).toBeFalse();
    });

    it('is none when empty', () => {
      expect(create().state).toBe('none');
    });

    it('is none for a garbage id token and no refresh token', () => {
      localStorage.setItem('id_token', 'garbage');
      expect(create().state).toBe('none');
    });

    it('is stale for a garbage id token with a refresh token', () => {
      localStorage.setItem('id_token', 'garbage');
      localStorage.setItem('refresh_token', 'r');
      expect(create().state).toBe('stale');
    });

    it('is valid when bypassAuth is set', () => {
      (environment as any).bypassAuth = true;
      expect(create().state).toBe('valid');
    });
  });

  describe('background refresh', () => {
    beforeEach(() => {
      localStorage.setItem('id_token', expiredToken());
      localStorage.setItem('refresh_token', 'r');
    });

    it('refreshes exactly once when stale and online', () => {
      online$.next(true);
      auth.refreshToken.and.returnValue(new Subject<string>());
      create();
      expect(auth.refreshToken).toHaveBeenCalledTimes(1);
      online$.next(true);
      expect(auth.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('does not refresh when stale and offline', () => {
      create();
      expect(auth.refreshToken).not.toHaveBeenCalled();
    });

    it('refreshes when connectivity returns', () => {
      create();
      online$.next(true);
      expect(auth.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('does not refresh when state is valid', () => {
      localStorage.setItem('id_token', validToken());
      online$.next(true);
      create();
      expect(auth.refreshToken).not.toHaveBeenCalled();
    });

    it('emits valid on state$ after a successful refresh', () => {
      online$.next(true);
      auth.refreshToken.and.callFake(() => {
        localStorage.setItem('id_token', validToken());
        return of('new');
      });
      const s = create();
      let last: SessionState | undefined;
      s.state$.subscribe(v => (last = v));
      expect(last).toBe('valid');
    });

    it('stays stale after a network error', () => {
      online$.next(true);
      auth.refreshToken.and.returnValue(throwError(() => ({ status: 0 })));
      const s = create();
      expect(s.state).toBe('stale');
      let last: SessionState | undefined;
      s.state$.subscribe(v => (last = v));
      expect(last).toBe('stale');
    });

    it('reports none after a refresh error that signed the user out', () => {
      online$.next(true);
      auth.refreshToken.and.callFake(() => {
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('id_token');
        return throwError(() => ({ status: 400 }));
      });
      const s = create();
      let last: SessionState | undefined;
      s.state$.subscribe(v => (last = v));
      expect(last).toBe('none');
    });
  });

  it('recomputes when accessToken$ emits', () => {
    const s = create();
    let last: SessionState | undefined;
    s.state$.subscribe(v => (last = v));
    expect(last).toBe('none');
    localStorage.setItem('id_token', validToken());
    accessToken$.next('x');
    expect(last).toBe('valid');
  });
});
