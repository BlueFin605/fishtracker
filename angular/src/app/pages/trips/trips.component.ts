import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import { ApiService, TripDetails } from '../../services/api.service';
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

  constructor(private router: Router, private apiService: ApiService) {
    this.trips = [];
  }

  ngOnInit() {
    this.apiService.getAllTrips().subscribe((data: TripDetails[]) => {
      this.trips = data;
      console.log(`trips data ${JSON.stringify(this.trips)}`)
    });
  }

  navigateToTripCatch(tripId: string) {
    this.router.navigate(['/trip', tripId]);
  }  
}
