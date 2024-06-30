import { Component } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-profile',
  template: `
    <ul>
      <li>{{ udets?.name }}</li>
      <li>{{ udets?.email }}</li>
    </ul>`,
  standalone: true,
  imports: [CommonModule]
})
export class UserProfileComponent {
  udets: User | null | undefined;

  constructor(public auth: AuthService) {
    this.udets = null;
    console.log('subscribe to users');
    auth.user$.subscribe(u =>  {
      console.log(`got user[${JSON.stringify(u)}]`);
      this.udets = u;
    });
  }
}