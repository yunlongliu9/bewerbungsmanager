# ADR 0001: pnpm TypeScript Monorepo

Status: Proposed

Date: 2026-10-18

## Context

Bewerbungsmanager needs a web frontend, an API, a database, and shared TypeScript types. The MVP is small, but separating presentation and persistence keeps the system understandable and testable.

We need a repository structure and technology baseline that:

- Supports a Next.js frontend and a NestJS API.
- Uses PostgreSQL with Prisma.
- Shares types without coupling UI and persistence.
- Stays simple enough for one maintainer.

## Decision

Use a pnpm TypeScript monorepo with:

- `apps/web` for Next.js.
- `apps/api` for NestJS.
- `packages/shared` for shared domain types and validation schemas.
- `prisma` for schema and migrations.
- PostgreSQL as the database.
- Docker Compose for local infrastructure, with PostgreSQL provisioned and verified before Prisma migrations are applied.
- The Plan -> Implement -> Verify -> Repair -> Report workflow documented in `AGENTS.md`.
- `docs/evals/task-runs.md` as the lightweight task outcome log.
- The personal cloud access and security model recorded in ADR 0002.

This is a proposal. No scaffolding has been created yet.

## Consequences

Positive:

- One checkout contains the complete system.
- TypeScript contracts can be shared between frontend and API.
- Each app has a clear responsibility and independent test surface.
- Local infrastructure can be reproduced with Docker Compose.
- Prisma migrations are always attempted after the local PostgreSQL prerequisite is satisfied.

Trade-offs:

- Monorepo tooling adds configuration before the first feature works.
- `packages/shared` must stay small to avoid creating a hidden coupling layer.
- Docker Compose requires a working Docker daemon, which is not currently accessible in the checked environment.

Sandbox security must remain enabled. A blocked Docker daemon is a reporting and escalation condition, not a reason to bypass sandbox controls.

## Alternatives Considered

### Single Next.js Full-Stack App

Use Next.js API routes and Prisma together.

- Simpler initial setup.
- Rejected because domain logic and API behavior are harder to test and separate from the UI.

### Separate Repositories

Keep web, API, and shared code in separate repositories.

- Clear ownership boundaries.
- Rejected because coordinated changes and shared types become more expensive for an MVP.

### npm Workspaces

Use npm instead of pnpm as the package manager.

- npm is already available.
- Rejected because pnpm is the selected standard for this proposed monorepo; this choice can be revisited if pnpm proves unavailable.

### SQLite

Use SQLite for local-only simplicity.

- Fewer infrastructure requirements.
- Rejected because PostgreSQL is the stated target and keeps the local environment closer to production.
