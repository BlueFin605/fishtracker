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

## Running / using this area

Standard `ng serve` / `ng build` usage is in `README.md`. The `local`
build configuration (used by `npm run start:local`) points API calls at
`localhost:3000` and bypasses auth — see `aspire/SYSDOC.md` for when and
how that's used.
