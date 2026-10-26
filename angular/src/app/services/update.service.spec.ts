import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate } from '@angular/service-worker';
import { of, Subject } from 'rxjs';
import { RELOAD_PAGE, UpdateService } from './update.service';

describe('UpdateService', () => {
  let versionUpdates: Subject<any>;
  let sw: any;
  let snackBar: { open: jasmine.Spy };
  let reload: jasmine.Spy;
  let visibilityHandlers: Array<() => void>;

  function setup(isEnabled = true): UpdateService {
    versionUpdates = new Subject<any>();
    sw = {
      isEnabled,
      versionUpdates,
      checkForUpdate: jasmine.createSpy('checkForUpdate').and.resolveTo(false),
      activateUpdate: jasmine.createSpy('activateUpdate').and.resolveTo(true),
    };
    snackBar = { open: jasmine.createSpy('open').and.returnValue({ onAction: () => of(void 0) }) };
    reload = jasmine.createSpy('reload');
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: sw },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: RELOAD_PAGE, useValue: reload },
      ],
    });
    return TestBed.inject(UpdateService);
  }

  beforeEach(() => {
    // Capture document listeners / intervals instead of registering them for real,
    // so nothing leaks into other specs.
    visibilityHandlers = [];
    const realAdd = document.addEventListener.bind(document);
    spyOn(document, 'addEventListener').and.callFake(((type: string, handler: any, opts?: any) => {
      if (type === 'visibilitychange') visibilityHandlers.push(handler);
      else realAdd(type, handler, opts);
    }) as any);
    spyOn(window, 'setInterval').and.returnValue(0 as any);
  });

  it('(a) opens one persistent snackbar when VERSION_READY is emitted', () => {
    // action never fires here: use a never-resolving onAction to check the open args only
    const service = setup();
    service.start();
    versionUpdates.next({ type: 'VERSION_READY' });
    expect(snackBar.open).toHaveBeenCalledTimes(1);
    const args = snackBar.open.calls.mostRecent().args;
    expect(args[0]).toBe('New version available');
    expect(args[1]).toBe('Update');
    expect(args[2]?.duration).toBeUndefined();
  });

  it('(b) action activates the update then reloads', async () => {
    const service = setup();
    service.start();
    versionUpdates.next({ type: 'VERSION_READY' });
    await Promise.resolve();
    await Promise.resolve();
    expect(sw.activateUpdate).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });

  it('(c) other event types open nothing', () => {
    const service = setup();
    service.start();
    versionUpdates.next({ type: 'VERSION_DETECTED' });
    versionUpdates.next({ type: 'NO_NEW_VERSION_DETECTED' });
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('(d) does nothing when the service worker is disabled', async () => {
    const service = setup(false);
    service.start();
    versionUpdates.next({ type: 'VERSION_READY' });
    expect(snackBar.open).not.toHaveBeenCalled();
    expect(visibilityHandlers.length).toBe(0);
    expect(await service.checkNow()).toBeFalse();
    expect(sw.checkForUpdate).not.toHaveBeenCalled();
  });

  it('(e) checks for an update when the document becomes visible', () => {
    const service = setup();
    service.start();
    expect(visibilityHandlers.length).toBe(1);
    spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible');
    visibilityHandlers[0]();
    expect(sw.checkForUpdate).toHaveBeenCalled();
  });

  it('(f) checkNow returns the value of checkForUpdate', async () => {
    const service = setup();
    sw.checkForUpdate.and.resolveTo(true);
    expect(await service.checkNow()).toBeTrue();
    sw.checkForUpdate.and.resolveTo(false);
    expect(await service.checkNow()).toBeFalse();
  });
});
