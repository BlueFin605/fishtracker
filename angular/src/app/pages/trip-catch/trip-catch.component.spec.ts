import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { TripCatchComponent } from './trip-catch.component';
import { OfflineDataService } from '../../services/offline/offline-data.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { ApiService } from '../../services/api.service';
import { GoogleMapsLoaderService } from '../../google-maps-loader.service';

describe('TripCatchComponent', () => {
  let component: TripCatchComponent;
  let fixture: ComponentFixture<TripCatchComponent>;
  let offlineData: { getTrip: jasmine.Spy; getCatches: jasmine.Spy; createCatch: jasmine.Spy; endTrip: jasmine.Spy };
  let getCurrentPosition: jasmine.Spy;

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
});
