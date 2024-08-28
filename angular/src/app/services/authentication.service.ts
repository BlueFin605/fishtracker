// src/app/services/authentication.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  // private clientId = '5gipvjjpmpeqagcqpv5kpnu7uu';
  // private domain = 'fishtracker-prod';
  private redirectUri = 'http://localhost:4200/callback';

  constructor(private router: Router) {}

  signIn() {
    const url = `https://${environment.domain}.auth.${environment.region}.amazoncognito.com/login?response_type=token&client_id=${environment.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=openid+profile+email`;    
    // const url = `https://fishtracker-prod.auth.ap-southeast-2.amazoncognito.com/login?
    //   response_type=code&
    //   client_id=${environment.clientId}&
    //   redirect_uri=${encodeURIComponent(this.redirectUri)}&
    //   scope=openid+profile+email`;
    window.location.href = url;    
    console.log(url);
    window.location.href = url;
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
  }  }