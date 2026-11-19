# T6 grades

| run | i1 | i2 | i3 | i4 | i5 | i6 | i7 | i8 | i9 | i10 | total | src_lines_added | test_lines_added |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baseline-1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 10 | 250 | 175 |
| baseline-2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 10 | 257 | 182 |
| rtk-1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 10 | 250 | 195 |
| rtk-2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 10 | 268 | 201 |
| caveman-1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 10 | 241 | 209 |
| caveman-2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 10 | 242 | 197 |
| ponytail-1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 10 | 234 | 162 |
| ponytail-2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 10 | 210 | 143 |
| codemap-1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 10 | 238 | 170 |
| codemap-2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 10 | 235 | 169 |

src_lines_added = '+' lines in all non-test files of the diff (api, web, docs/API.md; docs is ~26-34 of these). Test lines = test/*.

## Lost points

None. No run lost a point on any item.

## Evidence

- All 10 runs: `npm run lint` passes (12 rules, 0 problems), `npm test` passes (96-99 tests, base is 82), and the hidden fixtures/grading/T6/labels.test.js passes 11/11 (run on a scratch copy with a `_lib/app.js` shim for test/helpers/app.js).
- Handler is api/handlers/labels.handler.js everywhere; no console.*, no new Date/Date.now in api/ beyond the pre-existing seed.js ones; errors via notFound/conflict/validationError; sendData(201)/sendList/sendNoContent; filter read with getString(query, 'labelId'); label createdAt via nowIso() in store.js; all new CSS classes tf- prefixed; 4 routes registered and 4 `### METHOD /path` headings; Tasks section mentions labelIds and labelId; >=9 handler tests; web-labels test covers chip, card and client.
- Unscored observations: rtk-1 docs/API.md puts the GET/POST label headings (lines 61, 65) under the Projects section and the PATCH/DELETE ones under a Labels section (lines 71-83), so the endpoint docs are split. Pre-existing tests were untouched in every run (only new test files in the diff).
