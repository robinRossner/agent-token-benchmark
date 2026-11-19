#!/usr/bin/env bash
# Usage: grade.sh <task> <run_dir>
# Copies the run into a temp dir, runs the visible suite and lint, then the hidden tests for <task>.
# Prints exactly one JSON line to stdout.
set -u

task="${1:?usage: grade.sh <task> <run_dir>}"
run="${2:?usage: grade.sh <task> <run_dir>}"
here="$(cd "$(dirname "$0")" && pwd)"

if [ "$task" = "T4" ]; then
  echo '{"task":"T4","manual":true}'
  exit 0
fi
if [ ! -d "$run" ]; then
  echo "{\"task\":\"$task\",\"error\":\"run dir not found\"}"
  exit 0
fi

tmp="$(mktemp -d "${TMPDIR:-/tmp}/tf-grade.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT
cp -R "$run"/. "$tmp"/
rm -rf "$tmp/hidden-tests" "$tmp/node_modules"

visible_ok=false
lint_ok=false
(cd "$tmp" && npm test -- --test-timeout=60000 >/dev/null 2>&1) && visible_ok=true
(cd "$tmp" && npm run lint >/dev/null 2>&1) && lint_ok=true

hidden_total=0
hidden_pass=0
if [ -d "$here/$task" ]; then
  mkdir -p "$tmp/hidden-tests"
  cp "$here/$task"/*.test.js "$tmp/hidden-tests/" 2>/dev/null
  [ -d "$here/_lib" ] && cp -R "$here/_lib" "$tmp/hidden-tests/_lib"
  out="$(cd "$tmp" && node --test --test-reporter=tap --test-timeout=60000 hidden-tests/*.test.js 2>/dev/null)"
  hidden_total="$(printf '%s\n' "$out" | sed -n 's/^# tests \([0-9][0-9]*\).*/\1/p' | tail -1)"
  hidden_pass="$(printf '%s\n' "$out" | sed -n 's/^# pass \([0-9][0-9]*\).*/\1/p' | tail -1)"
  hidden_total="${hidden_total:-0}"
  hidden_pass="${hidden_pass:-0}"
fi

printf '{"task":"%s","hidden_pass":%s,"hidden_total":%s,"visible_ok":%s,"lint_ok":%s}\n' \
  "$task" "$hidden_pass" "$hidden_total" "$visible_ok" "$lint_ok"
