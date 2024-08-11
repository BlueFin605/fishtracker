import { Component, Inject } from '@angular/core';
import { AuthButtonComponent } from '../auth-button/auth-button.component';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@auth0/auth0-angular';
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
  userProfile: any;

  constructor(private router: Router, public authService: AuthenticationService) { }

  ngOnInit() {
    this.authService.fetchUserProfile().subscribe(profile => {
      this.userProfile = profile;
      console.log('User profile:', profile);
      this.authService.setUserProfile(profile);
    });
  }


  onPreferences() {
    // Navigate to preferences page or open preferences dialog
    this.router.navigate(['/preferences']);
  }

  onLogout() {
    // Handle logout logic
    console.log('Logout clicked');
  }

}
