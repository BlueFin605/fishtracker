import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { ConnectivityService } from './services/connectivity.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {

  private loaded = false;

  private inFlight: Promise<void> | null = null;

  private resolver:any;


  constructor(private connectivity: ConnectivityService) {
    // Step 1: Define mapInit globally
    (window as any)['mapInit'] = this.mapInit.bind(this);
  }

  loadScript(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    if (!this.connectivity.isOnline()) return Promise.reject(new Error('offline'));

    this.inFlight = new Promise<void>((resolve, reject) => {
      this.resolver = resolve;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapiApi}&loading=async&callback=mapInit`;
      script.async = true; // Ensure the script is loaded asynchronously
      script.onerror = (error) => {
        script.remove();
        this.inFlight = null;
        reject(error);
      };
      document.head.appendChild(script);
    });

    return this.inFlight;
  }

  // Step 2: Implement the mapInit function
  private mapInit() {
    // Initialize your map or perform other actions here
    console.log('Google Maps API is loaded and ready to use');
    this.loaded = true;
    this.inFlight = null;
    this.resolver?.();
    // For example, to initialize a map: new google.maps.Map(document.getElementById('map'), options);
  }
}