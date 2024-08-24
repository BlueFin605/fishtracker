import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Add this line

@Component({
  standalone: true,
  selector: 'app-species-selector',
  templateUrl: './species-selector.component.html',
  styleUrls: ['./species-selector.component.css'],
  imports: [CommonModule],
})
export class SpeciesSelector implements OnInit, OnChanges {
  @Input() speciesList: string[] = [];
  @Output() speciesSelected = new EventEmitter<string[]>();
  selectedSpecies: string[] = [];

  ngOnInit() {
    // Initialize selectedSpecies with all species by default
    this.selectedSpecies = [...this.speciesList];
    this.speciesSelected.emit(this.selectedSpecies);
    console.log(...this.selectedSpecies);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['speciesList']) {
      console.log(`speciesList changed: ${changes['speciesList'].currentValue}`);
      // Update selectedSpecies when speciesList changes
      this.selectedSpecies = [...this.speciesList];
      this.speciesSelected.emit(this.selectedSpecies);
      console.log(...this.selectedSpecies);
    }
  }
  
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