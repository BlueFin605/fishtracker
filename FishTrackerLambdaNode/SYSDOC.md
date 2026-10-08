# Backend API Lambda — FishTracker

What this is: the FishTracker API. A single Lambda (Express-shaped, via
`aws-serverless-express`) fronted by API Gateway, handling trips, catches,
sharing, profile, settings, and share emails. Reads/writes DynamoDB
directly.

Built with: Node.js + TypeScript, Express, AWS SDK v3 clients (DynamoDB,
S3, SES v2, Cognito Identity Provider, SSM Parameter Store), `tsyringe` for DI,
`luxon` / `astronomy-engine` for bite-time calculations.

## Where things are

- `src/routes.ts` — API route definitions.
- `src/index.ts` — Lambda entry point (also runs as a local Express server
  when `IS_LAMBDA` is unset — see "Running" below).
- `src/Services/` — business logic (trips, catches, sharing, profile,
  settings, bite times, thumbnails, static map rendering, Cognito users).
- `src/Db.Services/` — one DynamoDB-backed service per table (Trip, Catch,
  Profile, Settings, Share) plus the shared DynamoDB/AWS client wrappers.
- `src/Helpers/` — date conversion, ID generation, location fuzzing (for
  shared/public views), secrets caching.
- `src/Http/`, `src/Functional/` — request/response and result-wrapping
  plumbing.

## Running / using this area

- `npm run build` compiles TypeScript (`dist/`) and bundles it with esbuild
  into `bundle/index.js` — this bundle is what the CDK stack in
  `infrastructure/` packages as the Lambda's code (`Code.FromAsset`, per
  the bluefin-dev CDK convention).
- `npm start` (`ts-node src/index.ts`) runs it locally as a plain Express
  server: with `IS_LAMBDA` unset it skips the Lambda adapter and talks to
  DynamoDB at `http://localhost:8000` (LocalStack). This is what
  `aspire/` drives for local dev — see `aspire/SYSDOC.md`.
