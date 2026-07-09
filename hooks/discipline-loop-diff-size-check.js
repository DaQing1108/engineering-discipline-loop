#!/usr/bin/env node
// PreToolUse hook for engineering-discipline-loop v1.15.0 Step 4 (moved from
// PostToolUse in v1.14.0 — PostToolUse ran after the write, so fs.existsSync
// always saw the file as already present and could never detect "new file").
// Warns (does not block) when a single Write/Edit exceeds 50 lines.
// Fail-open: any unexpected error is silent (no warning, no block).
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK_LOG = path.join(os.homedir(), '.claude/skills/engineering-discipline-loop/references/hook-trigger-log.log');
const LINE_LIMIT = 50;
const MAX_READ_BYTES = 1024 * 1024; // 1MB guard against reading huge existing files

function logEvent(eventType, summary) {
  const line = `${new Date().toISOString().slice(0, 16).replace('T', ' ')} | ${eventType} | ${summary}\n`;
  try { fs.appendFileSync(HOOK_LOG, line); } catch (e) { /* fail-open */ }
}

// Multiset (frequency-map) line diff — counts net-new occurrences of each line,
// not just "is this line new anywhere" (a plain Set undercounts: a line that
// already existed once anywhere in old content would never count as added,
// even if it now appears many more times as part of a large new block).
function countAddedLines(oldContent, newContent) {
  const oldFreq = new Map();
  for (const line of oldContent.split('\n')) oldFreq.set(line, (oldFreq.get(line) || 0) + 1);
  const newFreq = new Map();
  for (const line of newContent.split('\n')) newFreq.set(line, (newFreq.get(line) || 0) + 1);
  let added = 0;
  for (const [line, count] of newFreq) added += Math.max(0, count - (oldFreq.get(line) || 0));
  return added;
}

function readBounded(filePath) {
  if (fs.statSync(filePath).size > MAX_READ_BYTES) return null; // too large to diff cheaply
  return fs.readFileSync(filePath, 'utf8');
}

// Write on a brand-new path (checked before the write happens) is file creation,
// not an "edit" — never counts toward line_warning. Write on an existing path,
// and every Edit/MultiEdit, count net-new lines via the multiset diff above
// (applied uniformly so all three tools answer "how much really changed" the
// same way, instead of Write using a diff and Edit/MultiEdit using raw length).
function countChangedLines(toolName, toolInput) {
  if (toolName === 'Write') {
    const filePath = toolInput.file_path;
    if (!fs.existsSync(filePath)) return 0;
    const oldContent = readBounded(filePath);
    if (oldContent === null) return (toolInput.content || '').split('\n').length; // fallback: file too large to diff
    return countAddedLines(oldContent, toolInput.content || '');
  }
  if (toolName === 'MultiEdit') {
    return toolInput.edits.reduce((sum, e) => sum + countAddedLines(e.old_string || '', e.new_string || ''), 0);
  }
  return countAddedLines(toolInput.old_string || '', toolInput.new_string || '');
}

// exit 0 + stderr is silently discarded by Claude Code (confirmed against official
// hooks docs) — the only documented way to surface a non-blocking warning is stdout
// JSON with hookSpecificOutput.additionalContext.
function emitWarning(message) {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: message },
  }));
}

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const { tool_name, tool_input } = JSON.parse(input);
    if (!['Write', 'Edit', 'MultiEdit'].includes(tool_name)) process.exit(0);
    const lineCount = countChangedLines(tool_name, tool_input);
    if (lineCount > LINE_LIMIT) {
      const base = path.basename(tool_input.file_path || '');
      logEvent('line_warning', `${base}：本次改動 ${lineCount} 行`);
      emitWarning(`⚠️ 本次改動 ${lineCount} 行，超過 ${LINE_LIMIT} 行上限，請說明是否需要拆分為多個子單位。`);
    }
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
