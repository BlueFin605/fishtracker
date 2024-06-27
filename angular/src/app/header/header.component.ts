import { Component } from '@angular/core';
import { AuthButtonComponent } from '../auth-button/auth-button.component';
import { UserProfileComponent } from '../user-profile/user-profile.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AuthButtonComponent, UserProfileComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

}
