import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common'; // Import CommonModule
import {AuthenticationService} from '../../services/authentication.service';
import { SessionService } from '../../services/session.service';

@Component({
  standalone: true,
  selector: 'app-auth-button',
  templateUrl: './auth-button.component.html',
  styleUrls: ['./auth-button.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule] // Add CommonModule to the imports array
})
export class AuthButtonComponent {
  constructor(public auth: AuthenticationService, public session: SessionService) {}
}