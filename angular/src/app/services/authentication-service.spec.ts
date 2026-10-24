import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AuthenticationService, isRefreshRejected } from './authentication.service';
import { LocalUsersRegistry } from './local-users-registry.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let http: HttpTestingController;
  let signOutSpy: jasmine.Spy;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    service = TestBed.inject(AuthenticationService);
    http = TestBed.inject(HttpTestingController);
    signOutSpy = spyOn(service, 'signOut');
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  function refreshFailing(init: { status: number; statusText: string }, body: any) {
    localStorage.setItem('refresh_token', 'r');
    localStorage.setItem('id_token', 'i');
    localStorage.setItem('access_token', 'a');
    let errored = false;
    service.refreshToken().subscribe({ error: () => (errored = true) });
    http.expectOne(r => r.url.includes('/oauth2/token')).flush(body, init);
    expect(errored).toBeTrue();
  }

  it('does not sign out on network failure (status 0)', () => {
    refreshFailing({ status: 0, statusText: 'Unknown Error' }, new ProgressEvent('error'));
    expect(signOutSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('refresh_token')).toBe('r');
    expect(localStorage.getItem('id_token')).toBe('i');
    expect(localStorage.getItem('access_token')).toBe('a');
  });

  it('signs out on 400 invalid_grant', () => {
    refreshFailing({ status: 400, statusText: 'Bad Request' }, { error: 'invalid_grant' });
    expect(signOutSpy).toHaveBeenCalled();
  });

  it('does not sign out on 500', () => {
    refreshFailing({ status: 500, statusText: 'Server Error' }, 'boom');
    expect(signOutSpy).not.toHaveBeenCalled();
  });

  it('throws without signing out when no refresh token is stored', () => {
    let errored = false;
    service.refreshToken().subscribe({ error: () => (errored = true) });
    expect(errored).toBeTrue();
    expect(signOutSpy).not.toHaveBeenCalled();
  });

  it('records the user in the registry after a successful refresh', () => {
    const enc = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    const idToken = `${enc({ alg: 'none' })}.${enc({ sub: 'u1', name: 'Una', email: 'u@x' })}.sig`;
    localStorage.setItem('refresh_token', 'r');
    service.refreshToken().subscribe();
    http.expectOne(r => r.url.includes('/oauth2/token')).flush({ access_token: 'a2', id_token: idToken });
    expect(TestBed.inject(LocalUsersRegistry).find('u1')).toEqual({ sub: 'u1', name: 'Una', email: 'u@x' });
  });

  it('isAuthenticated returns false for a malformed id token', () => {
    localStorage.setItem('id_token', 'garbage');
    expect(service.isAuthenticated()).toBeFalse();
  });

  describe('isRefreshRejected', () => {
    it('truth table', () => {
      expect(isRefreshRejected({ status: 400, error: { error: 'invalid_grant' } })).toBeTrue();
      expect(isRefreshRejected({ status: 400, error: { error: 'invalid_request' } })).toBeFalse();
      expect(isRefreshRejected({ status: 0 })).toBeFalse();
      expect(isRefreshRejected({ status: 500, error: { error: 'invalid_grant' } })).toBeFalse();
      expect(isRefreshRejected(null)).toBeFalse();
      expect(isRefreshRejected(undefined)).toBeFalse();
      expect(isRefreshRejected('x')).toBeFalse();
    });
  });
});
