# T4 answer key (hidden from agents)

Score each question 0 / 1 / 2: 2 = all required facts present and correct, 1 = mostly right but missing or wrong on
one required fact (or right facts with wrong file/function attribution), 0 = wrong or not answered.
Maximum 10. Do not penalise extra correct detail, line numbers that are off by a few lines, or wording.
Penalise (-1 on that question, floor 0) any claim that contradicts the code, e.g. repeating the claim in docs/API.md
for Q3 without noticing it is wrong.

## Q1 - `GET /api/tasks?pageSize=500`
Required facts:
- `parsePagination` in `api/lib/pagination.js` (called from the task list handler via `paginate(..., parsePagination(query))`)
  reads `pageSize` with `getInt` from `api/lib/query.js`, with `max: MAX_PAGE_SIZE` (100).
- `getInt` throws `validationError(...)` (`api/lib/errors.js`): an `ApiError` with HTTP **400** and code **`VALIDATION_ERROR`**,
  message `Query parameter "pageSize" must be an integer between 1 and 100`.
- The error is caught by the try/catch in `createApp` (`api/server.js`) which calls `sendError` (`api/lib/http.js`);
  `sendError` uses `toErrorBody` (`api/lib/errors.js`).
- Body: `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.

## Q2 - deleting a project
Required facts:
- Tasks of the project are deleted, and the comments on those tasks are deleted too (cascade). Users are untouched.
- Implemented in `store.deleteProject` (`api/store.js`, ~line 74): collects the project's task ids, filters them out of
  tasks, filters comments whose `taskId` is in that set, then removes the project.
- The handler `deleteProject` in `api/handlers/projects.handler.js` only checks the project exists (404 otherwise via
  `requireProject`), calls `store.deleteProject`, logs, and replies `204` via `sendNoContent`.

## Q3 - default sort and null due dates
Required facts:
- Default `sortBy` is `createdAt`, `sortDir` is `asc`; ties are broken by numeric id. Implemented in `store.listTasks`
  / `compareTasks` in `api/store.js` (the handler passes defaults `?? 'createdAt'` / `?? 'asc'` in `api/handlers/tasks.handler.js`).
- `sortBy=dueDate` ascending: tasks with `dueDate: null` come **last**.
- `sortDir=desc`: the comparison result is multiplied by -1, so tasks with no due date come **first** (6 such tasks in the seed:
  t_9, t_18, t_27, t_36, t_45, t_54).
- This does **not** match `docs/API.md`, which says missing due dates sort last when sorting by `dueDate` (true only for asc).
  An answer that says "yes it matches" scores at most 1.

## Q4 - web base URL and error path
Required facts:
- Base URL: `globalThis.TF_API_BASE` if set, otherwise `DEFAULT_API_BASE` = `http://localhost:3000`
  (`web/lib/constants.js`), used in `web/main.js` when calling `createApiClient`.
- In `web/api-client.js` `request()`, a non-2xx response with a JSON body is turned into an `ApiClientError(status, code, message)`
  using the `error` object of the body; network failures surface as the `fetch` rejection (a TypeError).
- `web/main.js` catches it (in `loadTasks`: `error: err.message`; in `start`: `Cannot reach the API: <message>`), puts it in the
  state store's `error` field, and `render` shows it via `renderErrorBanner` (`web/components/banner.js`) as a
  `tf-banner tf-banner--error` element with `role="alert"` at the top of the page.

## Q5 - lint rules
Required facts:
- Rule **C10 `routes-documented`** in `scripts/lint.js`: parses `router.add('METHOD', '/path', ...)` lines in `api/routes.js`
  and requires a heading `### METHOD /path` for each in `docs/API.md` (it also reports documented headings that are not
  registered - both directions).
- Rule **C12 `handler-tests`**: every `api/handlers/<name>.handler.js` needs `test/<name>.handler.test.js`; for comments that is
  **`test/comments.handler.test.js`**.
