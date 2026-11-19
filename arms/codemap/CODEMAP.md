# CODEMAP (file → purpose → exports)

- api/handlers/comments.handler.js (35L) — GET /api/tasks/:id/comments - paginated comments for a task, oldest first.
  exports: listComments, createComment, deleteComment
- api/handlers/health.handler.js (10L) — GET /api/health - liveness probe.
  exports: getHealth
- api/handlers/projects.handler.js (80L) — Look up a project or throw a 404.
  exports: listProjects, createProject, getProject, updateProject, deleteProject, exportProject
- api/handlers/tasks.handler.js (124L) — Look up a task or throw a 404.
  exports: listTasks, listProjectTasks, createTask, getTask, updateTask, deleteTask
- api/handlers/users.handler.js (23L) — GET /api/users - paginated list of users.
  exports: listUsers, getUser
- api/lib/csv.js (22L) — Quote a single CSV cell when it contains separators, quotes or newlines.
  exports: csvCell, toCsv
- api/lib/dates.js (39L) — Pin the clock used by nowIso(). Pass null to use the real clock again.
  exports: setFixedNow, nowIso, isIsoDate, toIso
- api/lib/errors.js (61L) — Error carrying an HTTP status and a stable machine-readable code. */
  exports: ApiError, badRequest, validationError, notFound, conflict, toErrorBody
- api/lib/http.js (90L) — Write a JSON response.
  exports: sendJson, sendData, sendList, sendNoContent, sendError, readJsonBody
- api/lib/ids.js (24L) — Create a sequential id generator such as t_1, t_2, ...
  exports: createIdGenerator, idNumber
- api/lib/logger.js (37L) — Change the minimum level that gets written.
  exports: setLogLevel, setLogSink, createLogger, logger
- api/lib/page-math.js (21L) — Number of pages needed to show `total` items when each page holds `size` items.
  exports: pageCount, pageOffset
- api/lib/pagination.js (44L) — Read `page` and `pageSize` from the query string, applying defaults and bounds.
  exports: DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, parsePagination, buildMeta, paginate
- api/lib/query.js (64L) — Read an optional string query parameter (trimmed; empty counts as missing).
  exports: getString, getEnum, getInt, getBool
- api/lib/rate-limit.js (19L) — Create a fixed-window rate limiter keyed by client id.
  exports: createRateLimiter
- api/lib/validation.js (129L) — Require a non-empty string field of bounded length.
  exports: TASK_STATUSES, TASK_PRIORITIES, requireString, optionalString, optionalEnum, optionalDate, validateProjectInput, validateTaskInput, validateCommentInput
- api/main.js (9L)
- api/router.js (70L) — Split a path into non-empty segments.
  exports: createRouter
- api/routes.js (36L) — Register every HTTP route. Keep one `router.add(...)` per line: scripts/lint.js
  exports: registerRoutes
- api/seed.js (75L) — Build the deterministic seed dataset: 5 users, 4 projects, 60 tasks, 30 comments.
  exports: buildSeed
- api/server.js (55L) — Create the HTTP server (not yet listening).
  exports: createApp
- api/store.js (125L) — Decide whether a task passes a filter. Unset filter fields match everything.
  exports: createStore
- CONVENTIONS.md (34L) — ... */` block directly above it.
- docs/API.md (104L)
- package.json (17L) — /*.test.js\"",
- README.md (39L)
- scripts/lint.js (245L) — Recursively list files under a directory (relative paths, sorted).
  exports: name, name
- scripts/serve-web.js (42L) — Create a static file server for the web/ directory.
  exports: createStaticServer
- test/comments.handler.test.js (37L)
- test/health.handler.test.js (33L)
- test/helpers/app.js (41L) — Start the API on an ephemeral port with a fresh seeded store.
  exports: startTestApp
- test/lib-pagination.test.js (55L)
- test/lib-validation.test.js (66L)
- test/projects.handler.test.js (56L)
- test/router.test.js (45L)
- test/store.test.js (74L)
- test/tasks.handler.test.js (92L)
- test/users.handler.test.js (26L)
- test/web-components.test.js (64L)
- test/web-format.test.js (46L)
- test/web-state.test.js (53L)
- web/api-client.js (62L) — Error thrown for non-2xx API responses; mirrors the API's { error: { code, message } } body. */
  exports: ApiClientError, toQueryString, createApiClient
- web/components/banner.js (12L) — Error banner shown at the top of the page; empty string when there is no message.
  exports: renderErrorBanner
- web/components/comment-list.js (21L) — Comments for a task, oldest first.
  exports: renderCommentList
- web/components/pager.js (17L) — Previous / next controls with a "Page x of y" label.
  exports: renderPager
- web/components/project-list.js (20L) — Sidebar list of projects; the selected one is highlighted.
  exports: renderProjectList
- web/components/task-board.js (27L) — Kanban-style board with one column per status.
  exports: renderTaskBoard
- web/components/task-card.js (26L) — Card for one task. `options.assignee` is the resolved user object (or undefined),
  exports: renderTaskCard
- web/components/user-badge.js (14L) — Small avatar + name badge. Renders "Unassigned" when there is no user.
  exports: renderUserBadge
- web/index.html (14L)
- web/lib/constants.js (14L)
  exports: STATUSES, PRIORITIES, DEFAULT_API_BASE
- web/lib/escape.js (11L) — Escape text for safe inclusion in HTML (element content and attribute values).
  exports: escapeHtml
- web/lib/format.js (67L) — Format an ISO timestamp as "Mar 5, 2026" (UTC). Returns "No date" for empty values.
  exports: formatDate, formatStatus, formatPriority, truncate, pluralize, isOverdue
- web/lib/utils.js (42L) — Delay calls to `fn` until `wait` ms have passed without another call.
  exports: debounce, loadPreference, savePreference
- web/main.js (92L) — Paint the whole page from the current state.
- web/state/selectors.js (29L) — Tasks of the selected project grouped by status.
  exports: selectTasksByStatus, selectUsersById, selectSelectedProject
- web/state/store.js (22L) — Create a minimal observable state container.
  exports: createStore
- web/styles.css (203L)
