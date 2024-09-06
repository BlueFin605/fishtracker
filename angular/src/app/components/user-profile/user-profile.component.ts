import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationService, UserProfile } from '../../services/authentication.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  // udets: User | null | undefined;
    udets: UserProfile = {name:'name', email: 'email'};

    constructor(private authenticationService: AuthenticationService) {}

    ngOnInit(): void {
      this.authenticationService.getUserInfo().subscribe(
        data => {
          this.udets = data;
        },
        error => {
          console.error('Error fetching profile:', error);
        }
      );
    }    
  // constructor(public auth: AuthService) {
  //   this.udets = null;
  //   console.log('subscribe to users');
  //   auth.user$.subscribe(u =>  {
  //     console.log(`got user[${JSON.stringify(u)}]`);
  //     this.udets = u;
  //   });
  // }
}