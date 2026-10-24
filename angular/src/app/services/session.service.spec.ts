import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthenticationService } from './authentication.service';
import { ConnectivityService } from './connectivity.service';
import { SessionService, SessionState } from './session.service';
import { IndexedDbService } from './offline/indexed-db.service';
import { LocalUsersRegistry } from './local-users-registry.service';

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
    sessionStorage.clear();
    online$ = new BehaviorSubject<boolean>(false);
    accessToken$ = new Subject<string>();
    auth = { refreshToken: jasmine.createSpy('refreshToken').and.returnValue(of('a')), accessToken$ };
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
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

  describe('proxy mode', () => {
    it('enterProxy sets the proxy subject and signedIn', () => {
      const s = create();
      const db = TestBed.inject(IndexedDbService);
      expect(s.signedIn).toBeFalse();
      s.enterProxy('abc');
      expect(s.isProxy).toBeTrue();
      expect(s.proxySub).toBe('abc');
      expect(s.signedIn).toBeTrue();
      expect(sessionStorage.getItem('proxy_sub')).toBe('abc');
      expect(db.currentSubjectId()).toBe('abc');
      s.exitProxy();
      expect(s.isProxy).toBeFalse();
      expect(sessionStorage.getItem('proxy_sub')).toBeNull();
      expect(db.currentSubjectId()).toBe('anonymous');
    });

    it('recompute clears the proxy once tokens exist', () => {
      const s = create();
      s.enterProxy('abc');
      localStorage.setItem('id_token', validToken());
      s.recompute();
      expect(s.isProxy).toBeFalse();
      expect(TestBed.inject(IndexedDbService).currentSubjectId()).toBe('u1');
    });

    it('restores a stored proxy sub on construction when signed out', () => {
      sessionStorage.setItem('proxy_sub', 'abc');
      const s = create();
      expect(s.isProxy).toBeTrue();
      expect(TestBed.inject(IndexedDbService).currentSubjectId()).toBe('abc');
    });

    it('discards a stored proxy sub on construction when tokens exist', () => {
      sessionStorage.setItem('proxy_sub', 'abc');
      localStorage.setItem('refresh_token', 'r');
      const s = create();
      expect(s.isProxy).toBeFalse();
      expect(sessionStorage.getItem('proxy_sub')).toBeNull();
    });

    it('remembers the proxied sub when a different user signs in', () => {
      const s = create();
      s.enterProxy('abc');
      localStorage.setItem('id_token', validToken()); // sub u1
      s.recompute();
      expect(localStorage.getItem('last_proxy_sub')).toBe('abc');
      expect(s.lastProxySub).toBe('abc');
    });

    it('clears the remembered sub when that same user signs in', () => {
      localStorage.setItem('last_proxy_sub', 'u1');
      const s = create();
      s.enterProxy('u1');
      localStorage.setItem('id_token', validToken()); // sub u1
      s.recompute();
      expect(localStorage.getItem('last_proxy_sub')).toBeNull();
    });

    it('clears a remembered sub when the same user signs in later', () => {
      localStorage.setItem('last_proxy_sub', 'u1');
      localStorage.setItem('id_token', validToken());
      const s = create();
      s.recompute();
      expect(localStorage.getItem('last_proxy_sub')).toBeNull();
    });

    it('does not remember a sub when leaving proxy without a signed-in user', () => {
      const s = create();
      s.enterProxy('abc');
      s.exitProxy();
      expect(localStorage.getItem('last_proxy_sub')).toBeNull();
    });

    it('displayName/displayEmail come from the registry in proxy mode', () => {
      (auth as any).userDisplayName = 'Token Name';
      (auth as any).userEmail = 'token@x';
      const s = create();
      expect(s.displayName).toBe('Token Name');
      expect(s.displayEmail).toBe('token@x');
      TestBed.inject(LocalUsersRegistry).upsert({ sub: 'abc', name: 'Abe', email: 'abe@x' });
      s.enterProxy('abc');
      expect(s.displayName).toBe('Abe');
      expect(s.displayEmail).toBe('abe@x');
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
