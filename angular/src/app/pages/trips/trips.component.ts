import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import { ApiService, TripDetails, CatchDetails } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trips.component.html',
  styleUrl: './trips.component.css'
})
export class TripsComponent {
  trips: TripDetails[];
  relevantTrips: boolean = true;

  constructor(private router: Router, private apiService: ApiService) {
    this.trips = [];
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

  deleteTrip(tripId: string, event: Event): void {
    event.stopPropagation();
    this.apiService.deleteTrip(tripId).subscribe((data: CatchDetails[]) => {
      console.log(`removed catch data ${JSON.stringify(data)}`);
      this.getAllTrips();
    });
  }

  toggleTrips(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.relevantTrips = checkbox.checked;
    this.getAllTrips();
  }

  navigateToTripCatch(tripId: string) {
    this.router.navigate(['/trip', tripId]);
  }
}
