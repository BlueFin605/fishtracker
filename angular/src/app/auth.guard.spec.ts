import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthGuard } from './auth.guard';
import { SessionService, SessionState } from './services/session.service';
import { ConnectivityService } from './services/connectivity.service';

describe('AuthGuard', () => {
  let state: SessionState;

  beforeEach(() => {
    state = 'valid';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: SessionService, useValue: { get state() { return state; } } },
        { provide: ConnectivityService, useValue: { isOnline: () => true } },
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

  it('redirects to /login when there is no session', () => {
    state = 'none';
    const result = TestBed.inject(AuthGuard).canActivate();
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
  });
});
