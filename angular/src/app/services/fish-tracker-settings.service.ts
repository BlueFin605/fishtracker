import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { ProfileDetails, SettingsDetails, ApiService } from './api.service';
import { IndexedDbService } from './offline/indexed-db.service';

@Injectable({
  providedIn: 'root'
})
export class FishTrackerSettingsService {
  private _relevantTrips: boolean = true;
  private _profile = new BehaviorSubject<ProfileDetails | null>(null);
  private _settings = new BehaviorSubject<SettingsDetails | null>(null);
  private profileInitStarted = false;
  private settingsInitStarted = false;

  constructor(
    private apiService: ApiService,
    private db: IndexedDbService,
    private http: HttpClient,
    private ngZone: NgZone,
  ) {}

  get relevantTrips(): boolean {
    return this._relevantTrips;
  }

  set relevantTrips(value: boolean) {
    this._relevantTrips = value;
  }

  get profile(): Observable<ProfileDetails> {
    if (!this.profileInitStarted) {
      this.profileInitStarted = true;
      this.initProfile();
    }
    return this._profile.asObservable().pipe(
      filter((p): p is ProfileDetails => p !== null),
    );
  }

  set profile(value: ProfileDetails) {
    this.emitProfile(value);
    this.cacheProfile(value);
  }

  get settings(): Observable<SettingsDetails> {
    if (!this.settingsInitStarted) {
      this.settingsInitStarted = true;
      this.initSettings();
    }
    return this._settings.asObservable().pipe(
      filter((s): s is SettingsDetails => s !== null),
    );
  }

  set settings(value: SettingsDetails) {
    this.emitSettings(value);
    this.cacheSettings(value);
  }

  /** Call after ApiService.addSpecies() to update the cached settings */
  updateSettingsCache(settings: SettingsDetails): void {
    this.emitSettings(settings);
    this.cacheSettings(settings);
  }

  // --- Zone-safe emitters ---
  // All BehaviorSubject emissions go through ngZone.run() so that
  // subscribers (components) always trigger change detection.

  private emitProfile(p: ProfileDetails | null): void {
    this.ngZone.run(() => this._profile.next(p));
  }

  private emitSettings(s: SettingsDetails | null): void {
    this.ngZone.run(() => this._settings.next(s));
  }

  // --- Initialization ---

  private initProfile(): void {
    this.loadProfileFromCache().then(cached => {
      if (cached) {
        this.emitProfile(cached);
        this.backgroundRefreshProfile();
      } else {
        this.apiService.getProfile().subscribe({
          next: p => {
            this.emitProfile(p);
            this.cacheProfile(p);
          },
          error: () => {
            this.emitProfile({ species: [], defaultSpecies: '' });
          },
        });
      }
    }).catch(() => {
      this.apiService.getProfile().subscribe({
        next: p => {
          this.emitProfile(p);
          this.cacheProfile(p);
        },
        error: () => {
          this.emitProfile({ species: [], defaultSpecies: '' });
        },
      });
    });
  }

  private initSettings(): void {
    this.loadSettingsFromCache().then(cached => {
      if (cached) {
        this.emitSettings(cached);
        this.backgroundRefreshSettings();
      } else {
        this.apiService.getSettings().subscribe({
          next: s => {
            this.emitSettings(s);
            this.cacheSettings(s);
          },
          error: () => {
            this.emitSettings({ species: [] });
          },
        });
      }
    }).catch(() => {
      this.apiService.getSettings().subscribe({
        next: s => {
          this.emitSettings(s);
          this.cacheSettings(s);
        },
        error: () => {
          this.emitSettings({ species: [] });
        },
      });
    });
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
      console.warn('Failed to cache profile to IndexedDB');
    });
  }

  private cacheSettings(settings: SettingsDetails): void {
    this.db.putSettings(settings).catch(() => {
      console.warn('Failed to cache settings to IndexedDB');
    });
  }

  private backgroundRefreshProfile(): void {
    this.http.get<ProfileDetails>(`${environment.apiUrl}/profile`).subscribe({
      next: p => {
        this.emitProfile(p);
        this.cacheProfile(p);
      },
      error: () => {},
    });
  }

  private backgroundRefreshSettings(): void {
    this.http.get<SettingsDetails>(`${environment.apiUrl}/settings`).subscribe({
      next: s => {
        this.emitSettings(s);
        this.cacheSettings(s);
      },
      error: () => {},
    });
  }

  private getSubject(): string | null {
    if (environment.bypassAuth) {
      return 'user123';
    }
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
