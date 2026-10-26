import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject, Subject } from 'rxjs';

import { OfflineNoticeComponent } from './offline-notice.component';
import { ConnectivityService } from '../../services/connectivity.service';

describe('OfflineNoticeComponent', () => {
  let online$: Subject<boolean>;
  let currentlyOnline: boolean;

  beforeEach(() => {
    online$ = new Subject<boolean>();
    currentlyOnline = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'offline', component: OfflineNoticeComponent }]),
        { provide: ConnectivityService, useValue: { online$: online$.asObservable(), isOnline: () => currentlyOnline } }
      ]
    });
  });

  async function textFor(url: string): Promise<string> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return (harness.routeNativeElement as HTMLElement).textContent ?? '';
  }

  it('shows the setup message', async () => {
    expect(await textFor('/offline?reason=setup'))
      .toContain('Connect to the internet once to finish setting up your account.');
  });

  it('shows the needs-connection message', async () => {
    expect(await textFor('/offline?reason=needs-connection'))
      .toContain('This page needs an internet connection.');
  });

  it('defaults to needs-connection', async () => {
    expect(await textFor('/offline')).toContain('This page needs an internet connection.');
  });

  it('has a back link to /trips', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/offline');
    const a = (harness.routeNativeElement as HTMLElement).querySelector('a');
    expect(a?.getAttribute('href')).toBe('/trips');
  });

  it('shows the auto-continue line for setup', async () => {
    expect(await textFor('/offline?reason=setup')).toContain("We'll continue automatically when you're back online.");
  });

  it('when already online, hides the auto-continue line and offers Try again to /trips', async () => {
    currentlyOnline = true;
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/offline?reason=setup');
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.textContent).not.toContain('continue automatically');
    const retry = Array.from(el.querySelectorAll('a')).find(a => a.textContent?.includes('Try again'));
    expect(retry?.getAttribute('href')).toBe('/trips');
  });

  it('hides the auto-continue line for needs-connection', async () => {
    expect(await textFor('/offline?reason=needs-connection')).not.toContain('continue automatically');
  });

  it('navigates to /trips once when connectivity returns (setup)', async () => {
    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    await harness.navigateByUrl('/offline?reason=setup');
    const nav = spyOn(router, 'navigate').and.resolveTo(true);
    online$.next(false);
    online$.next(true);
    online$.next(false);
    online$.next(true);
    expect(nav).toHaveBeenCalledOnceWith(['/trips']);
  });

  it('does not navigate when already online on load or on repeated true (setup)', async () => {
    const replay$ = new BehaviorSubject<boolean>(true);
    TestBed.overrideProvider(ConnectivityService, { useValue: { online$: replay$.asObservable(), isOnline: () => true } });
    const router = TestBed.inject(Router);
    const nav = spyOn(router, 'navigate').and.resolveTo(true);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/offline?reason=setup');
    expect(nav).not.toHaveBeenCalled();
    replay$.next(true);
    expect(nav).not.toHaveBeenCalled();
    replay$.next(false);
    replay$.next(true);
    expect(nav).toHaveBeenCalledOnceWith(['/trips']);
  });

  it('does not navigate for needs-connection', async () => {
    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    await harness.navigateByUrl('/offline?reason=needs-connection');
    const nav = spyOn(router, 'navigate').and.resolveTo(true);
    online$.next(true);
    expect(nav).not.toHaveBeenCalled();
  });

  it('unsubscribes on destroy', async () => {
    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    await harness.navigateByUrl('/offline?reason=setup');
    const nav = spyOn(router, 'navigate').and.resolveTo(true);
    expect(online$.observed).toBeTrue();
    harness.fixture.destroy();
    expect(online$.observed).toBeFalse();
    online$.next(true);
    expect(nav).not.toHaveBeenCalled();
  });
});
