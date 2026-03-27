# FishTracker Local Test Environment

Local development environment using [Microsoft Aspire](https://learn.microsoft.com/en-us/dotnet/aspire/) and [AWS LocalStack](https://localstack.cloud/).

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or [Podman](https://podman.io/)
- [Node.js 22+](https://nodejs.org/) (for the Node.js Lambda)

```bash
brew install dotnet@10
```

## First-time Setup

Initialize user secrets (required once per machine for the Aspire dashboard):

```bash
cd fishtracker/aspire
dotnet user-secrets init --project FishTracker.AppHost
```

## Getting Started

```bash
cd fishtracker/aspire
dotnet run --project FishTracker.AppHost
```

This opens the Aspire dashboard (typically at `https://localhost:17225`) where you can monitor logs, traces, and health for all services.

## What It Runs

| Service | Description | Local URL |
|---------|-------------|-----------|
| **LocalStack** | AWS cloud emulator providing DynamoDB | `http://localhost:8000` |
| **nodejs-api** | Node.js Lambda running as Express | `http://localhost:3000` |
| **angular-app** | Angular frontend (local config, auth bypassed) | `http://localhost:4201` |

## Architecture

```
Aspire AppHost
├── LocalStack (container)
│   └── DynamoDB (4 tables auto-created on startup)
├── Node.js Lambda (Express, local mode)
│   └── connects to LocalStack DynamoDB @ localhost:8000
└── Angular frontend (ng serve --configuration local)
    └── connects to Node.js API @ localhost:3000
```

### DynamoDB Tables

Created automatically by `localstack/init-dynamodb.sh` when LocalStack starts:

| Table | Partition Key | Sort Key |
|-------|--------------|----------|
| `FishTracker-Trips-Prod` | `Subject` (S) | `TripId` (S) |
| `FishTracker-Catch-Prod` | `TripKey` (S) | `CatchId` (S) |
| `FishTracker-Profile-Prod` | `Subject` (S) | — |
| `FishTracker-Settings-Prod` | `Settings` (S) | — |

## How It Works

- **LocalStack** container port 4566 is mapped to **host port 8000**, matching the hardcoded `http://localhost:8000` endpoint in the Node.js Lambda — no code changes needed.
- The Node.js Lambda runs without `IS_LAMBDA` set, which triggers its local Express server and `configureLocal()` DynamoDB client.
- The Angular app runs with the `local` configuration, which points API calls at `localhost:3000` and bypasses authentication.
- Aspire's `WaitFor` ensures services start in the correct order: LocalStack → Node.js API → Angular.

## Interacting with LocalStack DynamoDB

```bash
# List tables
aws --endpoint-url=http://localhost:8000 dynamodb list-tables --region eu-central-1

# Scan a table
aws --endpoint-url=http://localhost:8000 dynamodb scan \
    --table-name FishTracker-Trips-Prod --region eu-central-1
```

## Notes

- LocalStack uses `ContainerLifetime.Persistent` so it survives AppHost restarts without losing data.
- The ServiceDefaults project provides OpenTelemetry and health check integration for the Aspire dashboard.
