import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private tokenSubject: ReplaySubject<string> = new ReplaySubject(1);
  public token: Observable<string> = this.tokenSubject.asObservable();

  constructor(public auth: AuthService) {
    this.auth.getAccessTokenSilently().subscribe(
      (token: string) => {
        this.tokenSubject.next(token); // Emit the token to subscribers
        //console.log(token); // Use the token here
      },
      (error) => {
        console.error('Error fetching access token:', error)
      }
    );    
  };
}
