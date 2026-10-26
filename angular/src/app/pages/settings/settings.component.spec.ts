import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { IndexedDbService } from '../../services/offline/indexed-db.service';
import { SyncService } from '../../services/offline/sync.service';
import { AuthenticationService } from '../../services/authentication.service';

describe('SettingsComponent', () => {
  let db: jasmine.SpyObj<IndexedDbService>;

  beforeEach(() => {
    localStorage.clear();
    db = jasmine.createSpyObj('IndexedDbService', ['getSyncQueueCount', 'currentSubjectId']);
    db.getSyncQueueCount.and.resolveTo(0);
    TestBed.configureTestingModule({
      providers: [
        { provide: IndexedDbService, useValue: db },
        { provide: SyncService, useValue: {} },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: AuthenticationService, useValue: {} },
      ],
    });
  });

  it('clear cache targets the proxy subject database when there are no tokens', async () => {
    db.currentSubjectId.and.returnValue('proxy-sub');
    const del = spyOn(indexedDB, 'deleteDatabase');
    const c = TestBed.runInInjectionContext(() => new SettingsComponent(
      TestBed.inject(IndexedDbService), TestBed.inject(SyncService),
      TestBed.inject(Router), TestBed.inject(AuthenticationService)));
    await c.clearCache();
    expect(del).toHaveBeenCalledWith('fishtracker-proxy-sub');
  });
});
