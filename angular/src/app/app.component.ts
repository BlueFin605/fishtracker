import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { GoogleMapsLoaderService } from './google-maps-loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, 
            HeaderComponent,
           ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'fishtracker';

  constructor(private googleMapsLoader: GoogleMapsLoaderService) {}

  ngOnInit() {
    // this.googleMapsLoader.loadScript().then(() => {
    //   console.log('Google Maps API script loaded');
    //   // Initialize your Google Maps here
    // }).catch(error => {
    //   console.error('Error loading Google Maps:', error);
    // });
  }  
}

// Import RouterModule.forRoot(Routes) in the application bootstrap
