import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthGuard } from './auth.guard';
import { SessionService, SessionState } from './services/session.service';
import { ConnectivityService } from './services/connectivity.service';

describe('AuthGuard', () => {
  let state: SessionState;
  let proxy: boolean;
  let online: boolean;

  beforeEach(() => {
    state = 'valid';
    proxy = false;
    online = true;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: SessionService, useValue: { get state() { return state; }, get isProxy() { return proxy; } } },
        { provide: ConnectivityService, useValue: { isOnline: () => true, whenProbed: () => Promise.resolve(online) } },
      ]
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(AuthGuard)).toBeTruthy();
  });

  it('allows a valid session', () => {
    state = 'valid';
    expect(TestBed.inject(AuthGuard).canActivate()).toBeTrue();
  });

  it('allows a stale session', () => {
    state = 'stale';
    expect(TestBed.inject(AuthGuard).canActivate()).toBeTrue();
  });

  it('redirects to /login when there is no session', async () => {
    state = 'none';
    const result = await TestBed.inject(AuthGuard).canActivate();
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('allows a signed-out proxy session', () => {
    state = 'none';
    proxy = true;
    expect(TestBed.inject(AuthGuard).canActivate()).toBeTrue();
  });

  it('redirects to /offline-user when the probe says offline despite navigator.onLine', async () => {
    state = 'none';
    online = false;
    const result = await TestBed.inject(AuthGuard).canActivate();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/offline-user');
  });
});
