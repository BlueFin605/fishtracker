import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  public token: string;

  constructor(public auth: AuthService) {
    this.token = '';
    this.auth.getAccessTokenSilently().subscribe(
      (token: string) => {
        this.token = token;
        console.log(token); // Use the token here
      },
      (error) => {
        console.error('Error fetching access token:', error)
      }
    );    

   }
}
