import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { IndexedDbService } from '../../services/offline/indexed-db.service';
import { SyncService } from '../../services/offline/sync.service';
import { AuthenticationService } from '../../services/authentication.service';
import { UpdateService } from '../../services/update.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { environment } from '../../../environments/environment';

describe('SettingsComponent', () => {
  let db: jasmine.SpyObj<IndexedDbService>;
  let updates: jasmine.SpyObj<UpdateService> & { updateReady: boolean };
  let online: boolean;

  function create(): SettingsComponent {
    return TestBed.runInInjectionContext(() => new SettingsComponent(
      TestBed.inject(IndexedDbService), TestBed.inject(SyncService),
      TestBed.inject(Router), TestBed.inject(AuthenticationService),
      TestBed.inject(UpdateService), TestBed.inject(ConnectivityService)));
  }

  beforeEach(() => {
    localStorage.clear();
    db = jasmine.createSpyObj('IndexedDbService', ['getSyncQueueCount', 'currentSubjectId']);
    db.getSyncQueueCount.and.resolveTo(0);
    updates = jasmine.createSpyObj('UpdateService', ['checkNow', 'showPrompt']) as any;
    updates.updateReady = false;
    online = true;
    TestBed.configureTestingModule({
      providers: [
        { provide: IndexedDbService, useValue: db },
        { provide: SyncService, useValue: {} },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: AuthenticationService, useValue: {} },
        { provide: UpdateService, useValue: updates },
        { provide: ConnectivityService, useValue: { isOnline: () => online } },
      ],
    });
  });

  it('clear cache targets the proxy subject database when there are no tokens', async () => {
    db.currentSubjectId.and.returnValue('proxy-sub');
    const del = spyOn(indexedDB, 'deleteDatabase');
    const c = create();
    await c.clearCache();
    expect(del).toHaveBeenCalledWith('fishtracker-proxy-sub');
  });

  it('checkForUpdates reports an update when one is found', async () => {
    let resolve!: (v: boolean) => void;
    updates.checkNow.and.returnValue(new Promise<boolean>(r => (resolve = r)));
    const c = create();
    const p = c.checkForUpdates();
    expect(c.updateStatus).toBe('Checking...');
    resolve(true);
    await p;
    expect(c.updateStatus).toBe('Update found — use the Update button in the banner');
  });

  it('checkForUpdates reports latest version when none found', async () => {
    updates.checkNow.and.resolveTo(false);
    const c = create();
    await c.checkForUpdates();
    expect(c.updateStatus).toBe('You are on the latest version');
  });

  it('says it could not check when offline', async () => {
    online = false;
    updates.checkNow.and.resolveTo(false);
    const c = create();
    await c.checkForUpdates();
    expect(c.updateStatus).toBe("Couldn't check for updates (offline?)");
  });

  it('reports a ready update and re-opens the snackbar', async () => {
    updates.updateReady = true;
    updates.checkNow.and.resolveTo(true);
    const c = create();
    await c.checkForUpdates();
    expect(c.updateStatus).toBe('Update ready — tap Update');
    expect(updates.showPrompt).toHaveBeenCalled();
  });

  it('does not re-open the snackbar when the update is merely found', async () => {
    updates.checkNow.and.resolveTo(true);
    const c = create();
    await c.checkForUpdates();
    expect(updates.showPrompt).not.toHaveBeenCalled();
  });

  it('renders the build date in the template', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('built ' + environment.buildDate);
  });
});
