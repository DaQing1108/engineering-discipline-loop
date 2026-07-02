---
name: Feature request
about: Propose a new step, eval scenario, or workflow change
title: "[FEATURE] "
labels: enhancement
assignees: ''
---

## What problem does this solve?

Describe the gap in the current 9-step / 6-step workflow, or the missing
verification coverage in `references/eval-scenarios.md`.

## Proposed change

- [ ] Change to full-path Step 1–9
- [ ] Change to lite-path L-STEP 1–6
- [ ] New or modified Eval scenario (`references/eval-scenarios.md`)
- [ ] Change to `references/governance.md` (owner, integrations, known limitations)
- [ ] Change to `references/init.md` (cold-start flow)
- [ ] Other (describe below)

Describe the proposed change in enough detail that it could be written directly into
`SKILL.md`.

## Why this approach

Why this solves the problem better than alternatives — especially if it changes an
existing STOP/approval point or the risk-level routing logic.

## Impact on existing behavior

Does this change any of Step 1–9 or L-STEP 1–6? If yes, note that per
[CONTRIBUTING.md](../../CONTRIBUTING.md) this requires a full Eval walkthrough
(E01–E08) with per-scenario results before merge, plus a version bump in `SKILL.md`
frontmatter (`version:` and `metadata.version`, kept in sync) and a `CHANGELOG.md`
entry.

## Additional context

Any related discussion, prior art, or examples from real usage.
