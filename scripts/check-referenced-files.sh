#!/usr/bin/env bash
# Consistency gate: every backtick-quoted `*.js` / `*.md` / `*.sh` filename
# mentioned in this repo's own Markdown must actually exist in the repo.
#
# Exists to prevent a repeat of the 2026-07-09 incident: SKILL.md described
# four PreToolUse hook scripts by name for two version syncs before anyone
# noticed the hooks/ directory itself was never shipped in this public
# mirror. That gap was invisible to a human skim because the prose read as
# complete — only a name-vs-filesystem diff catches it.
#
# Deliberately scoped to .js/.md/.sh: those are the only file types this repo
# ships (no .json/.toml manifests of its own), so widening the extension set
# would start matching example filenames from *other* projects that SKILL.md
# discusses (package.json, Cargo.toml, etc.) as false positives.
#
# Install (from repo root):
#   ln -sf ../../scripts/check-referenced-files.sh .git/hooks/pre-push-refcheck
#   (or invoke directly — see pre-push-sanitize-check.sh, which chains this in)
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# Runtime-only filename patterns that are correctly never present in the repo
# (git-ignored task/log artifacts, or illustrative example filenames like
# `.loop-state-20260621-a3f2.md` that show the naming convention, not a real
# shipped file).
ALLOWLIST_PATTERN='^(hook-trigger-log\.log|step7-verification-log\.log|trigger-counts\.log|\.loop-state.*\.md)$'

# references/governance.md's known-limitations / v1.17-candidate table exists
# specifically to name things that do NOT exist yet (with their own build
# trigger criteria) — scanning it would flag every roadmap item as "missing".
md_files=$(find . -name '*.md' -not -path './references/governance.md' -not -path './.git/*')

fail=0

candidates="$(grep -ohE '`[A-Za-z0-9_./-]+\.(js|md|sh)`' -- $md_files 2>/dev/null \
  | tr -d '`' | xargs -n1 basename | sort -u)"

# All real filenames actually shipped in the repo, for suffix matching below
# (CHANGELOG.md legitimately shortens a name to `ship-gate-check.js` after
# spelling out `discipline-loop-ship-gate-check.js` earlier in the same
# entry — that's shorthand for a real file, not a dangling reference, so a
# candidate counts as satisfied if it's a suffix of any real filename).
real_files="$(find . -type f \( -name '*.js' -o -name '*.md' -o -name '*.sh' \) -not -path './.git/*' -exec basename {} \; | sort -u)"

while IFS= read -r name; do
  [ -z "$name" ] && continue
  echo "$name" | grep -qE "$ALLOWLIST_PATTERN" && continue
  if ! printf '%s\n' "$real_files" | grep -qE -- "${name}\$"; then
    echo "[check-referenced-files] missing: \`$name\` is named in a .md file but no such file exists in the repo"
    fail=1
  fi
done <<< "$candidates"

if [ "$fail" -eq 1 ]; then
  echo "[check-referenced-files] one or more referenced files are missing — either ship them or fix the reference"
  exit 1
fi
echo "[check-referenced-files] OK — every referenced .js/.md/.sh filename exists in the repo"
exit 0
