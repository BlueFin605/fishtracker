import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FishTrackerSettingsService {
  private _relevantTrips: boolean = true;

  get relevantTrips(): boolean {
    return this._relevantTrips;
  }

  set relevantTrips(value: boolean) {
    this._relevantTrips = value;
  }}
