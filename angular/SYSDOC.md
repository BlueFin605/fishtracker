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
  network only on genuine first run), `OnlineOnlyGuard` (routes that need a
  connection show the `/offline` page).

## Running / using this area

Standard `ng serve` / `ng build` usage is in `README.md`. The `local`
build configuration (used by `npm run start:local`) points API calls at
`localhost:3000` and bypasses auth — see `aspire/SYSDOC.md` for when and
how that's used.
