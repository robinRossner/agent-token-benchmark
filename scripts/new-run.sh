#!/usr/bin/env bash
# Usage: scripts/new-run.sh <arm> <task> <rep>
# Creates runs/<arm>/<task>/<rep>/ from fixtures/base (+ overlay for T5) with the task brief as TASK.md.
# Prints the absolute path of the new run directory. Never copies fixtures/grading or other tasks.
set -eu

arm="${1:?usage: new-run.sh <arm> <task> <rep>}"
task="${2:?usage: new-run.sh <arm> <task> <rep>}"
rep="${3:?usage: new-run.sh <arm> <task> <rep>}"
root="$(cd "$(dirname "$0")/.." && pwd)"

[ -f "$root/tasks/$task.md" ] || { echo "unknown task: $task" >&2; exit 1; }
dest="$root/runs/$arm/$task/$rep"
[ -e "$dest" ] && { echo "run already exists: $dest" >&2; exit 1; }

mkdir -p "$dest"
cp -R "$root/fixtures/base/." "$dest/"
if [ -d "$root/fixtures/overlays/$task" ]; then
  cp -R "$root/fixtures/overlays/$task/." "$dest/"
fi
cp "$root/tasks/$task.md" "$dest/TASK.md"
echo "$dest"
