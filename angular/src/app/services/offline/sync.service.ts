import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { IndexedDbService } from './indexed-db.service';
import { ApiService, NewTrip, NewCatch, EndTripDetails } from '../api.service';
import { SyncState, SyncQueueEntry } from './offline.types';

const RETRY_DELAYS = [0, 5000, 30000, 120000]; // immediate, 5s, 30s, 2min cap

@Injectable({
  providedIn: 'root',
})
export class SyncService implements OnDestroy {
  private _syncState$ = new BehaviorSubject<SyncState>('idle');
  private _pendingCount$ = new BehaviorSubject<number>(0);

  syncState$: Observable<SyncState> = this._syncState$.asObservable();
  pendingCount$: Observable<number> = this._pendingCount$.asObservable();

  private syncing = false;
  private authBlocked = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private periodicTimer: ReturnType<typeof setInterval> | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private db: IndexedDbService,
    private apiService: ApiService,
    private ngZone: NgZone,
  ) {
    this.setupTriggers();
    this.updatePendingCount();
  }

  ngOnDestroy(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.periodicTimer) clearInterval(this.periodicTimer);
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /** Called by OfflineDataService when a new queue entry is added */
  notifyNewEntry(): void {
    this.attemptSync();
  }

  /** Called after re-authentication to unblock sync */
  clearAuthBlock(): void {
    this.authBlocked = false;
    this.attemptSync();
  }

  private setupTriggers(): void {
    // App gains focus
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.attemptSync();
      }
    });

    // Connectivity change
    window.addEventListener('online', () => {
      this.attemptSync();
    });

    // Periodic foreground check (30s) — fallback for iOS
    this.periodicTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.attemptSync();
      }
    }, 30000);
  }

  private async attemptSync(): Promise<void> {
    if (this.syncing) return;
    if (this.authBlocked) return;
    if (!navigator.onLine) {
      await this.updatePendingCount();
      return;
    }

    // Cancel any pending retry timer since we're syncing now
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    const queueCount = await this.db.getSyncQueueCount();
    if (queueCount === 0) return;

    console.log(`[Sync] Starting sync pass, ${queueCount} entries in queue`);
    this.syncing = true;
    this.ngZone.run(() => this._syncState$.next('syncing'));

    try {
      await this.processSyncQueue();
    } finally {
      this.syncing = false;
      await this.updatePendingCount();
      const remaining = this._pendingCount$.value;
      console.log(`[Sync] Pass complete, ${remaining} entries remaining`);
      this.ngZone.run(() => this._syncState$.next(remaining > 0 ? 'pending' : 'idle'));
    }
  }

  private async processSyncQueue(): Promise<void> {
    // Process in order: createTrip → createCatch → updateTrip/endTrip → deleteTrip
    const operationOrder: string[] = ['createTrip', 'createCatch', 'updateTrip', 'endTrip', 'deleteTrip'];

    for (const operation of operationOrder) {
      const entries = await this.getQueuedEntriesForOperation(operation);

      for (const entry of entries) {
        // For createCatch, check parent trip is synced
        if (entry.operation === 'createCatch' && entry.parentId) {
          const parentTrip = await this.db.getTrip(entry.parentId);
          if (!parentTrip || parentTrip.syncStatus !== 'synced') {
            continue; // Skip — parent trip not yet synced
          }
        }

        const success = await this.processEntry(entry);
        if (!success) {
          // Network failure — stop this sync pass, schedule retry
          this.scheduleRetry(entry.retryCount);
          return;
        }
      }
    }
  }

  private async getQueuedEntriesForOperation(operation: string): Promise<SyncQueueEntry[]> {
    const all = await this.db.getAllSyncQueueEntries();
    return all
      .filter(e => e.operation === operation && (e.status === 'queued' || e.status === 'failed'))
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  private async processEntry(entry: SyncQueueEntry): Promise<boolean> {
    console.log(`[Sync] Processing: ${entry.operation} for ${entry.entityId}`, entry.payload);
    await this.db.updateSyncQueueEntry(entry.id, { status: 'in-progress', lastAttempt: Date.now() });

    try {
      switch (entry.operation) {
        case 'createTrip':
          await this.syncCreateTrip(entry);
          break;
        case 'createCatch':
          await this.syncCreateCatch(entry);
          break;
        case 'updateTrip':
          await this.syncUpdateTrip(entry);
          break;
        case 'endTrip':
          await this.syncEndTrip(entry);
          break;
        case 'deleteTrip':
          await this.syncDeleteTrip(entry);
          break;
      }

      // Success — remove from queue
      console.log(`[Sync] Success: ${entry.operation} for ${entry.entityId}`);
      await this.db.deleteSyncQueueEntry(entry.id);
      return true;
    } catch (err: unknown) {
      console.error(`[Sync] Failed: ${entry.operation} for ${entry.entityId}`, err);
      const status = (err as { status?: number })?.status;

      if (status === 401) {
        this.authBlocked = true;
        this.ngZone.run(() => this._syncState$.next('authExpired'));
        await this.db.updateSyncQueueEntry(entry.id, { status: 'failed', retryCount: entry.retryCount + 1 });
        return false;
      }

      // Network error or server error — mark failed, will retry
      await this.db.updateSyncQueueEntry(entry.id, {
        status: 'failed',
        retryCount: entry.retryCount + 1,
        lastAttempt: Date.now(),
      });
      return false;
    }
  }

  private syncCreateTrip(entry: SyncQueueEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.postTrip(entry.payload as NewTrip).subscribe({
        next: async serverTrip => {
          // Update local record with server response (moon phase, etc.)
          await this.db.putTrip({ ...serverTrip, syncStatus: 'synced' });
          resolve();
        },
        error: reject,
      });
    });
  }

  private syncCreateCatch(entry: SyncQueueEntry): Promise<void> {
    const tripId = entry.parentId!;
    return new Promise((resolve, reject) => {
      this.apiService.postCatch(tripId, entry.payload as NewCatch).subscribe({
        next: async serverCatch => {
          // Delete the local catch (client-generated catchId) and store server version
          // Server generates a new catchId, so we need to remove the old one
          if (serverCatch.catchId !== entry.entityId) {
            await this.db.deleteCatch(entry.entityId);
          }
          await this.db.putCatch({ ...serverCatch, syncStatus: 'synced' });
          resolve();
        },
        error: reject,
      });
    });
  }

  private syncUpdateTrip(entry: SyncQueueEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.patchTrip(entry.entityId, entry.payload as Partial<import('../api.service').TripDetails>).subscribe({
        next: async serverTrip => {
          await this.db.putTrip({ ...serverTrip, syncStatus: 'synced' });
          resolve();
        },
        error: reject,
      });
    });
  }

  private syncEndTrip(entry: SyncQueueEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.endTrip(entry.entityId, entry.payload as EndTripDetails).subscribe({
        next: async serverTrip => {
          await this.db.putTrip({ ...serverTrip, syncStatus: 'synced' });
          resolve();
        },
        error: reject,
      });
    });
  }

  private syncDeleteTrip(entry: SyncQueueEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.deleteTrip(entry.entityId).subscribe({
        next: () => resolve(),
        error: err => {
          // If trip already deleted on server (404), consider it success
          if (err?.status === 404) {
            resolve();
          } else {
            reject(err);
          }
        },
      });
    });
  }

  private scheduleRetry(retryCount: number): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
    if (delay > 0) {
      this.retryTimer = setTimeout(() => this.attemptSync(), delay);
    }
  }

  private async updatePendingCount(): Promise<void> {
    try {
      const count = await this.db.getSyncQueueCount();
      this.ngZone.run(() => this._pendingCount$.next(count));
    } catch {
      // Non-critical
    }
  }
}
