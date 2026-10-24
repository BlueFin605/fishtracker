import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AuthenticationService } from '../../services/authentication.service';
import { SessionService } from '../../services/session.service';
import { SyncService } from '../../services/offline/sync.service';
import { SyncState } from '../../services/offline/offline.types';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let signedIn: boolean;
  let syncState: BehaviorSubject<SyncState>;
  let signIn: jasmine.Spy;

  beforeEach(async () => {
    signedIn = true;
    signIn = jasmine.createSpy('signIn');
    syncState = new BehaviorSubject<SyncState>('idle' as SyncState);
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: { get signedIn() { return signedIn; } } },
        {
          provide: AuthenticationService,
          useValue: {
            isAuthenticated: () => false, // expired id token
            userDisplayName: 'Dean', userEmail: 'd@x.com', userInitial: 'D',
            signIn, signOut: () => {},
          },
        },
        { provide: SyncService, useValue: { syncState$: syncState, pendingCount$: new BehaviorSubject(0) } },
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
  });

  it('renders the avatar when the session is signed in despite an expired id token', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.avatar-button')).toBeTruthy();
  });

  it('renders nothing when signed out', () => {
    signedIn = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.avatar-button')).toBeNull();
  });

  it('shows a sign-in button on authExpired that calls signIn', () => {
    syncState.next('authExpired' as SyncState);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button.sync-auth-warning');
    expect(btn).toBeTruthy();
    expect(btn.title).toBe('Sign in again to sync');
    btn.click();
    expect(signIn).toHaveBeenCalled();
  });
});
