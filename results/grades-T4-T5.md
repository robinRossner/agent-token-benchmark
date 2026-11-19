# Grades: T4 (codebase questions) and T5 (hidden tests)

## Part 1: T4

Scale: the key's 0/1/2 per question is mapped to 0 / 0.5 / 1. The key's -1 penalty for contradicting the code (on the 0-2 scale) would be -0.5 here. No arm contradicted the code, so no penalty applied.

| arm | Q1 | Q2 | Q3 | Q4 | Q5 | total |
|---|---|---|---|---|---|---|
| baseline | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
| rtk | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
| caveman | 1 | 1 | 1 | 1 | 1 | 5 |
| ponytail | 1 | 1 | 1 | 0.5 | 1 | 4.5 |
| codemap | 1 | 1 | 1 | 0.5 | 1 | 4.5 |

Lost points:
- baseline Q4 (-0.5): does not say the error banner sits at the top of the page. The key lists this as a required fact. The code confirms it: `render` in `web/main.js:36` puts `renderErrorBanner(state.error)` first.
- rtk Q4 (-0.5): same missing "top of the page" fact.
- ponytail Q4 (-0.5): same missing "top of the page" fact.
- codemap Q4 (-0.5): same missing "top of the page" fact.
- caveman: none. It states the banner is rendered first (`web/main.js:30`, "puts renderErrorBanner(state.error) first").

Judgment call: the "top of the page" placement is a required fact in the key but a minor one. If it is not counted, all five arms score 5 and caveman no longer leads. The other facts are all correct in every arm: Q1 status 400 and VALIDATION_ERROR; Q2 cascade to tasks and comments with users untouched; Q3 the desc flip with the docs/API.md:70 mismatch noted by all five; Q5 both C10 and C12 directions.

## Part 2: T5 (codemap, hidden tests)

`bash fixtures/grading/grade.sh T5 runs/codemap/T5/1` gives hidden 6/7, visible tests and lint both pass.

Failing test: `seed data is consistent: 60 tasks, 15 per project, all referencing real projects`
(`fixtures/grading/T5/regressions.test.js:32`).

- Assertion: `fixtures/grading/T5/regressions.test.js:37`, `for (const id of ids) assert.equal(seed.tasks.filter(...).length, 15)`. Actual: `16 !== 15`, for project p_1.
- The next assertion (line 39, `t_37.projectId === 'p_4'`) would also fail. It is not reached because line 37 throws first. Codemap's t_37 is in p_1.
- Per-project counts in codemap's seed: p_1 = 16, p_2 = 15, p_3 = 15, p_4 = 14. Baseline: 15 each.

Cause: the T5 overlay (`fixtures/overlays/T5/api/seed.js:50`) set t_37 to a nonexistent project, `'p_9'`, which broke the visible "all tasks reference real projects" check. Codemap's fix is at `runs/codemap/T5/1/api/seed.js:50`: `projectId: n === 37 ? projects[0].id : projects[(n * 3) % projects.length].id`. It sends t_37 to `projects[0]` (p_1), which makes the referential check pass but moves the task to the wrong project. The correct restoration is the original formula, `projects[(n * 3) % projects.length]`, which gives `projects[3]` = p_4. Baseline (`runs/baseline/T5/1/api/seed.js:50`) restores that formula and passes 7/7.

Not graded, but noticed: codemap's `runs/codemap/T5/1/api/router.js:45` uses bare `decodeURIComponent`, with no guard. The hidden router test passes because it only uses valid escapes. With a malformed escape such as `/api/things/%E0%A4%A`, `router.match` throws `URIError: URI malformed` (checked directly). Baseline wraps this in `safeDecode` (`runs/baseline/T5/1/api/router.js:11-23`, used at line 58) and returns the segment unchanged. I did not check what the HTTP layer returns for the thrown error.

Temporary grading copies were created in a system temp directory and deleted afterwards. Nothing under `runs/` or `fixtures/` was modified.
