import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IndexedDbService } from '../../services/offline/indexed-db.service';
import { SyncService } from '../../services/offline/sync.service';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  imports: [CommonModule],
})
export class SettingsComponent {
  pendingCount = 0;
  cacheCleared = false;
  buildVersion = environment.buildVersion;

  constructor(
    private db: IndexedDbService,
    private syncService: SyncService,
    private router: Router,
    public authService: AuthenticationService,
  ) {
    this.loadPendingCount();
  }

  async loadPendingCount(): Promise<void> {
    try {
      this.pendingCount = await this.db.getSyncQueueCount();
    } catch {
      this.pendingCount = 0;
    }
  }

  async clearCache(): Promise<void> {
    if (this.pendingCount > 0) {
      const confirmed = confirm(
        `You have ${this.pendingCount} unsynced item(s). Clearing the cache will lose this data. Continue?`
      );
      if (!confirmed) return;
    }

    try {
      // Delete the user's IndexedDB database
      const dbName = `fishtracker-${this.getSubject()}`;
      // Close the current connection first
      indexedDB.deleteDatabase(dbName);
      this.cacheCleared = true;
      this.pendingCount = 0;
    } catch (e) {
      console.error('Failed to clear cache', e);
    }
  }

  goBack(): void {
    if (this.cacheCleared) {
      // Force a full reload to reinitialize services
      window.location.href = '/trips';
    } else {
      this.router.navigate(['/trips']);
    }
  }

  private getSubject(): string {
    if (environment.bypassAuth) {
      return 'user123';
    }
    try {
      const idToken = localStorage.getItem('id_token');
      if (!idToken) return 'anonymous';
      const decoded: { sub: string } = JSON.parse(atob(idToken.split('.')[1]));
      return decoded.sub;
    } catch {
      return 'anonymous';
    }
  }
}
