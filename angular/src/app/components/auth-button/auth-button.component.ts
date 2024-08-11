import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common'; // Import CommonModule
import {AuthenticationService} from '../../services/authentication.service';

@Component({
  selector: 'app-auth-button',
  template: `
    <ng-container *ngIf="auth.isAuthenticated() | async; else loggedOut">
      <button mat-menu-item (click)="auth.logout()">
        Log out
      </button>
    </ng-container>

    <ng-template #loggedOut>
      <button mat-menu-item (click)="auth.login()">Log in</button>
    </ng-template>
  `,
  standalone: true,
  imports: [CommonModule] // Add CommonModule to the imports array
})
export class AuthButtonComponent {
  constructor(public auth: AuthenticationService) {}
}