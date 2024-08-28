import { Component } from '@angular/core';
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
  // udets: User | null | undefined;
    udets: any = {name:'name', email: 'email'};

  // constructor(public auth: AuthService) {
  //   this.udets = null;
  //   console.log('subscribe to users');
  //   auth.user$.subscribe(u =>  {
  //     console.log(`got user[${JSON.stringify(u)}]`);
  //     this.udets = u;
  //   });
  // }
}