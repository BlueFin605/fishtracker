import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { TripCatchComponent } from './trip-catch.component';
import { OfflineDataService } from '../../services/offline/offline-data.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { ApiService } from '../../services/api.service';
import { GoogleMapsLoaderService } from '../../google-maps-loader.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('TripCatchComponent', () => {
  let component: TripCatchComponent;
  let fixture: ComponentFixture<TripCatchComponent>;
  let offlineData: { getTrip: jasmine.Spy; getCatches: jasmine.Spy; createCatch: jasmine.Spy; endTrip: jasmine.Spy };
  let getCurrentPosition: jasmine.Spy;
  let snackBar: { open: jasmine.Spy };

  function fix(lat: number, lng: number) {
    return (success: PositionCallback) =>
      success({ coords: { latitude: lat, longitude: lng } } as GeolocationPosition);
  }

  beforeEach(async () => {
    offlineData = {
      getTrip: jasmine.createSpy('getTrip').and.returnValue(of({ tripId: 't1', defaultSpecies: 'Snapper' })),
      getCatches: jasmine.createSpy('getCatches').and.returnValue(of([])),
      createCatch: jasmine.createSpy('createCatch').and.callFake((_id: string, c: any) =>
        of({ caughtLocation: c.caughtLocation })),
      endTrip: jasmine.createSpy('endTrip').and.returnValue(of({})),
    };
    getCurrentPosition = spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake(fix(1, 2) as any);

    snackBar = { open: jasmine.createSpy('open') };
    await TestBed.configureTestingModule({
      imports: [TripCatchComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map()),
            snapshot: { paramMap: { get: () => 't1' } },
          },
        },
        { provide: OfflineDataService, useValue: offlineData },
        { provide: ConnectivityService, useValue: { online$: new BehaviorSubject(true) } },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ApiService, useValue: {} },
        { provide: GoogleMapsLoaderService, useValue: { loadScript: () => Promise.resolve() } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripCatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    getCurrentPosition.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes bounded options to getCurrentPosition', async () => {
    await component.getCurrentLocation();
    expect(getCurrentPosition).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.any(Function),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });

  it('refreshes GPS at save when position was not set manually', async () => {
    getCurrentPosition.and.callFake(fix(10, 20) as any);
    await component.postCatch();
    expect(getCurrentPosition).toHaveBeenCalled();
    expect(offlineData.createCatch.calls.mostRecent().args[1].caughtLocation)
      .toEqual({ latitude: 10, longitude: 20 });
  });

  it('keeps the manual position and skips geolocation at save', async () => {
    component.onMapClick({ latLng: { toJSON: () => ({ lat: 5, lng: 6 }) } } as any);
    getCurrentPosition.calls.reset();
    await component.postCatch();
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(offlineData.createCatch.calls.mostRecent().args[1].caughtLocation)
      .toEqual({ latitude: 5, longitude: 6 });
  });

  it('keeps manual position after marker drag', async () => {
    component.onMarkerDragEnd({ latLng: { lat: () => 7, lng: () => 8 } });
    getCurrentPosition.calls.reset();
    await component.postCatch();
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(offlineData.createCatch.calls.mostRecent().args[1].caughtLocation)
      .toEqual({ latitude: 7, longitude: 8 });
  });

  it('falls back to the existing caughtLocation when refresh fails', async () => {
    component.newCatch.caughtLocation = { latitude: 3, longitude: 4 };
    getCurrentPosition.and.callFake(((_s: PositionCallback, err: PositionErrorCallback) =>
      err({ code: 3, message: 'timeout' } as GeolocationPositionError)) as any);
    await component.postCatch();
    expect(offlineData.createCatch.calls.mostRecent().args[1].caughtLocation)
      .toEqual({ latitude: 3, longitude: 4 });
  });

  describe('quick catch without a GPS fix', () => {
    const failGps = () => getCurrentPosition.and.callFake(((_s: PositionCallback, err: PositionErrorCallback) =>
      err({ code: 3, message: 'timeout' } as GeolocationPositionError)) as any);

    it('still saves the catch using the last known position and notifies the user', async () => {
      component.currentPositionMarkerPosition = { lat: 9, lng: 8 };
      component.newCatch.caughtLocation = { latitude: 9, longitude: 8 };
      failGps();
      await component.onFishSizeSelected('Large' as any);
      expect(offlineData.createCatch).toHaveBeenCalledTimes(1);
      expect(offlineData.createCatch.calls.mostRecent().args[1].caughtLocation)
        .toEqual({ latitude: 9, longitude: 8 });
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('saves with no location when nothing is known and notifies the user', async () => {
      component.currentPositionMarkerPosition = {} as any;
      component.newCatch.caughtLocation = undefined as any;
      failGps();
      await component.onFishSizeSelected('Large' as any);
      expect(offlineData.createCatch).toHaveBeenCalledTimes(1);
      expect(offlineData.createCatch.calls.mostRecent().args[1].caughtLocation).toBeUndefined();
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('postCatch robustness', () => {
    it('ignores a second tap while a save is in flight', async () => {
      const p1 = component.postCatch();
      const p2 = component.postCatch();
      await Promise.all([p1, p2]);
      expect(offlineData.createCatch).toHaveBeenCalledTimes(1);
    });

    it('does not throw when the saved catch has no location', async () => {
      getCurrentPosition.and.callFake(((_s: PositionCallback, err: PositionErrorCallback) =>
        err({ code: 3, message: 'timeout' } as GeolocationPositionError)) as any);
      offlineData.createCatch.and.returnValue(of({}));
      await expectAsync(component.postCatch()).toBeResolved();
      expect(component.tripCatch.length).toBe(1);
      expect(component.catchHistoryMapMarkerPosition.length).toBe(0);
    });

    it('resets the manual-location flag after a successful save', async () => {
      component.onMapClick({ latLng: { toJSON: () => ({ lat: 5, lng: 6 }) } } as any);
      await component.postCatch();
      getCurrentPosition.calls.reset();
      await component.postCatch();
      expect(getCurrentPosition).toHaveBeenCalled();
    });
  });

  describe('map unavailable flags', () => {
    it('clears the flag when a later map load succeeds and keeps sections independent', async () => {
      const loader = TestBed.inject(GoogleMapsLoaderService) as any;
      loader.loadScript = () => Promise.reject(new Error('offline'));
      await component.toggleCurrentPositionMapVisibility({ preventDefault() {} });
      await fixture.whenStable();
      expect(component.currentMapUnavailable).toBeTrue();
      expect(component.historyMapUnavailable).toBeFalse();
      loader.loadScript = () => Promise.resolve();
      await component.toggleCurrentPositionMapVisibility({ preventDefault() {} });
      await fixture.whenStable();
      expect(component.currentMapUnavailable).toBeFalse();
    });
  });
});
