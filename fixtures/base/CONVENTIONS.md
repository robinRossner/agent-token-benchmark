# TaskFlow conventions

These rules apply to all new and changed code. Rules marked **[lint]** are checked by
`npm run lint` (`scripts/lint.js`); the others are checked in review and by tests.

1. **File names** [lint C1]. All file names are kebab-case. Handler modules live in
   `api/handlers/` and are named `<resource>.handler.js`.
2. **No console output** [lint C2]. Never call `console.*` in `api/` or `web/`. Server code logs
   through `api/lib/logger.js` (`createLogger` / `logger.info(message, fields)`).
3. **JSDoc on exports** [lint C3]. Every exported function, class and arrow-function constant in
   `api/` and `web/` has a `/** ... */` block directly above it.
4. **Error responses** [lint C4]. Errors are always `{ "error": { "code", "message" } }`. Handlers
   throw helpers from `api/lib/errors.js` (`validationError`, `notFound`, `conflict`, ...) and never
   write 4xx/5xx responses themselves. Codes are UPPER_SNAKE_CASE.
5. **Success responses** [lint C5]. Use `sendData` (single resource, `{ data }`), `sendList` (lists,
   `{ data, meta }` with `meta = { page, pageSize, total, totalPages }`) or `sendNoContent` (204 for deletes).
   Creating returns `201`.
6. **Query parameters** [lint C6]. Names are camelCase (`pageSize`, `includeArchived`) and are read
   with the helpers in `api/lib/query.js`. Invalid values yield `400 VALIDATION_ERROR`.
   List endpoints paginate with `parsePagination` + `paginate` from `api/lib/pagination.js`.
7. **Dates** [lint C7]. Timestamps are ISO-8601 strings in UTC. Create "now" with `nowIso()` from
   `api/lib/dates.js`; never call `Date.now()` or `new Date()` elsewhere in `api/`.
8. **CSS classes** [lint C8]. Every class starts with `tf-` and uses BEM-style names
   (`tf-task-card__title`, `tf-task-card--overdue`).
9. **UI components** [lint C9]. Modules in `web/components/` are pure functions that return HTML
   strings, export `render<Name>` (e.g. `renderTaskCard`), escape all user text with `escapeHtml`
   and never touch `document` or `window`.
10. **New endpoints** [lint C10]. Register each route in `api/routes.js` (one `router.add(...)` per
    line) and document it in `docs/API.md` under a heading exactly like `### GET /api/things/:id`.
11. **Exports and line length** [lint C11]. Named exports only (no `export default`); lines are at
    most 120 characters.
12. **Tests** [lint C12]. Every handler has `test/<name>.handler.test.js`; new library modules and
    components get tests in `test/` too. Tests use `node:test` and must not need the network.
