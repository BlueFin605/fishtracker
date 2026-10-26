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

  function captureAppendedScripts(): HTMLScriptElement[] {
    const captured: HTMLScriptElement[] = [];
    spyOn(document.head, 'appendChild').and.callFake(((el: Node) => {
      captured.push(el as HTMLScriptElement);
      return el;
    }) as any);
    return captured;
  }

  it('removes the failed script tag on error so a retry appends a fresh one', async () => {
    online = true;
    const loader = TestBed.inject(GoogleMapsLoaderService);
    const captured = captureAppendedScripts();
    const removeSpy = spyOn(HTMLScriptElement.prototype, 'remove').and.callThrough();
    const p = loader.loadScript();
    expect(captured.length).toBe(1);
    captured[0].onerror!(new Event('error'));
    await expectAsync(p).toBeRejected();
    expect(removeSpy).toHaveBeenCalled();
    // retry appends a fresh script
    const p2 = loader.loadScript();
    expect(captured.length).toBe(2);
    captured[1].onerror!(new Event('error'));
    await expectAsync(p2).toBeRejected();
  });

  it('resolves from the already-loaded state even when offline', async () => {
    online = true;
    const loader = TestBed.inject(GoogleMapsLoaderService);
    const captured = captureAppendedScripts();
    const p = loader.loadScript();
    (window as any)['mapInit']();
    await p;
    online = false;
    await expectAsync(loader.loadScript()).toBeResolved();
    expect(captured.length).toBe(1);
  });

  it('returns the in-flight promise for concurrent calls and appends one script', async () => {
    online = true;
    const loader = TestBed.inject(GoogleMapsLoaderService);
    const captured = captureAppendedScripts();
    const p1 = loader.loadScript();
    const p2 = loader.loadScript();
    expect(p2).toBe(p1);
    expect(captured.length).toBe(1);
    (window as any)['mapInit']();
    await p1;
  });
});
