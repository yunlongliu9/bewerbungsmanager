# ADR 0002: Personal Cloud Application

Status: Proposed

Date: 2026-10-18

## Context

Bewerbungsmanager tracks personal job applications. The owner needs access from multiple devices, which requires a cloud deployment rather than a local-only tool. At the same time, the product serves one person and does not need the account model, tenant boundaries, or public onboarding of a multi-tenant SaaS application.

The existing product requirements and architecture need a clear access model for production security and data handling.

## Decision

Build Bewerbungsmanager as a personal cloud application with:

- Exactly one owner account.
- Access from multiple devices through a responsive web UI.
- Authentication required before production.
- No public registration and no multi-tenancy.
- All private API endpoints protected by the authenticated owner session.
- HTTPS and secure sessions in production.
- Persistent PostgreSQL storage.
- Documented and testable PostgreSQL backup and restore procedures.
- No publicly exposed database.
- Local development that remains usable.

Hosting and the authentication library remain undecided. They must be selected and recorded in later ADRs without coupling the domain model to those choices.

## Consequences

Positive:

- The owner can use the same data from different devices.
- Production security requirements are explicit without SaaS complexity.
- The data model can remain simple because it does not require tenant IDs or multi-user ownership.
- The database and API boundary can be kept private by default.

Trade-offs:

- Authentication and HTTPS must be configured before production, even though they are not core job-tracking features.
- Backup and restore operations add operational responsibility.
- Deferring hosting and authentication decisions creates a known decision point before production.

## Alternatives Considered

### Local-Only Application

Keep all data on a single device.

- Simpler privacy and operations.
- Rejected because it does not meet the multi-device requirement.

### Multi-Tenant SaaS

Support many users, accounts, invitations, and tenant isolation.

- Reusable beyond one owner.
- Rejected because it adds public registration, tenant scoping, and account-management complexity that the product does not need.

### Unauthenticated Public Web Application

Deploy without authentication.

- Faster to deploy initially.
- Rejected because job application data is private and must not be publicly accessible.

## Related Decisions

- ADR 0001: pnpm TypeScript monorepo.
- `docs/product-requirements.md`: personal cloud requirements and production acceptance criteria.
- `docs/architecture.md`: access, security, backup, and restore model.
