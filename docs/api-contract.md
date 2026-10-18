# API Contract

Status: Frozen for backend MVP

Version: 0.1

This contract documents the implemented NestJS API.

## Base Rules

- Base path: `/`
- JSON request and response bodies.
- `GET /health` is public.
- Every other endpoint requires an authenticated owner and uses `OwnerAuthGuard`.
- Authenticated requests send `bewerbungsmanager_session` as an `HttpOnly` cookie.
- Mutating authenticated requests must include an `Origin` header whose host matches the request host.
- Unauthenticated private requests return:

```json
{
  "statusCode": 401,
  "message": "Authentication required",
  "error": "UNAUTHORIZED",
  "path": "/path",
  "timestamp": "2026-10-18T00:00:00.000Z"
}
```

- Validation errors return `400`.
- Missing active records return `404`.
- Conflicting domain states return `400`.
- Login is rate limited per IP and returns `429` after repeated attempts.

## Authentication

### POST /auth/bootstrap

Public one-time owner setup.

Headers:

- `x-bootstrap-secret`

Body:

```json
{
  "username": "viende",
  "email": "optional@example.com",
  "password": "long-secure-password"
}
```

Required: `username`, `password`.
`password` must be at least 6 characters.

Returns the owner without a password hash. Rejects if an owner already exists.

### POST /auth/login

Body:

```json
{
  "username": "viende",
  "password": "long-secure-password"
}
```

Sets the session cookie and returns:

```json
{
  "owner": {
    "id": "string",
    "username": "viende",
    "email": null,
    "createdAt": "2026-10-18T00:00:00.000Z",
    "updatedAt": "2026-10-18T00:00:00.000Z"
  }
}
```

Invalid credentials return the same generic `401` response.

### GET /auth/session

Requires a valid session cookie.

### POST /auth/logout

Requires a valid session cookie. Revokes the server session and clears the cookie.

## Error Shape

```json
{
  "statusCode": 400,
  "message": "string or string[]",
  "error": "BAD_REQUEST",
  "path": "/path",
  "timestamp": "2026-10-18T00:00:00.000Z"
}
```

## Pagination

List endpoints return:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

`page` defaults to `1`; `limit` defaults to `20` and is capped at `100`.

## Health

### GET /health

Public.

Response:

```json
{ "status": "ok" }
```

## Companies

### POST /companies

Body:

```json
{
  "name": "Acme GmbH",
  "website": "https://example.com",
  "location": "Berlin",
  "description": "Optional description"
}
```

Required: `name`.

### GET /companies

Query:

- `page`
- `limit`
- `search`

### GET /companies/:id

### PATCH /companies/:id

Editable fields: `name`, `website`, `location`, `description`.

### DELETE /companies/:id

Soft archive.

### POST /companies/:id/archive

Soft archive.

## Applications

### POST /applications

Body:

```json
{
  "companyId": "string",
  "jobTitle": "Software Engineer",
  "jobPostingUrl": "https://example.com/job",
  "status": "WISHLIST",
  "appliedAt": "2026-10-18T00:00:00.000Z",
  "employmentType": "FULL_TIME",
  "workMode": "REMOTE",
  "deadline": "2026-12-31",
  "nextActionAt": "2026-11-01T00:00:00.000Z",
  "priority": "HIGH",
  "salaryMin": 70000,
  "salaryMax": 90000,
  "salaryCurrency": "EUR",
  "jobDescriptionSnapshot": "Posting snapshot",
  "source": "Referral"
}
```

Required: `companyId`, `jobTitle`.

Salary range rules:

- If either `salaryMin` or `salaryMax` is provided, `salaryCurrency` is required.
- `salaryMin` cannot exceed `salaryMax`.

### GET /applications

Query:

- `page`
- `limit`
- `search`
- `status`
- `companyId`

### GET /applications/:id

Includes the company and status history.

### PATCH /applications/:id

Editable fields:

- `companyId`
- `jobTitle`
- `jobPostingUrl`
- `appliedAt`
- `employmentType`
- `workMode`
- `deadline`
- `nextActionAt`
- `priority`
- `salaryMin`
- `salaryMax`
- `salaryCurrency`
- `jobDescriptionSnapshot`
- `source`

`status` is not editable through PATCH.

### DELETE /applications/:id

Soft archive.

### POST /applications/:id/archive

Soft archive.

### POST /applications/:id/status

Body:

```json
{
  "status": "APPLIED",
  "note": "Submitted application."
}
```

Required: `status`.

This endpoint atomically updates the application status and creates a `StatusChange`.

## Contacts

### POST /contacts

Body:

```json
{
  "companyId": "string",
  "name": "Jane Doe",
  "role": "Recruiter",
  "email": "jane@example.com",
  "phone": "+49..."
}
```

Required: `companyId`, `name`.

### GET /contacts

Query:

- `page`
- `limit`
- `search`
- `companyId`

### GET /contacts/:id

### PATCH /contacts/:id

Editable fields: `companyId`, `name`, `role`, `email`, `phone`.

### DELETE /contacts/:id

Soft archive.

## Interviews

### POST /interviews

Body:

```json
{
  "applicationId": "string",
  "contactId": "string",
  "interviewerName": "Jane Doe",
  "format": "VIDEO",
  "scheduledAt": "2026-11-05T10:00:00.000Z"
}
```

Required: `applicationId`, `scheduledAt`.

If `contactId` is provided, the contact must belong to the application company.

### GET /interviews

Query:

- `page`
- `limit`
- `applicationId`
- `contactId`
- `from`
- `to`

### GET /interviews/:id

### PATCH /interviews/:id

Editable fields: `applicationId`, `contactId`, `interviewerName`, `format`, `scheduledAt`.

### POST /interviews/:id/cancel

Cancels the interview.

### DELETE /interviews/:id

Cancels the interview.

## Notes

### POST /notes

Body:

```json
{
  "companyId": "string",
  "applicationId": "string",
  "contactId": "string",
  "interviewId": "string",
  "text": "Note text"
}
```

Exactly one of `companyId`, `applicationId`, `contactId`, or `interviewId` is required.

### GET /notes

Query:

- `page`
- `limit`
- `companyId`
- `applicationId`
- `contactId`
- `interviewId`

### GET /notes/:id

### PATCH /notes/:id

Body:

```json
{ "text": "Updated note" }
```

### DELETE /notes/:id

Soft archive.

## Dashboard

### GET /dashboard

Response:

```json
{
  "activeApplicationCount": 1,
  "applicationsByStatus": {
    "WISHLIST": 0,
    "APPLIED": 1,
    "SCREENING": 0,
    "INTERVIEW": 0,
    "OFFER": 0,
    "REJECTED": 0,
    "WITHDRAWN": 0,
    "ACCEPTED": 0
  },
  "upcomingInterviews": [],
  "recentlyUpdatedApplications": [],
  "dueFollowUps": [],
  "overdueFollowUps": []
}
```

Due follow-ups have `nextActionAt` between now and the next seven days. Overdue follow-ups have `nextActionAt` in the past.
