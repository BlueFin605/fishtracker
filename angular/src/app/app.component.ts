import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { Observable } from 'rxjs';
import { GoogleMapsLoaderService } from './google-maps-loader.service';
import { HeaderComponent } from './components/header/header.component';
import { LoadingService } from './services/loading.service';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'fishtracker';
  loading$: Observable<boolean>;

  constructor(private googleMapsLoader: GoogleMapsLoaderService,
              private loadingService: LoadingService) {
                this.loading$ = this.loadingService.loading$;                
              }

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
