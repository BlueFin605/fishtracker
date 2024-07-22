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

  getTripCatch(tripid: string): Observable<CatchDetails[]> {
    const apiUrl = `${this.baseApiUrl}/trip/${tripid}/catch`; // Construct full API URL
    return this.tokenService.token.pipe(switchMap(jwt => {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${jwt}`,
      });
      return this.http.get<CatchDetails[]>(apiUrl, { headers });
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

  postCatch(tripid: string, newCatch: NewCatch): Observable<CatchDetails> {
    const apiUrl = `${this.baseApiUrl}/trip/${tripid}/catch`; // Construct full API URL
    console.log(JSON.stringify(newCatch));
    return this.tokenService.token.pipe(switchMap(jwt => {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${jwt}`,
      });
      return this.http.post<CatchDetails>(apiUrl, newCatch, { headers });
    }));
  }
}

export interface CatchDetails {
  tripId: string;
  catchId: string; // Assuming Guid translates to string in TypeScript for UUIDs
  speciesId: string; // Assuming Guid translates to string in TypeScript for UUIDs
  caughtLocation: Location;
  caughtWhen: Date; // DateTimeOffset translates to Date in TypeScript
  caughtSize: FishSize;
  caughtLength: number;
  weather?: WeatherAttributes; // Assuming WeatherAttributes is defined elsewhere
}

export interface WeatherAttributes {
  fromMajorBiteTime: string; // TimeSpan translates to string in TypeScript, assuming ISO 8601 duration format
  fromMinorBiteTime: string; // Same as above
  majorBiteTime: Date; // DateTime translates to Date in TypeScript
  minorBiteTime: Date; // Same as above
  sunSet: Date;
  sunRise: Date;
  moonSet: Date;
  moonRise: Date;
  lowTide: Date;
  highTide: Date;
  tideHeight: number;
  wind: Wind; // Assuming Wind is defined elsewhere
}

export interface Wind {
  speedKnots: number;
  direction: number;
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
  caughtLocation?: Location;
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

