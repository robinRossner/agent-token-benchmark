# TaskFlow API

Base URL: `http://localhost:3000`. All bodies are JSON unless noted.

## Conventions

- Single resource: `{ "data": { ... } }`
- Lists: `{ "data": [ ... ], "meta": { "page", "pageSize", "total", "totalPages" } }`
- Errors: `{ "error": { "code": "NOT_FOUND", "message": "Task t_9 not found" } }`
- Pagination query parameters (all list endpoints): `page` (default 1) and `pageSize` (default 20, max 100).
- Timestamps are ISO-8601 strings in UTC.
- Error codes: `VALIDATION_ERROR` (400), `BAD_REQUEST` (400), `INVALID_JSON` (400), `NOT_FOUND` (404),
  `METHOD_NOT_ALLOWED` (405), `CONFLICT` (409), `PAYLOAD_TOO_LARGE` (413), `RATE_LIMITED` (429), `INTERNAL` (500).

## Health

### GET /api/health

Liveness probe. Returns `{ "data": { "status": "ok", "service": "taskflow", "version": "0.4.0" } }`.

## Users

### GET /api/users

Paginated list of users.

### GET /api/users/:id

One user: `{ id, name, email, role }`. `404 NOT_FOUND` for unknown ids.

## Projects

### GET /api/projects

Paginated list of projects. Archived projects are hidden unless `includeArchived=true`.

### POST /api/projects

Create a project. Body: `name` (2-80 chars, required), `description` (optional). Returns `201`.

### GET /api/projects/:id

One project: `{ id, name, description, ownerId, archived, createdAt }`.

### PATCH /api/projects/:id

Partial update of `name`, `description`, `archived`.

### DELETE /api/projects/:id

Deletes the project together with its tasks and their comments. Returns `204`.

### GET /api/projects/:id/tasks

Same as `GET /api/tasks` but scoped to one project (the `projectId` query parameter is ignored).

## Tasks

A task is `{ id, projectId, title, description, status, priority, assigneeId, dueDate, createdAt, updatedAt }`
where `status` is `todo | in_progress | done`, `priority` is `low | medium | high`, and `assigneeId` / `dueDate` may be `null`.

### GET /api/tasks

Paginated list. Filters: `projectId`, `status`, `priority`, `assigneeId` (use `none` for unassigned).
Sorting: `sortBy` (`createdAt` default, `dueDate`, `priority`, `title`) and `sortDir` (`asc` default, `desc`).
Missing due dates sort last when sorting by `dueDate`; `priority` sorts high first.

### POST /api/tasks

Create a task. Body: `projectId` (required, must exist), `title` (3-120 chars, required), `description`,
`status` (default `todo`), `priority` (default `medium`), `assigneeId`, `dueDate`. Returns `201`.

### GET /api/tasks/:id

One task.

### PATCH /api/tasks/:id

Partial update; accepts the same fields as creation except `projectId`.

### DELETE /api/tasks/:id

Deletes the task and its comments. Returns `204`.

## Comments

A comment is `{ id, taskId, authorId, body, createdAt }`.

### GET /api/tasks/:id/comments

Paginated comments for a task, oldest first.

### POST /api/tasks/:id/comments

Add a comment. Body: `authorId` (existing user, required), `body` (1-1000 chars, required). Returns `201`.

### DELETE /api/comments/:id

Delete a comment. Returns `204`.
