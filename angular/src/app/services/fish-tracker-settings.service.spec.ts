import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { FishTrackerSettingsService } from './fish-tracker-settings.service';
import { IndexedDbService } from './offline/indexed-db.service';
import { SessionService } from './session.service';
import { HttpTestingController } from '@angular/common/http/testing';

describe('FishTrackerSettingsService proxy mode', () => {
  it('reads the cached profile under the proxied subject', async () => {
    const profile = { subject: 'abc', species: ['Snapper'] } as any;
    const store: Record<string, any> = { abc: profile };
    const db = {
      currentSubjectId: () => 'abc',
      getProfile: jasmine.createSpy('getProfile').and.callFake(async (s: string) => store[s]),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: IndexedDbService, useValue: db },
        { provide: ApiService, useValue: {} },
      ],
    });
    const svc = TestBed.inject(FishTrackerSettingsService);
    expect(await svc.getCachedProfile()).toBe(profile);
    expect(db.getProfile).toHaveBeenCalledWith('abc');
  });
});

describe('FishTrackerSettingsService while proxying online', () => {
  function setup(cachedProfile: any, cachedSettings: any) {
    const db = {
      currentSubjectId: () => 'abc',
      getProfile: async () => cachedProfile,
      getSettings: async () => cachedSettings,
    };
    const api = jasmine.createSpyObj('ApiService', ['getProfile', 'getSettings']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: IndexedDbService, useValue: db },
        { provide: ApiService, useValue: api },
        { provide: SessionService, useValue: { isProxy: true } },
      ],
    });
    return { svc: TestBed.inject(FishTrackerSettingsService), api, http: TestBed.inject(HttpTestingController) };
  }

  it('does not refresh cached profile or settings from the API', async () => {
    const { svc, api, http } = setup({ subject: 'abc', species: ['A'] }, { species: ['A'] });
    svc.profile.subscribe();
    svc.settings.subscribe();
    await new Promise(r => setTimeout(r, 50));
    http.expectNone(() => true);
    expect(api.getProfile).not.toHaveBeenCalled();
    expect(api.getSettings).not.toHaveBeenCalled();
  });

  it('does not call the API on a cache miss', async () => {
    const { svc, api, http } = setup(null, null);
    svc.profile.subscribe();
    svc.settings.subscribe();
    await new Promise(r => setTimeout(r, 50));
    http.expectNone(() => true);
    expect(api.getProfile).not.toHaveBeenCalled();
    expect(api.getSettings).not.toHaveBeenCalled();
  });
});
