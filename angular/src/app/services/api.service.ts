import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TokenService } from './token.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseApiUrl = environment.apiUrl; // Use environment variable for base API URL

  constructor(private http: HttpClient, private tokenService: TokenService) {}

  getTripCatch(): Observable<TripCatch[]> {
    const apiUrl = `${this.baseApiUrl}/trip/5acb3a1b-9311-447b-95e5-7dfca626a3d2/catch`; // Construct full API URL
    return this.tokenService.token.pipe(switchMap(jwt => {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${jwt}`,
      });
      return this.http.get<TripCatch[]>(apiUrl, { headers });
    }));
  }

  getTrip(): Observable<TripDetails[]> {
    const apiUrl = `${this.baseApiUrl}/trip?view=relevant`; // Construct full API URL
    return this.tokenService.token.pipe(switchMap(jwt => {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${jwt}`,
      });
      return this.http.get<TripDetails[]>(apiUrl, { headers });
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

