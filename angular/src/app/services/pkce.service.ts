// src/app/services/pkce.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PkceService {
  generateCodeVerifier(): string {
  //   return crypto.randomBytes(64).toString("base64url");
    const array = new Uint32Array(56 / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
  }

  async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashString = hashArray.map(byte => String.fromCharCode(byte)).join('');
    const base64Hash = btoa(hashString);
    return this.base64UrlEncode(base64Hash);  
  }
  
  private base64UrlEncode(input: string): string {
    return input
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

