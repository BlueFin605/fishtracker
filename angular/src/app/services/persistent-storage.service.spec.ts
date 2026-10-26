import { PersistentStorageService } from './persistent-storage.service';

describe('PersistentStorageService', () => {
  it('returns true when already persisted without re-requesting', async () => {
    const persist = jasmine.createSpy('persist');
    spyOnProperty(navigator, 'storage').and.returnValue({ persisted: () => Promise.resolve(true), persist } as any);
    expect(await new PersistentStorageService().request()).toBeTrue();
    expect(persist).not.toHaveBeenCalled();
  });
  it('requests persistence when not yet persisted', async () => {
    const persist = jasmine.createSpy('persist').and.resolveTo(true);
    spyOnProperty(navigator, 'storage').and.returnValue({ persisted: () => Promise.resolve(false), persist } as any);
    expect(await new PersistentStorageService().request()).toBeTrue();
    expect(persist).toHaveBeenCalled();
  });
  it('returns false when the API is unavailable or throws', async () => {
    spyOnProperty(navigator, 'storage').and.returnValue(undefined as any);
    expect(await new PersistentStorageService().request()).toBeFalse();
  });
});
