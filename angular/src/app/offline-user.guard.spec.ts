import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';

import { OfflineUserGuard } from './offline-user.guard';
import { SessionService, SessionState } from './services/session.service';

describe('OfflineUserGuard', () => {
  let state: SessionState;

  beforeEach(() => {
    state = 'none';
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: { get state() { return state; } } },
      ],
    });
  });

  it('allows when there is no session', () => {
    expect(TestBed.inject(OfflineUserGuard).canActivate()).toBeTrue();
  });

  for (const s of ['valid', 'stale'] as SessionState[]) {
    it(`redirects to /trips when the session is ${s}`, () => {
      state = s;
      const result = TestBed.inject(OfflineUserGuard).canActivate();
      expect(result instanceof UrlTree).toBeTrue();
      expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/trips');
    });
  }
});
