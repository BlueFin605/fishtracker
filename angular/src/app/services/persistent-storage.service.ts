import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PersistentStorageService {
  async request(): Promise<boolean> {
    try {
      const storage = navigator.storage;
      if (!storage?.persist) return false;
      if (await storage.persisted()) return true;
      return await storage.persist();
    } catch {
      return false;
    }
  }
}
