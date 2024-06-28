import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-token-display',
  standalone: true,
  imports: [],
  templateUrl: './token-display.component.html',
  styleUrl: './token-display.component.css'
})
export class TokenDisplayComponent implements OnInit {

  access_token: string;
  id_token: string;

  constructor(public auth: AuthService, tokenService: TokenService) { 
    this.access_token = '';
    tokenService.token.subscribe(t => {
      this.access_token = t
    });
    this.id_token = "";
  }

  ngOnInit(): void {
    // this.auth.getAccessTokenSilently().subscribe(
    //   (token: string) => {
    //     this.access_token = token;
    //     console.log(token); // Use the token here
    //   },
    //   (error) => {
    //     console.error('Error fetching access token claims:', error)
    //   }
    // );    

    this.auth.idTokenClaims$.subscribe({
      next: (claims) => {
        // Step 3: Use getIdTokenClaims to retrieve the ID token claims
        this.id_token = claims?.__raw ?? ""; // Step 4: Access the __raw property to get the JWT, provide default value of empty string
        // console.log('ID Token (JWT):', jwt);
      },
      error: (error) => console.error('Error fetching ID token claims:', error)
    });
  }

}