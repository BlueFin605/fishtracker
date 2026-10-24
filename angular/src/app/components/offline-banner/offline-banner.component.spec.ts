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
  let users: { sub: string; name: string; email: string }[];
  let counts: Record<string, number>;
  let currentSub: string;
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
    users = [];
    counts = {};
    currentSub = 'me';
    state$ = new BehaviorSubject<string>('valid');
    signIn = jasmine.createSpy('signIn');
    countFor = jasmine.createSpy('getSyncQueueCountFor').and.callFake(async (sub: string) => counts[sub] ?? 0);
    TestBed.configureTestingModule({
      imports: [OfflineBannerComponent],
      providers: [
        {
          provide: SessionService,
          useValue: {
            get isProxy() { return isProxy; },
            state$,
            displayName: 'Ann',
          },
        },
        { provide: AuthenticationService, useValue: { signIn } },
        { provide: ConnectivityService, useValue: { isOnline: () => online } },
        { provide: IndexedDbService, useValue: { getSyncQueueCountFor: countFor, currentSubjectId: () => currentSub } },
        { provide: LocalUsersRegistry, useValue: { list: () => users } },
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
    const bob = { sub: 'other', name: 'Bob', email: 'b@x' };
    const me = { sub: 'me', name: 'Me', email: 'm@x' };

    beforeEach(() => {
      isProxy = false;
      users = [me, bob];
      counts = { other: 2 };
    });

    it('shows the warning for a registry user with queued work, with no remembered sub', async () => {
      const text = (await create()).nativeElement.textContent;
      expect(text).toContain('Bob has unsynced offline changes — sign in as them to sync');
      expect(countFor).toHaveBeenCalledWith('other');
    });

    it('never checks the current user', async () => {
      counts = { me: 5 };
      expect((await create()).nativeElement.textContent.trim()).toBe('');
      expect(countFor).not.toHaveBeenCalledWith('me');
    });

    it('is hidden when no registry user has queued work', async () => {
      counts = {};
      expect((await create()).nativeElement.textContent.trim()).toBe('');
    });

    it('is hidden when the registry is empty', async () => {
      users = [];
      expect((await create()).nativeElement.textContent.trim()).toBe('');
    });

    it('shows the first user with a non-zero count', async () => {
      users = [me, { sub: 'cat', name: 'Cat', email: 'c@x' }, bob];
      counts = { cat: 0, other: 1 };
      expect((await create()).nativeElement.textContent).toContain('Bob has unsynced');
    });

    it('hides after the queue drains and state re-emits', async () => {
      const fixture = await create();
      expect(fixture.nativeElement.textContent).toContain('Bob has unsynced');
      counts = {};
      state$.next('stale');
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent.trim()).toBe('');
    });
  });
});
