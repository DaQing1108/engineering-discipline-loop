#!/usr/bin/env bash
# Lightweight pre-push gate for this public mirror repo.
#
# Scans every commit in the push range (not just the tip diff) for two kinds
# of leaks: (1) generic, always-on checks that need no configuration, and
# (2) an optional local blocklist for maintainer-specific sensitive terms
# (org name, internal product codenames, etc.) that must never live in this
# tracked script, since the script itself ships in the public repo.
#
# Install (from repo root):
#   ln -sf ../../scripts/pre-push-sanitize-check.sh .git/hooks/pre-push
#   chmod +x .git/hooks/pre-push
#
# Optional: create .sanitize-blocklist.local at repo root (gitignored),
# one literal string per line, '#' for comments, blank lines ignored.
set -euo pipefail

EMPTY_TREE_SHA="4b825dc642cb6eb9a060e54bf8d69288fbee4904"
BLOCKLIST_FILE="$(git rev-parse --show-toplevel)/.sanitize-blocklist.local"
fail=0

check_range() {
  local range="$1"
  local diff_text
  # -m: also show diffs for merge commits (default `git log -p` hides them,
  # which would let a leak reintroduced only during conflict resolution slip
  # through undetected — this is the exact shape of the incident this script
  # exists to prevent).
  if ! diff_text="$(git log -p -m "$range" -- . 2>&1)"; then
    echo "[pre-push-sanitize] blocked: could not scan range \"$range\" (git log failed) — fix the range or investigate before pushing"
    fail=1
    return 0
  fi
  [ -z "$diff_text" ] && return 0

  # Generic check 1: this machine's actual home directory path/username,
  # computed at runtime — never hardcoded, works for any contributor.
  # Skippable via SANITIZE_SKIP_HOME_CHECK=1 if your account name happens to
  # collide with a common path fragment (e.g. "dev", "test") and this check
  # false-positives on unrelated content.
  if [ "${SANITIZE_SKIP_HOME_CHECK:-0}" != "1" ]; then
    local home_user
    home_user="$(basename "$HOME")"
    if [ -n "$home_user" ] && printf '%s' "$diff_text" | grep -qF "/$home_user/"; then
      echo "[pre-push-sanitize] blocked: found local home-directory path (/$home_user/) in pushed content"
      echo "[pre-push-sanitize] if this is a false positive (e.g. your account name matches a common path fragment), re-run with SANITIZE_SKIP_HOME_CHECK=1"
      fail=1
    fi
  fi

  # Generic check 2: common secret patterns.
  if printf '%s' "$diff_text" | grep -qE 'AKIA[0-9A-Z]{16}'; then
    echo "[pre-push-sanitize] blocked: found what looks like an AWS access key ID"
    fail=1
  fi
  if printf '%s' "$diff_text" | grep -qE -- '-----BEGIN [A-Z ]*PRIVATE KEY-----'; then
    echo "[pre-push-sanitize] blocked: found a private key header"
    fail=1
  fi

  # Local blocklist: maintainer-specific terms, never committed to this repo.
  if [ -f "$BLOCKLIST_FILE" ]; then
    if [ ! -r "$BLOCKLIST_FILE" ]; then
      echo "[pre-push-sanitize] blocked: $BLOCKLIST_FILE exists but is not readable"
      fail=1
    else
      # Append a trailing newline via process substitution so a blocklist
      # file whose last line has no final newline doesn't silently drop
      # that last term (bash `read` returns non-zero on an unterminated
      # final line, which would otherwise exit the loop before processing it).
      while IFS= read -r term; do
        [ -z "$term" ] && continue
        case "$term" in \#*) continue ;; esac
        if printf '%s' "$diff_text" | grep -qFi "$term"; then
          echo "[pre-push-sanitize] blocked: found blocklisted term \"$term\" in pushed content"
          fail=1
        fi
      done < <(cat "$BLOCKLIST_FILE"; echo)
    fi
  else
    echo "[pre-push-sanitize] note: no .sanitize-blocklist.local found — only generic checks ran"
  fi
}

while read -r _local_ref local_sha _remote_ref remote_sha; do
  [ "$local_sha" = "0000000000000000000000000000000000000000" ] && continue
  if [ "$remote_sha" = "0000000000000000000000000000000000000000" ]; then
    check_range "$EMPTY_TREE_SHA..$local_sha"
  else
    check_range "$remote_sha..$local_sha"
  fi
done

if [ "$fail" -eq 1 ]; then
  echo "[pre-push-sanitize] push blocked — fix the above or use --no-verify to override (not recommended)"
  exit 1
fi
exit 0
