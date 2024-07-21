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

  getTripCatch(tripid: string): Observable<TripCatch[]> {
    const apiUrl = `${this.baseApiUrl}/trip/${tripid}/catch`; // Construct full API URL
    return this.tokenService.token.pipe(switchMap(jwt => {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${jwt}`,
      });
      return this.http.get<TripCatch[]>(apiUrl, { headers });
    }));
  }

  getAllTrips(): Observable<TripDetails[]> {
    const apiUrl = `${this.baseApiUrl}/trip?view=relevant`; // Construct full API URL
    return this.tokenService.token.pipe(switchMap(jwt => {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${jwt}`,
      });
      return this.http.get<TripDetails[]>(apiUrl, { headers });
    }));
  }

  getTrip(tripid: string): Observable<TripDetails> {
    const apiUrl = `${this.baseApiUrl}/trip/${tripid}`; // Construct full API URL
    console.log(`tripid[${tripid}] url[${apiUrl}]`)
    return this.tokenService.token.pipe(switchMap(jwt => {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${jwt}`,
      });
      return this.http.get<TripDetails>(apiUrl, { headers });
    }));
  }

  postTrip(newTrip: NewTrip): Observable<TripDetails> {
    const apiUrl = `${this.baseApiUrl}/trip`; // Construct full API URL
    return this.tokenService.token.pipe(switchMap(jwt => {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${jwt}`,
      });
      return this.http.post<TripDetails>(apiUrl, newTrip, { headers });
    }));
  }

  postCatch(tripid: string, newCatch: NewCatch): Observable<TripCatch> {
    const apiUrl = `${this.baseApiUrl}/trip/${tripid}/catch`; // Construct full API URL
    console.log(JSON.stringify(newCatch));
    return this.tokenService.token.pipe(switchMap(jwt => {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${jwt}`,
      });
      return this.http.post<TripCatch>(apiUrl, newCatch, { headers });
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

export interface NewTrip {
  startTime?: Date;
  timeZone?: string;
  notes: string;
  tags: TripTags[];
}

export interface NewCatch {
  speciesId: string;
  caughtLocation: Location;
  caughtWhen?: Date;
  timeZone?: string;
  caughtSize: FishSize;
  caughtLength: number;
}

export interface Location {
  longitude: number;
  latitude: number;
}

export enum FishSize {
  Undersize,
  Small,
  Medium,
  Large,
  VeryLarge
}

export enum TripRating
{
    NonRated,
    Bust,
    Okay,
    Good,
    Fantastic,
    OutOfThisWorld
}

export enum TripTags
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

