import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private userProfile: any;
  private tokenSubject: ReplaySubject<string> = new ReplaySubject(1);
  public token: Observable<string> = this.tokenSubject.asObservable();

  constructor(private http: HttpClient, public auth: AuthService) {
    console.log('Authentication service initialized');
    this.auth.getAccessTokenSilently().subscribe(
      (token: string) => {
        this.tokenSubject.next(token); // Emit the token to subscribers
        //console.log(token); // Use the token here
      },
      (error) => {
        console.error('Error fetching access token:', error)
      }
    );
  }

  // Method to fetch user profile from IDP
  fetchUserProfile(): Observable<any> {
    return this.token.pipe(switchMap(jwt => {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${jwt}`,
      });
      return this.http.get('https://dev-ox5simjuwx546rx2.us.auth0.com/userinfo', { headers });
    }));

    // return this.http.get('https://dev-ox5simjuwx546rx2.us.auth0.com/userinfo'); // Replace with your IDP's user info endpoint
  }

  // Method to get the stored user profile
  getUserProfile() {
    return this.userProfile;
  }

  // Method to set the user profile
  setUserProfile(profile: any) {
    this.userProfile = profile;
  }

  isAuthenticated(): Observable<boolean> {
    return this.auth.isAuthenticated$;
  }

  login() {
    this.auth.loginWithRedirect();
  }

  logout() {
    this.auth.logout({ logoutParams: { returnTo: document.location.origin } });
  }
}
