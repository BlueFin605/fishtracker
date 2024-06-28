import { Component, OnInit } from '@angular/core';
import { ApiService, TripCatch } from '../services/api.service';

@Component({
  selector: 'app-trip-catch',
  templateUrl: './trip-catch.component.html',
})
export class TripCatchComponent implements OnInit {
  tripCatch: TripCatch[];

  constructor(private apiService: ApiService) {
    this.tripCatch = [];
  }

  ngOnInit() {
    this.apiService.getTripCatch().subscribe((data: TripCatch[]) => {
      this.tripCatch = data;
    });
  }
}