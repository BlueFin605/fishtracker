import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { SetupGuard } from './setup.guard';
import { ApiService } from './services/api.service';
import { ConnectivityService } from './services/connectivity.service';
import { FishTrackerSettingsService } from './services/fish-tracker-settings.service';
import { SessionService } from './services/session.service';
import { IndexedDbService } from './services/offline/indexed-db.service';

/**
 * Fresh-install offline path: sign in online, close the app, reopen offline.
 * Uses the REAL SetupGuard, FishTrackerSettingsService and IndexedDbService
 * (real IndexedDB in headless Chrome); only the network-facing services are mocked.
 */
describe('Offline first run (integration)', () => {
  const SUB = 'offline-first-run-spec-user';
  const DB_NAME = `fishtracker-${SUB}`;
  const settingsPayload = { species: [{ name: 'Snapper' }] } as any;

  let savedToken: string | null;
  let dbServices: IndexedDbService[] = [];

  function b64url(obj: object): string {
    return btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  function fakeJwt(sub: string): string {
    return `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ sub })}.sig`;
  }

  /** Simulates opening the app: brand-new injector (new guard + services), shared IndexedDB. */
  async function closeOpenDbs(): Promise<void> {
    // The real service never closes its connection; an open one would block deleteDatabase.
    for (const svc of dbServices) {
      try {
        (await (svc as any).dbPromise)?.close();
      } catch {
        // ignore
      }
    }
    dbServices = [];
  }

  async function openApp(opts: { online: boolean; api: Partial<Record<'getProfile' | 'getSettings', jasmine.Spy>> }): Promise<SetupGuard> {
    await closeOpenDbs();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: opts.api },
        { provide: ConnectivityService, useValue: { isOnline: () => opts.online, whenProbed: () => Promise.resolve(opts.online) } },
        { provide: SessionService, useValue: { isProxy: false } },
        { provide: HttpClient, useValue: { get: () => throwError(() => new Error('offline')) } },
      ],
    });
    dbServices.push(TestBed.inject(IndexedDbService));
    return TestBed.inject(SetupGuard);
  }

  function path(r: unknown): string {
    return TestBed.inject(Router).serializeUrl(r as UrlTree);
  }

  async function waitForCachedProfile(): Promise<any> {
    const settings = TestBed.inject(FishTrackerSettingsService);
    for (let i = 0; i < 20; i++) {
      const cached = await settings.getCachedProfile();
      if (cached) return cached;
      await new Promise(r => setTimeout(r, 50));
    }
    return null;
  }

  function deleteDb(name: string): Promise<void> {
    return new Promise(resolve => {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  }

  beforeEach(async () => {
    savedToken = localStorage.getItem('id_token');
    localStorage.setItem('id_token', fakeJwt(SUB));
    await deleteDb(DB_NAME);
  });

  afterEach(async () => {
    await closeOpenDbs();
    TestBed.resetTestingModule();
    if (savedToken === null) localStorage.removeItem('id_token');
    else localStorage.setItem('id_token', savedToken);
    await deleteDb(DB_NAME);
  });

  it('lets a fresh install that signed in online reopen offline', async () => {
    // 1. Online first run
    const onlineGuard = await openApp({
      online: true,
      api: {
        getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ species: ['Snapper'], defaultSpecies: 'Snapper' })),
        getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsPayload)),
      },
    });
    expect(await onlineGuard.canActivate()).toBeTrue();

    // 2. Caches flush (fire-and-forget writes)
    const cached = await waitForCachedProfile();
    expect(cached).not.toBeNull();
    expect(cached.species).toEqual(['Snapper']);

    // 3. Reopen offline: new guard, API unreachable
    const getProfile = jasmine.createSpy('getProfile').and.returnValue(throwError(() => new Error('offline')));
    const offlineGuard = await openApp({
      online: false,
      api: { getProfile, getSettings: jasmine.createSpy('getSettings').and.returnValue(throwError(() => new Error('offline'))) },
    });
    expect(await offlineGuard.canActivate()).toBeTrue();
    expect(getProfile).not.toHaveBeenCalled();
  });

  it('keeps a user with an empty profile on /setup online and lets them reopen offline', async () => {
    const onlineGuard = await openApp({
      online: true,
      api: {
        getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ species: [], defaultSpecies: '' })),
        getSettings: jasmine.createSpy('getSettings').and.returnValue(of({ species: [] } as any)),
      },
    });
    expect(path(await onlineGuard.canActivate())).toBe('/setup');

    const cached = await waitForCachedProfile();
    expect(cached).not.toBeNull();
    expect(cached.species).toEqual([]);

    const offlineGuard = await openApp({
      online: false,
      api: {
        getProfile: jasmine.createSpy('getProfile').and.returnValue(throwError(() => new Error('offline'))),
        getSettings: jasmine.createSpy('getSettings').and.returnValue(throwError(() => new Error('offline'))),
      },
    });
    expect(await offlineGuard.canActivate()).toBeTrue();
  });
});
