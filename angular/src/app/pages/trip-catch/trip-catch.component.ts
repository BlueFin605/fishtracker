import { Component, OnInit } from '@angular/core';
import { ApiService, TripCatch } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-trip-catch',
  templateUrl: './trip-catch.component.html',
  styleUrls: ['./trip-catch.component.css'],
  imports: [CommonModule]
})
export class TripCatchComponent implements OnInit {
  tripCatch: TripCatch[];

  constructor(private apiService: ApiService) {
    this.tripCatch = [];
  }

  ngOnInit() {
    this.apiService.getTripCatch().subscribe((data: TripCatch[]) => {
      this.tripCatch = data;
      console.log(`catch data ${JSON.stringify(this.tripCatch)}`)
    });
  }
}