import { TripDetails, CatchDetails, ProfileDetails, SettingsDetails } from '../api.service';

export type SyncStatus = 'synced' | 'pending' | 'modified';

export interface SyncMeta {
  syncStatus: SyncStatus;
}

export type LocalTripRecord = TripDetails & SyncMeta;
export type LocalCatchRecord = CatchDetails & SyncMeta;
export type LocalProfileRecord = ProfileDetails & { subject: string };

export type SyncQueueOperation = 'createTrip' | 'createCatch' | 'updateTrip' | 'endTrip' | 'deleteTrip';
export type SyncQueueEntryStatus = 'queued' | 'in-progress' | 'failed';

export interface SyncQueueEntry {
  id: number;
  operation: SyncQueueOperation;
  entityId: string;
  parentId?: string;
  payload: unknown;
  status: SyncQueueEntryStatus;
  retryCount: number;
  createdAt: number;
  lastAttempt?: number;
}

export type SyncState = 'idle' | 'syncing' | 'pending' | 'authExpired';
