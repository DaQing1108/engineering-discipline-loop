# Fork Report: engineering-discipline-loop

**Date:** 2026-07-02

## Nature of This Skill

This is a Markdown-based workflow/process skill for Claude Code agents (a "nine-step and
six-step disciplined coding workflow"), not application code. There are no API keys,
credentials, database connection strings, or other secrets anywhere in the source files.
The sanitization scope was entirely internal-organization references.

## Files Copied

- `SKILL.md`
- `CHANGELOG.md`
- `references/eval-scenarios.md`
- `references/governance.md`
- `references/init.md`

No files were removed (no secrets, no `.env` files, no credentials present in this skill).

## Files Removed

None.

## Secrets Extracted -> .env.example

None. No `.env.example` was generated because no secrets or environment-dependent
configuration values exist in this skill — it is pure workflow documentation.

## Internal References Replaced

14 replacements across 5 files, all falling into these categories:

- **Personal name** (1 occurrence) — an individual's name used as the skill's stated
  "Owner" was replaced with a generic placeholder framing ownership as "you, the
  skill's user".
- **Organization name** (5 occurrences) — a specific internal organization name was
  removed from the role-definition line, the scope-of-applicability description, and
  three governance bullet points; replaced with generic phrasing ("your organization",
  "your engineering team").
- **Internal product names** (2 occurrences) — four internal product names were
  removed from the scope-of-applicability section and from one Eval scenario's
  example input string; replaced with generic descriptions.
- **Hard dependency reframing** (4 occurrences) — two sibling internal-only skills
  were referenced as required dependencies; reworded to "optional integrations" with
  explicit notes that this skill has a built-in fallback and works standalone without
  them.
- **Private workspace link** (1 occurrence) — a link to a private company knowledge-base
  page was removed from the changelog entry; the surrounding changelog text describing
  what changed was preserved.
- **Environment-specific naming-collision note** (2 occurrences, in `SKILL.md` and
  `references/init.md`) — a warning about a naming collision with another installed
  skill was reworded from assuming a specific proprietary plugin ecosystem to a
  conditional, generic warning applicable to any Claude Code setup.

## Core Logic — Untouched (Verified)

Confirmed via byte-for-byte diff that the following sections are **identical** to the
source, with zero changes:

- Step 1–9 (full nine-step path): EXPLORE, PLAN, CLAUDE.md confirmation, small-step
  changes, HOOKS confirmation, tests, independent Review Agent, Requirement
  Verification (7.5), re-test/re-review close-loop, `/ship`
- L-STEP 1–6 (lite six-step path): EXPLORE, CHANGE, QUICK CHECK, TEST, VERIFY,
  HOOKS quick check (5.5), SHIP
- The Eval scenario table E01–E08 pass-conditions/expected-path/expected-stop-at
  fields (only one scenario's example `input` string had a product name removed;
  label, expected_path, expected_human_interventions, and pass_condition fields
  are untouched)
- The `.loop-state.md` state-machine design (fields, lifecycle, task-id generation,
  concurrent-session handling)
- The termination condition (3-failure `LOOP BLOCKED`) and rollback (`git stash`) logic

Verification method: the full-path and lite-path sections were extracted from both the
source and the forked `SKILL.md` and diffed line-for-line — zero differences.

The full text of Step 1–9 and L-STEP 1–6 was independently re-read before editing to
confirm no organization-specific content existed in those sections in the original
source. All internal references were confined entirely to the role-definition line,
the governance owner/dependency block, one Eval scenario's example input, the
changelog, and the init-flow naming note — matching the sanitization scope above.

## Warnings

None outstanding. A full-repo sweep after editing for organization names, personal
names, internal product names, private workspace links, and standard secret patterns
(cloud provider keys, OAuth tokens, private-key headers) returned zero matches across
all five forked files.

## Organization-Specific References Outside the Original Scope

None found beyond what's described above.

## Next Step

Run opensource-sanitizer to verify sanitization is complete.
