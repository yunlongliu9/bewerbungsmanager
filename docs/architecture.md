# Architecture

Status: Proposed

Version: 0.1

This document describes the architecture for Bewerbungsmanager. Phase 1 Monorepo Foundation, Phase 2 PostgreSQL plus Prisma Data Layer, Phase 3A Company and Application API, Phase 3B Backend MVP, and Phase 3C Backend Audit plus API Contract Freeze are implemented; the web MVP, deployment, real authentication, and backup automation remain proposed.

## Principles

- Prefer maintainability over complexity.
- Keep the web, API, and persistence boundaries explicit.
- Use TypeScript across the codebase for shared type safety.
- Run the application and PostgreSQL together with Docker Compose for local development.
- Design for one owner who can access the application from multiple devices.
- Require authentication, HTTPS, and secure sessions before production.
- Keep the API and PostgreSQL private, with no public registration, multi-tenancy, or public database exposure.
- Keep local development usable without weakening production security.

## Technology Choices

| Concern | Proposed technology |
| --- | --- |
| Package management and workspaces | pnpm |
| Web application | Next.js |
| API | NestJS |
| Database | PostgreSQL |
| ORM and migrations | Prisma |
| Primary language | TypeScript |
| Local infrastructure | Docker Compose |
| Authentication library | Undecided |
| Production hosting | Undecided |
| Linting and formatting | ESLint and Prettier |
| Testing | Vitest for unit tests, Supertest for API tests |

pnpm 12.9.1 was verified and used for the workspace. Local PostgreSQL was verified with Docker Compose using approved elevated access on `127.0.0.1:5433`.

## Proposed Repository Layout

```text
bewerbungsmanager/
  apps/
    web/                 # Next.js frontend
    api/
      prisma/
        schema.prisma    # Implemented database schema
        migrations/      # Initial migration
      src/               # NestJS backend source
  packages/
    shared/              # Shared domain types and validation schemas
  docker-compose.yml     # Local PostgreSQL, API, and web services
  docs/                  # Engineering documentation
    evals/
      task-runs.md       # Lightweight task outcome log specification
  AGENTS.md
  package.json
  pnpm-workspace.yaml
  turbo.json             # Optional task orchestration
```

The exact layout can be adjusted during scaffolding as long as the stated boundaries remain.

## Module Boundaries

### apps/web

- Renders the user interface.
- Calls the API through a typed client or fetch layer.
- Contains no direct database access.
- Owns navigation, forms, filters, and dashboard presentation.

### apps/api

- Exposes HTTP endpoints for domain operations.
- Validates requests and translates them into use cases.
- Owns persistence through Prisma.
- Returns typed API responses.
- Treats every private API endpoint as owner-only in production.
- Does not expose public registration or tenant management.
- Implements guarded Company, Application, Contact, Interview, Note, and Dashboard modules with validation, pagination, filters, archive, status history, and dashboard aggregation.

### packages/shared

- Contains types and validation schemas that both apps genuinely need.
- Must not contain database queries or UI components.
- Added only when it removes meaningful duplication.

### prisma

- Defines the database schema.
- Stores reviewed migrations.
- Is consumed by the API, not the web app.

## Data Flow

```text
Browser
  |
  v
Next.js web app
  |
  v
NestJS API
  |
  v
Prisma
  |
  v
PostgreSQL
```

The web app may use server-side rendering for initial data, but all mutations should go through the API.

## Access and Security Model

- The application has one owner and no public sign-up flow.
- There is no multi-tenant data model or tenant selection.
- In production, the owner must authenticate before using the application.
- All private API endpoints require the authenticated owner session.
- Production traffic uses HTTPS and secure, revocable sessions.
- PostgreSQL listens on a private network or local socket only and is never exposed to the public internet.
- Local development may use a local-only session or development bypass, provided that bypass is never enabled in production.

The exact authentication library and hosting provider are undecided. Do not couple the domain model to either choice.

## Backup and Restore

PostgreSQL contains persistent application data and must be recoverable.

Requirements:

- Define and document a backup procedure for the PostgreSQL data.
- Store backups separately from the database host.
- Do not include secrets in backup files or backup documentation.
- Document a restore procedure that can recreate a usable application state.
- Test restore in a disposable environment before relying on it for production data.
- Treat deletion of backups or database data as a destructive operation requiring explicit approval.

## Proposed Domain Model

The implemented Prisma schema includes:

- Company
- Application
- Status
- StatusChange
- Contact
- Interview
- Note

The Application model must support the fields defined in the product requirements, including employment type, work mode, deadline, next action timestamp, priority, salary currency, and job description snapshot.

Relationships and constraints are defined in the product requirements and are enforced in the initial migration.

## API Design

The frozen backend contract is documented in `docs/api-contract.md`.

The API should expose resource-oriented routes:

- `GET /companies`
- `POST /companies`
- `GET /applications`
- `POST /applications`
- `PATCH /applications/:id/status`
- `GET /dashboard`

This route list is illustrative and will be finalized with the API contract. In production, these routes are private and require an authenticated owner session.

## Local Development

Proposed local developer workflow:

1. Start the PostgreSQL service with Docker Compose and verify that it is reachable.
2. Apply Prisma migrations.
3. Run the API.
4. Run the web app.

PostgreSQL must be provisioned and healthy before Prisma migrations are applied. Do not disable or weaken sandbox security to reach the Docker daemon.

Local development must remain usable without exposing PostgreSQL publicly or enabling production authentication bypasses.

The current environment check showed that Docker daemon access is blocked in the sandbox and no PostgreSQL server was responding on the default local socket. These findings must be rechecked before claiming local infrastructure works.

## Docker Compose

Proposed services:

- `postgres`: local database with a persistent volume.
- `api`: NestJS application.
- `web`: Next.js application.

The PostgreSQL Compose service is implemented for local development. It binds only to `127.0.0.1:5433` and uses the persistent `postgres-data` volume.

The `postgres` service is a prerequisite for Prisma migrations. Migration or application steps must not be attempted until that service is confirmed reachable through an approved, non-security-bypassing path.

In local Compose, PostgreSQL should be reachable only on the internal Compose network or local socket, not published to the public internet. Production deployment must keep the database private.

## Testing Strategy

- Unit tests for domain rules and pure helpers.
- API integration tests against a disposable database.
- Minimal UI smoke tests for critical flows once the web app exists.

No test results are available yet. No test pass should be claimed until commands have been run.

## Deployment

Production deployment is not yet scoped. Hosting and authentication libraries remain undecided.

When deployment is designed, it must satisfy the product requirements for one-owner access, multi-device web UI, HTTPS, secure sessions, protected private API endpoints, persistent PostgreSQL, private database access, and tested backup and restore procedures.

## Open Decisions

- Whether to add `turbo` immediately or introduce it after the first working build.
- The exact shape of `packages/shared`.
- The initial UI language and design system.
- The production hosting provider.
- The authentication library and session strategy.
