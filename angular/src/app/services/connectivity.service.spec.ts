import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  let fetchSpy: jasmine.Spy;

  function create(): ConnectivityService {
    return TestBed.inject(ConnectivityService);
  }

  beforeEach(() => {
    fetchSpy = spyOn(window, 'fetch');
  });

  it('check() is true when fetch resolves (opaque response)', fakeAsync(() => {
    fetchSpy.and.returnValue(Promise.resolve(new Response(null)));
    const svc = create();
    let result: boolean | undefined;
    svc.check().then(r => (result = r));
    tick();
    expect(result).toBeTrue();
    expect(svc.isOnline()).toBeTrue();
    discardPeriodicTasks();
  }));

  it('check() is false when fetch rejects', fakeAsync(() => {
    fetchSpy.and.returnValue(Promise.reject(new TypeError('Failed to fetch')));
    const svc = create();
    let result: boolean | undefined;
    svc.check().then(r => (result = r));
    tick();
    expect(result).toBeFalse();
    expect(svc.isOnline()).toBeFalse();
    discardPeriodicTasks();
  }));

  it('check() is false when fetch never resolves within 3000 ms', fakeAsync(() => {
    fetchSpy.and.callFake((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      }));
    const svc = create();
    let result: boolean | undefined;
    svc.check().then(r => (result = r));
    tick(3001);
    expect(result).toBeFalse();
    expect(svc.isOnline()).toBeFalse();
    discardPeriodicTasks();
  }));

  it('does not call fetch when navigator.onLine is false', fakeAsync(() => {
    spyOnProperty(navigator, 'onLine').and.returnValue(false);
    const svc = create();
    let result: boolean | undefined;
    svc.check().then(r => (result = r));
    tick();
    expect(result).toBeFalse();
    expect(svc.isOnline()).toBeFalse();
    expect(fetchSpy).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('emits on online$ only on change', fakeAsync(() => {
    fetchSpy.and.returnValue(Promise.resolve(new Response(null)));
    const svc = create();
    const seen: boolean[] = [];
    svc.online$.subscribe(v => seen.push(v));
    svc.check();
    tick();
    svc.check();
    tick();
    expect(seen).toEqual([true]);
    discardPeriodicTasks();
  }));
});
