# T6 adherence checklist (hidden from agents)

Grade after the run on the final repository state. One point per item (0 or 1), 10 total. Items marked [auto] can be
checked by `npm run lint` plus the quick command given; the others need a short look at the diff
(`diff -r fixtures/base <run_dir>`). Functional correctness is graded separately by `grading/T6/labels.test.js`.

1. [auto] **Handler file naming** - the label endpoints live in `api/handlers/labels.handler.js` (and no other new
   handler file breaks the `*.handler.js` rule). Check: `ls <run>/api/handlers`; lint rule C1 passes.
2. [auto] **No console output** - no `console.*` in `api/` or `web/`. Check: `grep -rn "console\." api web`; lint C2.
3. [auto] **JSDoc on every new export** - lint C3 passes (new handlers, `validateLabel*`, `renderLabelChip`, store helpers if exported).
4. **Error shape** - label errors are produced by throwing `ApiError` helpers (`validationError`, `notFound`, `conflict`);
   no hand-written `{ error: ... }` or `res.writeHead(4xx)` in handlers. Check: lint C4 plus the 400/404/409 assertions in the hidden test.
5. **Response helpers** - handlers use `sendData` / `sendList` / `sendNoContent` (201 for create, 204 for delete). Check: lint C5 and the hidden test.
6. [auto] **camelCase query parameter** - the filter is `labelId`, read via `getString(query, 'labelId')` (not `label_id`, not `label`).
   Check: lint C6 and `grep -rn "labelId" api`.
7. [auto] **ISO dates** - label `createdAt` comes from `nowIso()`; no `Date.now()` / `new Date()` added to `api/`. Check: lint C7; hidden test asserts ISO format.
8. [auto] **CSS prefix** - every new class starts with `tf-` (`tf-label-chip`, `tf-task-card__labels`, ...) in styles.css and in markup. Check: lint C8.
9. [auto] **Route registration and docs** - the four label routes are registered in `api/routes.js` (one `router.add` per line) and documented
   as `### METHOD /path` headings in `docs/API.md`; the Tasks section mentions `labelIds` and `labelId`. Check: lint C10 and the hidden test.
10. **Tests present for every layer** - `test/labels.handler.test.js` has >= 8 tests, a web test covers `renderLabelChip`, the task-card chips and
    the client methods, and the existing tests were not weakened (`npm test` test count >= 82 + new tests). Check: lint C12, `npm test` summary.

Late-drift signals worth noting separately (not scored): conventions that held in steps 1-4 but slipped in steps 6-8 (for example a missing
JSDoc on `renderLabelChip`, an unprefixed CSS class, or docs added only for some endpoints).
