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
