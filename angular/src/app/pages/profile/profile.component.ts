import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpeciesSelector } from '../../components/species-selector-component/species-selector.component';
import { ApiService, ProfileDetails, SettingsDetails } from '../../services/api.service';
import { FishTrackerSettingsService } from '../../services/fish-tracker-settings.service';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  standalone: true,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [CommonModule, FormsModule, SpeciesSelector]
})
export class ProfileComponent implements OnInit {
  profileDetails: ProfileDetails = {
    species: [],
    defaultSpecies: ''
  };

  settings: SettingsDetails = {
    species: []
  }

  newSpeciesName: string = '';
  addSpeciesError: string = '';
  saveSuccess: boolean = false;
  saveError: boolean = false;
  buildVersion: string = environment.buildVersion;

  constructor(private apiService: ApiService, private router: Router, private settingsService: FishTrackerSettingsService, public authService: AuthenticationService) {}

  ngOnInit(): void {
    this.loadSettings();
    this.loadProfileDetails();
  }

  loadProfileDetails(): void {
    this.apiService.getProfile().subscribe((details: ProfileDetails) => {
      this.profileDetails = details;
    });
  }

  loadSettings(): void {
    this.apiService.getSettings().subscribe(s => this.settings = s);
  }

  saveProfileDetails(): void {
    this.saveSuccess = false;
    this.saveError = false;
    this.apiService.postProfile(this.profileDetails).subscribe({
      next: (response) => {
        this.saveSuccess = true;
        console.log('Profile updated successfully', response);
      },
      error: (error) => {
        this.saveError = true;
        console.error('Error updating profile', error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/trips']);
  }

  addSpecies(): void {
    const name = this.newSpeciesName.trim();
    if (!name) return;

    this.addSpeciesError = '';
    this.apiService.addSpecies(name).subscribe({
      next: (updatedSettings) => {
        this.settings = updatedSettings;
        this.settingsService.updateSettingsCache(updatedSettings);
        const titleCased = name.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        if (!this.profileDetails.species.includes(titleCased)) {
          this.profileDetails.species = [...this.profileDetails.species, titleCased];
        }
        this.newSpeciesName = '';
      },
      error: (error) => {
        this.addSpeciesError = 'Failed to add species. Please try again.';
        console.error('Error adding species', error);
      }
    });
  }

  onSpeciesSelected(species: string[]) {
    this.profileDetails.species = species;
  }
}