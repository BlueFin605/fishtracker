import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthenticationService } from '../../services/authentication.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { SessionService } from '../../services/session.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let online: boolean;

  beforeEach(async () => {
    online = true;
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: { signedIn: false } },
        { provide: ConnectivityService, useValue: { isOnline: () => online } },
        { provide: AuthenticationService, useValue: { isAuthenticated: () => false, signIn: () => {}, signOut: () => {} } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows no connection message when online', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.offline-message')).toBeNull();
  });

  it('shows a needs-internet message when offline', () => {
    online = false;
    fixture.detectChanges();
    const msg: HTMLElement = fixture.nativeElement.querySelector('.offline-message');
    expect(msg).toBeTruthy();
    expect(msg.textContent).toContain('This page needs an internet connection');
  });
});
