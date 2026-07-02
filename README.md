# engineering-discipline-loop

A Claude Code skill that turns a senior engineer's coding discipline into a workflow
an agent actually follows — every time, not just when it feels like it.

## The Problem

Left to their own judgment, coding agents tend to skip the boring-but-critical parts
of software engineering:

- **No read-before-write** — editing a file without first understanding what's around it
- **Over-large diffs** — one giant commit instead of small, reviewable steps
- **Claiming tests pass without running them** — or running the wrong subset
- **Silently giving up on failures** — retrying forever, or quietly abandoning the task
- **No cross-session continuity** — losing all context the moment a session ends,
  forcing a full re-explore on every resume

`engineering-discipline-loop` is a Markdown-based Skill for [Claude Code](https://docs.claude.com/claude-code)
that wraps a disciplined nine-step workflow (and a lightweight six-step variant for
small changes) around every coding task, with built-in state persistence, a
three-failure termination rule, and git-stash rollback.

There is no application code here, no build step, no dependencies to install.
This is pure Markdown that Claude Code reads and follows as instructions.

## What It Does

- **Full 9-step path** (new features, refactors, DB/schema changes, cross-module work):
  Explore → Plan (stop for approval) → CLAUDE.md conflict check → small-step changes
  (≤50 lines each) → hooks confirmation → write tests → independent review agent →
  requirement (AC) verification → re-test/re-review close-loop → `/ship`
- **Lite 6-step path** (bug fixes, config tweaks, copy fixes, small UI changes):
  Explore → Change → Quick Check → Test → Verify → Hooks quick check → Ship
- **Risk-based routing** — a built-in fallback risk assessment (L0–L4) forces small
  tasks up to the full path when the blast radius is bigger than it looks, and blocks
  L4 (irreversible / production) tasks outright pending manual review
- **`.loop-state-{task-id}.md`** — a per-task state file that lets an agent resume
  exactly where it left off in a later session, without re-exploring the codebase
- **3-failure termination rule** — the same step failing three times halts execution
  with `⛔ LOOP BLOCKED` and a summary of what was tried, instead of looping forever
- **git-stash rollback** — a failed `/ship` stashes the working tree and reports the
  stash reference instead of leaving a half-finished commit

## Install

Copy the folder into your personal skills directory so it's available in every project:

```bash
git clone https://github.com/DaQing1108/engineering-discipline-loop.git
mkdir -p ~/.claude/skills
cp -r engineering-discipline-loop ~/.claude/skills/engineering-discipline-loop
```

Or drop it into a single project instead, so it's scoped to that repo:

```bash
mkdir -p .claude/skills
cp -r engineering-discipline-loop .claude/skills/engineering-discipline-loop
```

Claude Code picks up skills under `~/.claude/skills/` (global) or `.claude/skills/`
(project-scoped) automatically — no restart or registration step needed beyond the copy.

## Use

Inside a Claude Code session:

```
/discipline-loop Add rate limiting to the /api/upload endpoint
```

The skill also triggers implicitly on phrasing like "implement X", "modify Y module",
"continue yesterday's task", or when a `task-router`-style harness has already routed
an L0–L3 coding task to you. See `SKILL.md` for the full trigger list.

### Full path vs. lite path, in practice

```
/discipline-loop Fix typo on the login page
```
→ Small, single-module, no schema/architecture impact → **lite 6-step path**.
Explore (≤3 files) → Change (≤50 lines) → 5-question Quick Check → Test the
affected module → Verify diff is clean → Hooks quick check → Ship. No approval
stop in the middle — the whole thing can complete unattended if nothing fails.

```
/discipline-loop Add an audio pre-processing module to the STT pipeline
```
→ New feature, cross-module → **full 9-step path**. Step 1 (Explore) is read-only;
Step 2 (Plan) always stops and waits for you to reply "proceed" before any file is
touched; Step 7 spawns an independent review-agent pass instead of self-review;
Step 7.5 re-verifies every acceptance criterion from the approved Plan before
shipping.

Both paths refuse to run `/ship` without confirmed git hooks, and both persist
progress to a `.loop-state-*.md` file so a dropped session can resume from the
exact step it stopped at.

## Reference Material

- [`references/eval-scenarios.md`](references/eval-scenarios.md) — the eight manual
  eval scenarios (E01–E08) used to validate the skill's actual behavior before every
  version bump (there is no automated test runner for this — see
  [CONTRIBUTING.md](CONTRIBUTING.md))
- [`references/governance.md`](references/governance.md) — ownership, optional
  integrations, update triggers, and a structured known-limitations table
- [`references/init.md`](references/init.md) — the cold-start onboarding flow to run
  once before first use in a new project (`references/init.md` is what `SKILL.md`
  points to when you say "first time using discipline-loop in this project")
- [`references/output-templates.md`](references/output-templates.md) — output format
  templates for conditionally-triggered messages (environment mismatch, resume
  checkpoint listing, risk-assessment fallback, L4 block, loop termination, ship
  failure) — kept out of `SKILL.md` since they're read only when that specific
  condition fires, not on every task
- [`references/output-spec.md`](references/output-spec.md) — the full
  `.loop-state-*.md` schema, filename convention, lifecycle, and change boundaries
- [`references/quality-standards.md`](references/quality-standards.md) — the
  three-tier delivery quality bar and the pre-ship self-review checklist
- [`CHANGELOG.md`](CHANGELOG.md) — full version history, v1.0.0 through v1.11.0

## Using with Claude Code

This project *is* a Claude Code skill — using it with Claude Code is the whole point.
For working on this repository itself (not just using the skill it ships), see
[CLAUDE.md](CLAUDE.md).

## License

MIT — see [LICENSE](LICENSE)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
