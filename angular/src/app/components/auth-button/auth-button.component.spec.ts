import { TestBed } from '@angular/core/testing';

import { AuthButtonComponent } from './auth-button.component';
import { AuthenticationService } from '../../services/authentication.service';
import { SessionService } from '../../services/session.service';

describe('AuthButtonComponent', () => {
  let signedIn: boolean;

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(AuthButtonComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => {
    signedIn = true;
    TestBed.configureTestingModule({
      imports: [AuthButtonComponent],
      providers: [
        // isAuthenticated() is false (expired id token) but the session is still signed in
        { provide: AuthenticationService, useValue: { isAuthenticated: () => false, signIn: () => {}, signOut: () => {} } },
        { provide: SessionService, useValue: { get signedIn() { return signedIn; } } },
      ],
    });
  });

  it('shows Log out when the session is signed in despite an expired id token', () => {
    expect(render().textContent).toContain('Log out');
  });

  it('shows Log in when signed out', () => {
    signedIn = false;
    expect(render().textContent).toContain('Log in');
  });
});
