import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthButtonComponent } from '../../components/auth-button/auth-button.component';
import { SessionService } from '../../services/session.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [AuthButtonComponent]
})
export class LoginComponent {

  constructor(private router: Router, private session: SessionService ) {
  }

  ngOnInit() {
    if (this.session.signedIn) {
      this.router.navigate(['/trips']);
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}