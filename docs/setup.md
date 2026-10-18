# Local Setup

Status: Implemented through Phase 2.

This document describes local development setup for the pnpm monorepo, Next.js web app, NestJS API, and PostgreSQL data layer.

## Prerequisites

- Node.js 24 or newer.
- pnpm 12.9 or newer.
- Docker with Compose.
- A sandboxed Codex environment requires approved elevated access for Docker and localhost database commands.

## Install

```bash
pnpm install
```

## Configure Environment

The repository contains safe example files. Create local environment files only if you need to override the documented defaults.

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

The local database uses the `trust` authentication method and is bound only to `127.0.0.1`. This is suitable for local development only. Production must use a real password and private networking.

## Start PostgreSQL

```bash
pnpm db:up
```

Verify the database:

```bash
pg_isready -h 127.0.0.1 -p 5433 -U bewerbungsmanager -d bewerbungsmanager
```

The service binds to `127.0.0.1:5433`, not a public host port.

## Generate and Validate Prisma

```bash
pnpm prisma:generate
pnpm prisma:validate
```

## Apply Migrations

```bash
pnpm db:migrate
```

## Run Applications

```bash
pnpm dev
```

## Run Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm format:check
```

## Run Database Tests

Database tests are kept separate from the default test command because they require a live PostgreSQL instance.

Create a disposable test database:

```bash
docker compose exec -T postgres psql -U bewerbungsmanager -d bewerbungsmanager -c "CREATE DATABASE bewerbungsmanager_test;"
```

Apply migrations and run the tests:

```bash
DATABASE_URL="postgresql://bewerbungsmanager@localhost:5433/bewerbungsmanager_test?schema=public" pnpm --filter @bewerbungsmanager/api exec prisma migrate deploy
DATABASE_URL="postgresql://bewerbungsmanager@localhost:5433/bewerbungsmanager_test?schema=public" pnpm --filter @bewerbungsmanager/api test:db
```

Drop the disposable database after verification:

```bash
docker compose exec -T postgres psql -U bewerbungsmanager -d bewerbungsmanager -c "DROP DATABASE bewerbungsmanager_test;"
```

## Stop PostgreSQL

```bash
pnpm db:down
```

Stopping the container preserves the `postgres-data` volume. Do not run `docker compose down -v` or remove the volume unless you intend to delete persistent data.
