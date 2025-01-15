// src/app/components/token-display/token-display.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClipboardModule, Clipboard } from '@angular/cdk/clipboard';
import { AuthenticationService } from '../../services/authentication.service';
import { jwtDecode } from "jwt-decode";

@Component({
    selector: 'app-token-display',
    imports: [
        // BrowserModule,
        CommonModule,
        ClipboardModule
    ],
    templateUrl: './token-display.component.html',
    styleUrls: ['./token-display.component.css']
})
export class TokenDisplayComponent implements OnInit {
  access_token: string;
  id_token: string;
  refresh_token: string;
  decodedAccessToken: any = null;
  decodedIdToken: any = null;
  decodedRefreshToken: any = null;

  constructor(private authenticationService: AuthenticationService, private clipboard: Clipboard) { 
    this.access_token = '';
    this.id_token = '';
    this.refresh_token = '';
  }

  ngOnInit(): void {
    this.access_token = this.authenticationService.access_token ?? "";
    this.id_token = this.authenticationService.id_token ?? "";
    this.refresh_token = this.authenticationService.refresh_token ?? "";

    if (this.access_token) {
      this.decodedAccessToken = jwtDecode(this.access_token);
    }

    if (this.id_token) {
      this.decodedIdToken = jwtDecode(this.id_token);
    }

    if (this.refresh_token) {
      this.decodedRefreshToken = jwtDecode(this.refresh_token);
    }
  }


  copyToClipboard(tokenDetails: any): void {
    const tokenString = JSON.stringify(tokenDetails, null, 2);
    this.clipboard.copy(tokenString);
  }  
}