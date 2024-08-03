import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import { ApiService, TripDetails, CatchDetails } from '../../services/api.service';
import { Router } from '@angular/router';
import { FishTrackerSettingsService } from '../../services/fish-tracker-settings.service';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trips.component.html',
  styleUrl: './trips.component.css'
})
export class TripsComponent {
  trips: TripDetails[];
  relevantTrips: boolean;

  constructor(private router: Router, 
              private apiService: ApiService,
              private fishTrackerSettingsService: FishTrackerSettingsService) {
    this.trips = [];
    this.relevantTrips = this.fishTrackerSettingsService.relevantTrips;
  }

  ngOnInit() {
    this.getAllTrips();
  }

  getAllTrips() {
    this.apiService.getAllTrips(this.relevantTrips).subscribe((data: TripDetails[]) => {
      this.trips = data;
      console.log(`trips data ${JSON.stringify(this.trips)}`);
    });
  }

  confirmDeleteTrip(tripId: string, event: Event): void {
    event.stopPropagation();
    const confirmed = confirm('Are you sure you want to delete this trip?');
    if (confirmed) {
      this.deleteTrip(tripId);
    }
  }

  deleteTrip(tripId: string): void {
    this.apiService.deleteTrip(tripId).subscribe((data: CatchDetails[]) => {
      console.log(`removed catch data ${JSON.stringify(data)}`);
      this.getAllTrips();
    });
  }

  toggleTrips(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.relevantTrips = checkbox.checked;
    this.fishTrackerSettingsService.relevantTrips = this.relevantTrips; // Store the value in the service    
    this.getAllTrips();
  }

  navigateToTripCatch(tripId: string) {
    this.router.navigate(['/trip', tripId]);
  }
}
