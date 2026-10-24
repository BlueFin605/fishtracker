import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { OnlineOnlyGuard } from './online-only.guard';
import { ConnectivityService } from './services/connectivity.service';

describe('OnlineOnlyGuard', () => {
  let online: boolean;

  beforeEach(() => {
    online = true;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ConnectivityService, useValue: { isOnline: () => online } },
      ]
    });
  });

  it('allows navigation when online', () => {
    expect(TestBed.inject(OnlineOnlyGuard).canActivate()).toBeTrue();
  });

  it('redirects to /offline with a needs-connection reason when offline', () => {
    online = false;
    const result = TestBed.inject(OnlineOnlyGuard).canActivate();
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/offline?reason=needs-connection');
  });
});
