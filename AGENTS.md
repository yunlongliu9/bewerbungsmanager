# Bewerbungsmanager Agent Instructions

## Repository Status

Engineering Harness v0.1, Phase 1 Monorepo Foundation, Phase 2 PostgreSQL plus Prisma Data Layer, Phase 3A Company and Application API, Phase 3B Backend MVP, and Phase 3C Backend Audit plus API Contract Freeze are implemented. The backend includes guarded Company, Application, Contact, Interview, Note, and Dashboard modules.

Frontend features, production deployment, real authentication, and backup automation remain proposed and unimplemented.

Treat the files under `docs/` as the current source of truth for intent and scope. In particular:

- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/tasks/roadmap.md`
- `docs/decisions/0001-monorepo.md`
- `docs/decisions/0002-personal-cloud-application.md`
- `docs/evals/task-runs.md`
- `docs/api-contract.md`

Do not treat proposed architecture as implemented. Before each coding task, inspect the relevant document and the current repository state.

## Mission

Bewerbungsmanager is a personal cloud application with one owner. It records companies, applications, status changes, contacts, interviews, and notes, provides search, filtering, and a dashboard, and is accessible from multiple devices through a responsive web UI.

Prefer a small, maintainable, typed system over speculative generality.

## Architecture Boundaries

- The proposed layout is a pnpm TypeScript monorepo:
  - `apps/web`: Next.js user interface.
  - `apps/api`: NestJS API.
  - `packages/*`: shared TypeScript packages only when they remove real duplication.
  - `prisma`: database schema and migrations once implemented.
- The web app must call the API, not PostgreSQL directly.
- The API owns persistence through Prisma and exposes explicit domain operations.
- Keep UI concerns out of the API and database concerns out of the web app.
- Do not add a new service or package without a clear responsibility.
- Do not introduce public registration, multi-tenancy, or a publicly exposed database.
- Keep hosting and the authentication library undecided until a documented decision changes that.

These boundaries are proposed until the corresponding scaffolding exists.

## Security

- Never add secrets, credentials, tokens, or personal data to source files or documentation.
- Never disable, bypass, or weaken sandbox security to reach a blocked service.
- Keep environment-specific configuration in `.env` files that are git-ignored.
- Never commit `.env`, `.env.*`, or generated credential files.
- Use parameterized queries through Prisma. Do not build SQL from user input.
- Validate and normalize all input at the API boundary.
- Apply least-privilege database access and separate local development credentials from production secrets.
- Do not log passwords, tokens, or full application-note contents.
- Require authentication before any production deployment.
- Protect every private API endpoint with the authenticated owner session.
- Use HTTPS and secure session handling in production.
- Keep the PostgreSQL database private and unreachable from the public internet.
- Keep local development usable without weakening production security.
- Document and test backup and restore procedures before relying on persistent data in production.

## Code Quality

- Use TypeScript with strict mode enabled.
- Prefer explicit types at module and API boundaries.
- Keep functions small and single-purpose.
- Name files and exports by responsibility, not by generic terms such as `utils` or `misc`.
- Avoid dead code, commented-out code, and undocumented workarounds.
- Use shared types only for contracts that are genuinely shared.
- Keep migrations intentional and reviewable.

## Tool Use

- Read existing files before editing.
- Use `rg` or `rg --files` for search and file discovery.
- Use `apply_patch` for manual file edits.
- Do not use shell redirection or `cat` to create or overwrite source files.
- Do not install dependencies unless a task explicitly requires it.
- Do not change global configuration, Docker, or PostgreSQL as part of routine development.
- Do not run destructive Git commands such as `git reset --hard` or `git checkout --` without explicit user approval.

## Testing

- Tests are required for domain logic and API behavior once implementation begins.
- Run the appropriate typecheck, lint, unit, and integration commands for the changed area.
- Report only commands that were actually run and outputs that were actually observed.
- Do not invent test results or claim a passing suite that was not executed.
- If a required command cannot run, report the exact limitation.

## Change Management

- Keep changes scoped to the requested outcome.
- Do not mix unrelated refactors into a functional change.
- Preserve user changes in a dirty work tree.
- Do not commit changes unless the user explicitly asks for a commit.
- When branching is requested, use the `codex/` prefix by default.

## Workflow

Workflow: Plan -> Implement -> Verify -> Repair -> Report.

Use this workflow for engineering tasks:

1. **Plan**
   - Read the relevant product, architecture, roadmap, decision, and agent instructions.
   - Inspect the current repository and identify affected files.
   - State the intended change and any risks before editing.

2. **Implement**
   - Make the smallest change that satisfies the request.
   - Use `apply_patch` for manual edits.
   - Do not add application code, dependencies, or infrastructure unless explicitly requested.

3. **Verify**
   - Run the appropriate typecheck, lint, test, build, or read-only inspection commands.
   - Compare observed behavior with acceptance criteria.
   - Record only commands that were actually run and outputs that were actually observed.

4. **Repair**
   - For an ordinary failure, diagnose the cause and make a focused correction.
   - Re-run verification after each correction.
   - Allow up to three bounded autonomous repair attempts for the same failure.
   - Stop and report if the issue is not resolved after three attempts.

5. **Report**
   - Summarize files changed, commands run, observed results, and remaining limitations.
   - Separate proposed work from implemented work.
   - Record task-level outcomes in `docs/evals/task-runs.md`.

### Escalation

Do not proceed autonomously with:

- Destructive operations such as deleting data, dropping databases, removing Docker volumes, or running destructive Git resets.
- Handling real secrets or credentials.
- Changing permissions, sandbox restrictions, global configuration, Docker, or PostgreSQL outside the requested task.
- Architectural deviations from the documented decisions.

Stop and request explicit user approval before any of these actions.

## Reporting

After each task, report:

- Files created or changed.
- Commands run and observed results.
- Any untested or blocked capabilities.
- A clear note separating proposed work from implemented work.
- A pointer to the matching `docs/evals/task-runs.md` entry when applicable.

Keep reports concise and grounded in evidence.
