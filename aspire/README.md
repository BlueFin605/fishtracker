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

See `SYSDOC.md` for the architecture, how it's wired together, and how to
interact with the emulated DynamoDB directly.
