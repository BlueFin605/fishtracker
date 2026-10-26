import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IndexedDbService } from '../../services/offline/indexed-db.service';
import { SyncService } from '../../services/offline/sync.service';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from '../../services/authentication.service';
import { UpdateService } from '../../services/update.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule],
})
export class SettingsComponent {
  pendingCount = 0;
  cacheCleared = false;
  buildVersion = environment.buildVersion;
  buildDate = environment.buildDate;
  updateStatus = '';

  constructor(
    private db: IndexedDbService,
    private syncService: SyncService,
    private router: Router,
    public authService: AuthenticationService,
    private updates: UpdateService,
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

  async checkForUpdates(): Promise<void> {
    this.updateStatus = 'Checking...';
    const found = await this.updates.checkNow();
    this.updateStatus = found
      ? 'Update found — use the Update button in the banner'
      : 'You are on the latest version';
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
    return this.db.currentSubjectId();
  }
}
