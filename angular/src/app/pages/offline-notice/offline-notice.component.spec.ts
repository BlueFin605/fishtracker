import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { OfflineNoticeComponent } from './offline-notice.component';

describe('OfflineNoticeComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'offline', component: OfflineNoticeComponent }])]
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
});
