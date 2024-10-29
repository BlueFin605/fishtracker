import { Component, OnInit } from '@angular/core';
import { ApiService, NewTrip } from '../../services/api.service';
import { FormsModule } from '@angular/forms'; // Add this line
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Add this line
import { DateConversionService } from '../../services/date-conversion.service';
// import * as moment from 'moment-timezone';
import { PreferencesService } from '../../services/preferences.service';
import { FishTrackerSettingsService } from '../../services/fish-tracker-settings.service';
import { SpeciesSelector} from '../../components/species-selector-component/species-selector.component';

@Component({
  standalone: true,
  selector: 'app-new-trip',
  templateUrl: './new-trip.component.html',
  styleUrls: ['./new-trip.component.css'],
  imports: [CommonModule, FormsModule, SpeciesSelector]
})
export class NewTripComponent implements OnInit {
  newTrip: NewTrip = {
    startTime: undefined,
    timeZone: 'UTC',
    notes: '',
    tags: [],
    species: [],
    defaultSpecies: ''
  };

  startTime: Date | undefined = new Date();
  speciesList: string[] = [];

  constructor(private apiService: ApiService, 
              private router: Router, 
              private dateFormatter: DateConversionService,
              private preferencesService: PreferencesService,
              private settingsService: FishTrackerSettingsService) {}

  ngOnInit() {
    console.log(`ngOnInit`);
    this.startTime = new Date();
    this.newTrip.timeZone = this.preferencesService.getTimeZone();   
    this.settingsService.profile.subscribe(s => { 
                                                 this.speciesList = s.species;
                                                 this.newTrip.species = s.species;
                                                 this.newTrip.defaultSpecies = s.defaultSpecies;});
  }

  onSpeciesSelected(species: string[]) {
    this.newTrip.species = species;
    console.log(this.newTrip.species);
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

  onCancel() {
    this.router.navigate(['/trips']);
  }  
}