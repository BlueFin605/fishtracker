import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OfflineDataService } from './offline-data.service';
import { IndexedDbService } from './indexed-db.service';
import { SyncService } from './sync.service';
import { ApiService, NewTrip, NewCatch, FishSize, TripRating } from '../api.service';
import { LocalTripRecord, LocalCatchRecord } from './offline.types';

describe('OfflineDataService', () => {
  let service: OfflineDataService;
  let dbSpy: jasmine.SpyObj<IndexedDbService>;
  let syncSpy: jasmine.SpyObj<SyncService>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    dbSpy = jasmine.createSpyObj('IndexedDbService', [
      'putTrip', 'getTrip', 'getAllTrips', 'deleteTrip',
      'putCatch', 'getCatch', 'getCatchesByTripId', 'deleteCatchesByTripId',
      'addToSyncQueue', 'deleteSyncQueueEntriesByEntityId',
    ]);
    syncSpy = jasmine.createSpyObj('SyncService', ['notifyNewEntry']);
    apiSpy = jasmine.createSpyObj('ApiService', ['getAllTrips', 'getTrip', 'getTripCatch']);

    // Default returns
    dbSpy.putTrip.and.resolveTo();
    dbSpy.putCatch.and.resolveTo();
    dbSpy.addToSyncQueue.and.resolveTo(1);
    dbSpy.deleteCatchesByTripId.and.resolveTo();
    dbSpy.deleteSyncQueueEntriesByEntityId.and.resolveTo();
    dbSpy.deleteTrip.and.resolveTo();

    // Mock localStorage for getSubject
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'id_token') {
        // JWT with sub: "test-user-123" (base64 encoded payload)
        const header = btoa(JSON.stringify({ alg: 'none' }));
        const payload = btoa(JSON.stringify({ sub: 'test-user-123', exp: 9999999999 }));
        return `${header}.${payload}.signature`;
      }
      return null;
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OfflineDataService,
        { provide: IndexedDbService, useValue: dbSpy },
        { provide: SyncService, useValue: syncSpy },
        { provide: ApiService, useValue: apiSpy },
      ],
    });
    service = TestBed.inject(OfflineDataService);
  });

  describe('createTrip', () => {
    it('should write trip to IndexedDB with pending status', (done) => {
      const newTrip: NewTrip = {
        timeZone: 'Pacific/Auckland',
        notes: 'Test trip',
        tags: [],
        species: ['Snapper', 'Kahawai'],
        defaultSpecies: 'Snapper',
      };

      service.createTrip(newTrip).subscribe(trip => {
        expect(trip.subject).toBe('test-user-123');
        expect(trip.tripId).toMatch(/^\d{4}:\d{6}-\d{2}$/); // MMDD:HHMMSS-YY
        expect(trip.species).toEqual(['Snapper', 'Kahawai']);
        expect(trip.defaultSpecies).toBe('Snapper');
        expect(trip.notes).toBe('Test trip');
        expect(trip.catchSize).toBe(0);
        expect(trip.rating).toBe(TripRating.NonRated);

        expect(dbSpy.putTrip).toHaveBeenCalledTimes(1);
        const storedTrip = dbSpy.putTrip.calls.first().args[0] as LocalTripRecord;
        expect(storedTrip.syncStatus).toBe('pending');

        expect(dbSpy.addToSyncQueue).toHaveBeenCalledTimes(1);
        const queueEntry = dbSpy.addToSyncQueue.calls.first().args[0];
        expect(queueEntry.operation).toBe('createTrip');
        expect(queueEntry.status).toBe('queued');

        expect(syncSpy.notifyNewEntry).toHaveBeenCalled();
        done();
      });
    });

    it('should generate TripId in MMDD:HHMMSS-YY format', (done) => {
      const newTrip: NewTrip = {
        startTime: '2026-03-28T14:30:45',
        timeZone: 'UTC',
        notes: '',
        tags: [],
        species: ['Snapper'],
        defaultSpecies: 'Snapper',
      };

      service.createTrip(newTrip).subscribe(trip => {
        // TripId should match MMDD:HHMMSS-YY pattern
        expect(trip.tripId).toMatch(/^\d{4}:\d{6}-26$/);
        done();
      });
    });
  });

  describe('createCatch', () => {
    it('should write catch to IndexedDB with pending status', (done) => {
      const newCatch: NewCatch = {
        speciesId: 'Snapper',
        caughtSize: FishSize.Medium,
        caughtLength: 35,
        timeZone: 'Pacific/Auckland',
        caughtLocation: { latitude: -36.8, longitude: 174.8 },
      };

      service.createCatch('trip123', newCatch).subscribe(catchRecord => {
        expect(catchRecord.tripId).toBe('trip123');
        expect(catchRecord.catchId).toMatch(/^[0-9a-f-]{36}$/); // UUID format
        expect(catchRecord.speciesId).toBe('Snapper');
        expect(catchRecord.caughtSize).toBe(FishSize.Medium);

        expect(dbSpy.putCatch).toHaveBeenCalledTimes(1);
        const stored = dbSpy.putCatch.calls.first().args[0] as LocalCatchRecord;
        expect(stored.syncStatus).toBe('pending');

        expect(dbSpy.addToSyncQueue).toHaveBeenCalledTimes(1);
        const queueEntry = dbSpy.addToSyncQueue.calls.first().args[0];
        expect(queueEntry.operation).toBe('createCatch');
        expect(queueEntry.parentId).toBe('trip123');

        done();
      });
    });

    it('should not include biteInfo on locally created catch', (done) => {
      const newCatch: NewCatch = {
        speciesId: 'Snapper',
        caughtSize: FishSize.Small,
        caughtLength: 20,
        timeZone: 'UTC',
      };

      service.createCatch('trip123', newCatch).subscribe(catchRecord => {
        expect(catchRecord.biteInfo).toBeUndefined();
        done();
      });
    });
  });

  describe('endTrip', () => {
    it('should update trip in IndexedDB and count catches', (done) => {
      const existingTrip: LocalTripRecord = {
        subject: 'test-user-123',
        tripId: 'trip123',
        startTime: new Date(),
        notes: 'Started fishing',
        catchSize: 0,
        rating: TripRating.NonRated,
        tags: [],
        species: ['Snapper'],
        defaultSpecies: 'Snapper',
        moonPhase: '',
        syncStatus: 'pending',
      };

      dbSpy.getTrip.and.resolveTo(existingTrip);
      dbSpy.getCatchesByTripId.and.resolveTo([
        { catchId: 'c1', syncStatus: 'pending' } as LocalCatchRecord,
        { catchId: 'c2', syncStatus: 'pending' } as LocalCatchRecord,
      ]);

      service.endTrip('trip123', { timeZone: 'UTC', rating: TripRating.Good }).subscribe(trip => {
        expect(trip.endTime).toBeDefined();
        expect(trip.catchSize).toBe(2);
        expect(trip.rating).toBe(TripRating.Good);

        const stored = dbSpy.putTrip.calls.first().args[0] as LocalTripRecord;
        // Trip was 'pending' (never synced), should stay 'pending'
        expect(stored.syncStatus).toBe('pending');

        done();
      });
    });

    it('should set syncStatus to modified if trip was previously synced', (done) => {
      const existingTrip: LocalTripRecord = {
        subject: 'test-user-123',
        tripId: 'trip123',
        startTime: new Date(),
        notes: '',
        catchSize: 0,
        rating: TripRating.NonRated,
        tags: [],
        species: ['Snapper'],
        defaultSpecies: 'Snapper',
        moonPhase: 'Full Moon',
        syncStatus: 'synced',
      };

      dbSpy.getTrip.and.resolveTo(existingTrip);
      dbSpy.getCatchesByTripId.and.resolveTo([]);

      service.endTrip('trip123', { timeZone: 'UTC' }).subscribe(() => {
        const stored = dbSpy.putTrip.calls.first().args[0] as LocalTripRecord;
        expect(stored.syncStatus).toBe('modified');
        done();
      });
    });
  });

  describe('deleteTrip', () => {
    it('should delete locally and queue server delete for synced trip', (done) => {
      dbSpy.getTrip.and.resolveTo({
        tripId: 'trip123',
        syncStatus: 'synced',
      } as LocalTripRecord);

      service.deleteTrip('trip123').subscribe(() => {
        expect(dbSpy.deleteCatchesByTripId).toHaveBeenCalledWith('trip123');
        expect(dbSpy.deleteSyncQueueEntriesByEntityId).toHaveBeenCalledWith('trip123');
        expect(dbSpy.addToSyncQueue).toHaveBeenCalled();
        const queueEntry = dbSpy.addToSyncQueue.calls.first().args[0];
        expect(queueEntry.operation).toBe('deleteTrip');
        expect(dbSpy.deleteTrip).toHaveBeenCalledWith('trip123');
        done();
      });
    });

    it('should delete locally without server delete for pending trip', (done) => {
      dbSpy.getTrip.and.resolveTo({
        tripId: 'trip123',
        syncStatus: 'pending',
      } as LocalTripRecord);

      service.deleteTrip('trip123').subscribe(() => {
        expect(dbSpy.deleteCatchesByTripId).toHaveBeenCalledWith('trip123');
        expect(dbSpy.deleteSyncQueueEntriesByEntityId).toHaveBeenCalledWith('trip123');
        // Should NOT queue a server delete
        expect(dbSpy.addToSyncQueue).not.toHaveBeenCalled();
        expect(dbSpy.deleteTrip).toHaveBeenCalledWith('trip123');
        done();
      });
    });
  });

  describe('getTrips', () => {
    it('should return trips from IndexedDB when available', (done) => {
      const trips: LocalTripRecord[] = [
        { tripId: 't1', syncStatus: 'synced' } as LocalTripRecord,
        { tripId: 't2', syncStatus: 'pending' } as LocalTripRecord,
      ];
      dbSpy.getAllTrips.and.resolveTo(trips);

      service.getTrips().subscribe(result => {
        expect(result.length).toBe(2);
        expect(dbSpy.getAllTrips).toHaveBeenCalled();
        done();
      });
    });
  });
});
