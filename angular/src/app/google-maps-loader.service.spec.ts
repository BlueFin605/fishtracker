import { TestBed } from '@angular/core/testing';
import { GoogleMapsLoaderService } from './google-maps-loader.service';
import { ConnectivityService } from './services/connectivity.service';

describe('GoogleMapsLoaderService', () => {
  let online: boolean;

  const mapsScripts = () =>
    Array.from(document.head.querySelectorAll('script')).filter(s => s.src.includes('maps.googleapis.com'));

  beforeEach(() => {
    online = false;
    mapsScripts().forEach(s => s.remove());
    TestBed.configureTestingModule({
      providers: [{ provide: ConnectivityService, useValue: { isOnline: () => online } }],
    });
  });

  afterEach(() => mapsScripts().forEach(s => s.remove()));

  it('rejects immediately with "offline" and appends no script when offline', async () => {
    const loader = TestBed.inject(GoogleMapsLoaderService);
    await expectAsync(loader.loadScript()).toBeRejectedWithError('offline');
    expect(mapsScripts().length).toBe(0);
  });

  it('removes the failed script tag on error so a retry appends a fresh one', async () => {
    online = true;
    const loader = TestBed.inject(GoogleMapsLoaderService);
    const p = loader.loadScript();
    const tags = mapsScripts();
    expect(tags.length).toBe(1);
    tags[0].onerror!(new Event('error'));
    await expectAsync(p).toBeRejected();
    expect(mapsScripts().length).toBe(0);
  });
});
