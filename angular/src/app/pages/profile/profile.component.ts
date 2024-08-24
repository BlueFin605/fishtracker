import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { SpeciesSelector } from '../../components/species-selector-component/species-selector.component';
import { ApiService, ProfileDetails, SettingsDetails } from '../../services/api.service';

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
    // Initialize other fields if necessary
  };

  settings: SettingsDetails = {
    species: []
  }

  constructor(private apiService: ApiService) {}

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
    this.apiService.postProfile(this.profileDetails).subscribe({
      next: (response) => {
        console.log('Profile updated successfully', response);
      },
      error: (error) => {
        console.error('Error updating profile', error);
      }
    });
  }

  onSpeciesSelected(species: string[]) {
    this.profileDetails.species = species;
    console.log(this.profileDetails.species);
  }
}