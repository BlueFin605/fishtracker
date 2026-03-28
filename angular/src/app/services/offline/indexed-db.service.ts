import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SettingsDetails } from '../api.service';
import {
  LocalTripRecord,
  LocalCatchRecord,
  LocalProfileRecord,
  SyncQueueEntry,
  SyncQueueEntryStatus,
  SyncStatus,
} from './offline.types';

const DB_NAME = 'fishtracker';
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
  private dbPromise: Promise<IDBPDatabase<FishTrackerDB>>;

  constructor() {
    this.dbPromise = openDB<FishTrackerDB>(DB_NAME, DB_VERSION, {
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
    const db = await this.dbPromise;
    await db.put('trips', trip);
  }

  async getTrip(tripId: string): Promise<LocalTripRecord | undefined> {
    const db = await this.dbPromise;
    return db.get('trips', tripId);
  }

  async getAllTrips(): Promise<LocalTripRecord[]> {
    const db = await this.dbPromise;
    return db.getAll('trips');
  }

  async getTripsBySyncStatus(status: SyncStatus): Promise<LocalTripRecord[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('trips', 'by-syncStatus', status);
  }

  async deleteTrip(tripId: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('trips', tripId);
  }

  // --- Catches ---

  async putCatch(catchRecord: LocalCatchRecord): Promise<void> {
    const db = await this.dbPromise;
    await db.put('catches', catchRecord);
  }

  async getCatch(catchId: string): Promise<LocalCatchRecord | undefined> {
    const db = await this.dbPromise;
    return db.get('catches', catchId);
  }

  async getCatchesByTripId(tripId: string): Promise<LocalCatchRecord[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('catches', 'by-tripId', tripId);
  }

  async getCatchesBySyncStatus(status: SyncStatus): Promise<LocalCatchRecord[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('catches', 'by-syncStatus', status);
  }

  async deleteCatch(catchId: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('catches', catchId);
  }

  async deleteCatchesByTripId(tripId: string): Promise<void> {
    const db = await this.dbPromise;
    const catches = await this.getCatchesByTripId(tripId);
    const tx = db.transaction('catches', 'readwrite');
    for (const c of catches) {
      await tx.store.delete(c.catchId);
    }
    await tx.done;
  }

  // --- Profile ---

  async putProfile(profile: LocalProfileRecord): Promise<void> {
    const db = await this.dbPromise;
    await db.put('profile', profile);
  }

  async getProfile(subject: string): Promise<LocalProfileRecord | undefined> {
    const db = await this.dbPromise;
    return db.get('profile', subject);
  }

  // --- Settings ---

  async putSettings(settings: SettingsDetails): Promise<void> {
    const db = await this.dbPromise;
    await db.put('settings', { ...settings, key: 'global' });
  }

  async getSettings(): Promise<SettingsDetails | undefined> {
    const db = await this.dbPromise;
    const record = await db.get('settings', 'global');
    if (!record) return undefined;
    const { key, ...settings } = record;
    return settings;
  }

  // --- Sync Queue ---

  async addToSyncQueue(entry: Omit<SyncQueueEntry, 'id'>): Promise<number> {
    const db = await this.dbPromise;
    return db.add('syncQueue', entry as SyncQueueEntry);
  }

  async getSyncQueueEntries(status: SyncQueueEntryStatus): Promise<SyncQueueEntry[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('syncQueue', 'by-status', status);
  }

  async getAllSyncQueueEntries(): Promise<SyncQueueEntry[]> {
    const db = await this.dbPromise;
    return db.getAll('syncQueue');
  }

  async updateSyncQueueEntry(id: number, updates: Partial<SyncQueueEntry>): Promise<void> {
    const db = await this.dbPromise;
    const entry = await db.get('syncQueue', id);
    if (!entry) return;
    await db.put('syncQueue', { ...entry, ...updates });
  }

  async deleteSyncQueueEntry(id: number): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('syncQueue', id);
  }

  async deleteSyncQueueEntriesByEntityId(entityId: string): Promise<void> {
    const db = await this.dbPromise;
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
    const db = await this.dbPromise;
    const queued = await db.countFromIndex('syncQueue', 'by-status', 'queued');
    const failed = await db.countFromIndex('syncQueue', 'by-status', 'failed');
    return queued + failed;
  }
}
