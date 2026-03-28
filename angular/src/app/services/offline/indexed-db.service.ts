import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { SettingsDetails } from '../api.service';
import {
  LocalTripRecord,
  LocalCatchRecord,
  LocalProfileRecord,
  SyncQueueEntry,
  SyncQueueEntryStatus,
  SyncStatus,
} from './offline.types';

const DB_VERSION = 1;

interface FishTrackerDB extends DBSchema {
  trips: {
    key: string;
    value: LocalTripRecord;
    indexes: {
      'by-syncStatus': SyncStatus;
      'by-startTime': Date;
    };
  };
  catches: {
    key: string;
    value: LocalCatchRecord;
    indexes: {
      'by-tripId': string;
      'by-syncStatus': SyncStatus;
    };
  };
  profile: {
    key: string;
    value: LocalProfileRecord;
  };
  settings: {
    key: string;
    value: SettingsDetails & { key: string };
  };
  syncQueue: {
    key: number;
    value: SyncQueueEntry;
    indexes: {
      'by-status': SyncQueueEntryStatus;
      'by-createdAt': number;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService {
  private dbPromise: Promise<IDBPDatabase<FishTrackerDB>> | null = null;
  private currentSubject: string | null = null;

  private getDb(): Promise<IDBPDatabase<FishTrackerDB>> {
    const subject = this.getSubject();
    // If user changed (logout/login), open a new database
    if (this.currentSubject !== subject) {
      this.dbPromise = null;
      this.currentSubject = subject;
    }
    if (!this.dbPromise) {
      const dbName = `fishtracker-${subject}`;
      this.dbPromise = this.openDatabase(dbName);
    }
    return this.dbPromise;
  }

  private getSubject(): string {
    if (environment.bypassAuth) {
      return 'user123';
    }
    const idToken = localStorage.getItem('id_token');
    if (!idToken) {
      return 'anonymous';
    }
    try {
      const decoded: { sub: string } = jwtDecode(idToken);
      return decoded.sub;
    } catch {
      return 'anonymous';
    }
  }

  private openDatabase(dbName: string): Promise<IDBPDatabase<FishTrackerDB>> {
    return openDB<FishTrackerDB>(dbName, DB_VERSION, {
      upgrade(db) {
        // Trips store
        if (!db.objectStoreNames.contains('trips')) {
          const tripStore = db.createObjectStore('trips', { keyPath: 'tripId' });
          tripStore.createIndex('by-syncStatus', 'syncStatus');
          tripStore.createIndex('by-startTime', 'startTime');
        }

        // Catches store
        if (!db.objectStoreNames.contains('catches')) {
          const catchStore = db.createObjectStore('catches', { keyPath: 'catchId' });
          catchStore.createIndex('by-tripId', 'tripId');
          catchStore.createIndex('by-syncStatus', 'syncStatus');
        }

        // Profile store
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'subject' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          queueStore.createIndex('by-status', 'status');
          queueStore.createIndex('by-createdAt', 'createdAt');
        }
      },
    });
  }

  // --- Trips ---

  async putTrip(trip: LocalTripRecord): Promise<void> {
    const db = await this.getDb();
    await db.put('trips', trip);
  }

  async getTrip(tripId: string): Promise<LocalTripRecord | undefined> {
    const db = await this.getDb();
    return db.get('trips', tripId);
  }

  async getAllTrips(): Promise<LocalTripRecord[]> {
    const db = await this.getDb();
    return db.getAll('trips');
  }

  async getTripsBySyncStatus(status: SyncStatus): Promise<LocalTripRecord[]> {
    const db = await this.getDb();
    return db.getAllFromIndex('trips', 'by-syncStatus', status);
  }

  async deleteTrip(tripId: string): Promise<void> {
    const db = await this.getDb();
    await db.delete('trips', tripId);
  }

  // --- Catches ---

  async putCatch(catchRecord: LocalCatchRecord): Promise<void> {
    const db = await this.getDb();
    await db.put('catches', catchRecord);
  }

  async getCatch(catchId: string): Promise<LocalCatchRecord | undefined> {
    const db = await this.getDb();
    return db.get('catches', catchId);
  }

  async getCatchesByTripId(tripId: string): Promise<LocalCatchRecord[]> {
    const db = await this.getDb();
    return db.getAllFromIndex('catches', 'by-tripId', tripId);
  }

  async getCatchesBySyncStatus(status: SyncStatus): Promise<LocalCatchRecord[]> {
    const db = await this.getDb();
    return db.getAllFromIndex('catches', 'by-syncStatus', status);
  }

  async deleteCatch(catchId: string): Promise<void> {
    const db = await this.getDb();
    await db.delete('catches', catchId);
  }

  async deleteCatchesByTripId(tripId: string): Promise<void> {
    const db = await this.getDb();
    const catches = await this.getCatchesByTripId(tripId);
    const tx = db.transaction('catches', 'readwrite');
    for (const c of catches) {
      await tx.store.delete(c.catchId);
    }
    await tx.done;
  }

  // --- Profile ---

  async putProfile(profile: LocalProfileRecord): Promise<void> {
    const db = await this.getDb();
    await db.put('profile', profile);
  }

  async getProfile(subject: string): Promise<LocalProfileRecord | undefined> {
    const db = await this.getDb();
    return db.get('profile', subject);
  }

  // --- Settings ---

  async putSettings(settings: SettingsDetails): Promise<void> {
    const db = await this.getDb();
    await db.put('settings', { ...settings, key: 'global' });
  }

  async getSettings(): Promise<SettingsDetails | undefined> {
    const db = await this.getDb();
    const record = await db.get('settings', 'global');
    if (!record) return undefined;
    const { key, ...settings } = record;
    return settings;
  }

  // --- Sync Queue ---

  async addToSyncQueue(entry: Omit<SyncQueueEntry, 'id'>): Promise<number> {
    const db = await this.getDb();
    return db.add('syncQueue', entry as SyncQueueEntry);
  }

  async getSyncQueueEntries(status: SyncQueueEntryStatus): Promise<SyncQueueEntry[]> {
    const db = await this.getDb();
    return db.getAllFromIndex('syncQueue', 'by-status', status);
  }

  async getAllSyncQueueEntries(): Promise<SyncQueueEntry[]> {
    const db = await this.getDb();
    return db.getAll('syncQueue');
  }

  async updateSyncQueueEntry(id: number, updates: Partial<SyncQueueEntry>): Promise<void> {
    const db = await this.getDb();
    const entry = await db.get('syncQueue', id);
    if (!entry) return;
    await db.put('syncQueue', { ...entry, ...updates });
  }

  async deleteSyncQueueEntry(id: number): Promise<void> {
    const db = await this.getDb();
    await db.delete('syncQueue', id);
  }

  async deleteSyncQueueEntriesByEntityId(entityId: string): Promise<void> {
    const db = await this.getDb();
    const all = await db.getAll('syncQueue');
    const tx = db.transaction('syncQueue', 'readwrite');
    for (const entry of all) {
      if (entry.entityId === entityId || entry.parentId === entityId) {
        await tx.store.delete(entry.id);
      }
    }
    await tx.done;
  }

  async getSyncQueueCount(): Promise<number> {
    const db = await this.getDb();
    const queued = await db.countFromIndex('syncQueue', 'by-status', 'queued');
    const failed = await db.countFromIndex('syncQueue', 'by-status', 'failed');
    return queued + failed;
  }
}
