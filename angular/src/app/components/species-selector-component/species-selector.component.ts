import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Add this line

@Component({
  standalone: true,
  selector: 'app-species-selector',
  templateUrl: './species-selector.component.html',
  styleUrls: ['./species-selector.component.css'],
  imports: [CommonModule, FormsModule],
})
export class SpeciesSelector {
  @Input() speciesList: string[] = [];
  @Output() speciesSelected = new EventEmitter<string[]>();
  selectedSpecies: string[] = [];

  // selectedSpecies: string[] = [];
  
  onSpeciesChange(species: string, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement.checked;

    if (isChecked) {
      this.selectedSpecies.push(species);
    } else {
      const index = this.selectedSpecies.indexOf(species);
      if (index > -1) {
        this.selectedSpecies.splice(index, 1);
      }
    }
    this.speciesSelected.emit(this.selectedSpecies);
  }
}