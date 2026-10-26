# Offline PWA — design

Date: 2026-10-26
Scope: `angular/` only. No backend or infrastructure changes.

## Problem

Dean wants FishTracker on his Android phone to be (1) installable,
(2) easily updated, and (3) usable offline when out of range.

(1) already works: the app is an Angular PWA (manifest, service worker) served
over HTTPS from CloudFront, and Chrome installs it. Unlike RokuRemote — whose
proxy is plain HTTP, so Chrome refuses to install it and it needed a Capacitor
APK — FishTracker needs no native wrapper.

What is missing:

- **Fresh install fails offline.** Install, sign in, close the app before
  anything saves the profile, go offline: `SetupGuard` finds no cached profile
  with species and shows "Connect to the internet once to finish setting up
  your account." with nothing else usable. `SetupGuard.check()` fetches the
  profile online but never caches it; the cache is only written when a
  consumer subscribes to `FishTrackerSettingsService.profile`/`settings`.
  This is the 2026-10-24 offline cold-start work (see
  `2026-10-24-offline-cold-start-design.md`) failing for a user who has never
  had a populated cache.
- **No update flow.** The service worker downloads new versions but nothing
  tells the user or applies them.
- **Offline gaps beyond the data layer.** Google Maps and CDN fonts/icons are
  not available offline.

## Decisions

- Stay a PWA. No Capacitor / APK (more signing, CI and sideloading for no
  benefit).
- Offline scope is "log plus position": trips and catches (including GPS
  coordinates) are logged offline and synced later. No offline map tiles.
- Updates use a prompt: a snackbar when a new version is ready; the user
  decides when to reload.

## Design

### 1. First-run offline reliability

- Cache the profile and settings as soon as they are fetched, independent of
  which screen is open: write them from `SetupGuard.check()` after a
  successful `getProfile()` and from the post-sign-in path, via
  `FishTrackerSettingsService`.
- "Signed in and profile fetched" is sufficient to work offline. A profile with
  an empty species list is cached too; offline it means "no species yet" (shown
  as a prompt to add species once online), not a blocker. `SetupGuard` offline
  gate becomes "no cached profile at all", not "no cached species".
- When offline with nothing cached the `/offline` page says what to do and
  retries when connectivity returns, rather than leaving the user stranded.

### 2. Offline in the field

- Trip/catch logging, the write queue and sync are existing behaviour
  (`services/offline/`); verify them end to end on a fresh install.
- Capture GPS with each catch; position is recorded even when the map cannot
  render.
- Map components show an "Offline: map unavailable" placeholder when
  `ConnectivityService` reports offline or the Google Maps script fails to
  load, and never block on the loader (`google-maps-loader.service.ts`).
- Audit the app shell for CDN dependencies (Font Awesome, Google Fonts). Bundle
  them or ensure `ngsw-config.json` caches them (the `assets` group already
  lists these origins with lazy install; confirm they are cached after one
  online run).
- Call `navigator.storage.persist()` at startup so Android is less likely to
  evict IndexedDB (the sync queue) from an installed PWA.

### 3. Updates (prompt)

- `UpdateService` subscribes to `SwUpdate.versionUpdates`. On
  `VERSION_READY` it shows a Material snackbar "New version available" with an
  "Update" action; tapping calls `activateUpdate()` then reloads.
- Check for updates on app foreground and on a timer of a few hours
  (`SwUpdate.checkForUpdate()`), so a long-lived app notices new builds.
- Never auto-reload: unsaved catch entry must not be lost. The snackbar stays
  until acted on.
- Settings shows app version and build date (injected at build time) and a
  "Check for updates" button.
- Deployment is unchanged: a new build changes hashed files and `ngsw.json`,
  which the service worker detects.

### 4. Testing

- Unit: `SetupGuard` and settings caching (profile cached on fetch, empty
  species accepted offline), `UpdateService` (ready → snackbar → activate),
  map offline placeholder.
- E2E: fresh install path — sign in online, go offline, reload, log a catch,
  go online, assert it synced.
- Manual, post-deploy, on the phone: install, open once online, airplane mode,
  log a catch, reconnect and confirm sync; then deploy a trivial change and
  confirm the update prompt appears.
- Run `ng lint` before closing tickets.

## Out of scope

Offline map tiles, a Capacitor/APK build, push notifications, a device
PIN/lock.

## Open verification items for the plan

- Confirm which code path writes the profile cache today and that the
  sign-in/callback flow populates it.
- Confirm the service worker is actually active and serving the shell offline
  on a fresh install (first load after install, before any update).
