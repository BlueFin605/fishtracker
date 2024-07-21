import { Component, OnInit } from '@angular/core';
import { ApiService, TripCatch, TripDetails, NewCatch } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Add this line

@Component({
  standalone: true,
  selector: 'app-trip-catch',
  templateUrl: './trip-catch.component.html',
  styleUrls: ['./trip-catch.component.css'],
  imports: [CommonModule, FormsModule]
})
export class TripCatchComponent implements OnInit {
  tripDetails: TripDetails = {} as TripDetails;
  tripCatch: TripCatch[];
  tripId: string = '';
  newCatch: NewCatch = {
    timeZone: 'New Zealand Standard Time',
    speciesId: '2baeb56a-9f54-4e18-96ef-8bff9427b3c6'
  } as NewCatch;


  constructor(private route: ActivatedRoute, private apiService: ApiService) {
    this.tripCatch = [];
  }

  ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('tripid')!;
    console.log(`tripId: ${this.tripId}`);
    this.fetchTripDetails(this.tripId);
    this.fetchCatches(this.tripId);
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
}