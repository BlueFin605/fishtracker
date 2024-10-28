import { Component, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { Observable } from 'rxjs';
import { GoogleMapsLoaderService } from './google-maps-loader.service';
import { HeaderComponent } from './components/header/header.component';
import { LoadingService } from './services/loading.service';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { AuthenticationService } from './services/authentication.service';

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
export class AppComponent implements OnInit {
  title = 'fishtracker';
  loading$: Observable<boolean>;

  constructor(private googleMapsLoader: GoogleMapsLoaderService,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private loadingService: LoadingService,
    private authService: AuthenticationService ) {
    this.loading$ = this.loadingService.loading$;
  }

  ngOnInit() {
    // if (this.authService.isAuthenticated()) {
    //   this.router.navigate(['/trips']);
    // } else {
    //   this.router.navigate(['/login']);
    // }
    
    // this.googleMapsLoader.loadScript().then(() => {
    //   console.log('Google Maps API script loaded');
    //   // Initialize your Google Maps here
    // }).catch(error => {
    //   console.error('Error loading Google Maps:', error);
    // });

    //   this.router.events.subscribe(event => {
    //     if (event instanceof NavigationStart) {
    //       this.loadingService.show();
    //     } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
    //       this.loadingService.hide();
    //     }
    //     this.cdr.detectChanges(); // Manually trigger change detection
    //   });
    // }

    //   this.router.events.subscribe(event => {
    //     this.zone.run(() => {
    //       if (event instanceof NavigationStart) {
    //         this.loadingService.show();
    //       } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
    //         this.loadingService.hide();
    //       }
    //     });
    //   });
  }
}
// Import RouterModule.forRoot(Routes) in the application bootstrap
