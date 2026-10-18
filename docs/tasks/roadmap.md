# Implementation Roadmap

Status: Proposed

Version: 0.1

This roadmap defines phased work for the MVP. Phase 0, Phase 1, Phase 2, and Phase 3 are implemented. Phase 4 is partially implemented as Phase 3A, covering Company and Application APIs only.

## Phase 0: Engineering Harness

Goal: establish project intent, agent guidance, and outcome recording without application code.

Deliverables:

- `AGENTS.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/tasks/roadmap.md`
- `docs/decisions/0001-monorepo.md`
- `docs/decisions/0002-personal-cloud-application.md`
- `docs/evals/task-runs.md`

Done when:

- The harness documents exist and are mutually consistent.
- The agent workflow is explicit.
- Architecture and requirements are marked as proposed.
- The personal cloud access and security decision is recorded.
- The task outcome log format is defined.
- No application code, package manifests, migrations, or infrastructure files are added.
- No dependencies are installed and no commits are created.

## Phase 1: Monorepo Foundation

Status: Implemented and verified on 2026-10-18.

Goal: create a typed, linted, testable workspace.

Scope:

- Initialize the pnpm workspace.
- Add shared TypeScript configuration.
- Add ESLint and Prettier.
- Add placeholder `apps/web` and `apps/api`.
- Add root scripts for typecheck, lint, format, and test.

Done when:

- The workspace installs cleanly with pnpm.
- Typecheck, lint, test, formatting, and build commands run successfully.
- The API and web packages have distinct boundaries.
- No domain behavior is implemented yet.

Verified results:

- `pnpm install` completed after allowing `esbuild` and `unrs-resolver` build scripts in `pnpm-workspace.yaml`.
- `pnpm typecheck` passed for `apps/web` and `apps/api`.
- `pnpm lint` passed for `apps/web` and `apps/api`.
- `pnpm test` passed; the API health test passed with one-time elevated permission for ephemeral localhost binding required by Supertest.
- `pnpm dev` started both applications; the web app became ready and the API mapped `GET /health`.
- `pnpm build` passed for both applications.
- `pnpm format:check` passed.
- Next.js emitted a non-blocking warning about multiple detected lockfiles and inferred workspace root.

## Phase 2: Local PostgreSQL Environment

Status: Implemented and verified on 2026-10-18.

Goal: provision the local database before any migration work begins.

Scope:

- Add Docker Compose with a PostgreSQL service and persistent volume.
- Add a healthcheck for PostgreSQL.
- Add `.env.example` files without secrets.
- Document how to start and verify PostgreSQL in an environment with Docker access.

Done when:

- The PostgreSQL service starts and reports healthy in an environment where Docker daemon access is available.
- The database is reachable with the local client tools.
- PostgreSQL is reachable only through the local Compose network or local socket, not a public host port.
- Sandbox security is not disabled or bypassed.
- No database credentials are committed.

Verified results:

- `docker compose up -d postgres` started `postgres:17-alpine` successfully.
- PostgreSQL reported healthy on `127.0.0.1:5433`.
- The persistent `postgres-data` volume was created and preserved.
- The database was not exposed on a public host port.

## Phase 3: Data Layer

Status: Implemented and verified on 2026-10-18.

Goal: define and migrate the PostgreSQL schema after the database is available.

Scope:

- Add Prisma.
- Define Company, Application, Status, StatusChange, Contact, Interview, and Note models.
- Include the product-required Application fields: employment type, work mode, deadline, next action timestamp, priority, salary currency, and job description snapshot.
- Add required relations and uniqueness rules.
- Create the first migration.
- Add an optional local seed script.

Done when:

- Migrations apply to the PostgreSQL database provisioned in Phase 2 or to a disposable PostgreSQL database.
- The schema supports the product requirements.
- Required fields and relationships are enforced.
- No database credentials are committed.

Verified results:

- Prisma Client 6.19.3 was generated and Prisma schema validation passed.
- The initial migration was created and applied to the local database.
- The migration adds foreign keys, indexes, enum constraints, salary checks, and the note-parent check.
- Four Prisma data-layer tests passed against a disposable `bewerbungsmanager_test` database.
- The disposable test database was dropped after verification; the persistent volume was left intact.

## Phase 4: API Foundation

Status: Partially implemented as Phase 3A on 2026-10-18.

Goal: expose typed domain operations through NestJS.

Scope:

- Create modules for companies, applications, contacts, interviews, notes, and dashboard.
- Implement create, read, update, and status-change operations.
- Add request validation.
- Add integration tests using a disposable database.

Done when:

- API tests cover the core workflows and pass when actually run.
- Invalid input returns a useful validation response.
- Status changes create history.
- Search and filter parameters are validated.
- The API has no direct UI concerns.
- API routes are structured as private owner-only endpoints, with no public registration or tenant management.

Verified Phase 3A results:

- Company and Application modules support create, list, get, update, archive, and atomic status transitions.
- DTO validation, pagination, search, status filters, and company filters are implemented.
- The API uses an `OwnerAuthGuard` boundary without a fake production authentication bypass.
- Eight Company and Application API integration tests passed.
- Five schema and transaction tests passed, including transaction rollback.
- Contacts, interviews, notes, and dashboard endpoints remain unimplemented.

## Phase 5: Web MVP

Goal: build the usable tracker interface.

Scope:

- Implement the dashboard as the landing view.
- Implement company and application lists and forms.
- Implement application detail with status history.
- Implement contacts, interviews, and notes.
- Implement search and filters.

Done when:

- Core workflows are reachable in the browser.
- The dashboard shows required summary data.
- Search and filters combine correctly.
- Forms validate required input.
- The layout works at desktop and mobile viewport sizes.

## Phase 6: Quality and Hardening

Goal: make the MVP reliable and maintainable.

Scope:

- Add loading, empty, and error states.
- Improve keyboard and form accessibility.
- Add focused tests for critical business rules.
- Review security boundaries and input handling.
- Remove unused code and speculative abstractions.

Done when:

- The agreed test commands pass in the implemented environment.
- Critical flows have automated coverage.
- No secrets or personal data are present in source control.
- Accessibility and error states are manually verified.

## Phase 7: Local Orchestration and Handoff

Goal: make the full project straightforward to run.

Scope:

- Extend Docker Compose to include the API and web services.
- Confirm the documented setup still provisions PostgreSQL before migrations.
- Document setup, migrations, testing, and common commands.
- Record any environment-specific limitations.

Done when:

- A clean checkout can be set up by following the documented steps in an environment with Docker access.
- Compose starts PostgreSQL before any migration command is run.
- Migrations and seed data apply successfully.
- The documented commands match observed behavior.
- Local development remains usable without enabling a production authentication bypass.

## Phase 8: Production Readiness and Data Safety

Goal: satisfy the personal cloud security and recoverability requirements before production.

Scope:

- Select and record a hosting approach only when ready; do not prematurely couple the codebase.
- Select and record an authentication library and secure session strategy.
- Require authentication and HTTPS for production access.
- Enforce private access for all private API endpoints.
- Keep PostgreSQL private and persistent.
- Document automated or operator-run PostgreSQL backups.
- Document and test a restore procedure in a disposable environment.

Done when:

- The hosting and authentication decisions are recorded in ADRs.
- Production access requires authentication and HTTPS.
- Private API endpoints reject unauthenticated access.
- PostgreSQL is not publicly exposed and survives restarts and deployments.
- Backup and restore procedures are documented and restore is tested.
- No secrets are committed.

## Definition of Done

Every phase is done only when:

- Acceptance criteria are verified with real command output or manual inspection.
- Proposed and implemented work are clearly distinguished.
- The PostgreSQL prerequisite is satisfied before migrations.
- No unrelated application behavior is introduced.
- The repository remains free of committed secrets.
