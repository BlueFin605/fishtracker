import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { IndexedDbService } from '../../services/offline/indexed-db.service';
import { SyncService } from '../../services/offline/sync.service';
import { AuthenticationService } from '../../services/authentication.service';
import { UpdateService } from '../../services/update.service';

describe('SettingsComponent', () => {
  let db: jasmine.SpyObj<IndexedDbService>;
  let updates: jasmine.SpyObj<UpdateService>;

  function create(): SettingsComponent {
    return TestBed.runInInjectionContext(() => new SettingsComponent(
      TestBed.inject(IndexedDbService), TestBed.inject(SyncService),
      TestBed.inject(Router), TestBed.inject(AuthenticationService),
      TestBed.inject(UpdateService)));
  }

  beforeEach(() => {
    localStorage.clear();
    db = jasmine.createSpyObj('IndexedDbService', ['getSyncQueueCount', 'currentSubjectId']);
    db.getSyncQueueCount.and.resolveTo(0);
    updates = jasmine.createSpyObj('UpdateService', ['checkNow']);
    TestBed.configureTestingModule({
      providers: [
        { provide: IndexedDbService, useValue: db },
        { provide: SyncService, useValue: {} },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: AuthenticationService, useValue: {} },
        { provide: UpdateService, useValue: updates },
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

  it('exposes the build date', () => {
    expect(create().buildDate).toBeDefined();
  });
});
