# Offline cold start — design

Date: 2026-10-24
Scope: `angular/` only. No backend or infrastructure changes.

## Problem

Starting FishTracker cold with no connectivity (out fishing) fails: the app
cannot get past login even though trips, catches and the sync queue are
already cached locally in IndexedDB. Three causes:

1. `AuthenticationService.isAuthenticated()` returns false once the id token
   has expired (1 hour). `AuthGuard` then routes to `/login`, which redirects
   to the Cognito hosted UI — unreachable offline. `''` and `**` also route to
   `/login`, so every cold start passes through it.
2. `refreshToken()` calls `signOut()` on any error, including a network
   failure. One failed refresh in a dead zone deletes the refresh token and
   ends the session.
3. `SetupGuard` calls `getProfile()` over the network on every cold start,
   ignoring the profile that `FishTrackerSettingsService` already caches in
   IndexedDB. Offline it blocks `/trips`, `/trip/:id` and `/newtrip`.

Also, `navigator.onLine` is unreliable on a boat (signal bars, no data), so
code gated on it will still hang on dead requests.

## Decisions

- A device that has signed in before is treated as signed in while offline
  (full local use: view cached data, log trips and catches, queue writes,
  sync once connectivity and a token return).
- No PIN / device lock (possible later).
- Token lifetimes (infrastructure/FishTracker.Cdk/FishTrackerStack.cs): id
  token 1 h, access token 1 h or 1 day depending on client, refresh token
  30 days. A device can therefore stay offline up to 30 days before a
  re-login is needed.

## Existing behaviour that stays

- `IndexedDbService` already opens one database per user,
  `fishtracker-<sub>`, with `sub` decoded from the stored `id_token`
  (`anonymous` when absent). Users' trips, catches, profile, settings and sync
  queue are fully isolated.
- Sign-out removes tokens but never deletes databases.
- `OfflineDataService` already serves trips/catches from IndexedDB and queues
  writes; `SyncService` drains the queue.

## 1. SessionService

New service owning "is this device signed in?".

States:
- `valid` — id token present and unexpired.
- `stale` — id token expired, refresh token stored. Still trusted.
- `none` — no refresh token. Signed out.

Refresh behaviour:
- On cold start in `stale`, attempt one non-blocking refresh.
- Success: store tokens, move to `valid`.
- Network error / timeout (status 0): stay `stale`, keep tokens, retry when
  `ConnectivityService` reports online.
- Cognito rejects the refresh (400 `invalid_grant`): the only case that signs
  out.
- `AuthenticationService.refreshToken()` changes to call `signOut()` only for
  an explicit rejection, never for a network error.

Other:
- `userDisplayName` / `userEmail` keep decoding the (possibly expired) id
  token and must not throw on a malformed one.
- `''` and `**` redirect to `/trips`; the guard sends signed-out users on.
- The sync queue of a user whose refresh token has expired stays in their
  database and drains after they sign in again.

## 2. Offline user picker (proxy mode)

Applies only when there is no usable session (`none`) and the device is
offline.

- `LocalUsersRegistry`: localStorage list of `{sub, name, email}`, updated on
  sign-in and on every successful refresh. Contains no tokens. (Enumerating
  IndexedDB databases is not reliable across browsers.)
- Exactly one known user: open that user's database directly, show banner
  "Offline as <name> — sign in to sync".
- Two or more known users: show "Who's fishing?" picker before anything loads.
- Zero known users (never signed in on this device): normal login page, with
  an "offline" message since login needs a connection.
- `SessionService` exposes a proxy-mode flag: selected `sub`, no tokens.
  `IndexedDbService.getSubject()` returns the proxied `sub` in this mode
  instead of `anonymous`.
- In proxy mode `SyncService` does not attempt network calls (no token).
- After the user signs in online, the queue drains only if the signed-in `sub`
  equals the database's `sub`. On mismatch, show "Sign in as <name> to sync".
  Nothing is ever written to a different account.
- The picker is not authentication: anyone holding the unlocked phone can
  choose either user's offline data.

## 3. Guards and routing

- `AuthGuard` asks `SessionService`: `valid`/`stale` pass; `none` + online →
  `/login`; `none` + offline → picker / auto-open per section 2.
- `SetupGuard` reads the cached profile first and passes if it has species.
  It refreshes from the server in the background when online. It blocks on the
  network only when no cached profile exists (genuine first run). If that
  happens offline, show "Connect once to finish setup".
- Online-only routes (`shares`, `shared/:shareId`, profile save, Google Maps
  dependent views) show a clear "needs a connection" message when offline.

## 4. ConnectivityService

Replaces `navigator.onLine` as the source of truth.

- Online = a lightweight request to the API (or the Cognito well-known
  endpoint) completes within about 3 s.
- Re-checked on `online`/`offline` events, on app foreground, and every
  30–60 s while the session is `stale` or the queue is non-empty.
- `SessionService` refresh retries and `SyncService` consult it before
  touching the network; `OfflineDataService`'s `navigator.onLine` checks move
  to it.

## Testing

- Unit: `SessionService` state table and refresh-outcome transitions;
  `refreshToken()` error classification (status 0 vs 400 `invalid_grant` vs
  5xx); both guards; `LocalUsersRegistry`; `ConnectivityService` timeout
  logic; sub mismatch blocking sync.
- E2E: the project has no Playwright setup today. Either add a minimal one
  for a single flow (sign in, expire `id_token` in localStorage, go offline,
  cold reload, view trips, log a catch, go online, confirm sync) or cover the
  flow with a documented manual check. Decide at planning time.
- Manual: airplane mode, cold start the installed PWA with an expired id
  token; repeat with two known users and no tokens.

## Out of scope

- PIN or device lock.
- Offline Google Maps tiles.
- Backend / infrastructure changes.
- Changing token lifetimes.
