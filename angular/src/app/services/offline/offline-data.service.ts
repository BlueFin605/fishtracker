import { Injectable, Inject, forwardRef } from '@angular/core';
import { Observable, from, of, switchMap, catchError } from 'rxjs';
import { toZonedTime } from 'date-fns-tz';
import { jwtDecode } from 'jwt-decode';
import { IndexedDbService } from './indexed-db.service';
import { SyncService } from './sync.service';
import {
  ApiService,
  TripDetails,
  CatchDetails,
  NewTrip,
  NewCatch,
  EndTripDetails,
  TripRating,
  FishSize,
} from '../api.service';
import {
  LocalTripRecord,
  LocalCatchRecord,
  SyncQueueOperation,
} from './offline.types';

@Injectable({
  providedIn: 'root',
})
export class OfflineDataService {
  constructor(
    private db: IndexedDbService,
    private apiService: ApiService,
    @Inject(forwardRef(() => SyncService)) private syncService: SyncService,
  ) {}

  // --- Trip Operations ---

  createTrip(newTrip: NewTrip): Observable<TripDetails> {
    return from(this.createTripLocally(newTrip));
  }

  endTrip(tripId: string, endTripData: EndTripDetails): Observable<TripDetails> {
    return from(this.endTripLocally(tripId, endTripData));
  }

  updateTripNotes(tripId: string, notes: string): Observable<TripDetails> {
    return from(this.updateTripNotesLocally(tripId, notes));
  }

  deleteTrip(tripId: string): Observable<void> {
    return from(this.deleteTripLocally(tripId));
  }

  // --- Catch Operations ---

  createCatch(tripId: string, newCatch: NewCatch): Observable<CatchDetails> {
    return from(this.createCatchLocally(tripId, newCatch));
  }

  // --- Read Operations ---

  getTrips(): Observable<TripDetails[]> {
    return from(this.db.getAllTrips()).pipe(
      switchMap(trips => {
        if (trips.length > 0) {
          return of(trips as TripDetails[]);
        }
        if (!navigator.onLine) {
          return of([] as TripDetails[]);
        }
        // Fallback to API if IndexedDB is empty and online
        return this.apiService.getAllTrips(true).pipe(
          switchMap(serverTrips => from(this.cacheTrips(serverTrips))),
          catchError(() => of([] as TripDetails[])),
        );
      }),
    );
  }

  getTrip(tripId: string): Observable<TripDetails> {
    return from(this.db.getTrip(tripId)).pipe(
      switchMap(trip => {
        if (trip) {
          return of(trip as TripDetails);
        }
        if (!navigator.onLine) {
          throw new Error(`Trip ${tripId} not available offline`);
        }
        // Fallback to API
        return this.apiService.getTrip(tripId).pipe(
          switchMap(serverTrip => from(this.cacheTripAndReturn(serverTrip))),
        );
      }),
    );
  }

  getCatches(tripId: string): Observable<CatchDetails[]> {
    return from(this.db.getCatchesByTripId(tripId)).pipe(
      switchMap(catches => {
        if (catches.length > 0) {
          return of(catches as CatchDetails[]);
        }
        if (!navigator.onLine) {
          return of([] as CatchDetails[]);
        }
        // Fallback to API
        return this.apiService.getTripCatch(tripId).pipe(
          switchMap(serverCatches => from(this.cacheCatches(serverCatches))),
          catchError(() => of([] as CatchDetails[])),
        );
      }),
    );
  }

  // --- Cache server responses ---

  async cacheTrips(trips: TripDetails[]): Promise<TripDetails[]> {
    for (const trip of trips) {
      const existing = await this.db.getTrip(trip.tripId);
      // Don't overwrite local pending/modified data with server data
      if (!existing || existing.syncStatus === 'synced') {
        await this.db.putTrip({ ...trip, syncStatus: 'synced' });
      }
    }
    return trips;
  }

  async cacheCatches(catches: CatchDetails[]): Promise<CatchDetails[]> {
    for (const c of catches) {
      const existing = await this.db.getCatch(c.catchId);
      if (!existing || existing.syncStatus === 'synced') {
        await this.db.putCatch({ ...c, syncStatus: 'synced' });
      }
    }
    return catches;
  }

  // --- Private implementation ---

  private async createTripLocally(newTrip: NewTrip): Promise<TripDetails> {
    const subject = this.getSubject();
    const startTime = newTrip.startTime ? new Date(newTrip.startTime) : new Date();
    const tripId = this.generateTripId(startTime, newTrip.timeZone);

    const trip: LocalTripRecord = {
      subject,
      tripId,
      startTime,
      notes: newTrip.notes,
      catchSize: 0,
      rating: TripRating.NonRated,
      tags: newTrip.tags,
      species: newTrip.species,
      defaultSpecies: newTrip.defaultSpecies,
      moonPhase: '',
      syncStatus: 'pending',
    };

    await this.db.putTrip(trip);
    await this.addToQueue('createTrip', tripId, undefined, newTrip);

    return trip;
  }

  private async endTripLocally(tripId: string, endTripData: EndTripDetails): Promise<TripDetails> {
    const trip = await this.db.getTrip(tripId);
    if (!trip) {
      throw new Error(`Trip ${tripId} not found locally`);
    }

    const catches = await this.db.getCatchesByTripId(tripId);
    const endTime = endTripData.endTime ? new Date(endTripData.endTime) : new Date();

    const updatedTrip: LocalTripRecord = {
      ...trip,
      endTime,
      catchSize: catches.length,
      rating: endTripData.rating ?? trip.rating,
      tags: endTripData.tags ?? trip.tags,
      notes: endTripData.notes ? (trip.notes ? `${trip.notes}\n${endTripData.notes}` : endTripData.notes) : trip.notes,
      syncStatus: trip.syncStatus === 'pending' ? 'pending' : 'modified',
    };

    await this.db.putTrip(updatedTrip);
    await this.addToQueue('endTrip', tripId, undefined, endTripData);

    return updatedTrip;
  }

  private async updateTripNotesLocally(tripId: string, notes: string): Promise<TripDetails> {
    const trip = await this.db.getTrip(tripId);
    if (!trip) {
      throw new Error(`Trip ${tripId} not found locally`);
    }

    const updatedTrip: LocalTripRecord = {
      ...trip,
      notes,
      syncStatus: trip.syncStatus === 'pending' ? 'pending' : 'modified',
    };

    await this.db.putTrip(updatedTrip);
    await this.addToQueue('updateTrip', tripId, undefined, { notes });

    return updatedTrip;
  }

  private async deleteTripLocally(tripId: string): Promise<void> {
    const trip = await this.db.getTrip(tripId);
    if (!trip) return;

    // Remove catches locally
    await this.db.deleteCatchesByTripId(tripId);

    // Remove any pending sync queue entries for this trip and its catches
    await this.db.deleteSyncQueueEntriesByEntityId(tripId);

    // If trip was synced to server, queue a delete operation
    if (trip.syncStatus === 'synced' || trip.syncStatus === 'modified') {
      await this.addToQueue('deleteTrip', tripId, undefined, { tripId });
    }

    await this.db.deleteTrip(tripId);
  }

  private async createCatchLocally(tripId: string, newCatch: NewCatch): Promise<CatchDetails> {
    const catchId = crypto.randomUUID();
    const caughtWhen = newCatch.caughtWhen ? new Date(newCatch.caughtWhen) : new Date();

    const catchRecord: LocalCatchRecord = {
      tripId,
      catchId,
      speciesId: newCatch.speciesId,
      caughtLocation: newCatch.caughtLocation ?? { longitude: 0, latitude: 0 },
      caughtWhen,
      caughtSize: newCatch.caughtSize,
      caughtLength: newCatch.caughtLength,
      syncStatus: 'pending',
    };

    await this.db.putCatch(catchRecord);
    await this.addToQueue('createCatch', catchId, tripId, newCatch);

    return catchRecord;
  }

  private async cacheTripAndReturn(trip: TripDetails): Promise<TripDetails> {
    await this.db.putTrip({ ...trip, syncStatus: 'synced' });
    return trip;
  }

  private async addToQueue(
    operation: SyncQueueOperation,
    entityId: string,
    parentId: string | undefined,
    payload: unknown,
  ): Promise<void> {
    await this.db.addToSyncQueue({
      operation,
      entityId,
      parentId,
      payload,
      status: 'queued',
      retryCount: 0,
      createdAt: Date.now(),
    });
    this.syncService.notifyNewEntry();
  }

  private generateTripId(startTime: Date, timeZone: string): string {
    const zoned = toZonedTime(startTime, timeZone);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const month = pad(zoned.getMonth() + 1);
    const day = pad(zoned.getDate());
    const hours = pad(zoned.getHours());
    const minutes = pad(zoned.getMinutes());
    const seconds = pad(zoned.getSeconds());
    const year = zoned.getFullYear().toString().slice(-2);
    return `${month}${day}:${hours}${minutes}${seconds}-${year}`;
  }

  private getSubject(): string {
    const idToken = localStorage.getItem('id_token');
    if (!idToken) {
      throw new Error('No id_token available — user not authenticated');
    }
    const decoded: { sub: string } = jwtDecode(idToken);
    return decoded.sub;
  }
}
