import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { OfflineBannerComponent } from './offline-banner.component';
import { SessionService } from '../../services/session.service';
import { AuthenticationService } from '../../services/authentication.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { IndexedDbService } from '../../services/offline/indexed-db.service';
import { LocalUsersRegistry } from '../../services/local-users-registry.service';

describe('OfflineBannerComponent', () => {
  let isProxy: boolean;
  let online: boolean;
  let lastProxySub: string | null;
  let currentSub: string;
  let queueCount: number;
  let state$: BehaviorSubject<string>;
  let signIn: jasmine.Spy;
  let countFor: jasmine.Spy;

  async function create() {
    const fixture = TestBed.createComponent(OfflineBannerComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    isProxy = true;
    online = false;
    lastProxySub = null;
    currentSub = 'me';
    queueCount = 2;
    state$ = new BehaviorSubject<string>('valid');
    signIn = jasmine.createSpy('signIn');
    countFor = jasmine.createSpy('getSyncQueueCountFor').and.callFake(async () => queueCount);
    TestBed.configureTestingModule({
      imports: [OfflineBannerComponent],
      providers: [
        {
          provide: SessionService,
          useValue: {
            get isProxy() { return isProxy; },
            get lastProxySub() { return lastProxySub; },
            state$,
            displayName: 'Ann',
          },
        },
        { provide: AuthenticationService, useValue: { signIn } },
        { provide: ConnectivityService, useValue: { isOnline: () => online } },
        { provide: IndexedDbService, useValue: { getSyncQueueCountFor: countFor, currentSubjectId: () => currentSub } },
        { provide: LocalUsersRegistry, useValue: { find: (sub: string) => (sub === 'other' ? { sub, name: 'Bob', email: 'b@x' } : undefined) } },
      ],
    });
  });

  it('is hidden when not in proxy mode', async () => {
    isProxy = false;
    expect((await create()).nativeElement.textContent.trim()).toBe('');
  });

  it('shows the user name in proxy mode', async () => {
    expect((await create()).nativeElement.textContent).toContain('Offline as Ann — sign in to sync');
  });

  it('disables Sign in while offline', async () => {
    const btn: HTMLButtonElement = (await create()).nativeElement.querySelector('button');
    expect(btn.disabled).toBeTrue();
    expect(btn.title).toBe('Needs a connection');
  });

  it('Sign in calls authService.signIn when online', async () => {
    online = true;
    const btn: HTMLButtonElement = (await create()).nativeElement.querySelector('button');
    expect(btn.disabled).toBeFalse();
    btn.click();
    expect(signIn).toHaveBeenCalled();
  });

  describe('another user has unsynced changes', () => {
    beforeEach(() => {
      isProxy = false;
      lastProxySub = 'other';
    });

    it('shows the warning with the registry name', async () => {
      const text = (await create()).nativeElement.textContent;
      expect(text).toContain('Bob has unsynced offline changes — sign in as them to sync');
      expect(countFor).toHaveBeenCalledWith('other');
    });

    it('is hidden when there is no lastProxySub', async () => {
      lastProxySub = null;
      expect((await create()).nativeElement.textContent.trim()).toBe('');
    });

    it('is hidden when lastProxySub is the current user', async () => {
      currentSub = 'other';
      expect((await create()).nativeElement.textContent.trim()).toBe('');
    });

    it('is hidden when the other queue is empty', async () => {
      queueCount = 0;
      expect((await create()).nativeElement.textContent.trim()).toBe('');
    });

    it('hides when the same user signs back in', async () => {
      const fixture = await create();
      expect(fixture.nativeElement.textContent).toContain('Bob has unsynced');
      lastProxySub = null;
      state$.next('valid');
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent.trim()).toBe('');
    });
  });
});
