import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common'; // Import CommonModule
import {AuthenticationService} from '../../services/authentication.service';

@Component({
    selector: 'app-auth-button',
    templateUrl: './auth-button.component.html',
    styleUrls: ['./auth-button.component.css'],
    imports: [CommonModule] // Add CommonModule to the imports array
})
export class AuthButtonComponent {
  constructor(public auth: AuthenticationService) {}
}