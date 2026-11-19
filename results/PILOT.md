# Pilot: T3 (cross-file pagination bug), 1 run per arm, Sonnet

All 5 arms found the root cause (`api/lib/page-math.js:9`, Math.round → Math.ceil) and passed hidden tests 6/6, test + lint OK.

| arm | turns | total tokens | cost (Sonnet $) | vs baseline | lines added |
|---|---|---|---|---|---|
| baseline | 6 | 313k | 0.18 | – | 15 |
| rtk | 9 | 499k | 0.27 | +59% tokens | 17 |
| caveman | 7 | 378k | 0.22 | +21% | 17 |
| ponytail | 6 | 317k | 0.18 | +1% | 7 |
| codemap | 4 | 210k | 0.15 | −33% | 17 |

Cost = cache_write×3.75 + cache_read×0.30 + output×15 + input×3 per MTok.

## What the pilot taught us
- **Metric fix:** the subagent "tokens" number is the final context size (55–60k for every run, ~45k of it fixed
  overhead). Real usage is the per-turn sum from the transcript (`scripts/usage.py`), dominated by cache reads.
  **Turns are the main cost driver**: every extra turn re-reads the ~50k context.
- n=1: differences here are mostly turn-count noise (rtk took 3 extra turns, not because of rtk output).
  Only codemap's −33% (fewest turns, went straight to the file) looks plausibly real.
- T3 is too easy/small for ponytail to matter in tokens; it did produce the smallest diff (7 vs 15–17 lines).
- Setup was the expensive part: fixtures ≈ $4.0, discovery ≈ $0.7, all 5 pilot runs ≈ $1.0.
