#!/usr/bin/env node
// PreToolUse hook for engineering-discipline-loop v1.15.0.
// Warns (does not block) on the first Write/Edit/MultiEdit in a working
// directory that has no .loop-state-*.md — i.e. discipline-loop was never
// invoked for this task. Throttled to once per 10 minutes per cwd so a lite
// task's many small edits don't spam repeated reminders.
// Fail-open: any unexpected error allows the tool call through silently.
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const THROTTLE_MS = 10 * 60 * 1000;

function emitWarning(message) {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: message },
  }));
}

function hasLoopState(cwd) {
  if (!fs.existsSync(cwd)) return true; // can't tell — don't warn on an unreadable cwd
  return fs.readdirSync(cwd).some((f) => /^\.loop-state-.*\.md$/.test(f));
}

function shouldThrottle(cwd) {
  const hash = crypto.createHash('md5').update(cwd).digest('hex').slice(0, 12);
  const markerPath = path.join(os.tmpdir(), `.discipline-loop-entry-warned-${hash}`);
  const now = Date.now();
  if (fs.existsSync(markerPath)) {
    const last = Number(fs.readFileSync(markerPath, 'utf8').trim() || 0);
    if (now - last < THROTTLE_MS) return true;
  }
  try { fs.writeFileSync(markerPath, String(now)); } catch (e) { /* fail-open */ }
  return false;
}

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const { tool_name } = JSON.parse(input);
    if (!['Write', 'Edit', 'MultiEdit'].includes(tool_name)) process.exit(0);
    const cwd = process.cwd();
    if (hasLoopState(cwd)) process.exit(0);
    if (shouldThrottle(cwd)) process.exit(0);
    emitWarning('ℹ️ 這個目錄下沒有 .loop-state-*.md，代表尚未透過 engineering-discipline-loop 執行。若這是 L2 以上的任務，建議先跑 loop 再繼續寫程式碼。');
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
