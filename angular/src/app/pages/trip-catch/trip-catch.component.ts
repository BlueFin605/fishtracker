import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { ApiService, CatchDetails, TripDetails, NewCatch, EndTripDetails, TripRating, FishSize } from '../../services/api.service';
import { OfflineDataService } from '../../services/offline/offline-data.service';
import { SyncStatus, LocalTripRecord, LocalCatchRecord } from '../../services/offline/offline.types';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConnectivityService } from '../../services/connectivity.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Add this line
import { GoogleMapsModule } from '@angular/google-maps'; // Add this line\
import { GoogleMapsLoaderService } from '../../google-maps-loader.service';
import { DateConversionService } from '../../services/date-conversion.service';
// import * as moment from 'moment-timezone';
import { DateFormatModule } from '../../components/date-format/date-format.module';
import { PreferencesService } from '../../services/preferences.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShareDialogComponent, ShareDialogTripOption } from '../share-dialog/share-dialog.component';

@Component({
  standalone: true,
  selector: 'app-trip-catch',
  templateUrl: './trip-catch.component.html',
  styleUrls: ['./trip-catch.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, GoogleMapsModule, DateFormatModule, ShareDialogComponent]
})
export class TripCatchComponent implements OnInit, OnDestroy {
  currentMapUnavailable = false;
  historyMapUnavailable = false;
  private savingCatch = false;
  private onlineSub?: Subscription;
  private locationSetManually = false;
  currentPositionMapVisible = false;
  currentPositionMapReady = false;
  catchHistoryMapVisible = false;
  catchHistoryMapReady = false;
  tripDetails: TripDetails = {} as TripDetails;
  tripCatch: CatchDetails[];
  tripId: string = '';
  caughtWhen: Date | undefined; // = new Date();
  // timeZones: string[] = [];
  showEndTripModal: boolean = false;
  endTripData: any = {
    endTime: '',
    notes: '',
    rating: TripRating.Okay,
    tags: ''
  };

  newCatch: NewCatch = {
    timeZone: 'UCT',
    speciesId: 'Snapper',
    caughtSize: FishSize.Medium,
  } as NewCatch;

  center: google.maps.LatLngLiteral = {lat: 24, lng: 12};
  zoom = 14;
  currentPositionMarkerOptions: google.maps.MarkerOptions = {draggable: true};
  currentPositionMarkerPosition: google.maps.LatLngLiteral = {} as google.maps.LatLngLiteral;
  catchHistoryMapMarkerOptions: google.maps.MarkerOptions = {draggable: false};
  catchHistoryMapMarkerPosition: google.maps.LatLngLiteral[] = [];

  ratingOptions = Object.values(TripRating);
  sizeOptions = Object.values(FishSize);

  isAdvancedMode: boolean = true;
  fishSizes = Object.values(FishSize);
  activeSpecies: string = '';

  shareDialogOpen = false;
  availableTripsForDialog: ShareDialogTripOption[] = [];

  constructor(private route: ActivatedRoute,
              private apiService: ApiService,
              private offlineData: OfflineDataService,
              private googleMapsLoader: GoogleMapsLoaderService,
              private dateFormatter: DateConversionService,
              private preferencesService: PreferencesService,
              private router: Router,
              private cdr: ChangeDetectorRef,
              private ngZone: NgZone,
              private connectivity: ConnectivityService,
              private snackBar: MatSnackBar) {
    this.tripCatch = [];
  }

  ngOnInit() {
    this.onlineSub = this.connectivity.online$.subscribe((online) => {
      if (online) { this.currentMapUnavailable = false; this.historyMapUnavailable = false; }
    });
    // this.timeZones = moment.tz.names();
    this.newCatch.timeZone = this.preferencesService.getTimeZone();
    this.tripId = this.route.snapshot.paramMap.get('tripid')!;
    console.log(`tripId: ${this.tripId}`);
    this.fetchTripDetails(this.tripId);
    this.fetchCatches(this.tripId);
    this.getCurrentLocation().then((position) => {
      this.center = position;
      this.currentPositionMarkerPosition = position;
      this.newCatch.caughtLocation = { latitude: position.lat, longitude: position.lng };
    }).catch((error) => {
      console.error('Error getting current location', error);
    });
    console.log(JSON.stringify(this.currentPositionMarkerPosition));
    console.log(`sizeOptions: ${this.sizeOptions}`);
    console.log(`ratingOptions: ${this.ratingOptions}`);
  }

  ngOnDestroy() {
    this.onlineSub?.unsubscribe();
  }

  get showAdvancedMode(): boolean {
    return this.isAdvancedMode || !!this.tripDetails?.endTime;
  }

  get tripIsOpen(): boolean {
    return this.tripDetails.tripId != undefined && !this.tripDetails.endTime
  }

  toggleMode() {
    this.isAdvancedMode = !this.isAdvancedMode;
  }

  formatNotes(notes: string): string {
    return notes?.replace(/\r\n/g, '<br>');
  }

  fetchTripDetails(tripid: string) {
    this.offlineData.getTrip(tripid).subscribe(data => {
      this.tripDetails = data;
      this.activeSpecies = data.defaultSpecies;
      this.isAdvancedMode = false;
      this.cdr.detectChanges();
      console.log(`trip rating[${this.tripDetails.rating}]`);
    });
  }

  selectSpecies(species: string) {
    this.activeSpecies = species;
  }

  fetchCatches(tripid: string) {
    this.offlineData.getCatches(tripid).subscribe(data => {
      this.tripCatch = data;
      this.tripCatch.forEach(item => {
        if (item.caughtLocation) {
          const markerPosition: google.maps.LatLngLiteral = {
            lat: item.caughtLocation.latitude,
            lng: item.caughtLocation.longitude
          };
          this.catchHistoryMapMarkerPosition.push(markerPosition);
        }
      });
      this.cdr.detectChanges();
    });
  }

  async postCatch() {
    if (this.savingCatch) return;
    this.savingCatch = true;
    try {
      await this.doPostCatch();
    } finally {
      this.savingCatch = false;
    }
  }

  private async doPostCatch() {
    if (!this.locationSetManually) {
      try {
        const p = await this.getCurrentLocation();
        this.newCatch.caughtLocation = { latitude: p.lat, longitude: p.lng };
      } catch {
        // keep earlier fix
      }
    }
    this.newCatch.caughtWhen = this.dateFormatter.createLocalDate(this.caughtWhen, this.newCatch.timeZone);

    this.offlineData.createCatch(this.tripId, this.newCatch).subscribe({
      next: (response) => {
        console.log('Catch saved successfully', response);
        this.tripCatch.push(response);
        this.addHistoryMarker(response);
        this.locationSetManually = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error saving catch', error);
      }
    });
  }

  private addHistoryMarker(response: CatchDetails): void {
    if (response?.caughtLocation) {
      this.catchHistoryMapMarkerPosition.push({
        lat: response.caughtLocation.latitude,
        lng: response.caughtLocation.longitude
      });
    }
  }

  getCurrentLocation(): Promise<google.maps.LatLngLiteral> {
    console.log('getCurrentLocation');
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log(`Found location:[${JSON.stringify(position)}]`);
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
      } else {
        reject(new Error('Geolocation is not supported by this browser.'));
      }
    });
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    console.log(JSON.stringify(event));
    if (event?.latLng == null)
      return;

    this.locationSetManually = true;
    this.currentPositionMarkerPosition = event.latLng.toJSON();
    this.newCatch.caughtLocation = { latitude: this.currentPositionMarkerPosition.lat, longitude: this.currentPositionMarkerPosition.lng };
  }

  onMarkerDragEnd(event: any) {
    console.log("onMarkerDragEnd");
    console.log(JSON.stringify(event));
      this.locationSetManually = true;
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      this.newCatch.caughtLocation = { latitude: newLat, longitude: newLng };
  }

  toggleCurrentPositionMapVisibility(event: any) {
    event.preventDefault();
    if (this.currentPositionMapVisible) {
      this.currentPositionMapVisible = false;
      this.currentPositionMapReady = false;
    } else {
      this.googleMapsLoader.loadScript().then(() => {
        this.ngZone.run(() => {
          // Show container first, then init map after DOM renders
          this.currentMapUnavailable = false;
          this.currentPositionMapVisible = true;
          this.cdr.detectChanges();
          requestAnimationFrame(() => {
            this.ngZone.run(() => {
              this.currentPositionMapReady = true;
              this.cdr.detectChanges();
            });
          });
        });
      }).catch(error => {
        console.error('Error loading Google Maps:', error);
        this.ngZone.run(() => { this.currentMapUnavailable = true; this.cdr.detectChanges(); });
      });
    }
  }

  togglecatchHistoryVisibility(event: any): void {
    event.preventDefault();
    if (this.catchHistoryMapVisible) {
      this.catchHistoryMapVisible = false;
      this.catchHistoryMapReady = false;
    } else {
      this.googleMapsLoader.loadScript().then(() => {
        this.ngZone.run(() => {
          // Show container first, then init map after DOM renders
          this.historyMapUnavailable = false;
          this.catchHistoryMapVisible = true;
          this.cdr.detectChanges();
          requestAnimationFrame(() => {
            this.ngZone.run(() => {
              this.catchHistoryMapReady = true;
              this.cdr.detectChanges();
            });
          });
        });
      }).catch(error => {
        console.error('Error loading Google Maps:', error);
        this.ngZone.run(() => { this.historyMapUnavailable = true; this.cdr.detectChanges(); });
      });
    }
  }

  openEndTripModal() {
    this.showEndTripModal = true;
  }

  closeEndTripModal() {
    this.showEndTripModal = false;
  }

  async onFishSizeSelected(size: FishSize): Promise<void> {
    const species = this.activeSpecies || this.tripDetails.defaultSpecies;
    let location: NewCatch['caughtLocation'] | undefined;
    try {
      const position = await this.getCurrentLocation();
      location = { latitude: position.lat, longitude: position.lng };
    } catch (error) {
      console.error('Error getting current location', error);
      // Never lose the catch: fall back to the last known position, or none.
      const last = this.currentPositionMarkerPosition;
      if (last && last.lat !== undefined && last.lng !== undefined) {
        location = { latitude: last.lat, longitude: last.lng };
      } else {
        location = this.newCatch.caughtLocation;
      }
      this.snackBar.open(
        location ? "Couldn't get a GPS fix - used your last known position." : "Couldn't get a GPS fix - catch saved without a position.",
        undefined, { duration: 4000 });
    }
    const mycatch: NewCatch = {
      timeZone: this.newCatch.timeZone,
      caughtWhen: this.dateFormatter.createLocalDate(new Date(), this.newCatch.timeZone),
      speciesId: species,
      caughtSize: size,
      caughtLocation: location as NewCatch['caughtLocation'],
      caughtLength: 0
    };

    this.offlineData.createCatch(this.tripId, mycatch).subscribe({
      next: (response) => {
        console.log('Catch saved successfully', response);
        this.tripCatch.push(response);
        this.addHistoryMarker(response);
        this.activeSpecies = this.tripDetails.defaultSpecies;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error saving catch', error);
        this.activeSpecies = this.tripDetails.defaultSpecies;
      }
    });
  }

  endTrip() {
    console.log('endTrip called', { tripId: this.tripDetails.tripId, endTripData: this.endTripData });
    const updatedTrip: EndTripDetails = {
      endTime: this.dateFormatter.createLocalDate(this.endTripData.endTime, this.newCatch.timeZone),
      timeZone: this.newCatch.timeZone,
      notes: this.endTripData.notes,
      rating: this.endTripData.rating
      // tags: this.endTripData.tags.split(',').map(tag => tag.trim())
    };
    console.log('endTrip updatedTrip', updatedTrip);

    this.offlineData.endTrip(this.tripDetails.tripId, updatedTrip).subscribe({
      next: (response) => {
        this.closeEndTripModal();
        console.log('Trip ended successfully', response);
        this.tripDetails = response;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.closeEndTripModal();
        console.error('Error ending trip', error);
      }
    });
  }

  getButtonClass(size: string): string {
    switch (size.toLowerCase()) {
      case 'undersize':
        return 'button-undersize';
      case 'small':
        return 'button-small';
      case 'medium':
        return 'button-medium';
      case 'large':
        return 'button-large';
      case 'verylarge':
        return 'button-verylarge';
      default:
        return '';
    }
  }

  formatSize(size: string): string {
    if (size.toLowerCase() === 'verylarge') {
      return 'Very Large';
    }
    return size;
  }


  isTripPending(): boolean {
    const trip = this.tripDetails as LocalTripRecord;
    return trip?.syncStatus === 'pending' || trip?.syncStatus === 'modified';
  }

  isCatchPending(item: CatchDetails): boolean {
    return (item as LocalCatchRecord)?.syncStatus === 'pending';
  }

  onCancel() {
    this.router.navigate(['/trips']);
  }

  get canOpenShareDialog(): boolean {
    return !!this.tripDetails?.tripId;
  }

  openShareDialog() {
    if (!this.canOpenShareDialog) return;
    this.availableTripsForDialog = [
      {
        tripId: this.tripId,
        startTime: this.tripDetails.startTime as unknown as string,
        catchCount: this.tripCatch?.length ?? 0,
      },
    ];
    this.shareDialogOpen = true;
  }

  onShareDialogClosed(ev: { shareId?: string }) {
    this.shareDialogOpen = false;
    if (ev.shareId) {
      alert('Share sent. View in My Shares.');
    }
  }
}
