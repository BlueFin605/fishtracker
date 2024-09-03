// src/app/services/authentication.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, throwError, catchError } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private accessTokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public accessToken$: Observable<string> = this.accessTokenSubject.asObservable();

  constructor(private router: Router, private http: HttpClient) {}

  // private myurl = 'https://auth.fishtracker.bluefin605.com/login?client_id=6a1k8mh59fmah76tr3uua6r8at&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+profile&redirect_uri=http%3A%2F%2Flocalhost%3A4200%2Fcallback';
  private loginUrl = `${environment.domain}/login?response_type=token&client_id=${environment.clientId}&redirect_uri=${encodeURIComponent(environment.redirectUri)}&scope=openid+profile+email`;    
  private tokenUrl = `${environment.domain}/oauth2/token`;    

  signIn() {

    // const url = `https://fishtracker-prod.auth.ap-southeast-2.amazoncognito.com/login?
    //   response_type=code&
    //   client_id=${environment.clientId}&
    //   redirect_uri=${encodeURIComponent(this.redirectUri)}&
    //   scope=openid+profile+email`;
    window.location.href = this.loginUrl;    
    console.log(this.loginUrl);
  }

  signOut() {
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('id_token');
  }

  get id_token(): string | null {
    return localStorage.getItem('id_token');
  }  

  get access_token(): string | null {
    return localStorage.getItem('access_token');
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

        return newAccessToken;
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }}