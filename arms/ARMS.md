# Arm definitions (snippet inserted into each run brief)

RAW = "Prefix every shell command with `rtk proxy ` (e.g. `rtk proxy npm test`) so you see raw output."

- baseline : RAW only.
- rtk      : no prefix (global rtk hook condenses command output). Nothing else.
- caveman  : RAW + "Before starting, read SKILL.md in this directory's .arm/ folder and follow it for the whole task." (.arm/SKILL.md = caveman SKILL.md)
- ponytail : RAW + same line, .arm/SKILL.md = ponytail SKILL.md (v5, full level)
- codemap  : RAW + "Read .arm/CODEMAP.md first and use it to go straight to the right files. Don't re-read files you've already read; for large files use offset/limit or grep for the lines you need."

Common brief: run dir, TASK.md, work only in that dir, no subagents, final reply ≤5 lines.
Model: sonnet for all runs.
