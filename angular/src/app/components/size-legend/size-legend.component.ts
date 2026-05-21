import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FishSize, FISH_SIZE_COLORS } from '../../services/share.types';

@Component({
  selector: 'app-size-legend',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './size-legend.component.html',
  styleUrls: ['./size-legend.component.css'],
})
export class SizeLegendComponent {
  items = [
    { size: FishSize.Undersize, label: 'Undersize',  color: FISH_SIZE_COLORS[FishSize.Undersize] },
    { size: FishSize.Small,     label: 'Small',      color: FISH_SIZE_COLORS[FishSize.Small] },
    { size: FishSize.Medium,    label: 'Medium',     color: FISH_SIZE_COLORS[FishSize.Medium] },
    { size: FishSize.Large,     label: 'Large',      color: FISH_SIZE_COLORS[FishSize.Large] },
    { size: FishSize.VeryLarge, label: 'Very large', color: FISH_SIZE_COLORS[FishSize.VeryLarge] },
  ];
}
