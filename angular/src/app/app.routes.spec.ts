import { routes } from './app.routes';
import { OnlineOnlyGuard } from './online-only.guard';
import { OfflineUserGuard } from './offline-user.guard';

describe('app routes', () => {
  const find = (path: string) => routes.find(r => r.path === path)!;

  it('/profile is online-only', () => {
    expect(find('profile').canActivate).toContain(OnlineOnlyGuard);
  });

  it('/offline-user is guarded so it is only reachable when signed out', () => {
    expect(find('offline-user').canActivate).toContain(OfflineUserGuard);
  });
});
