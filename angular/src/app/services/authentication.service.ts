// src/app/services/authentication.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PkceService } from './pkce.service';
import { jwtDecode } from "jwt-decode";
// import * as jwt_decode from "jwt-decode";
// import jwt_decode from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private accessTokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public accessToken$: Observable<string> = this.accessTokenSubject.asObservable();

  private loginUrl = `${environment.domain}/oauth2/authorize?client_id=${environment.clientId}&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+profile&redirect_uri=${encodeURIComponent(environment.redirectUri)}`;
  private tokenUrl = `${environment.domain}/oauth2/token`;
  private userInfoUrl = `${environment.domain}/oauth2/userInfo`;

  constructor(private router: Router, private http: HttpClient, private pkceService: PkceService) {}

  async signIn() {
    const codeVerifier = this.pkceService.generateCodeVerifier();
    const codeChallenge = await this.pkceService.generateCodeChallenge(codeVerifier);    
    // const codeChallenge = this.pkceService.generateCodeChallenge(codeVerifier);
    console.log('codeVerifier:', codeVerifier);
    console.log('codeChallenge:', codeChallenge);
    localStorage.setItem('code_verifier', codeVerifier);

    const authUrl = `${this.loginUrl}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    window.location.href = authUrl;
    console.log(authUrl);
  }

  handleAuthCallback(code: string): Observable<any> {
    const codeVerifier = localStorage.getItem('code_verifier');
    if (!codeVerifier) {
      return throwError('Code verifier not found');
    }
  
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('client_id', environment.clientId);
    body.set('code', code);
    body.set('redirect_uri', environment.redirectUri);
    body.set('code_verifier', codeVerifier);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
  
    console.log('Token request body:', body.toString());
  
    return this.http.post(this.tokenUrl, body.toString(), { headers }).pipe(
      map((response: any) => {
        const accessToken = response.access_token;
        const idToken = response.id_token;
        const refreshToken = response.refresh_token;
  
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('id_token', idToken);
        localStorage.setItem('refresh_token', refreshToken);
  
        this.accessTokenSubject.next(accessToken);
  
        return response;
      }),
      catchError(error => {
        console.error('Token request error:', error);
        return throwError(error);
      })
    );
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return throwError('No refresh token available');
    }

    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', environment.clientId);
    body.set('refresh_token', refreshToken);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(this.tokenUrl, body.toString(), { headers }).pipe(
      map((response: any) => {
        const newAccessToken = response.access_token;
        const newIdToken = response.id_token;
        const newRefreshToken = response.refresh_token || refreshToken; // Use the new refresh token if provided

        localStorage.setItem('access_token', newAccessToken);
        localStorage.setItem('id_token', newIdToken);
        localStorage.setItem('refresh_token', newRefreshToken);

        this.accessTokenSubject.next(newAccessToken);

        return newAccessToken;
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }

  getUserInfo(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.userInfoUrl);
  }

  signOut() {
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    const idToken = this.id_token;
    if (!idToken) {
      return false;
    }

    const decodedToken: any = jwtDecode(idToken);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    return decodedToken.exp > currentTime;
  }

  get id_token(): string | null {
    return localStorage.getItem('id_token');
  }  

  get access_token(): string | null {
    return localStorage.getItem('access_token');  
  }
}

// src/app/interfaces/user-profile.interface.ts
export interface UserProfile {
  name: string;
  email: string;
  // Add other fields as needed
}