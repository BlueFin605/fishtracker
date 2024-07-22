import { Component, OnInit } from '@angular/core';
import { ApiService, CatchDetails, TripDetails, NewCatch } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Add this line
import { GoogleMapsModule } from '@angular/google-maps'; // Add this line\
import { GoogleMapsLoaderService } from '../../google-maps-loader.service';

@Component({
  standalone: true,
  selector: 'app-trip-catch',
  templateUrl: './trip-catch.component.html',
  styleUrls: ['./trip-catch.component.css'],
  imports: [CommonModule, FormsModule, GoogleMapsModule]
})
export class TripCatchComponent implements OnInit {
  mapVisible = false;
  tripDetails: TripDetails = {} as TripDetails;
  tripCatch: CatchDetails[];
  tripId: string = '';
  newCatch: NewCatch = {
    timeZone: 'New Zealand Standard Time',
    speciesId: '2baeb56a-9f54-4e18-96ef-8bff9427b3c6'
  } as NewCatch;

  center: google.maps.LatLngLiteral = {lat: 24, lng: 12};
  zoom = 14;
  markerOptions: google.maps.MarkerOptions = {draggable: true};
  markerPosition: google.maps.LatLngLiteral = {} as google.maps.LatLngLiteral;

  constructor(private route: ActivatedRoute, 
              private apiService: ApiService,
              private googleMapsLoader: GoogleMapsLoaderService) {
    this.tripCatch = [];
  }

  ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('tripid')!;
    console.log(`tripId: ${this.tripId}`);
    this.fetchTripDetails(this.tripId);
    this.fetchCatches(this.tripId);
    this.getCurrentLocation().then((position) => {
      this.center = position;
      this.markerPosition = position;
      this.newCatch.caughtLocation = { latitude: position.lat, longitude: position.lng };
    }).catch((error) => {
      console.error('Error getting current location', error);
    });
    console.log(JSON.stringify(this.markerPosition));
  }

  fetchTripDetails(tripid: string) {
    this.apiService.getTrip(tripid).subscribe(data => {
      this.tripDetails = data;
    });
  }
  
  fetchCatches(tripid: string) {
    this.apiService.getTripCatch(tripid).subscribe(data => {
      this.tripCatch = data;
    });
  }  
  
  postCatch() {
    this.getCurrentLocation().then((position) => {
      this.markerPosition = position;
    }).catch((error) => {
      console.error('Error getting current location', error);
    });

    this.apiService.postCatch(this.tripId, this.newCatch).subscribe({
      next: (response) => {
        console.log('Catch saved successfully', response);
      },
      error: (error) => {
        console.error('Error saving catch', error);
        // Handle error, e.g., show an error message
      }
    });
  }

  getCurrentLocation(): Promise<google.maps.LatLngLiteral> {
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

    this.markerPosition = event.latLng.toJSON();
  }

  onMarkerDragEnd(event: any) {
    console.log("onMarkerDragEnd");
    console.log(JSON.stringify(event));
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      this.newCatch.caughtLocation = { latitude: newLat, longitude: newLng };
  }

  toggleMapVisibility(event: any) {
    event.preventDefault();    
    if (this.mapVisible == false) {
        this.googleMapsLoader.loadScript().then(() => {
          this.mapVisible = true;
          console.log('Google Maps API script loaded');
          // Initialize your Google Maps here
        }).catch(error => {
          console.error('Error loading Google Maps:', error);
        });
    }
    
    this.mapVisible = false;
  }
}