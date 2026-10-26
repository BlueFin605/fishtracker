# Angular frontend — FishTracker

What this is: the FishTracker SPA — trip/catch logging, map views, sharing,
profile and settings screens, Cognito login.

Built with: Angular 21, Angular Material, `aws-amplify` / Cognito Identity
JS for auth, Google Maps, IndexedDB (`idb`) for offline support.

## Where things are

- `src/app/pages/` — routed screens (trips, trip-catch, new-trip, shared-map,
  my-shares, settings, profile, login, callback, setup, debug-display).
- `src/app/components/` — shared UI (header, auth-button, species-selector,
  size-legend, share-watermark, token-display, date-format).
- `src/app/services/` — API client and app services; `services/offline/` —
  offline/local-cache support.

## Offline session handling

A device that has signed in before stays usable offline (full local use,
writes queued, sync later). Pieces in `src/app/services/` unless noted:

- `SessionService` — owns "is this device signed in?". State is `valid`
  (unexpired id token), `stale` (id token expired but a refresh token is
  stored — still treated as signed in, so a stored refresh token means signed
  in offline) or `none`. Refreshes a stale session when connectivity returns.
- `ConnectivityService` — source of truth for online/offline: a timed
  reachability probe to the API, re-run on online/offline events, app
  foreground and a timer. Not `navigator.onLine`.
- `AuthenticationService.refreshToken()` — signs out only when Cognito
  explicitly rejects the refresh (`invalid_grant`); a network failure keeps the
  tokens.
- `LocalUsersRegistry` — localStorage list of users who have signed in on this
  device (sub, name, email; never tokens), updated on sign-in and refresh.
- Offline user picker (`pages/offline-user`) and proxy mode — when there is no
  session and the device is offline, the user picks (or is auto-selected as)
  a known user and works against that user's per-user IndexedDB
  (`fishtracker-<sub>`) with no tokens and no sync. Signing in online later
  drains the queue only if the signed-in sub matches the database's sub. The
  picker is not authentication. `components/offline-banner` shows the
  offline-as-user state.
- Guards — `AuthGuard` (via `SessionService`; `none` goes to `/login` online,
  `/offline-user` offline), `SetupGuard` (trusts the cached profile, hits the
  network only on genuine first run; on that first successful fetch it caches
  the profile via `FishTrackerSettingsService.primeCache`, and offline it lets
  any cached profile through, even one with an empty species list),
  `OnlineOnlyGuard` (routes that need a connection show the `/offline` page).
- `pages/offline-notice` — the `/offline` page; resumes to `/trips` only on a
  real offline-to-online transition, not when already online.

## Updates and offline shell

- `services/update.service.ts` — on `VERSION_READY` shows a "New version
  available" snackbar with an Update action (activate, then reload via the
  `RELOAD_PAGE` token). Checks on app foreground and every 4 hours; never
  auto-reloads. Started from `main.ts`.
- `services/persistent-storage.service.ts` — requests persistent storage at
  startup (`main.ts`) so Android is less likely to evict IndexedDB.
- Fonts and icons (Roboto, Material Icons, Font Awesome) are self-hosted via
  `angular.json` styles, no CDN. The built `/media/*.woff2` files are cached
  lazily by the `fonts` group in `ngsw-config.json`.
- Maps degrade offline: `GoogleMapsLoaderService` rejects with
  `Error('offline')` when offline, and map views (`shared-map`, `trip-catch`)
  show an "Offline: map unavailable" placeholder. Trip-catch geolocation is
  time-bounded and refreshed at save unless the position was set manually.
- Settings has an "App" section: version, build date and "Check for updates".
  The deploy workflow substitutes `BUILD_DATE` in `environments/environment.ts`
  at build time.

## Running / using this area

Standard `ng serve` / `ng build` usage is in `README.md`. The `local`
build configuration (used by `npm run start:local`) points API calls at
`localhost:3000` and bypasses auth — see `aspire/SYSDOC.md` for when and
how that's used.
