import { Component } from '@angular/core';
import { AuthButtonComponent } from '../auth-button/auth-button.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AuthButtonComponent, 
            RouterLink
          ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

}
