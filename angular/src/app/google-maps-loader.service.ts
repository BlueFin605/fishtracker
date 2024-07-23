import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {

  private loaded = false;

  private promise: Promise<void> = new Promise<void>(() => {});

  private resolver:any;


  constructor() {
    // Step 1: Define mapInit globally
    (window as any)['mapInit'] = this.mapInit.bind(this);
  }

  loadScript(): Promise<void> {
    this.promise = new Promise((resolve, reject) => {
      if (this.loaded) {
        resolve();
        return;
      }
      
      this.resolver = resolve;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapiApi}&loading=async&callback=mapInit`;
      script.async = true; // Ensure the script is loaded asynchronously
      script.onload = () => {
        this.loaded = true;
      };
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    });

    return this.promise;
  }

  // Step 2: Implement the mapInit function
  private mapInit() {
    // Initialize your map or perform other actions here
    console.log('Google Maps API is loaded and ready to use');
    this.resolver();
    // For example, to initialize a map: new google.maps.Map(document.getElementById('map'), options);
  }
}