# ADR 0003: Single-Owner Session Authentication

Status: Proposed

Date: 2026-10-18

## Context

Bewerbungsmanager is a personal cloud application with exactly one owner. The backend already enforces default-deny authorization with `OwnerAuthGuard`, but it did not yet establish a real owner identity or session mechanism.

## Decision

Use NestJS server-side sessions backed by PostgreSQL.

- Store one `Owner` row with a username, optional email, and Argon2id password hash.
- Require owner passwords to be at least 6 characters during bootstrap.
- Store random session tokens only as SHA-256 hashes in the `Session` table.
- Send the raw session token in an `HttpOnly`, `Secure` in production, `SameSite=Strict` cookie.
- Do not store JWTs in browser storage.
- Protect mutating requests with same-origin `Origin` validation.
- Rate limit login attempts per IP.
- Bootstrap the owner with a one-time secret and reject bootstrap after an owner exists.
- Log in with the owner username.
- Return a generic login error for missing owners and wrong passwords.

## Threat Assumptions

- The browser cookie can be stolen by an attacker with local or cross-site script execution.
- The API and web frontend run on the same origin through Next.js rewrites.
- The PostgreSQL database is private and never exposed publicly.
- The owner password is a user-held secret and is not stored in source control.
- The production environment terminates HTTPS before the application.

## Consequences

Positive:

- Session revocation and expiration are server-controlled.
- Raw session tokens are not stored in the database.
- SameSite and origin checks reduce CSRF risk.
- Authentication stays single-owner and does not require public registration or tenant isolation.

Trade-offs:

- Sessions require a database lookup on private requests.
- The in-memory login rate limiter is per-process and must be replaced with durable infrastructure before multi-instance deployment.
- Secure cookie behavior depends on production HTTPS termination.

## Alternatives Considered

### JWT in localStorage

Rejected because it is more exposed to cross-site scripting and cannot be revoked server-side as simply.

### Public registration flow

Rejected because the product has one owner and no public onboarding.

### Unauthenticated backend

Rejected because all private data must be protected by default.
