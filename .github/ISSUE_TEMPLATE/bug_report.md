---
name: Bug report
about: Report a case where the skill's actual behavior diverges from SKILL.md
title: "[BUG] "
labels: bug
assignees: ''
---

## Describe the bug

A clear description of what went wrong — e.g. a step was skipped, a STOP condition
wasn't honored, `.loop-state.md` wasn't updated correctly, the wrong path (full vs.
lite) was chosen, etc.

## Related Eval scenario (if any)

Does this reproduce one of E01–E11 in `references/eval-scenarios.md`? If so, which
one, and how does the actual behavior differ from the documented `pass_condition`?

- Scenario ID:
- Expected (`pass_condition`):
- Actual:

## Steps to reproduce

1. Task given to Claude Code: `/discipline-loop ...`
2. Path selected by the agent (full-9 / lite-6 / blocked / resume):
3. Step at which the divergence occurred:
4. What happened instead:

## Expected behavior

What `SKILL.md` says should have happened (quote the relevant section/step).

## Environment

- Skill version (`SKILL.md` frontmatter `version:`):
- Claude Code version:
- Installed as: global (`~/.claude/skills/`) / project-scoped (`.claude/skills/`)
- Optional integrations installed: `harness-rules` (yes/no), `task-router` (yes/no)
- OS:

## Additional context

Relevant `.loop-state-*.md` contents, transcript excerpts, or anything else useful.
