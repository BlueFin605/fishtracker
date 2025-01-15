import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-species-selector',
    templateUrl: './species-selector.component.html',
    styleUrls: ['./species-selector.component.css'],
    imports: [CommonModule, FormsModule]
})
export class SpeciesSelector {
  private _selectedSpecies: string[] = [];

  @Input() speciesList: string[] = [];
  
  @Input()
  get selectedSpecies(): string[] {
    return this._selectedSpecies;
  }
  set selectedSpecies(value: string[]) {
    this._selectedSpecies = value;
    this.selectedSpeciesChange.emit(this._selectedSpecies);
  }

  @Output() selectedSpeciesChange = new EventEmitter<string[]>();

  onSpeciesSelected(event: Event, species: string) {
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement.checked;
    if (isChecked) {
      this.selectedSpecies = [...this.selectedSpecies, species];
    } else {
      this.selectedSpecies = this.selectedSpecies.filter(s => s !== species);
    }
  }
}