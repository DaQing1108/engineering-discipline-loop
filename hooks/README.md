# Hooks (optional)

These are the four `PreToolUse` hook scripts referenced throughout `SKILL.md`
(entry check, dependency check, diff-size check, ship-gate check). They are
**optional** — the skill's text-only rules already cover the same ground; these
scripts add an automated, tool-layer reminder/block on top so the check fires
even if the agent skips or compresses a step.

Each script:
- Is a standalone Node.js file with no dependencies (`fs`, `path`, `os`,
  `crypto` only — all built-in modules)
- Reads the tool-call payload from stdin as JSON and exits `0` (allow) or `2`
  (block, for `discipline-loop-dependency-check.js` only — the other three warn
  via `additionalContext` but never block)
- Fails open: any unexpected error (parse failure, missing file, etc.) exits
  `0` silently rather than blocking your work

| Script | Hook event | Matcher | Behavior |
|---|---|---|---|
| `discipline-loop-entry-check.js` | PreToolUse | `Write\|Edit\|MultiEdit` | Denies edits to code files (by extension) when no `.loop-state-*.md` exists yet; docs and tmp/memory paths pass through; a session-scoped bypass marker (command shown in the deny message) is the explicit, user-authorized escape hatch |
| `discipline-loop-dependency-check.js` | PreToolUse | `Write\|Edit\|MultiEdit` | Blocks (exit 2) when a manifest edit adds a new top-level dependency, until Step 3 confirms it |
| `discipline-loop-diff-size-check.js` | PreToolUse | `Write\|Edit\|MultiEdit` | Warns when a single edit adds more than 50 net-new lines |
| `discipline-loop-ship-gate-check.js` | PreToolUse | `Bash` | Warns before `git commit` if `.loop-state` shows Step 7.5 was reached but no matching AC-verification log entry exists |

## Install

1. Copy this folder's `.js` files anywhere you like — for example:

   ```bash
   mkdir -p ~/.claude/hooks
   cp hooks/discipline-loop-*.js ~/.claude/hooks/
   ```

2. Register each one in `~/.claude/settings.json` (global) or
   `.claude/settings.json` (project-scoped) under `"hooks"` → `"PreToolUse"`:

   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Write|Edit|MultiEdit",
           "hooks": [
             { "type": "command", "command": "node ~/.claude/hooks/discipline-loop-entry-check.js" }
           ]
         },
         {
           "matcher": "Write|Edit|MultiEdit",
           "hooks": [
             { "type": "command", "command": "node ~/.claude/hooks/discipline-loop-dependency-check.js" }
           ]
         },
         {
           "matcher": "Write|Edit|MultiEdit",
           "hooks": [
             { "type": "command", "command": "node ~/.claude/hooks/discipline-loop-diff-size-check.js" }
           ]
         },
         {
           "matcher": "Bash",
           "hooks": [
             { "type": "command", "command": "node ~/.claude/hooks/discipline-loop-ship-gate-check.js" }
           ]
         }
       ]
     }
   }
   ```

   Use absolute paths (not `~`) if your Claude Code version doesn't expand
   `~` inside `command`. Restart Claude Code (or start a new session) after
   editing `settings.json` — hooks are read at session start.

3. Verify they're wired up: attempt a throwaway edit to a code file (e.g. a
   `.js` or `.py`) in a fresh directory (no `.loop-state-*.md` present) and
   confirm the entry-check denies it with the gate message; a `.md` edit in
   the same directory should pass through untouched.

## Known limitation

All four scripts write their trigger log to a hardcoded path:
`~/.claude/skills/engineering-discipline-loop/references/hook-trigger-log.log`.
This only exists if you installed the skill globally per the main
[README's Install section](../README.md#install). If you used the
project-scoped install (`.claude/skills/...`) instead, logging silently
no-ops (fail-open — the hooks still warn/block correctly, you just won't get
a persisted trigger history). Create the directory manually if you want
logging under a project-scoped install:

```bash
mkdir -p ~/.claude/skills/engineering-discipline-loop/references
```
