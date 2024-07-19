import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, from, map, pipe } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://xte0lryazi.execute-api.eu-central-1.amazonaws.com/Prod/api/trip/5acb3a1b-9311-447b-95e5-7dfca626a3d2/catch';

  constructor(private http: HttpClient, private tokenService: TokenService ) {}

  getTripCatch(): Observable<TripCatch[]> {
    return this.tokenService.token.pipe(switchMap(jwt => {
        // console.log(`Bearer ${jwt}`);
        const headers = new HttpHeaders({
          Authorization: `Bearer ${jwt}`,
        });
        return this.http.get<TripCatch[]>(this.apiUrl, { headers });
    }));
  }


  getTrip(): Observable<TripDetails[]> {
    return this.tokenService.token.pipe(switchMap(jwt => {
        // console.log(`Bearer ${jwt}`);
        const headers = new HttpHeaders({
          Authorization: `Bearer ${jwt}`,
        });
        return this.http.get<TripDetails[]>('https://xte0lryazi.execute-api.eu-central-1.amazonaws.com/Prod/api/trip?view=relevant', { headers });
    }));
  }

}

export interface TripCatch {
  tripId: string;
  catchId: string;
  speciesId: string;
  caughtWhen: Date;
  caughtSize: string;
  caughtLength: number;
  // Add other properties based on the actual response structure
}

export interface TripDetails {
  subject: string;
  tripId: string;
  startTime: Date;
  endTime?: Date;
  notes: string;
  catchSize: number;
  rating: TripRating;
  tags: TripTags[];
}

enum TripRating
{
    NonRated,
    Bust,
    Okay,
    Good,
    Fantastic,
    OutOfThisWorld
}

enum TripTags
{
    Consistent,
    IncomingTide,
    OutgoingTide,
    Current,
    SlackWater,
    DeepWater,
    ShallowWater,
    Bait,
    Softbait,
    Jigs,
    EndOfTide,
    MidTide,
    StartOfTide,
    Dawn,
    Dusk,
    Overcast,
    Sunny,
    Rainy
}

