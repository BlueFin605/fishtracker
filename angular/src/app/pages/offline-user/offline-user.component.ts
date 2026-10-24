import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KnownUser, LocalUsersRegistry } from '../../services/local-users-registry.service';
import { SessionService } from '../../services/session.service';

@Component({
  standalone: true,
  selector: 'app-offline-user',
  template: `
    @if (users.length > 1) {
      <div class="offline-user">
        <h2>Who's fishing?</h2>
        @for (u of users; track u.sub) {
          <button type="button" class="user-choice" (click)="choose(u)">
            <span class="user-name">{{ u.name }}</span>
            <span class="user-email">{{ u.email }}</span>
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .offline-user { padding: 2rem; text-align: center; }
    .user-choice { display: block; width: 100%; max-width: 20rem; margin: 0.5rem auto; padding: 0.75rem; }
    .user-name { display: block; font-weight: bold; }
    .user-email { display: block; font-size: 0.85em; opacity: 0.7; }
  `]
})
export class OfflineUserComponent implements OnInit {
  private registry = inject(LocalUsersRegistry);
  private session = inject(SessionService);
  private router = inject(Router);

  users: KnownUser[] = [];

  ngOnInit(): void {
    this.users = this.registry.list();
    if (this.users.length === 0) {
      this.router.navigate(['/login']);
    } else if (this.users.length === 1) {
      this.choose(this.users[0]);
    }
  }

  choose(user: KnownUser): void {
    this.session.enterProxy(user.sub);
    this.router.navigate(['/trips']);
  }
}
