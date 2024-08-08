import { Component, OnInit } from '@angular/core';
import { ApiService, CatchDetails, TripDetails, NewCatch } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Add this line
import { GoogleMapsModule } from '@angular/google-maps'; // Add this line\
import { GoogleMapsLoaderService } from '../../google-maps-loader.service';
import { DateConversionService } from '../../services/date-conversion.service';
import * as moment from 'moment-timezone';

@Component({
  standalone: true,
  selector: 'app-trip-catch',
  templateUrl: './trip-catch.component.html',
  styleUrls: ['./trip-catch.component.css'],
  imports: [CommonModule, FormsModule, GoogleMapsModule]
})
export class TripCatchComponent implements OnInit {
  currentPositionMapVisible = false;
  catchHistoryMapVisible = false;
  tripDetails: TripDetails = {} as TripDetails;
  tripCatch: CatchDetails[];
  tripId: string = '';
  caughtWhen: Date | undefined = new Date();
  timeZones: string[] = [];

  newCatch: NewCatch = {
    timeZone: 'UCT',
    speciesId: 'Snapper'
  } as NewCatch;

  center: google.maps.LatLngLiteral = {lat: 24, lng: 12};
  zoom = 14;
  currentPositionMarkerOptions: google.maps.MarkerOptions = {draggable: true};
  currentPositionMarkerPosition: google.maps.LatLngLiteral = {} as google.maps.LatLngLiteral;
  catchHistoryMapMarkerOptions: google.maps.MarkerOptions = {draggable: false};
  catchHistoryMapMarkerPosition: google.maps.LatLngLiteral[] = [];

  constructor(private route: ActivatedRoute, 
              private apiService: ApiService,
              private googleMapsLoader: GoogleMapsLoaderService,
              private dateFormatter: DateConversionService) {
    this.tripCatch = [];
  }

  ngOnInit() {
    this.timeZones = moment.tz.names();  
    this.newCatch.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;      
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
  }

  fetchTripDetails(tripid: string) {
    this.apiService.getTrip(tripid).subscribe(data => {
      this.tripDetails = data;
    });
  }
  
  fetchCatches(tripid: string) {
    this.apiService.getTripCatch(tripid).subscribe(data => {
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
  
    });
  }  
  
  postCatch() {
    this.newCatch.caughtWhen = this.dateFormatter.createLocalDate(this.caughtWhen, this.newCatch.timeZone);

    this.apiService.postCatch(this.tripId, this.newCatch).subscribe({
      next: (response) => {
        console.log('Catch saved successfully', response);
        this.tripCatch.push(response);
        const markerPosition: google.maps.LatLngLiteral = {
          lat: response.caughtLocation.latitude,
          lng: response.caughtLocation.longitude
        };
        this.catchHistoryMapMarkerPosition.push(markerPosition);

      },
      error: (error) => {
        console.error('Error saving catch', error);
        // Handle error, e.g., show an error message
      }
    });
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
          }
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

    this.currentPositionMarkerPosition = event.latLng.toJSON();
    this.newCatch.caughtLocation = { latitude: this.currentPositionMarkerPosition.lat, longitude: this.currentPositionMarkerPosition.lng };    
  }

  onMarkerDragEnd(event: any) {
    console.log("onMarkerDragEnd");
    console.log(JSON.stringify(event));
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      this.newCatch.caughtLocation = { latitude: newLat, longitude: newLng };
  }

  toggleCurrentPositionMapVisibility(event: any) {
    event.preventDefault();    
    if (this.currentPositionMapVisible == false) {
        this.googleMapsLoader.loadScript().then(() => {
          this.currentPositionMapVisible = true;
          console.log('Google Maps API script loaded');
          // Initialize your Google Maps here
        }).catch(error => {
          console.error('Error loading Google Maps:', error);
        });
    }
    
    this.currentPositionMapVisible = false;
  }

  togglecatchHistoryVisibility(event: any): void {
    event.preventDefault();    
    if (this.catchHistoryMapVisible == false) {
        this.googleMapsLoader.loadScript().then(() => {
          this.catchHistoryMapVisible = true;
          console.log('Google Maps API script loaded');
          // Initialize your Google Maps here
        }).catch(error => {
          console.error('Error loading Google Maps:', error);
        });
    }
    
    this.catchHistoryMapVisible = false;
  }  
}