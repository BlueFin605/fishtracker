import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { ProfileDetails, SettingsDetails, ApiService } from './api.service';
import { IndexedDbService } from './offline/indexed-db.service';

@Injectable({
  providedIn: 'root'
})
export class FishTrackerSettingsService {
  private _relevantTrips: boolean = true;
  private _profile: BehaviorSubject<ProfileDetails | null> = new BehaviorSubject<ProfileDetails | null>(null);
  private _settings: BehaviorSubject<SettingsDetails | null> = new BehaviorSubject<SettingsDetails | null>(null);
  private profileLoading = false;
  private settingsLoading = false;

  constructor(private apiService: ApiService, private db: IndexedDbService) {}

  get relevantTrips(): boolean {
    return this._relevantTrips;
  }

  set relevantTrips(value: boolean) {
    this._relevantTrips = value;
  }

  get profile(): Observable<ProfileDetails> {
    return this._profile.asObservable().pipe(
      switchMap(profile => {
        if (profile !== null) {
          return of(profile);
        }
        if (this.profileLoading) {
          return this._profile.asObservable();
        }
        this.profileLoading = true;

        // Try IndexedDB first, then fall back to API
        return from(this.loadProfileFromCache()).pipe(
          switchMap(cached => {
            if (cached) {
              this._profile.next(cached);
              // Background refresh from API (best-effort)
              this.backgroundRefreshProfile();
              return of(cached);
            }
            // No cache — must fetch from API
            return this.apiService.getProfile().pipe(
              tap(p => {
                this._profile.next(p);
                this.cacheProfile(p);
                this.profileLoading = false;
              }),
              catchError(() => {
                // Both IndexedDB and API unavailable (first-time offline user)
                this.profileLoading = false;
                return of(null as unknown as ProfileDetails);
              }),
            );
          }),
        );
      }),
    ) as Observable<ProfileDetails>;
  }

  set profile(value: ProfileDetails) {
    this._profile.next(value);
    this.cacheProfile(value);
  }

  get settings(): Observable<SettingsDetails> {
    return this._settings.asObservable().pipe(
      switchMap(settings => {
        if (settings !== null) {
          return of(settings);
        }
        if (this.settingsLoading) {
          return this._settings.asObservable();
        }
        this.settingsLoading = true;

        // Try IndexedDB first, then fall back to API
        return from(this.loadSettingsFromCache()).pipe(
          switchMap(cached => {
            if (cached) {
              this._settings.next(cached);
              // Background refresh from API (best-effort)
              this.backgroundRefreshSettings();
              return of(cached);
            }
            // No cache — must fetch from API
            return this.apiService.getSettings().pipe(
              tap(s => {
                this._settings.next(s);
                this.cacheSettings(s);
                this.settingsLoading = false;
              }),
              catchError(() => {
                this.settingsLoading = false;
                return of(null as unknown as SettingsDetails);
              }),
            );
          }),
        );
      }),
    ) as Observable<SettingsDetails>;
  }

  set settings(value: SettingsDetails) {
    this._settings.next(value);
    this.cacheSettings(value);
  }

  /** Call after ApiService.addSpecies() to update the cached settings */
  updateSettingsCache(settings: SettingsDetails): void {
    this._settings.next(settings);
    this.cacheSettings(settings);
  }

  // --- Private caching methods ---

  private async loadProfileFromCache(): Promise<ProfileDetails | null> {
    try {
      const subject = this.getSubject();
      if (!subject) return null;
      const cached = await this.db.getProfile(subject);
      return cached ?? null;
    } catch {
      return null;
    }
  }

  private async loadSettingsFromCache(): Promise<SettingsDetails | null> {
    try {
      return (await this.db.getSettings()) ?? null;
    } catch {
      return null;
    }
  }

  private cacheProfile(profile: ProfileDetails): void {
    const subject = this.getSubject();
    if (!subject) return;
    this.db.putProfile({ ...profile, subject }).catch(() => {
      // Non-critical — log but don't surface
      console.warn('Failed to cache profile to IndexedDB');
    });
  }

  private cacheSettings(settings: SettingsDetails): void {
    this.db.putSettings(settings).catch(() => {
      console.warn('Failed to cache settings to IndexedDB');
    });
  }

  private backgroundRefreshProfile(): void {
    this.apiService.getProfile().subscribe({
      next: p => {
        this._profile.next(p);
        this.cacheProfile(p);
        this.profileLoading = false;
      },
      error: () => {
        // Silent — cached version is fine
        this.profileLoading = false;
      },
    });
  }

  private backgroundRefreshSettings(): void {
    this.apiService.getSettings().subscribe({
      next: s => {
        this._settings.next(s);
        this.cacheSettings(s);
        this.settingsLoading = false;
      },
      error: () => {
        this.settingsLoading = false;
      },
    });
  }

  private getSubject(): string | null {
    try {
      const idToken = localStorage.getItem('id_token');
      if (!idToken) return null;
      const decoded: { sub: string } = jwtDecode(idToken);
      return decoded.sub;
    } catch {
      return null;
    }
  }
}
