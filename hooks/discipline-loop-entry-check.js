#!/usr/bin/env node
// PreToolUse hook for engineering-discipline-loop v1.17.0.
// GATE (was warn-only in v1.15.0–v1.16.0): blocks Write/Edit/MultiEdit on code
// files when the working directory has no .loop-state-*.md — i.e.
// discipline-loop was never invoked for this task. L1 is NOT exempt.
//
// Scope: only source-code file extensions are gated. Docs (.md/.txt), data,
// memory files, scratchpad/tmp paths, and .notion-draft pass through freely.
//
// Escape hatch: a session-scoped bypass marker in tmpdir. Claude may create it
// ONLY after the user explicitly authorizes skipping in chat (e.g. "skip loop").
// The deny message contains the exact command, so the skip is a visible,
// auditable action instead of a silent model judgment.
//
// Fail-open: any unexpected error allows the tool call through silently.
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const CODE_EXTENSIONS = new Set([
  'py', 'sh', 'bash', 'zsh', 'fish',
  'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'vue', 'svelte',
  'rb', 'go', 'rs', 'java', 'kt', 'kts', 'swift', 'php', 'pl', 'pm', 'lua',
  'c', 'h', 'cc', 'cpp', 'hpp', 'cxx', 'm', 'mm', 'cs',
  'sql', 'html', 'css', 'scss', 'sass', 'less', 'conf',
]);

const PASS_THROUGH_PATH_SEGMENTS = ['/memory/', '/.notion-draft/', '/session-data/', '/scratchpad'];

function isGatedFile(filePath) {
  if (!filePath) return false; // can't tell — fail-open
  const normalized = filePath.replace(/\\/g, '/');
  const tmpRoots = [os.tmpdir(), '/tmp/', '/private/tmp/', '/private/var/folders/', '/var/folders/'];
  if (tmpRoots.some((r) => normalized.startsWith(r))) return false;
  if (PASS_THROUGH_PATH_SEGMENTS.some((seg) => normalized.includes(seg))) return false;
  const ext = path.extname(normalized).slice(1).toLowerCase();
  return CODE_EXTENSIONS.has(ext);
}

function hasLoopState(cwd) {
  if (!cwd || !fs.existsSync(cwd)) return true; // can't tell — don't block on an unreadable cwd
  return fs.readdirSync(cwd).some((f) => /^\.loop-state-.*\.md$/.test(f));
}

function bypassMarkerPath(sessionId, cwd) {
  const key = sessionId || crypto.createHash('md5').update(cwd || '').digest('hex').slice(0, 12);
  return path.join(os.tmpdir(), `.discipline-loop-bypass-${key}`);
}

function emitDeny(reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
}

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(input);
    const { tool_name, tool_input, session_id } = payload;
    if (!['Write', 'Edit', 'MultiEdit'].includes(tool_name)) process.exit(0);
    const filePath = tool_input && tool_input.file_path;
    if (!isGatedFile(filePath)) process.exit(0);
    const cwd = payload.cwd || process.cwd();
    if (hasLoopState(cwd)) process.exit(0);
    const marker = bypassMarkerPath(session_id, cwd);
    if (fs.existsSync(marker)) process.exit(0);
    emitDeny(
      '⛔ discipline-loop 閘門：此目錄沒有 .loop-state-*.md，本次 coding 任務尚未經 ' +
      'engineering-discipline-loop 執行（L1 也不豁免）。兩條路：' +
      '(1) 先執行 /engineering-discipline-loop 再改程式碼；' +
      '(2) 僅當使用者已在對話中顯式授權跳過（例如說「skip loop」）時，執行 ' +
      `\`touch "${marker}"\` 建立本 session 的 bypass 標記後重試。` +
      '未獲使用者顯式授權，不得自行建立 bypass 標記。'
    );
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
