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
