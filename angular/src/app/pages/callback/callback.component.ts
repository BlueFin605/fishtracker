// src/app/auth-callback/auth-callback.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  standalone: true,
  selector: 'app-callback',
  templateUrl: './callback.component.html'
})
export class CallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.authService.handleAuthCallback(code).subscribe(
          () => {
            this.router.navigate(['/']); // Redirect to home or another page after successful authentication
          },
          error => {
            console.error('Authentication error', error);
            // Handle error (e.g., show an error message)
          }
        );
      } else {
        // Handle missing code (e.g., show an error message)
      }
    });
  }
}