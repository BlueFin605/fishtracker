import { TestBed } from '@angular/core/testing';

import { OfflineBannerComponent } from './offline-banner.component';
import { SessionService } from '../../services/session.service';
import { AuthenticationService } from '../../services/authentication.service';
import { ConnectivityService } from '../../services/connectivity.service';

describe('OfflineBannerComponent', () => {
  let isProxy: boolean;
  let online: boolean;
  let signIn: jasmine.Spy;

  function create() {
    const fixture = TestBed.createComponent(OfflineBannerComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    isProxy = true;
    online = false;
    signIn = jasmine.createSpy('signIn');
    TestBed.configureTestingModule({
      imports: [OfflineBannerComponent],
      providers: [
        { provide: SessionService, useValue: { get isProxy() { return isProxy; }, displayName: 'Ann' } },
        { provide: AuthenticationService, useValue: { signIn } },
        { provide: ConnectivityService, useValue: { isOnline: () => online } },
      ],
    });
  });

  it('is hidden when not in proxy mode', () => {
    isProxy = false;
    expect(create().nativeElement.textContent.trim()).toBe('');
  });

  it('shows the user name in proxy mode', () => {
    expect(create().nativeElement.textContent).toContain('Offline as Ann — sign in to sync');
  });

  it('disables Sign in while offline', () => {
    const btn: HTMLButtonElement = create().nativeElement.querySelector('button');
    expect(btn.disabled).toBeTrue();
    expect(btn.title).toBe('Needs a connection');
  });

  it('Sign in calls authService.signIn when online', () => {
    online = true;
    const btn: HTMLButtonElement = create().nativeElement.querySelector('button');
    expect(btn.disabled).toBeFalse();
    btn.click();
    expect(signIn).toHaveBeenCalled();
  });
});
