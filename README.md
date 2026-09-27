# FishTracker

A fishing trip and catch tracker: log trips, record catches with photos and
location, view them on a map, and share a read-only trip link. Angular
frontend, serverless Node.js API on AWS.

## Quickstart

1. Copy `config.example.json` to `config.json` and fill in your own domain,
   region, and SES sender details.
2. Deploy the CDK stack in [`infrastructure/`](infrastructure) to provision
   the AWS resources.
3. Build and deploy [`FishTrackerLambdaNode/`](FishTrackerLambdaNode) (the
   API) and [`FishTrackerLambdaValidator/`](FishTrackerLambdaValidator) (the
   API Gateway authorizer).
4. Build and host [`angular/`](angular) (the SPA).

To try the whole stack locally without an AWS account, see
[`aspire/README.md`](aspire/README.md) — it runs the API and SPA together
against a local AWS emulator.

## Prerequisites

- Node.js 22+
- .NET 10 SDK (for the CDK infra and for local dev via Aspire)
- An AWS account with a Route53-hosted domain, for deployment

## Project layout

- `angular/` — frontend SPA
- `FishTrackerLambdaNode/` — backend API Lambda
- `FishTrackerLambdaValidator/` — API Gateway JWT authorizer Lambda
- `infrastructure/` — AWS CDK stack
- `aspire/` — local dev environment (Aspire + LocalStack)
