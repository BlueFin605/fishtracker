# FishTracker

Purpose: A fishing trip/catch tracker. Users log trips and catches (with
photos and location), view them on a map, and share a read-only link to a
trip.

## Tech stack

Angular SPA / Node.js (TypeScript) Lambda API behind API Gateway / Cognito
auth with a custom JWT authorizer Lambda / DynamoDB storage / AWS CDK (C#)
for infrastructure. Local dev is orchestrated with .NET Aspire + LocalStack.

## Where things are

- `angular/` — the frontend SPA. See `angular/SYSDOC.md`.
- `FishTrackerLambdaNode/` — the backend API Lambda (routes, DynamoDB
  services, sharing/email/thumbnail logic). See
  `FishTrackerLambdaNode/SYSDOC.md`.
- `FishTrackerLambdaValidator/` — the API Gateway custom authorizer that
  validates Cognito-issued JWTs. See `FishTrackerLambdaValidator/SYSDOC.md`.
- `infrastructure/` — the AWS CDK stack (C#) that provisions everything:
  DynamoDB tables, both Lambdas, API Gateway, CloudFront, Cognito,
  Route53, SES. See `infrastructure/SYSDOC.md`.
- `aspire/` — the local dev environment (Aspire + LocalStack) that runs the
  API and SPA together against emulated DynamoDB. See `aspire/SYSDOC.md`.
- `FishTrackerLambda/` — stale build output only (not tracked in git, no
  source present); safe to ignore.

## Running it

Environment config, secrets layering, and deployment orchestration
(`config.json`, `deploy-infra.ps1`) follow the standard convention in the
Home repo's `bluefin-dev` skill — not repeated here. For day-to-day local
development against emulated AWS, see `aspire/SYSDOC.md` and
`aspire/README.md`.
