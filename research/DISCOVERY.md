# Token-saving tools for Claude Code: discovery notes (research only, nothing installed or run)

Date: 2026-10-25. Method: web search + fetch of READMEs/blogs. Stars are as seen on fetch or on third-party snapshots (marked ~).
"Credibility" = who measured. Vendor numbers are marketing until reproduced.

## Headline finding for experiment design
The only independent, paired A/B data (JetBrains AI blog, July 2026, SkillsBench tasks via Harbor, Claude Code) says:
- Caveman: ~8.5% output-token saving over 86 tasks (advertised ~65%; first 10 tasks showed ~30%, regressed with N). No quality change.
- RTK: NO saving; +7.6% cost/task at low reasoning effort, flat at high effort; more rewritten commands = larger penalty. (rtk is already installed locally, so test it as an explicit on/off arm.)
- Ponytail: ~-10.3% cost, ~-11% time over 80 paired tasks; only tool with a statistically solid saving. Code size shrank ~15% (advertised 54%).
- Reason given: most agentic token use is file reads, reasoning, tool calls and code generation, not chat prose. Output tokens are a small share of billed tokens.
(JetBrains pages returned HTTP 403 to me; figures come from search-result summaries, InfoWorld and MindStudio. Primary URLs below.)
- https://blog.jetbrains.com/ai/2026/07/ponytail-skill-claude-tested/
- https://blog.jetbrains.com/ai/2026/07/rtk-claude-code-token-savings/
- https://blog.jetbrains.com/ai/2026/07/speak-to-ai-agents-like-cavemen-tosave-tokens/
- https://www.infoworld.com/article/4193775/talk-like-a-caveman-prompts-save-tokens-but-far-less-than-promised.html

## 1. PONYTAIL
- What: https://github.com/DietrichGebert/ponytail , MIT, ~175.8k stars / 9.6k forks (README, very fast growth; star counts this high merit mild skepticism but the repo is real). It is NOT an MCP server or CLI. It is a prompt ("lazy senior dev" / YAGNI mode) that makes the agent write less code.
- Core = ONE file: skills/ponytail/SKILL.md (~650 words, pure prompt text, no scripts). Also AGENTS.md (compact always-on version), plugin manifests, Node lifecycle hooks, slash commands (/ponytail lite|full|ultra|off, /ponytail-review, -audit, -debt, -gain), a "band" UI and a "board" page (v5).
- Mechanism: a 6-rung ladder, first that fully works wins: (1) does the feature need to exist, (2) reuse existing codebase helpers, (3) stdlib/platform feature, (4) already-installed dependency, (5) one-liner, (6) minimum code. Map callers/tests/config before editing. Never cut validation, security, error handling, accessibility. Each reply ends with 1-2 lines on what was skipped / risks.
- Modes: lite (build what was asked, suggest smaller), full (default), ultra (challenges the request too).
- What it cuts: generated code volume (and thereby output tokens, review effort, some turns). It does NOT shrink file reads, tool output, or exploration.
- Install (plugin): `/plugin marketplace add DietrichGebert/ponytail` then `/plugin install ponytail@ponytail`; also `npx skills add DietrichGebert/ponytail`. Plugin runs small Node hooks (inject ruleset each turn, incl. subagents; env PONYTAIL_SUBAGENT_MATCHER limits which subagent types get it; mode flag at ~/.claude/.ponytail-active; PONYTAIL_DEFAULT_MODE). Needs external code from GitHub -> user must approve.
- Per-subagent without installing: YES, feasible. INSTALL.md explicitly supports standalone use by copying AGENTS.md / SKILL.md into the project. So: put the SKILL.md text (or AGENTS.md) in the run directory and tell the subagent "read and follow it", or paste it into the brief. Caveat: without hooks nothing enforces persistence; relies on the model following it. Downloading the file = external content, needs approval (read it first; README warns to use only the official repo/npm package).
- Author's evidence (self-run, https://github.com/DietrichGebert/ponytail/blob/main/benchmarks/results/2026-10-07-agentic.md): 585 headless `claude -p` sessions, 39 tasks (12 tickets on FastAPI+React template, 18 surgical tasks, 9 build/show tasks), Opus 5.5, 5 runs/task, Bash DISABLED, fresh dir outside git, CLAUDE.md off. v5 vs no skill: -53% lines, -26% cost, -41% time, -45% tokens (README). Earlier versions claimed 80-94% code cut, then 54% lines/22% tokens/20% cost (Haiku 4.5) after a critic; the author revised numbers down twice. Correctness equal across arms (86-87/90). Skill-arm tests were less thorough where tests were needed. Gains concentrated on tasks where no-skill output balloons (datepicker 335 -> 10 lines); some tasks got LONGER.
- Independent: JetBrains ~-10% cost, ~-11% time, ~15% less code (80 paired tasks). Known Windows hook bug (multi-second stall per message). Author admits very verbose reasoning models can spend tokens deliberating each rung.
- Small vs complex projects: the savings come from suppressing over-building on "write new code" tasks, so it helps most on feature/greenfield work and where the model would add abstractions. On big repos the ladder's "reuse existing helpers / map callers first" step may cost extra exploration reads (opposite direction) but also avoids duplicate code. No published breakdown by repo size exists (its own benchmark page has none). On a 40-file repo with small bug-fix/feature tasks expect ~0-15% cost change; for large repos treat as unknown. Verdict: TEST (best-evidenced candidate; cheap per-subagent via file).

## 2. Requested candidates

### caveman (already installed locally)
- https://github.com/JuliusBrussee/caveman , Apache-2.0, ~115k stars. Skill + Claude Code plugin (SessionStart hook, auto-starts in every session incl. subagents) + npm CLI (`npx @caveman-ai/cli@latest`). Newer README adds "Read less" (compress logs/JSON/test output), model/effort "Auto" routing (sign-in), `/caveman-compress` for CLAUDE.md, telemetry (disable with DO_NOT_TRACK=1). Those extras are NOT in the local SKILL.md-only install; stay with the plain skill for a clean arm.
- Cuts: output prose only. Claims: ~65% output tokens (README headline; README itself notes a plain "be concise" baseline captures much of it; earlier 75%/50-65% claims withdrawn). Own 54-run test: -33.2% INPUT tokens (that is the newer proxy/compress feature, a different thing).
- Independent: JetBrains 8.5%/86 tasks; critical analyses estimate output = ~0.6-2.5% of billed session tokens, so 4-5% session saving at best. Adobe/Elastic numbers cited in README are on responses, not sessions.
- Per-subagent: YES. If the local plugin hook is active it auto-applies to all sessions; to isolate arms, either keep it off and instruct "read ~/.claude/skills/caveman/SKILL.md and follow it" in the brief, or tell baseline agents explicitly "normal mode". Check the hook does not leak into the baseline arm (flag file/SessionStart).
- Effect: small on both repo sizes (output share is small). Verdict: TEST as a cheap control arm (expect low single digits %); low risk.

### rtk (already installed locally, 0.51.0)
- https://github.com/rtk-ai/rtk , Apache-2.0, Rust binary; PreToolUse hook rewrites Bash commands to condensed output. Claims 60-90% on command output (one 30-min session 118k -> 23.9k tokens, self-reported). Only Bash is covered (Read/Grep/Glob bypass it).
- Independent: JetBrains found no saving, +7.6% cost at low effort. Plausible mechanism: condensed output hides detail, agent re-runs or re-reads. 
- Per-subagent: hook is global (settings.json). Per-run switch: baseline brief says "prefix every command with `rtk proxy`" (bypass) vs treated arm runs normal; or set separate config dirs. Note the hook may also fire in the baseline unless bypassed, so the baseline definition must be explicit.
- Effect: bigger absolute benefit on large repos with verbose test/build/git output; a 40-file zero-dependency repo has little noisy output, so ~nothing to save. Verdict: TEST as on/off arm (it is installed, free) but expect null.

### Serena (symbol-level MCP)
- https://github.com/oraios/serena , GPL-3.0 (SolidLSP MIT), ~30.7k stars. MCP toolkit: find_symbol, references, symbol-level edits via language servers (JS/TS needs typescript-language-server -> downloads npm deps). Install: `uv tool install -p 3.13 serena-agent`, `serena init`, then register as MCP; README warns NOT to install via a marketplace.
- Cuts: exploration and whole-file reads (read only the symbol body). Claims "much more token-efficient" qualitatively; I found NO rigorous published benchmark (only community "50-70%" anecdotes; "serena-slim" 50% is about tool-schema overhead, different thing). Credibility: low/anecdotal.
- Per-subagent: MCP servers are configured session/project-wide. Per-run switch is possible via a per-directory `.mcp.json` (project-scoped, each run dir gets or lacks one) plus an explicit instruction to use its tools. Subagents inherit session MCP tools, so a session-level add would leak into all arms unless dirs are separate `claude` sessions. Needs install + external code + language server download: USER APPROVAL REQUIRED.
- Effect: for ~40 files, grep+read is already cheap; tool schema overhead (~20+ tools) likely makes it a net LOSS. Clear benefit only on large repos (thousands of files). Verdict: SKIP for the small repo, mention as the "large repo" hypothesis.

### claude-context (Zilliz, semantic code search MCP)
- https://github.com/zilliztech/claude-context , MIT, ~12.6k stars. Embeds code into a vector DB (Milvus/Zilliz Cloud) and exposes search_code. Install: `claude mcp add claude-context -e <embedding-provider key> -e MILVUS_ADDRESS=... -e MILVUS_TOKEN=... -- npx @zilliz/claude-context-mcp@latest`.
- Needs: embedding API key + vector DB (cloud account) -> code chunks leave the machine. Credentials/accounts are things the user must handle personally; I would not set this up for the experiment.
- Claim: ~40% fewer tokens at equal F1 (0.40) on SWE-bench-Verified cases, tool calls 8.3 -> 5.3 (vendor eval, vs grep-only; no independent replication). Reviewers note Claude Code's own agentic grep is strong and real usage is lower than stars suggest.
- Per-subagent: MCP, project-scoped `.mcp.json` only. Verdict: SKIP (cloud keys, indexing cost, tiny repo makes retrieval pointless).

### Repo map / code index (aider-style, CODEMAP.md)
- Aider's repo map (https://aider.chat/docs/repomap.html , tree-sitter + PageRank, token-budgeted symbol outline) is the reference design. For Claude Code the nearest approach is a hand-written or generated map file (e.g. docs/repo_map.md with entry points, modules, test commands) referenced from CLAUDE.md; Composio describes it anecdotally. I found NO controlled published experiment comparing a CODEMAP.md against Claude Code's agentic search. Morph's "Aider uses 4.2x fewer tokens" is vendor-affiliated and confounded (different agents).
- Cuts: exploration (the initial glob/grep/read sweep). Install: none external if generated locally (a script or the agent itself writes CODEMAP.md: file -> exports/one-line purpose, plus run commands). Per-subagent: TRIVIALLY switchable: treated run dir contains CODEMAP.md and the brief says "read CODEMAP.md first"; baseline dir has none. Zero downloads.
- Effect: a 40-file repo map is ~1-2k tokens, which may save a few Glob/Read calls; plausible gain on this size; on large repos map must be truncated/ranked. Risk: stale or wrong map misleads. Verdict: TEST (cheapest, no external code, tests the "exploration" lever the other tools ignore). Fair-comparison note: the map generation cost must be counted separately (one-off) and the map must be produced without peeking at task specifics.

## 3. Other tools with adoption / published numbers

### context-mode (mksglu)
- https://github.com/mksglu/context-mode , ~18.5k stars (third-party snapshot, July 2026). License listings conflict (MIT vs Elastic-2.0; check). MCP server + plugin + routing skill/hooks: tool output goes through a sandbox (runs code, only stdout enters context), indexed for retrieval. Claim: 315 KB -> 5.4 KB (98%) on its own demos. Cuts: tool output / context bloat.
- Install: npm / `/plugin` (external code). Per-subagent: MCP+hooks are session-wide; per-dir `.mcp.json` possible but hooks make isolation messy. No independent benchmark found. Effect: helps when big outputs (logs, big files, web) dominate; small repo = little. Verdict: SKIP for this experiment (session-wide hooks, overlaps with rtk, big claims only on demos).

### headroom (headroomlabs-ai)
- https://github.com/headroomlabs-ai/headroom , Apache-2.0 (star count not verified). Compression layer/proxy for tool output, logs, RAG, history; reversible via cache; pip install "headroom-ai[all]", `headroom proxy --port 8788`, or MCP. Claims 60-95% on JSON, 15-20% on coding agents (self-reported). Requires ANTHROPIC_BASE_URL routing = session-wide, Python; some ONNX features need AVX2 (not Apple Silicon per the article). Verdict: SKIP (proxy = whole session, install heavy; claimed 15-20% on coding is the only relevant figure and unverified).

### pxpipe (teamchong)
- https://github.com/teamchong/pxpipe , MIT. Local proxy that renders old context/tool results as PNG images (fewer tokens). `npx pxpipe-proxy` + ANTHROPIC_BASE_URL. Claims 59-70% request size; docs admit exact strings (hashes, paths) are unreliable (0/15 exact hex recall with Opus). Session-wide, risky for correctness. Verdict: SKIP.

### token-savior (Mibayy)
- https://github.com/Mibayy/token-savior (MIT, PyPI token-savior-recall). MCP symbol/structure server with memory. Claims -77..80% active tokens, 96 tasks, Opus 4.7; the figures differ across listings (97.9% vs 100% completion) and the bench repo may be private. Low credibility until reproduced. MCP, session/project-wide. Verdict: SKIP (unverified; same category as Serena).

### Read-dedup hooks (claude-context-optimizer, cc-token-optimizer, others)
- Several small repos block redundant re-reads / filter test output. Vendor claim "30-60% per session from read dedup" (egorfedorov). Star counts unverified, likely small. Hooks = session-wide. Verdict: SKIP; could be emulated per-subagent by a brief rule "do not re-read a file you already read" (free arm variant).

### Lean-context habits (no install)
- Brief-level rules: "read with offset/limit, grep before read, no re-reads, report summary only", short CLAUDE.md, prompt caching. Free, per-subagent, no external code. Composio's "9 ways to cut token consumption" (https://composio.dev/blog/ways-to-cut-token-consumption-in-claude-code) is anecdotal. Verdict: TEST as a "lean-brief" arm (strong candidate: targets file reads, which dominate).

## 4. Anthropic plugin-directory items (listed in the plugin directory; not found online)
Searches for "Token Shield", "token-saver", "Context Compactor", "AgentOne Token Compression" found no public pages, so I cannot verify claims or packaging. Based only on the directory listings (to be confirmed by reading each package before any decision):
- Context Compactor (skill: read less, summarize state): SKILL.md-style -> feedable to a subagent as instructions; switchable per run. Likely overlaps with the lean-brief arm.
- Token Shield (playbook skill: output discipline, model routing, context linter): SKILL.md-style; output discipline overlaps with caveman; model routing is irrelevant to subagents with a fixed model (and would confound the experiment).
- token-saver (compact output + conversation snapshots): probably skill (+ maybe command/hook for snapshots); snapshots only matter for long sessions.
- AgentOne Token Compression (Iterate.ai; hooks compressing tool output/file reads, claims 40-90%): hooks = session-wide, vendor claims, same family as rtk. Treat as SKIP unless a hook-free mode exists.
All four: community tier, no published independent numbers found.

## 5. Recommended arms (besides baseline), all per-subagent feasible
| Arm | How enabled per run | Install needed |
|---|---|---|
| A. ponytail (SKILL.md/AGENTS.md as instructions) | file in run dir + "read and follow" in brief | User approves downloading ONE text file from github.com/DietrichGebert/ponytail (read before use); no plugin/hooks |
| B. repo map (CODEMAP.md) + lean-read rules in brief | CODEMAP.md in run dir; brief says read it first, avoid re-reads, use offset/limit | none (generated locally) |
| C. caveman (+ rtk as a separate on/off factor) | brief "follow caveman SKILL.md"; rtk on = default hook, off = prefix commands with `rtk proxy` | none (both already installed); verify the caveman hook is not leaking into baseline |
Optional combined arm: A+B+C (does stacking help?). Session-wide-only items (Serena, claude-context, context-mode, headroom, pxpipe, AgentOne) are skipped; if ever tried they need separate `claude` sessions with their own `.mcp.json`/settings and user-approved installs/credentials.

## 6. Experiment cautions
- Compare total billed tokens/cost (input+cache+output), not just output; log turns and success (tests pass), since savings that lower correctness are not savings.
- Multiple runs per arm: JetBrains saw caveman's effect shrink from 30% (N=10) to 8.5% (N=86); one-offs mislead.
- Task mix matters: ponytail's gains come from open-ended feature tasks; bug-fix/rename tasks see little. Include both types.
- Subagents may auto-inherit installed hooks (rtk, caveman SessionStart); define baseline explicitly and check transcripts.
- Long-context pricing tier anomalies can skew totals (JetBrains hit one).
