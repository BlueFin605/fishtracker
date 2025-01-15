import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthButtonComponent } from '../../components/auth-button/auth-button.component';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    imports: [AuthButtonComponent]
})
export class LoginComponent {

  constructor(private router: Router, private authService: AuthenticationService ) {
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/trips']);
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}