import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { OnlineOnlyGuard } from './online-only.guard';
import { ConnectivityService } from './services/connectivity.service';

describe('OnlineOnlyGuard', () => {
  let online: boolean;

  beforeEach(() => {
    online = true;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([]),
        { provide: ConnectivityService, useValue: { isOnline: () => true, whenProbed: () => Promise.resolve(online) } },
      ]
    });
  });

  it('allows navigation when online', async () => {
    expect(await TestBed.inject(OnlineOnlyGuard).canActivate()).toBeTrue();
  });

  it('redirects to /offline with a needs-connection reason when the probe says offline', async () => {
    online = false;
    const result = await TestBed.inject(OnlineOnlyGuard).canActivate();
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/offline?reason=needs-connection');
  });
});
