#!/usr/bin/env node
// PreToolUse hook for engineering-discipline-loop v1.15.0.
// Warns (does not block) before `git commit` if the current task's .loop-state
// shows Step 7.5 was reached but step7-verification-log.log has no matching
// task_id — i.e. the AC verification result was never recorded.
// Fail-open: any unexpected error allows the commit through silently.
const fs = require('fs');
const path = require('path');
const os = require('os');

const VERIFY_LOG = path.join(os.homedir(), '.claude/skills/engineering-discipline-loop/references/step7-verification-log.log');
const COMMIT_PATTERN = /\bgit\s+(?:[\w.-]+\s+)*commit\b/;
const MAX_READ_BYTES = 1024 * 1024; // 1MB guard — these files are normally tiny

// Anchored to line-start (multiline) so a free-text summary/notes field that
// merely mentions "step: 7.5" or "task_id: ..." in prose can't false-match —
// only an actual YAML key at the start of a line counts.
const TASK_ID_LINE = /^task_id:\s*"?([\w-]+)"?/m;
// Matches both the completed_steps list-item form ("- step: 7.5") and a bare
// scalar current_step form ("current_step: 7.5") — still anchored to line-start
// so free-text prose mentioning "step: 7.5" can't false-match either way.
const STEP_75_LINE = /^(\s*-\s*step|current_step):\s*"?7\.5"?\s*$/m;

function emitWarning(message) {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: message },
  }));
}

function readBounded(filePath) {
  if (!fs.existsSync(filePath)) return '';
  if (fs.statSync(filePath).size > MAX_READ_BYTES) return null; // too large, skip rather than block on a slow read
  return fs.readFileSync(filePath, 'utf8');
}

function findStaleTaskId(cwd) {
  if (!fs.existsSync(cwd)) return null;
  const stateFiles = fs.readdirSync(cwd).filter((f) => /^\.loop-state-.*\.md$/.test(f));
  for (const file of stateFiles) {
    const content = readBounded(path.join(cwd, file));
    if (!content) continue;
    const taskIdMatch = content.match(TASK_ID_LINE);
    if (!taskIdMatch || !STEP_75_LINE.test(content)) continue;
    const taskId = taskIdMatch[1];
    const verifyLog = readBounded(VERIFY_LOG);
    if (verifyLog === null) continue; // too large to safely scan, don't guess
    if (!verifyLog.includes(`| ${taskId} |`)) return taskId;
  }
  return null;
}

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const { tool_name, tool_input } = JSON.parse(input);
    if (tool_name !== 'Bash') process.exit(0);
    if (!COMMIT_PATTERN.test(tool_input.command || '')) process.exit(0);
    const staleTaskId = findStaleTaskId(process.cwd());
    if (staleTaskId) {
      emitWarning(`⚠️ 任務 ${staleTaskId} 的 .loop-state 顯示已進入 Step 7.5，但 step7-verification-log.log 找不到對應記錄——AC 驗收結果可能沒有寫入，commit 前請確認。`);
    }
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
