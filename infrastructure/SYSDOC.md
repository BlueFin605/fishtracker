# Infrastructure (CDK) — FishTracker

What this is: the AWS CDK stack (C#) that provisions every FishTracker AWS
resource — DynamoDB tables (Trips, Catch, Profile, Settings, IdentityAlias),
the API Lambda and the authorizer Lambda, API Gateway, CloudFront + S3 (SPA
hosting), Cognito (own pool by default, or an existing shared pool), Route53
records, and SES for Cognito's sending domain.

Built with: AWS CDK, C#/.NET, per the bluefin-dev stack conventions.

## Where things are

- `FishTracker.Cdk/FishTrackerStack.cs` — the whole stack: table
  definitions, both Lambdas, API Gateway routes/authorizer/validator,
  CloudFront/S3, Cognito, DNS.
- `FishTracker.Cdk/Program.cs` — CDK app entry point; reads the shared-pool
  context values.
- `FishTracker.Cdk.Tests/` — test project for the stack.
- `cdk.json` / `cdk.context.json` — CDK CLI config and cached context
  lookups (e.g. hosted zone).

## Identity (Cognito)

The mode is chosen at deploy time from CDK context (`Program.cs`). Context
values are never read from the app's `config.json`.

- **Default (no context):** the stack creates its own user pool, a Google
  identity provider (`GoogleProvider`), two app clients, and the auth custom
  domain with its Route53 record.
- **Shared pool:** pass both `identityUserPoolId` (the pool id) and
  `identityDomain` (the pool's hosted-UI domain) as `-c` context. Passing only
  one fails the CDK app. The stack imports the pool by id and creates only its
  two app clients (`ImplicitClient`, `AuthCodeClient`). It creates no user
  pool, no Google IdP, no auth custom domain and no DNS record. The pool's
  requirements and the deploy command are in the root `README.md` ("Using an
  existing Cognito user pool").

Both modes output:

- `UserPoolId` — the pool id.
- `AuthDomain` — the hosted-UI domain: the auth custom domain by default, or
  `identityDomain` in shared-pool mode.
- `CognitoClientId` — the auth-code client. The validator uses it as `AUDIENCE`.

## Identity alias table

`IdentityAliasTable` (`FishTracker-IdentityAlias-{env}`, both modes) maps a
shared-pool `sub` to the legacy `sub` whose data it owns. Partition key:
`Subject` (string). Attribute: `LegacySubject`. The table is empty unless a
migration populates it. Point-in-time recovery is on and the table is retained
on stack removal. The API Lambda receives the name as `IDENTITY_ALIAS_TABLE`
and only reads from it. How the API uses it is in `FishTrackerLambdaNode/SYSDOC.md`.

## Running / using this area

Deploy orchestration (build order, `config.json` wiring, manual trigger)
follows the standard bluefin-dev pattern — see the Home repo's
`bluefin-dev` skill and `configuration/fishtracker/deploy-infra.ps1` there;
not repeated here. Per bluefin-dev constraints, infra changes are always
run manually, never from a pipeline.

In default mode, Google OAuth credentials for Cognito are stored in SSM
SecureString at `/fishtracker/{env}/google-oauth`. CDK creates the identity
provider with placeholders, and the deploy script injects the live values
afterward so credential rotation doesn't require a CDK redeploy. In
shared-pool mode CDK creates no Google IdP and the deploy script skips the
Google credential sync, because the pool's IdP belongs to the identity stack.
