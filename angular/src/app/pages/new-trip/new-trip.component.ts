import { Component, OnInit } from '@angular/core';
import { ApiService, NewTrip, TripDetails, ProfileDetails } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DateConversionService } from '../../services/date-conversion.service';
import { PreferencesService } from '../../services/preferences.service';
import { FishTrackerSettingsService } from '../../services/fish-tracker-settings.service';
import { OfflineDataService } from '../../services/offline/offline-data.service';
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
  profileUnavailable = false;

  constructor(private apiService: ApiService,
              private offlineData: OfflineDataService,
              private router: Router,
              private dateFormatter: DateConversionService,
              private preferencesService: PreferencesService,
              private settingsService: FishTrackerSettingsService) {}

  ngOnInit() {
    this.startTime = new Date();
    this.newTrip.timeZone = this.preferencesService.getTimeZone();

    // Load profile as fallback, then try to auto-populate from trip history
    this.settingsService.profile.subscribe((profile: ProfileDetails) => {
      if (!profile || !profile.species || profile.species.length === 0) {
        // No profile available (first-time user offline)
        this.profileUnavailable = true;
        return;
      }

      this.speciesList = profile.species;

      // Try to derive species from locally cached trips
      this.offlineData.getTrips().subscribe({
        next: (trips: TripDetails[]) => {
          if (trips.length > 0) {
            this.applySpeciesFromTrips(trips.slice(-5));
          } else {
            this.applyProfileFallback(profile);
          }
        },
        error: () => this.applyProfileFallback(profile)
      });
    });
  }

  private applySpeciesFromTrips(trips: TripDetails[]): void {
    const frequent = this.getFrequentSpecies(trips);
    if (frequent.length > 0) {
      this.newTrip.species = frequent;
      this.newTrip.defaultSpecies = frequent[0];
    }
  }

  private applyProfileFallback(profile: ProfileDetails): void {
    this.newTrip.species = profile.species;
    this.newTrip.defaultSpecies = profile.defaultSpecies;
  }

  private getFrequentSpecies(trips: TripDetails[]): string[] {
    const counts = new Map<string, number>();
    for (const trip of trips) {
      if (trip.species) {
        for (const species of trip.species) {
          counts.set(species, (counts.get(species) || 0) + 1);
        }
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([species]) => species);
  }

  onSpeciesSelected(species: string[]) {
    this.newTrip.species = species;
    console.log(this.newTrip.species);
  }

  postTrip() {
    this.newTrip.startTime = this.dateFormatter.createLocalDate(this.startTime, this.newTrip.timeZone);

    this.offlineData.createTrip(this.newTrip).subscribe({
      next: (response) => {
        console.log('Trip saved successfully', response);
        const tripId = response.tripId;
        this.router.navigate(['trip', tripId]);
      },
      error: (error) => {
        console.error('Error saving trip', error);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/trips']);
  }  
}