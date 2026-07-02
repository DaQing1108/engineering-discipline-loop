# engineering-discipline-loop (this repo)

**Version:** see `SKILL.md` frontmatter | **Type:** documentation-only (Claude Code skill definition)

## What

This repository *is* the `engineering-discipline-loop` Skill — a Markdown workflow
definition that Claude Code loads and follows, not an application. There is no build,
no lint, no test runner, and no dependency install for this repo itself.

If you're looking for the skill's own governance doc (owner, optional integrations,
known limitations), that's [`references/governance.md`](references/governance.md), not
this file. This `CLAUDE.md` is only about working on this repo.

## Quick Start

```bash
# No setup needed. Read the skill, edit it, verify per CONTRIBUTING.md.
```

## Source of Truth for Version

The skill's version lives in `SKILL.md` frontmatter, in two places that must stay
in sync:

```yaml
---
version: 1.11.0        # top-level
metadata:
  version: 1.11.0      # duplicate — keep identical to top-level
---
```

Never bump one without the other. `CHANGELOG.md` gets a new entry for every version
bump, in the same commit.

## Architecture

```
SKILL.md                        # the skill itself: frontmatter + full 9-step / 6-step workflow
CHANGELOG.md                    # version history, v1.0.0 -> current
FORK_REPORT.md                  # sanitization record for the open-source fork (informational, do not edit)
references/
├── eval-scenarios.md           # E01-E08 manual eval scenarios — required before any version bump
├── governance.md               # owner, optional integrations, update triggers, known limitations
├── init.md                     # cold-start onboarding flow for first use in a new project
├── output-templates.md         # conditionally-triggered output format templates
├── output-spec.md              # .loop-state-*.md schema, filename rule, lifecycle, boundaries
└── quality-standards.md        # three-tier delivery quality bar + pre-ship checklist
.github/ISSUE_TEMPLATE/         # bug report / feature request templates
```

`SKILL.md` is the entry point Claude Code reads. It points into `references/*.md` for
material that doesn't need to be loaded on every invocation (eval scenarios, governance,
init flow) — those pointers must stay accurate whenever `SKILL.md` is restructured.

## Key Files

```
SKILL.md                        — the workflow definition; Step 1-9 (full path) and
                                   L-STEP 1-6 (lite path) are the core logic
references/eval-scenarios.md    — the only verification method for this project (no
                                   automated tests exist)
references/governance.md        — known-limitations table, update triggers
CONTRIBUTING.md                 — the actual verification process before a version bump
CHANGELOG.md                    — append-only version history
```

## Changing Step 1-9 or L-STEP 1-6

Any change to the core workflow logic (full-path Step 1-9 or lite-path L-STEP 1-6)
requires walking the full Eval scenario table (E01-E08) in
`references/eval-scenarios.md` before the version bump, with results reported inline
per scenario — not summarized as "Eval passed." See [CONTRIBUTING.md](CONTRIBUTING.md)
for the exact process. This applies before merging, not just before tagging a release.

## Configuration

None. This is documentation — there is no `.env`, no runtime configuration, and no
secrets anywhere in this repo (confirmed in `FORK_REPORT.md`).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
