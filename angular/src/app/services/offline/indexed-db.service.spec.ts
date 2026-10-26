import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { IndexedDbService } from './indexed-db.service';

function makeJwt(payload: object): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
}

describe('IndexedDbService subject resolution', () => {
  let service: IndexedDbService;

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(IndexedDbService);
  });

  afterEach(() => {
    localStorage.clear();
    (environment as any).bypassAuth = false;
  });

  it('is anonymous with no token and no proxy', () => {
    expect(service.currentSubjectId()).toBe('anonymous');
  });

  it('uses the proxy subject when there is no id token', () => {
    service.setProxySubject('abc');
    expect(service.currentSubjectId()).toBe('abc');
    service.setProxySubject(null);
    expect(service.currentSubjectId()).toBe('anonymous');
  });

  it('prefers the id token sub over the proxy subject', () => {
    localStorage.setItem('id_token', makeJwt({ sub: 'tok' }));
    service.setProxySubject('abc');
    expect(service.currentSubjectId()).toBe('tok');
  });

  it('falls back to the proxy subject for an undecodable token', () => {
    localStorage.setItem('id_token', 'garbage');
    service.setProxySubject('abc');
    expect(service.currentSubjectId()).toBe('abc');
  });

  it('bypassAuth wins', () => {
    (environment as any).bypassAuth = true;
    service.setProxySubject('abc');
    expect(service.currentSubjectId()).toBe('user123');
  });
});

describe('IndexedDbService getSyncQueueCountFor', () => {
  let service: IndexedDbService;

  const created: string[] = [];

  async function dbNames(): Promise<string[]> {
    return ((await indexedDB.databases()) ?? []).map(d => d.name ?? '');
  }

  const uniq = (p: string) => {
    const n = `${p}-${Math.random().toString(36).slice(2)}`;
    created.push(`fishtracker-${n}`);
    return n;
  };

  beforeEach(() => {
    service = TestBed.inject(IndexedDbService);
  });

  afterEach(() => {
    for (const n of created.splice(0)) indexedDB.deleteDatabase(n);
  });

  it('returns the queue size of the other user DB and closes it', async () => {
    const fake = { count: jasmine.createSpy('count').and.resolveTo(3), close: jasmine.createSpy('close') };
    spyOn(indexedDB, 'databases').and.resolveTo([{ name: 'fishtracker-other' }]);
    spyOn<any>(service, 'openExistingDatabase').and.resolveTo(fake);
    expect(await service.getSyncQueueCountFor('other')).toBe(3);
    expect(fake.count).toHaveBeenCalledWith('syncQueue');
    expect(fake.close).toHaveBeenCalled();
  });

  it('returns 0 when the DB cannot be opened', async () => {
    spyOn<any>(service, 'openExistingDatabase').and.rejectWith(new Error('missing'));
    expect(await service.getSyncQueueCountFor('nobody')).toBe(0);
  });

  it('returns 0 when counting fails', async () => {
    const fake = { count: jasmine.createSpy('count').and.rejectWith(new Error('x')), close: jasmine.createSpy('close') };
    spyOn(indexedDB, 'databases').and.resolveTo([{ name: 'fishtracker-other' }]);
    spyOn<any>(service, 'openExistingDatabase').and.resolveTo(fake);
    expect(await service.getSyncQueueCountFor('other')).toBe(0);
  });

  it('does not create a database for an unseen sub', async () => {
    const sub = uniq('unseen');
    expect(await service.getSyncQueueCountFor(sub)).toBe(0);
    expect(await dbNames()).not.toContain(`fishtracker-${sub}`);
  });

  it('does not create a database when indexedDB.databases() is unavailable', async () => {
    const sub = uniq('nodbs');
    const original = Object.getOwnPropertyDescriptor(IDBFactory.prototype, 'databases')!;
    Object.defineProperty(IDBFactory.prototype, 'databases', { value: undefined, configurable: true });
    try {
      expect(await service.getSyncQueueCountFor(sub)).toBe(0);
    } finally {
      Object.defineProperty(IDBFactory.prototype, 'databases', original);
    }
    expect(await dbNames()).not.toContain(`fishtracker-${sub}`);
  });

  it('counts an existing database', async () => {
    const sub = uniq('seen');
    const db = await (service as any).openDatabase(`fishtracker-${sub}`);
    await db.add('syncQueue', { operation: 'createTrip', entityId: 't', status: 'queued', retryCount: 0, createdAt: 1 });
    db.close();
    expect(await service.getSyncQueueCountFor(sub)).toBe(1);
  });
});
