# Product Requirements

Status: Proposed

Version: 0.1

This document defines the MVP for Bewerbungsmanager, a personal cloud application for one job seeker.

## Problem

Tracking job applications across emails, spreadsheets, and memory is error-prone. The user needs one place to record where they applied, who they contacted, what stage each application is in, and what to do next.

## Goals

- Record and retrieve job applications quickly.
- Keep companies, contacts, interviews, and notes connected.
- Show current progress and next actions on a dashboard.
- Support search and filtering without requiring complex configuration.
- Allow the owner to access their data from multiple devices through a responsive web UI.

## Non-Goals

- Multi-user collaboration.
- Public registration and multi-tenancy.
- Applicant tracking for recruiters or teams.
- Automatic email parsing or job-board integration in the MVP.
- Advanced analytics, reporting exports, or calendar integration in the MVP.
- Mobile native applications.

## Users

- Primary user: one owner managing their own applications.
- No tenant roles, invitations, or administrative accounts are required.

## Personal Cloud Requirements

Bewerbungsmanager is a personal cloud application, not a local-only tool and not a multi-tenant SaaS product.

The system must:

- Support exactly one owner.
- Be accessible from multiple devices through a responsive web UI.
- Require authentication before production use.
- Prohibit public registration and tenant separation.
- Protect all private API endpoints behind the authenticated owner session.
- Use HTTPS and secure sessions in production.
- Store data in persistent PostgreSQL storage.
- Document backup and restore requirements and procedures.
- Keep the database private and never expose it to the public internet.
- Continue to support local development.

The hosting provider and authentication library remain undecided and must be recorded in a later architecture decision when selected.

## Core Concepts

### Company

A company represents an employer or organization.

Attributes:

- Name
- Website
- Location
- Optional description

### Application

An application connects a company to a job opportunity.

Attributes:

- Job title
- Job posting URL
- Company association
- Current status
- Applied date
- Optional salary range
- Optional salary currency
- Employment type
- Work mode
- Optional deadline
- Optional next action date and time
- Optional priority
- Optional job description snapshot
- Optional source

Field definitions:

- `employmentType`: the form of employment, such as full-time, part-time, contract, internship, freelance, or other.
- `workMode`: where the work happens, such as onsite, hybrid, remote, or unspecified.
- `deadline`: an optional date associated with the application or decision.
- `nextActionAt`: an optional timestamp for the next follow-up action.
- `priority`: an optional ordering hint, such as low, normal, high, or urgent.
- `salaryCurrency`: an ISO 4217 currency code used with the salary range.
- `jobDescriptionSnapshot`: a plain-text copy of the posting so important details remain available if the source changes or disappears.

### Status

Each application has exactly one current status. The MVP must support a defined status workflow.

Initial statuses:

- Wishlist
- Applied
- Screening
- Interview
- Offer
- Rejected
- Withdrawn
- Accepted

Status changes must be timestamped and retained as history.

### Contact

A contact is a person at a company.

Attributes:

- Name
- Role or title
- Email
- Phone
- Company association
- Optional notes

### Interview

An interview is an event attached to an application.

Attributes:

- Application association
- Scheduled time
- Interviewer or contact association
- Format, such as phone, video, onsite, or technical
- Optional notes

### Note

A note is free-form context attached to a company, application, contact, or interview.

Attributes:

- Text
- Author, defaulting to the current user
- Timestamp

## Functional Requirements

### Companies

- Create, view, edit, and archive a company.
- Prevent duplicate exact-name company creation through a validation warning.
- Show related applications and contacts.

### Applications

- Create an application linked to a company.
- View all applications.
- Edit application details, including employment type, work mode, deadline, next action, priority, salary currency, and job description snapshot.
- Change application status while preserving status history.
- Archive applications that are no longer relevant.

### Status Management

- Assign one current status per application.
- Record the timestamp for each status change.
- Show recent status changes in application detail.

### Contacts

- Create and edit contacts linked to a company.
- Link contacts to applications or interviews where useful.

### Interviews

- Schedule and edit interviews for an application.
- View upcoming and past interviews.

### Notes

- Add notes to any supported parent record.
- Show notes in reverse chronological order.

### Search and Filter

- Search by company name, job title, contact name, and note text.
- Filter applications by current status.
- Filter applications by company.
- Filter applications by work mode and priority.
- Combine search and filters.
- Preserve filters while navigating to and from detail pages.

### Dashboard

The dashboard is the default landing view after the MVP is implemented.

It must show:

- Active application count.
- Applications by status.
- Upcoming interviews.
- Recently updated applications.
- Applications requiring a follow-up based on `nextActionAt` or an explicitly marked next action.

## Data Rules

- An application requires a company.
- A status change requires a valid application.
- A contact belongs to exactly one company.
- An interview belongs to exactly one application.
- If a salary range is provided, a salary currency must be provided.
- `priority`, `employmentType`, and `workMode` must use allowed values.
- `deadline` and `nextActionAt` must be valid dates or timestamps when present.
- Deleting a company with related records must be prevented or require explicit handling.

## Non-Functional Requirements

- The web app must be usable on desktop and mobile viewport sizes.
- Initial page load should target a reasonable local-development experience without blocking correctness.
- Sensitive data must not be committed to the repository.
- Forms must validate required fields and URL format where URLs are collected.
- The system should remain usable with a single local PostgreSQL instance during the MVP.
- Production traffic must use HTTPS.
- Production sessions must be securely issued and invalidated on sign-out.
- PostgreSQL data must persist across application restarts and deployments.
- Backup and restore procedures must be documented and testable.
- No database port or database service may be exposed directly to the public internet.

## MVP Acceptance Criteria

The MVP is complete when:

1. A user can create and edit companies and applications, including employment type, work mode, deadline, next action, priority, salary currency, and job description snapshot.
2. A user can change application status and see status history.
3. A user can add contacts and interviews.
4. A user can add notes to companies, applications, contacts, and interviews.
5. A user can search and filter applications.
6. A dashboard shows the required summary data, including follow-ups derived from `nextActionAt`.
7. The web UI is usable from multiple devices.
8. Production access requires authentication and HTTPS.
9. Private API endpoints reject unauthenticated access in production.
10. PostgreSQL remains persistent and private.
11. Backup and restore requirements are documented and at least one restore path is tested.
12. The documented test suite passes in the implemented environment.
13. No secrets or application data are present in source control.

## Out of Scope for MVP

- Public registration and multi-tenant account management.
- Selection of a hosting provider or authentication library during this documentation phase.
- Email or calendar integrations.
- Job-board scraping.
- Analytics exports.
- Deployment pipeline hardening.

Authentication is not a feature for the MVP user experience, but it is a production prerequisite. A production deployment must not be considered complete without owner authentication, HTTPS, secure sessions, and private API protection.
