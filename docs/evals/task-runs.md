# Task Run Log

Status: Proposed

Version: 0.1

This file defines a lightweight, evidence-based log for engineering task outcomes. It is a specification, not an existing evaluation result.

## Purpose

Record what was attempted, what was observed, what was repaired, and where human intervention was required. The log supports review and future planning without inventing results.

## Rules

- Record only outcomes that were actually observed.
- Record commands that were actually run.
- Do not fabricate passing tests, durations, or costs.
- Do not store secrets, tokens, credentials, or personal application data.
- Distinguish proposed work from implemented work.
- Keep entries concise and append-only.

## Fields

Use these fields for each task run:

| Field | Required | Description |
| --- | --- | --- |
| `runId` | Yes | Short unique identifier for the task run |
| `task` | Yes | Summary of the requested work |
| `status` | Yes | `planned`, `in_progress`, `passed`, `failed`, `repaired`, `blocked`, or `completed` |
| `plan` | Yes | Intended steps and scope |
| `changes` | Yes | Files created or modified |
| `commands` | No | Commands run, with observed outcomes |
| `tests` | No | Tests run and their real pass or fail state |
| `repairs` | No | Repair attempts, including what changed and the result |
| `humanInterventions` | No | Approvals, decisions, or prompts provided by a human |
| `time` | No | Elapsed time when available |
| `cost` | No | Cost when available and measurable |
| `limitations` | No | Blocked or untested capabilities |
| `notes` | No | Additional context |

## Recording Guidance

- Create a new entry when work begins.
- Update the same entry after verification and each repair attempt.
- Limit autonomous repair to three bounded attempts per ordinary failure.
- Stop and record a human intervention if the issue remains after three attempts.
- Escalate immediately for destructive operations, secrets, permission changes, or architectural deviations.

## Status Flow

```text
planned
  -> in_progress
      -> passed
      -> completed
      -> failed
          -> repaired (up to three bounded attempts)
              -> passed or completed
              -> blocked or human intervention
```

## Template

```markdown
## Run: <runId>

- Task: <summary>
- Status: <status>
- Plan: <intended steps>
- Changes:
  - <file or no changes>
- Commands:
  - `<command>` -> `<observed result>`
- Tests:
  - <test name> -> <real result>
- Repairs:
  - Attempt 1: <change> -> <result>
  - Attempt 2: <change> -> <result>
- Human interventions:
  - <approval, decision, or prompt>
- Time: <elapsed time or unavailable>
- Cost: <cost or unavailable>
- Limitations: <blocked or untested capabilities>
- Notes: <additional context>
```

## Relationship to Other Documents

- `AGENTS.md` defines the Plan -> Implement -> Verify -> Repair -> Report workflow.
- `docs/tasks/roadmap.md` defines phase acceptance criteria.
- This log records evidence for those criteria without replacing the source documents.

## Recorded Runs

### Run: phase-1-monorepo-foundation

- Task: Implement Phase 1 Monorepo Foundation.
- Status: completed
- Plan: Read harness documents, scaffold pnpm workspace with Next.js and NestJS apps, configure strict TypeScript, ESLint, Prettier, tests, root scripts, gitignore, and env examples, then verify.
- Changes:
  - Added root workspace, TypeScript, Prettier, gitignore, and env example files.
  - Added `apps/web` Next.js App Router application.
  - Added `apps/api` NestJS application with `GET /health`.
  - Updated `AGENTS.md`, `docs/architecture.md`, and `docs/tasks/roadmap.md`.
- Commands:
  - `pnpm install` -> completed after approving local build scripts for `esbuild` and `unrs-resolver`.
  - `pnpm typecheck` -> passed.
  - `pnpm lint` -> passed.
  - `pnpm format:check` -> passed after scoping Prettier.
  - `pnpm test` -> passed with one-time elevated permission for Supertest localhost binding.
  - `pnpm dev` -> both applications started; web ready and API mapped `GET /health`.
  - `pnpm build` -> passed.
- Tests:
  - `apps/api/test/health.e2e-spec.ts` -> passed.
  - `apps/web` -> no test files, Vitest exited successfully with `--passWithNoTests`.
- Repairs:
  - Attempt 1: adjusted API Vitest include pattern to match `*.e2e-spec.ts`.
  - Attempt 2: moved pnpm build-script approvals to `pnpm-workspace.yaml` using `allowBuilds`.
- Human interventions:
  - Approved elevated execution for `pnpm install`.
  - Approved elevated execution for `pnpm test` to allow ephemeral localhost binding.
- Time: not recorded.
- Cost: unavailable.
- Limitations: Docker and PostgreSQL were not changed or tested. Next.js build emitted a non-blocking workspace-root warning.

### Run: phase-2-postgres-prisma-data-layer

- Task: Implement PostgreSQL and Prisma data layer.
- Status: completed
- Plan: Add local PostgreSQL Compose, Prisma integration, domain schema, initial migration, constraints, safe deletes, focused database tests, scripts, environment examples, and setup documentation.
- Changes:
  - Added `docker-compose.yml` with a localhost-only PostgreSQL service and persistent volume.
  - Added Prisma Client and Prisma CLI to `apps/api`.
  - Added `apps/api/prisma/schema.prisma`, initial migration, Prisma module, and Prisma service.
  - Added database integration tests and a dedicated database test config.
  - Added root and API database scripts plus environment examples.
  - Added `docs/setup.md` and updated harness documents.
- Commands:
  - `pnpm add @prisma/client@6` -> completed after approving the Prisma client build script.
  - `pnpm add -D prisma@6` -> completed after approving Prisma engine build scripts.
  - `prisma format` -> passed.
  - `prisma validate` -> passed with the documented local `DATABASE_URL`.
  - `prisma generate` -> passed with approved engine-cache access.
  - `docker compose up -d postgres` -> passed after switching from occupied port 5432 to localhost-only port 5433.
  - `prisma migrate dev --create-only --name init` -> created the migration.
  - `prisma migrate dev` -> applied the edited migration.
  - `prisma migrate deploy` -> applied the migration to the disposable test database.
  - `test:db` -> four database tests passed.
  - `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm format:check` -> passed.
- Tests:
  - `apps/api/test/db/schema.db-spec.ts` -> 4 tests passed.
  - `apps/api/test/health.e2e-spec.ts` -> passed in the default test run.
- Repairs:
  - Attempt 1: switched PostgreSQL image from `18-alpine` to `17-alpine` because PostgreSQL 18 changed its data-directory layout.
  - Attempt 2: moved the local port from 5432 to 5433 because an existing local PostgreSQL service already bound 5432.
  - Attempt 3: added a dedicated Vitest database config because the default include pattern filtered out `.db-spec.ts`.
- Human interventions:
  - Approved registry access for Prisma package installation.
  - Approved Docker Compose start, database creation, migration, test, and stop commands.
  - Approved dropping the disposable `bewerbungsmanager_test` database.
- Time: not recorded.
- Cost: unavailable.
- Limitations: Docker and database commands require approved elevated access in the current sandbox. Production authentication and hosting remain undecided.

### Run: phase-3a-company-application-api

- Task: Implement Company and Application API.
- Status: completed
- Plan: Add NestJS Company and Application modules, CRUD plus archive, atomic status transitions, pagination, search, filters, DTO validation, consistent errors, a secure auth boundary, and integration tests.
- Changes:
  - Added `apps/api/src/companies` and `apps/api/src/applications`.
  - Added auth guard and owner decorator boundary.
  - Added validation helper and HTTP exception filter.
  - Wired `PrismaModule`, `CompaniesModule`, and `ApplicationsModule` into `AppModule`.
  - Added API integration tests and a shared database test helper.
  - Added a transaction rollback test to the schema test suite.
- Commands:
  - `pnpm add class-validator class-transformer` -> completed.
  - `pnpm add -D @types/express` -> completed.
  - `pnpm typecheck` -> passed.
  - `pnpm lint` -> passed.
  - `pnpm build` -> passed.
  - `pnpm format:check` -> passed after formatting three files.
  - `pnpm test` -> passed for the health test.
  - `test:db` -> 13 tests passed against a disposable database.
  - `prisma validate` -> passed.
- Tests:
  - Company and Application API -> 8 tests passed.
  - Prisma schema and transaction behavior -> 5 tests passed.
  - Health endpoint -> 1 test passed.
- Repairs:
  - Attempt 1: added explicit `@Inject` decorators because Vitest/esbuild does not emit Nest constructor parameter metadata.
  - Attempt 2: added per-route validation pipes with `expectedType` for the same metadata limitation.
  - Attempt 3: scoped the default Vitest config to the health test so database-backed API tests do not run in the no-database default suite.
- Human interventions:
  - Approved dependency installation.
  - Approved Docker start, disposable database creation, migration, integration tests, database drop, and Docker stop.
  - Approved the default test suite outside the sandbox for localhost binding.
- Time: not recorded.
- Cost: unavailable.
- Limitations: Contacts, interviews, notes, and dashboard APIs remain unimplemented. Real production authentication remains undecided.

### Run: phase-3b-backend-mvp

- Task: Complete the Bewerbungsmanager backend MVP.
- Status: completed
- Plan: Audit the authentication boundary, add unauthorized-access regression tests, implement Contacts, Interviews, Notes, and Dashboard modules, add database-backed integration tests, and update documentation.
- Changes:
  - Added Contacts, Interviews, Notes, and Dashboard modules and DTOs.
  - Wired the new modules into `AppModule`.
  - Added security regression tests for unauthenticated private endpoints.
  - Added backend MVP integration tests for relationships, scheduling, cancellation, note-parent rules, and dashboard metrics.
  - Updated `AGENTS.md`, `docs/architecture.md`, `docs/tasks/roadmap.md`, and this evaluation log.
- Commands:
  - `pnpm typecheck` -> passed.
  - `pnpm lint` -> passed.
  - `pnpm build` -> passed.
  - `pnpm test` -> passed.
  - `test:db` -> 32 tests passed.
  - `prisma validate` -> passed.
  - `pnpm format:check` -> passed after formatting three files.
- Tests:
  - Backend MVP API -> 7 tests passed.
  - Company and Application API -> 8 tests passed.
  - Prisma schema and transaction behavior -> 5 tests passed.
  - Authentication boundary -> 12 tests passed.
- Repairs:
  - Attempt 1: formatted three Prettier-flagged files.
- Human interventions:
  - Approved Docker start, disposable database creation, migration, integration tests, database drop, and Docker stop.
  - Approved the default test suite outside the sandbox for localhost binding.
- Time: not recorded.
- Cost: unavailable.
- Limitations: The web MVP remains unimplemented. Production authentication and hosting remain undecided.

### Run: phase-3c-backend-audit-contract-freeze

- Task: Audit the backend and freeze the API contract.
- Status: completed
- Plan: Audit authentication, transactions, relationships, validation, pagination, errors, and concurrency; fix confirmed issues; document the implemented API contract; add regression tests.
- Changes:
  - Fixed status bypass through `PATCH /applications/:id`.
  - Added company existence validation for applications.
  - Added salary currency and range validation before database writes.
  - Enforced contact-company relationship on interview updates.
  - Excluded archived applications from interview lists and dashboard results.
  - Made status transitions concurrency-safe with conditional updates.
  - Hid internal exception messages from HTTP responses.
  - Added non-empty ID validation across DTOs.
  - Added `docs/api-contract.md`.
  - Added audit regression tests.
- Commands:
  - `pnpm typecheck` -> passed.
  - `pnpm lint` -> passed.
  - `pnpm build` -> passed.
  - `pnpm test` -> passed.
  - `test:db` -> 38 tests passed.
  - `prisma validate` -> passed.
  - `pnpm format:check` -> passed after formatting five files.
- Tests:
  - Backend audit regressions -> 6 tests passed.
  - Backend MVP API -> 7 tests passed.
  - Company and Application API -> 8 tests passed.
  - Prisma schema and transaction behavior -> 5 tests passed.
  - Authentication boundary -> 12 tests passed.
- Repairs:
  - Attempt 1: formatted five Prettier-flagged files.
- Human interventions:
  - Approved Docker start, disposable database creation, migration, integration tests, database drop, and Docker stop.
  - Approved the default test suite outside the sandbox for localhost binding.
- Time: not recorded.
- Cost: unavailable.
- Limitations: The web MVP remains unimplemented. Production authentication and hosting remain undecided.
