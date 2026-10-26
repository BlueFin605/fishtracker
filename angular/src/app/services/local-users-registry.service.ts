import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export interface KnownUser {
  sub: string;
  name: string;
  email: string;
}

const STORAGE_KEY = 'known_users';

/** Remembers which users have signed in on this device. Never stores tokens. */
@Injectable({
  providedIn: 'root'
})
export class LocalUsersRegistry {
  list(): KnownUser[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(u => u && typeof u.sub === 'string');
    } catch {
      return [];
    }
  }

  find(sub: string): KnownUser | undefined {
    return this.list().find(u => u.sub === sub);
  }

  upsert(user: KnownUser): void {
    const users = this.list();
    const i = users.findIndex(u => u.sub === user.sub);
    if (i >= 0) {
      users[i] = user;
    } else {
      users.push(user);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch {
      // storage unavailable; registry is best-effort
    }
  }

  recordFromIdToken(idToken: string): void {
    try {
      const d: any = jwtDecode(idToken);
      if (!d?.sub) return;
      this.upsert({
        sub: d.sub,
        name: d.name || d.email || d.preferred_username || '',
        email: d.email || ''
      });
    } catch {
      // undecodable token: ignore
    }
  }
}
