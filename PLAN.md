# Experiment: do token-saving skills actually save tokens on coding tasks?

## Question
For a fixed set of coding tasks, does adding a "token-saving" skill/tool lower
total tokens per **successful** task, without lowering success rate or quality?

## What's already on this machine
- `caveman` skill (installed) – terse output style.
- `rtk` – condenses shell command output; already active
  globally via the agent's user-level config, so the current "baseline" is not clean.
- The folder is empty – fixtures must be built first.
- No `claude` CLI on PATH, so runs go through subagents (Agent tool). Each Agent
  result reports total tokens, tool-use count and duration – that's the meter.

## Phase 0 – Discovery (1 Sonnet subagent, web research)
Shortlist 4–5 candidates, with install method, what they cut (input vs output,
reads vs command output) and how to switch them on/off per run. Starting list
to verify, not assumed:
- **caveman** – shorter prose/output.
- **RTK** – shorter command output.
- **Serena** (MCP, symbol-level navigation) – fewer whole-file reads.
- **Repo map / code index** approach (e.g. a generated `CODEMAP.md` skill, or
  claude-context style semantic search) – fewer exploratory reads.
- Any well-known "concise output" / "lean context" skill found in the plugin
  catalog or GitHub.

Pick **3 arms + baseline**. Anything needing a download/install gets the owner's OK first.

## Phase 1 – Fixtures (1 Sonnet subagent, built once, then frozen)
A small but realistic monorepo (~30–40 files) in `fixtures/base/`:
- `web/` – small React (Vite) or vanilla TS UI with component tests.
- `api/` – small Node/Express or FastAPI service with a test suite.
- `CONVENTIONS.md` – house rules (naming, error format, logging, file layout).
- Seeded bugs + **hidden tests** in `fixtures/grading/` (agents never see them).

Each run copies `fixtures/base` → `runs/<arm>/<task>/<rep>/`, so every run starts identical.

## Phase 2 – Tasks (6 domains)
| # | Domain | Task | Graded by |
|---|---|---|---|
| T1 | UI | Add a filterable/sortable list component with empty/loading states | hidden tests + rubric (Haiku) |
| T2 | Backend | Add an endpoint with validation, pagination and error format per CONVENTIONS | hidden tests |
| T3 | Bug fix | Find & fix a seeded cross-file bug from a vague bug report | hidden test |
| T4 | Navigation | Answer 5 questions about the codebase (where/why/how) | answer key |
| T5 | Command-heavy | Make lint + full test suite pass (several noisy failures) | exit codes |
| T6 | Long-horizon | 8-step spec built incrementally (feature spans api+web), must keep all CONVENTIONS rules throughout | hidden tests + 10-item adherence checklist |

T6 is the "follow a long-term task" test: it checks whether terse styles or
compressed output make the agent drop constraints late in the task.

## Phase 3 – Runs
- Arms: **baseline**, **caveman**, **RTK**, **navigation tool (Serena or repo-map)**.
  (Optionally a 5th "stack" arm = all three combined, if budget allows.)
- Same brief per task for every arm; only the arm's switch differs.
- Model: **Sonnet** for every run (fixed), so differences come from the arm.
- Reps: **2 per cell** → 4 arms × 6 tasks × 2 = **48 runs**.
- Runs go in parallel batches (each in its own directory, never shared files).
- RTK on/off: its hook is global, so the non-RTK arms will run commands through
  `rtk proxy <cmd>` (raw output) – to be confirmed in the pilot by checking how the
  hook is wired. If that doesn't work cleanly, RTK arms run in a separate batch with
  the hook toggled.

## Phase 4 – Measurement & analysis
Per run, logged to `results/results.csv`:
- total tokens, tool calls, wall time (from the Agent result)
- pass/fail on hidden tests, rubric score (UI), adherence score (T6)
- files read / bytes of command output (from the run's own log)

Report (Haiku aggregates, I check the numbers):
- **tokens per successful task** per arm and per domain (primary metric)
- success-rate delta vs baseline (a skill that saves 20% but fails more is a loss)
- where each skill helps/hurts (e.g. RTK on T5, navigation on T3/T4, caveman on T6 adherence)
- caveats: n=2 per cell is noisy → only call differences >~15% meaningful

## Budget & stop rules (5h window)
- **Pilot first**: T3 × 4 arms × 1 rep (4 runs). Expect roughly 30–80k tokens/run.
  Usage is checked after the pilot; we then keep 2 reps, drop to 1, or cut a task.
- Full run estimate: ~48 runs × ~50k ≈ **2–3M tokens**, mostly Sonnet; discovery,
  fixtures and grading add ~10–15%.
- The main-session context stays small: subagents return only a short summary +
  write details to files; grading is scripted.
- Hard stop if any batch overshoots its estimate by 2× – reassess before continuing.

## Known limitations
- Agent results give *total* tokens, not an input/output split, so caveman's main
  effect (output tokens, which weigh more) may be understated.
- Subagents inherit the global user-level agent config, so "baseline" = the normal setup minus RTK.
- Small fixture repo favours tools less than a large real codebase would
  (navigation tools especially).

## Order of work once the go-ahead
1. Discovery → owner approves the arm list (and any installs)
2. Build + verify fixtures and hidden tests
3. Pilot (4 runs) → usage check
4. Full matrix in batches
5. Grade, aggregate, write the report (`results/REPORT.md`)
