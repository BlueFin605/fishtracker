import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpeciesSelector } from '../../components/species-selector-component/species-selector.component';
import { ApiService, SettingsDetails } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css'],
  imports: [CommonModule, FormsModule, SpeciesSelector]
})
export class SetupComponent implements OnInit {
  step: number = 1;
  settings: SettingsDetails = { species: [] };
  selectedSpecies: string[] = [];
  defaultSpecies: string = '';
  newSpeciesName: string = '';
  error: string = '';

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.apiService.getSettings().subscribe({
      next: (s) => this.settings = s,
      error: () => this.error = 'Failed to load species list.'
    });
  }

  addSpecies(): void {
    const name = this.newSpeciesName.trim();
    if (!name) return;

    this.error = '';
    this.apiService.addSpecies(name).subscribe({
      next: (updatedSettings) => {
        this.settings = updatedSettings;
        const titleCased = name.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        if (!this.selectedSpecies.includes(titleCased)) {
          this.selectedSpecies = [...this.selectedSpecies, titleCased];
        }
        this.newSpeciesName = '';
      },
      error: () => this.error = 'Failed to add species. Please try again.'
    });
  }

  nextStep(): void {
    if (this.selectedSpecies.length === 0) return;
    this.step = 2;
    if (this.selectedSpecies.length === 1) {
      this.defaultSpecies = this.selectedSpecies[0];
    }
  }

  selectDefault(species: string): void {
    this.defaultSpecies = species;
  }

  complete(): void {
    if (!this.defaultSpecies) return;

    this.error = '';
    this.apiService.postProfile({
      species: this.selectedSpecies,
      defaultSpecies: this.defaultSpecies
    }).subscribe({
      next: () => this.router.navigate(['/trips']),
      error: () => this.error = 'Failed to save profile. Please try again.'
    });
  }

  onSpeciesSelected(species: string[]): void {
    this.selectedSpecies = species;
    if (this.defaultSpecies && !species.includes(this.defaultSpecies)) {
      this.defaultSpecies = '';
    }
  }
}
