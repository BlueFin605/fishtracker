import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { environment } from '../../environments/environment';
import { AuthInterceptor } from './auth.interceptor';

@Injectable({
  providedIn: 'root',
 })
 export class ApiService {
  private baseApiUrl = environment.apiUrl; // Use environment variable for base API URL

  constructor(private http: HttpClient, private authService: AuthenticationService) {}

  getProfile(): Observable<ProfileDetails> {
    const apiUrl = `${this.baseApiUrl}/profile`; // Construct full API URL
    return this.http.get<ProfileDetails>(apiUrl);
  }

  postProfile(profile: ProfileDetails): Observable<ProfileDetails> {
    const apiUrl = `${this.baseApiUrl}/profile`; // Construct full API URL
    return this.http.patch<ProfileDetails>(apiUrl, profile);
  }

  getSettings(): Observable<SettingsDetails> {
    const apiUrl = `${this.baseApiUrl}/settings`; // Construct full API URL
    return this.http.get<SettingsDetails>(apiUrl);
  }

  getTripCatch(tripid: string): Observable<CatchDetails[]> {
    const apiUrl = `${this.baseApiUrl}/trip/${tripid}/catch`; // Construct full API URL
    return this.http.get<CatchDetails[]>(apiUrl);
  }

  getAllTrips(relevant: boolean): Observable<TripDetails[]> {
    const view = relevant ? 'relevant' : 'all';
    const apiUrl = `${this.baseApiUrl}/trip?view=${view}`; // Construct full API URL
    return this.http.get<TripDetails[]>(apiUrl);
  }

  getTrip(tripid: string): Observable<TripDetails> {
    const apiUrl = `${this.baseApiUrl}/trip/${tripid}`; // Construct full API URL
    console.log(`tripid[${tripid}] url[${apiUrl}]`)
    return this.http.get<TripDetails>(apiUrl);
  }

  deleteTrip(tripid: string): Observable<CatchDetails[]> {
    const apiUrl = `${this.baseApiUrl}/trip/${tripid}`; // Construct full API URL
    console.log(`tripid[${tripid}] url[${apiUrl}]`);
    return this.http.delete<CatchDetails[]>(apiUrl);
  }

  postTrip(newTrip: NewTrip): Observable<TripDetails> {
    const apiUrl = `${this.baseApiUrl}/trip`; // Construct full API URL
    return this.http.post<TripDetails>(apiUrl, newTrip);
  }

  endTrip(tripid: string, patchTrip: EndTripDetails): Observable<TripDetails> {
    const apiUrl = `${this.baseApiUrl}/trip/${tripid}/endtrip`; // Construct full API URL
    return this.http.post<TripDetails>(apiUrl, patchTrip);
  }

  postCatch(tripid: string, newCatch: NewCatch): Observable<CatchDetails> {
    const apiUrl = `${this.baseApiUrl}/trip/${tripid}/catch`; // Construct full API URL
    console.log(JSON.stringify(newCatch));
    return this.http.post<CatchDetails>(apiUrl, newCatch);
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
  species: string[];
  defaultSpecies: string;
}

export interface EndTripDetails {
  endTime?: string;
  timeZone?: string;
  notes?: string;
  rating?: TripRating;
  tags?: TripTags[];
}

export interface NewTrip {
  startTime?: string;
  timeZone?: string;
  notes: string;
  tags: TripTags[];
  species: string[];
  defaultSpecies: string;
}

export interface NewCatch {
  speciesId: string;
  caughtLocation?: Location;
  caughtWhen?: string;
  timeZone?: string;
  caughtSize: FishSize;
  caughtLength: number;
}



export interface Location {
  longitude: number;
  latitude: number;
}

export enum FishSize {
  Undersize = 'Undersize',
  Small = 'Small',
  Medium = 'Medium',
  Large = 'Large',
  VeryLarge = 'VeryLarge'
}

export enum TripRating {
  NonRated = 'NonRated',
  Bust = 'Bust',
  Okay = 'Okay',
  Good = 'Good',
  Fantastic = 'Fantastic',
  OutOfThisWorld = 'OutOfThisWorld'
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

export interface ProfileDetails {
  timeZone?: string;
  species: string[];
  defaultSpecies: string;
}

export interface SettingsDetails {
  species: string[];
}