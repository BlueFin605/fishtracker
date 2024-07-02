import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import { ApiService, TripDetails } from '../../services/api.service';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trips.component.html',
  styleUrl: './trips.component.css'
})
export class TripsComponent {
  trips: TripDetails[];

  constructor(private apiService: ApiService) {
    this.trips = [];
  }

  ngOnInit() {
    this.apiService.getTrip().subscribe((data: TripDetails[]) => {
      this.trips = data;
      console.log(`trips data ${JSON.stringify(this.trips)}`)
    });
  }

}
