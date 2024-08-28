import { Component, Inject } from '@angular/core';
import { AuthButtonComponent } from '../auth-button/auth-button.component';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule,
    AuthButtonComponent,
    RouterLink,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  // userProfile: any = {};

  constructor(private router: Router, public authService: AuthenticationService) { }

  ngOnInit() {
    // if (this.authService.isAuthenticated()) {
    //   this.authService.getUserAttributes().then(attributes => {
    //     this.userProfile = attributes;
    //   }).catch(error => {
    //     console.error('Error fetching user attributes', error);
    //   });
    // }  
  }


  onPreferences() {
    // Navigate to preferences page or open preferences dialog
    this.router.navigate(['/profile']);    
    // this.router.navigate(['/preferences']);
  }

  onLogout() {
    // Handle logout logic
    console.log('Logout clicked');
  }

}
