# Local Real-Stack Smoke Test

Status: Completed

Date: 2026-10-18

## Goal

Verify the Next.js frontend, NestJS API, and PostgreSQL database using real HTTP requests and browser automation rather than mocks.

## Environment

- PostgreSQL: Docker Compose on `127.0.0.1:5433`.
- Database: disposable `bewerbungsmanager_smoke`.
- API: NestJS on `http://localhost:3001`.
- Web: Next.js on `http://localhost:3000`.
- Bootstrap secret and owner password were supplied only to the disposable process and are not recorded here.

## Protection

- The persistent development database was not used.
- A disposable smoke database was created, migrated, tested, and dropped.
- No Docker volumes were removed.
- No data was committed to the repository.

## HTTP Results

| Flow | Result |
| --- | --- |
| Migrations | Applied |
| Owner bootstrap | `201` |
| Login | `201` |
| Session check | `200` |
| Company create | `201` |
| Application create | `201` |
| Application list/search | `200` |
| Application detail | `200` |
| Status transition | `201` |
| Dashboard | `200` |
| Application edit | `200` |
| Application archive | `201` |
| Logout | `201` |

## Browser Results

- Opened `http://localhost:3000/login`.
- Filled the login form with the temporary smoke owner credentials.
- Login redirected to `http://localhost:3000/dashboard`.
- Dashboard loaded with real backend metrics.
- Logout initially failed through the Next.js `/api` proxy with `Invalid request origin`.
- After fixing origin validation to compare hostnames instead of ports, logout redirected to `/login`.

## Bug Found and Fixed

Next.js rewrites change the backend request `Host` while the browser sends its original `Origin`. The CSRF check previously compared full host including port, so same-host proxied mutations were rejected.

Fix:

- `OwnerAuthGuard` now compares the origin hostname to the request hostname.
- A regression test covers a proxied origin with a different port.

## Regression Verification

- Full database-backed suite: 44 tests passed.
- Frontend suite: 10 tests passed.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test`, and `pnpm format:check` passed.

## Limitations

- The smoke test used a temporary owner and disposable database.
- Browser automation verified login, dashboard load, and logout; the remaining HTTP flows were verified with curl.
