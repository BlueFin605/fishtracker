import { TestBed } from '@angular/core/testing';
import { LocalUsersRegistry } from './local-users-registry.service';

function buildJwt(payload: object): string {
  const enc = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${enc({ alg: 'none' })}.${enc(payload)}.sig`;
}

describe('LocalUsersRegistry', () => {
  let registry: LocalUsersRegistry;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    registry = TestBed.inject(LocalUsersRegistry);
  });

  afterEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(registry.list()).toEqual([]);
  });

  it('upsert adds then updates the same sub', () => {
    registry.upsert({ sub: 'a', name: 'A', email: 'a@x' });
    registry.upsert({ sub: 'b', name: 'B', email: 'b@x' });
    registry.upsert({ sub: 'a', name: 'A2', email: 'a2@x' });
    expect(registry.list()).toEqual([
      { sub: 'a', name: 'A2', email: 'a2@x' },
      { sub: 'b', name: 'B', email: 'b@x' }
    ]);
    expect(registry.find('b')?.name).toBe('B');
    expect(registry.find('zzz')).toBeUndefined();
  });

  it('list survives corrupt JSON', () => {
    localStorage.setItem('known_users', '{not json');
    expect(registry.list()).toEqual([]);
    localStorage.setItem('known_users', '"a string"');
    expect(registry.list()).toEqual([]);
  });

  it('recordFromIdToken stores sub/name/email', () => {
    registry.recordFromIdToken(buildJwt({ sub: 's1', name: 'Dean', email: 'd@x' }));
    expect(registry.list()).toEqual([{ sub: 's1', name: 'Dean', email: 'd@x' }]);
  });

  it('recordFromIdToken falls back to email for name', () => {
    registry.recordFromIdToken(buildJwt({ sub: 's2', email: 'e@x' }));
    expect(registry.find('s2')).toEqual({ sub: 's2', name: 'e@x', email: 'e@x' });
  });

  it('recordFromIdToken ignores undecodable tokens', () => {
    registry.recordFromIdToken('garbage');
    expect(registry.list()).toEqual([]);
  });
});
