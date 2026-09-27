# Infrastructure (CDK) — FishTracker

What this is: the AWS CDK stack (C#) that provisions every FishTracker AWS
resource — DynamoDB tables (Trips, Catch, Profile, Settings), the API
Lambda and the authorizer Lambda, API Gateway, CloudFront + S3 (SPA
hosting), Cognito (with Google IdP), Route53 records, and SES for
Cognito's sending domain.

Built with: AWS CDK, C#/.NET, per the bluefin-dev stack conventions.

## Where things are

- `FishTracker.Cdk/FishTrackerStack.cs` — the whole stack: table
  definitions, both Lambdas, API Gateway routes/authorizer/validator,
  CloudFront/S3, Cognito, DNS.
- `FishTracker.Cdk/Program.cs` — CDK app entry point.
- `cdk.json` / `cdk.context.json` — CDK CLI config and cached context
  lookups (e.g. hosted zone).

## Running / using this area

Deploy orchestration (build order, `config.json` wiring, manual trigger)
follows the standard bluefin-dev pattern — see the Home repo's
`bluefin-dev` skill and `configuration/fishtracker/deploy-infra.ps1` there;
not repeated here. Per bluefin-dev constraints, infra changes are always
run manually, never from a pipeline.

Google OAuth credentials for Cognito are stored in SSM SecureString at
`/fishtracker/{env}/google-oauth`; CDK creates the identity provider with
placeholders, and the deploy script injects the live values afterward so
credential rotation doesn't require a CDK redeploy.
