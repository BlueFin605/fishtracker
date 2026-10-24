import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SetupGuard } from './setup.guard';
import { ApiService } from './services/api.service';
import { ConnectivityService } from './services/connectivity.service';
import { FishTrackerSettingsService } from './services/fish-tracker-settings.service';
import { SessionService } from './services/session.service';

describe('SetupGuard', () => {
  let cached: any;
  let online: boolean;
  let proxy: boolean;
  let api: { getProfile: jasmine.Spy };

  function make(): SetupGuard {
    api = { getProfile: jasmine.createSpy('getProfile') };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: FishTrackerSettingsService, useValue: { getCachedProfile: () => Promise.resolve(cached) } },
        { provide: ConnectivityService, useValue: { isOnline: () => online } },
        { provide: SessionService, useValue: { get isProxy() { return proxy; } } },
      ],
    });
    return TestBed.inject(SetupGuard);
  }

  function path(r: unknown): string {
    return TestBed.inject(Router).serializeUrl(r as UrlTree);
  }

  beforeEach(() => { cached = null; online = true; proxy = false; });

  it('does not call the API in proxy mode even when online', async () => {
    proxy = true;
    const guard = make();
    expect(path(await guard.canActivate())).toBe('/offline?reason=setup');
    expect(api.getProfile).not.toHaveBeenCalled();
  });

  it('passes with cached species while offline without calling the API', async () => {
    cached = { species: ['Bream'], defaultSpecies: 'Bream' };
    online = false;
    const guard = make();
    expect(await guard.canActivate()).toBeTrue();
    expect(api.getProfile).not.toHaveBeenCalled();
  });

  it('redirects to /offline?reason=setup with no cache and offline', async () => {
    online = false;
    const guard = make();
    expect(path(await guard.canActivate())).toBe('/offline?reason=setup');
  });

  it('passes online with no cache when the profile has species', async () => {
    const guard = make();
    api.getProfile.and.returnValue(of({ species: ['Bream'], defaultSpecies: '' }));
    expect(await guard.canActivate()).toBeTrue();
  });

  it('redirects to /setup online with no cache and empty species', async () => {
    const guard = make();
    api.getProfile.and.returnValue(of({ species: [], defaultSpecies: '' }));
    expect(path(await guard.canActivate())).toBe('/setup');
  });

  it('redirects to /offline?reason=setup when the API errors', async () => {
    const guard = make();
    api.getProfile.and.returnValue(throwError(() => new Error('x')));
    expect(path(await guard.canActivate())).toBe('/offline?reason=setup');
  });

  it('remembers completed setup', async () => {
    cached = { species: ['Bream'], defaultSpecies: '' };
    const guard = make();
    await guard.canActivate();
    cached = null;
    expect(guard.canActivate()).toBeTrue();
  });
});
