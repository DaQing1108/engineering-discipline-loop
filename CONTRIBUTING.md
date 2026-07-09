# Contributing to engineering-discipline-loop

This is a Markdown-based Claude Code skill, not application code. There is no
automated test suite, no CI pipeline running unit tests, and nothing to `npm install`
or `pip install`. Verification is done by an agent (or you) manually walking through
a fixed set of scenarios against the skill's actual behavior.

## Development Setup

Clone the repo, edit `SKILL.md` or the files under `references/` directly. Nothing to
install.

```bash
git clone https://github.com/DaQing1108/engineering-discipline-loop-oss.git
cd engineering-discipline-loop-oss
```

To try your changes locally before opening a PR, symlink or copy the repo into your
skills directory:

```bash
cp -r . ~/.claude/skills/engineering-discipline-loop
```

### Optional: Pre-Push Sanitization Check

This repo mirrors content synced in from a private, non-public skill definition.
`scripts/pre-push-sanitize-check.sh` is a lightweight guard that scans every commit
in a push range (not just the tip diff) for two things: generic, always-on checks
(your actual home-directory path, common secret patterns) that need no setup, and
an optional local blocklist for maintainer-specific sensitive terms — org names,
internal product codenames, and similar — that must never be written into this
tracked script, since the script itself ships in this public repo.

It also chains in `scripts/check-referenced-files.sh`, which checks the current
working tree (not the push diff) for a different failure mode: any `` `*.js` `` /
`` `*.md` `` / `` `*.sh` `` filename mentioned by name in this repo's own Markdown
must actually exist in the repo. This exists because a prior sync landed prose in
`SKILL.md` describing four hook scripts by name without the `hooks/` directory
itself ever being copied over — the mismatch went unnoticed for two version syncs
since nothing checked names against the filesystem.

It is **not installed automatically** (this repo has no build step to hook into).
To enable it:

```bash
ln -sf ../../scripts/pre-push-sanitize-check.sh .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

**This does not travel with the repo.** Cloning fresh — including on another
machine, or after `git filter-repo` style operations that remove `origin` and
require re-adding it — starts unprotected until you re-run the two lines above.
There is currently no CI-side or branch-protection backstop for this specific
check (GitHub secret scanning is enabled on this repo, but it only catches
credential-shaped strings, not organization/product-name-style leaks — this
hook is presently the only line of defense against that category).

The home-directory check can false-positive if your account name happens to
match a common path fragment (e.g. an account literally named `dev` or `test`).
Set `SANITIZE_SKIP_HOME_CHECK=1` before pushing to skip just that check if it's
misfiring on unrelated content.

If you maintain your own private/public sync like this repo does, create
`.sanitize-blocklist.local` at the repo root (already gitignored) with one literal
string per line — the hook reads it if present and only runs the generic checks
if it's absent. This complements, but does not replace, a full content review
before syncing private material into a public repo.

The same "hook lives in `.git/hooks/`, not auto-installed" pattern applies to the
existing `pre-commit` markdown-lint check in this repo — neither hook currently
has a setup script; both are opt-in, documented here for anyone who wants them.

## Verification Process (Required Before Any Version Bump)

There is no `npm test` / `pytest` equivalent here. Instead:

1. **Any change to core workflow logic** — the full-path Step 1–9 or the lite-path
   L-STEP 1–6 in `SKILL.md` — **requires walking the entire Eval scenario table**
   in [`references/eval-scenarios.md`](references/eval-scenarios.md) (currently
   E01–E24) before the version number is bumped.
2. Walk each scenario against the modified `SKILL.md`, using the scenario's `input`,
   and confirm the agent's actual behavior matches `pass_condition`.
3. **Report results inline, per scenario** — not as a blanket "Eval passed." A PR
   description (or commit body) must show something like:

   ```
   E01 (小任務輕量路徑): PASS — agent selected lite-6, shipped without stopping
   E02 (中任務完整路徑): PASS — Step 2 stopped at 📋 PLAN, waited for "proceed"
   E03 (跨 session 續跑): PASS — resumed from current_step after A1 selection
   E04 (三次失敗終止): PASS — ⛔ LOOP BLOCKED emitted on 3rd failure
   E05 (跨系統整合任務): PASS — five-point assessment output before Step 2
   E06 (L4 阻斷): PASS — 🚫 L4 BLOCKED emitted, no execution attempted
   E07 (CLAUDE.md 衝突處理): PASS — conflict type A identified, stopped for confirmation
   E08 (Reference pointer 讀取可靠性): PASS — eval-scenarios.md actually re-read,
        per-scenario results quoted rather than summarized
   ```

   Claiming "tests pass" without this per-scenario evidence does not satisfy the
   verification requirement — this mirrors the exact failure mode (E08) the skill
   itself is designed to prevent agents from committing.
4. Changes that do **not** touch Step 1–9 or L-STEP 1–6 (e.g. wording fixes in
   `references/governance.md`, changelog formatting, README updates) do not require
   a full Eval walkthrough, but should still be sanity-checked against any scenario
   they plausibly affect.

## Versioning

- The skill's version lives in `SKILL.md` frontmatter in **two places** that must
  stay in sync: the top-level `version:` field and `metadata.version`. A PR that
  bumps one without the other will not be merged.
- Every version bump requires a new entry at the top of `CHANGELOG.md` describing
  what changed and why — follow the existing entry format (see prior entries for
  v1.0.0–v1.10.1).
- Use semantic-ish versioning by feel: a new rule, step, or behavioral change is a
  minor bump; a wording/typo fix that doesn't change behavior is a patch bump.

## Branch / PR Workflow

1. Fork the repo, create a branch off `main`.
2. Make your change to `SKILL.md` and/or `references/*.md`.
3. If the change touches Step 1–9 or L-STEP 1–6, run the full Eval walkthrough above
   and include the per-scenario results in your PR description.
4. Update `CHANGELOG.md` and sync both `version:` fields in `SKILL.md` frontmatter.
5. Open a PR describing what changed and why (not just what).

## Code Style Notes

- `SKILL.md` is written primarily in Traditional Chinese (繁體中文) with English
  keywords for structural markers (`STEP`, `MUST`, `NEVER`, `STOP`) — keep this
  convention consistent when editing; don't silently switch languages mid-document.
- Keep Step/L-STEP output formats (the `✅ STEP [N] ...` confirmation lines) exact —
  other tooling and the eval scenarios pattern-match against these strings.
- Do not edit `FORK_REPORT.md` — it's a finalized historical record of the
  open-source sanitization pass, not a living doc.

## Issue Reporting

Use the issue templates under `.github/ISSUE_TEMPLATE/`:
- **Bug report** — for cases where the skill's actual behavior diverges from what
  `SKILL.md` specifies (e.g. a step is skipped, a stop condition isn't honored).
  Include which scenario (if any) from `references/eval-scenarios.md` reproduces it.
- **Feature request** — for new steps, new eval scenarios, or workflow changes.

## Using Claude Code

This repo is meant to be used *with* Claude Code — including while developing it.
If you have `engineering-discipline-loop` installed as a skill, you can dogfood it
on itself: point Claude Code at this repo and ask it to make a change under
`/discipline-loop`, though be aware Step 5/6 (hooks, tests) will report "not
applicable" since this repo has no build or test tooling to hook into.
