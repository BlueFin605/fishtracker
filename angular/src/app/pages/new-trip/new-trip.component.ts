import { Component } from '@angular/core';
import { ApiService, NewTrip } from '../../services/api.service';
import { FormsModule } from '@angular/forms'; // Add this line
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Add this line
import { DateConversionService } from '../../services/date-conversion.service';

@Component({
  standalone: true,
  selector: 'app-new-trip',
  templateUrl: './new-trip.component.html',
  styleUrls: ['./new-trip.component.css'],
  imports: [CommonModule, FormsModule]
})
export class NewTripComponent {
  newTrip: NewTrip = {
    startTime: undefined,
    timeZone: 'Pacific/Auckland',
    notes: '',
    tags: []
  };

  startTime: Date | undefined = new Date();

  constructor(private apiService: ApiService, private router: Router, private dateFormatter: DateConversionService) {}

  ngOnInit() {
    this.startTime = new Date();
  }

  postTrip() {    
    this.newTrip.startTime = this.dateFormatter.createLocalDate(this.startTime, this.newTrip.timeZone);

    this.apiService.postTrip(this.newTrip).subscribe({
      next: (response) => {
        console.log('Trip saved successfully', response);

        // Handle success, e.g., navigate to another page or show a success message
        const tripId = response.tripId;
        this.router.navigate(['trip', tripId]);
      },
      error: (error) => {
        console.error('Error saving trip', error);
        // Handle error, e.g., show an error message
      }
    });
  }
}