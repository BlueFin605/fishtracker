import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthenticationService } from '../../services/authentication.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { SessionService } from '../../services/session.service';
import { IndexedDbService } from '../../services/offline/indexed-db.service';
import { LocalUsersRegistry } from '../../services/local-users-registry.service';

@Component({
  standalone: true,
  selector: 'app-offline-banner',
  template: `
    @if (session.isProxy) {
      <div class="offline-banner">
        <span>Offline as {{ session.displayName }} — sign in to sync</span>
        <button type="button"
                [disabled]="!connectivity.isOnline()"
                [title]="connectivity.isOnline() ? '' : 'Needs a connection'"
                (click)="authService.signIn()">Sign in</button>
      </div>
    } @else if (otherUserName() !== null) {
      <div class="offline-banner">
        <span>{{ otherUserName() }} has unsynced offline changes — sign in as them to sync</span>
      </div>
    }
  `,
  styles: [`
    .offline-banner { display: flex; gap: 1rem; align-items: center; justify-content: center;
      padding: 0.5rem 1rem; background: #fff3cd; color: #664d03; }
  `]
})
export class OfflineBannerComponent implements OnInit {
  session = inject(SessionService);
  authService = inject(AuthenticationService);
  connectivity = inject(ConnectivityService);
  private db = inject(IndexedDbService);
  private registry = inject(LocalUsersRegistry);
  private destroyRef = inject(DestroyRef);

  /** Name of another user with unsynced offline work, or null. */
  otherUserName = signal<string | null>(null);

  ngOnInit(): void {
    void this.refreshOtherUser();
    this.session.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => void this.refreshOtherUser());
  }

  private refreshSeq = 0;

  private async refreshOtherUser(): Promise<void> {
    const seq = ++this.refreshSeq;
    if (this.session.isProxy) {
      this.otherUserName.set(null);
      return;
    }
    const current = this.db.currentSubjectId();
    let name: string | null = null;
    for (const user of this.registry.list()) {
      if (user.sub === current) continue;
      const count = await this.db.getSyncQueueCountFor(user.sub);
      if (count > 0) {
        name = user.name || 'Another user';
        break;
      }
    }
    if (seq !== this.refreshSeq) return;
    this.otherUserName.set(name);
  }
}
