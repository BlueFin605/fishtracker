import { Component } from '@angular/core';
import { UserProfileComponent } from '../../components/user-profile/user-profile.component';
import { TokenDisplayComponent } from '../../components/token-display/token-display.component'; 

@Component({
  selector: 'app-debug-display',
  standalone: true,
  imports: [UserProfileComponent,
            TokenDisplayComponent],
  templateUrl: './debug-display.component.html',
  styleUrl: './debug-display.component.css'
})
export class DebugDisplayComponent {

}
