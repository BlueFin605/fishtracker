import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';
import { ProfileDetails, SettingsDetails, ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FishTrackerSettingsService {
  private _relevantTrips: boolean = true;
  private _profile: BehaviorSubject<ProfileDetails | null> = new BehaviorSubject<ProfileDetails | null>(null);
  private _settings: BehaviorSubject<SettingsDetails | null> = new BehaviorSubject<SettingsDetails | null>(null);

  constructor(private apiService: ApiService) {}

  get relevantTrips(): boolean {
    return this._relevantTrips;
  }

  set relevantTrips(value: boolean) {
    this._relevantTrips = value;
  }

  get profile(): Observable<ProfileDetails> {
    return this._profile.asObservable().pipe(
      switchMap(profile => {
        if (profile === null) {
          return this.apiService.getProfile(); // Fetch profile from API if null
        }
        return [profile];
      }),
      filter(profile => profile !== null)
    ) as Observable<ProfileDetails>;
  }

  set profile(value: ProfileDetails) {
    this._profile.next(value);
  }

  get settings(): Observable<SettingsDetails> {
    return this._settings.asObservable().pipe(
      switchMap(settings => {
        if (settings === null) {
          return this.apiService.getSettings(); // Fetch settings from API if null
        }
        return [settings];
      }),
      filter(settings => settings !== null)
    ) as Observable<SettingsDetails>;
  }

  set settings(value: SettingsDetails) {
    this._settings.next(value);
  }
}