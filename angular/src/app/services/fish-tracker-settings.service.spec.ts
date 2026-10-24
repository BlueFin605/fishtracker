import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { FishTrackerSettingsService } from './fish-tracker-settings.service';
import { IndexedDbService } from './offline/indexed-db.service';

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
        provideHttpClient(),
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
