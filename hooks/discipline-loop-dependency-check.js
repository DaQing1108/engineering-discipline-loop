#!/usr/bin/env node
// PreToolUse hook for engineering-discipline-loop v1.14.0 Step 3.
// Detects newly-added top-level dependencies in manifest files on Write/Edit.
// Exit 0 = allow, Exit 2 = block/needs-confirmation (message goes to stderr).
// Fail-open: any unexpected error allows the tool call through.
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK_LOG = path.join(os.homedir(), '.claude/skills/engineering-discipline-loop/references/hook-trigger-log.log');
const JSON_MANIFESTS = ['package.json'];
const TEXT_MANIFESTS = {
  'pyproject.toml': /^[a-zA-Z0-9_.-]+\s*=\s*["\[]|^\s*[a-zA-Z0-9_.-]+\s*>=|dependencies\s*=\s*\[/,
  'Cargo.toml': /^[a-zA-Z0-9_-]+\s*=\s*["{]/,
  'go.mod': /^\s*require\s|^\s*[a-zA-Z0-9_.\/-]+\s+v[0-9]/,
};

function logEvent(eventType, summary) {
  const line = `${new Date().toISOString().slice(0, 16).replace('T', ' ')} | ${eventType} | ${summary}\n`;
  try { fs.appendFileSync(HOOK_LOG, line); } catch (e) { /* fail-open: logging must never block the tool call */ }
}

function extractDeps(content) {
  const json = JSON.parse(content);
  const deps = {};
  for (const key of ['dependencies', 'devDependencies']) {
    if (json[key]) Object.assign(deps, json[key]);
  }
  return new Set(Object.keys(deps));
}

// Returns null when an Edit/MultiEdit's old_string can't be located — caller must
// treat that as "can't reliably reconstruct", not as "no change" (silent-bypass fix).
function applyOneEdit(content, old_string, new_string, replace_all) {
  if (!content.includes(old_string)) return null;
  return replace_all ? content.split(old_string).join(new_string) : content.replace(old_string, new_string);
}

function reconstructNewContent(oldContent, toolName, toolInput) {
  if (toolName === 'Write') return toolInput.content;
  if (toolName === 'MultiEdit') {
    let content = oldContent;
    for (const { old_string, new_string, replace_all } of toolInput.edits) {
      content = applyOneEdit(content, old_string, new_string, replace_all);
      if (content === null) return null;
    }
    return content;
  }
  const { old_string, new_string, replace_all } = toolInput;
  return applyOneEdit(oldContent, old_string, new_string, replace_all);
}

function addedLines(oldContent, newContent) {
  const oldLines = new Set(oldContent.split('\n'));
  return newContent.split('\n').filter((l) => !oldLines.has(l));
}

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const { tool_name, tool_input } = JSON.parse(input);
    if (!['Write', 'Edit', 'MultiEdit'].includes(tool_name)) process.exit(0);
    const filePath = tool_input.file_path;
    const base = path.basename(filePath || '');
    const fileExists = fs.existsSync(filePath);
    if (!fileExists) process.exit(0); // new manifest = project init, not "adding a dependency"

    if (JSON_MANIFESTS.includes(base)) {
      const oldContent = fs.readFileSync(filePath, 'utf8');
      const newContent = reconstructNewContent(oldContent, tool_name, tool_input);
      if (newContent === null) {
        logEvent('needs_confirmation', `${base}：old_string 對不上檔案內容，無法可靠重建，需人工確認`);
        console.error(`⚠️ 無法可靠重建 ${base} 的改動後內容，請人工確認本次改動是否影響依賴。`);
        process.exit(2);
      }
      let oldDeps, newDeps;
      try {
        oldDeps = extractDeps(oldContent);
        newDeps = extractDeps(newContent);
      } catch (e) {
        logEvent('needs_confirmation', `${base}：無法解析 JSON，需人工確認`);
        console.error(`⚠️ 無法解析 ${base}，請人工確認本次改動是否影響依賴。`);
        process.exit(2);
      }
      const added = [...newDeps].filter((d) => !oldDeps.has(d));
      if (added.length > 0) {
        logEvent('dependency_block', `${base}：新增套件 ${added.join(', ')}`);
        console.error(`📦 偵測到新增依賴：${added.join(', ')}（來源：${base}）。請依 Step 3 流程確認後再繼續。`);
        process.exit(2);
      }
      process.exit(0);
    }

    const pattern = TEXT_MANIFESTS[base];
    if (pattern) {
      const oldContent = fs.readFileSync(filePath, 'utf8');
      const newContent = reconstructNewContent(oldContent, tool_name, tool_input);
      if (newContent === null) {
        logEvent('needs_confirmation', `${base}：old_string 對不上檔案內容，無法可靠重建，需人工確認`);
        console.error(`⚠️ 無法可靠重建 ${base} 的改動後內容，請人工確認本次改動是否影響依賴。`);
        process.exit(2);
      }
      const added = addedLines(oldContent, newContent);
      if (added.some((l) => pattern.test(l))) {
        logEvent('needs_confirmation', `${base}：偵測到可能的依賴變更，無法可靠解析`);
        console.error(`⚠️ ${base} 疑似新增依賴宣告，此格式無輕量 parser，需人工確認。`);
        process.exit(2);
      }
    }
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
