import { Component } from '@angular/core';
import { AuthButtonComponent } from '../auth-button/auth-button.component';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { TokenDisplayComponent } from '../token-display/token-display.component'; 

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AuthButtonComponent, 
            UserProfileComponent,
            TokenDisplayComponent
          ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

}
