import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://xte0lryazi.execute-api.eu-central-1.amazonaws.com/Prod/api/trip/5acb3a1b-9311-447b-95e5-7dfca626a3d2/catch';

  constructor(private http: HttpClient, private auth: AuthService ) {}

  getTripCatch(): Observable<TripCatch[]> {
    return this.auth.idTokenClaims$.pipe(
      switchMap((tokenClaims) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${tokenClaims?.__raw}`,
        });
        return this.http.get<TripCatch[]>(this.apiUrl, { headers });
      })
    );
  }
}

export class TripCatch {
  id: number = 0;
  location: string = '';
  date: Date = new Date();
  // Add other properties based on the actual response structure
}