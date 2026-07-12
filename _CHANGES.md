# 異動紀錄 — engineering-discipline-loop-oss

## 2026-07-12 18:20
### ✏️ 編輯（v1.16.0 → v1.17.0 同步，來源：內部 repo 同日變更）
- `hooks/discipline-loop-entry-check.js`（整檔替換為閘門版：warn-only → permissionDecision
  deny，限程式碼副檔名，session-scoped bypass 標記為顯式逃生口；與內部版本逐 byte 一致）
- `SKILL.md`（frontmatter 版本兩處 1.16.0→1.17.0；模組② hook 描述改閘門語意）
- `CHANGELOG.md`（新增 v1.17.0 條目，含升版例外註記）
- `hooks/README.md`（hook 行為表 entry-check 列 + 安裝驗證步驟改閘門語意）

### 📋 例外記錄
- 模組⑦-E 要求任何升版前跑 E01–E24；本次為 hook 層 + 文件變更，未觸及 Step 1-9 /
  L-STEP 1-6 核心流程邏輯，經維護者於同步時核准免跑（依 CLAUDE.md「僅核心邏輯變更
  強制 eval」的收窄規則），E01–E24 留待下次核心邏輯變更時執行

## 2026-07-09 22:10
### ➕ 新增（根因修復：加自動一致性檢查，避免同一類問題再發生）
- `scripts/check-referenced-files.sh`（新寫，掃描所有 .md 檔裡反引號包住的
  `*.js`/`*.md`/`*.sh` 檔名，確認 repo 裡真的存在對應檔案；已用「刪掉一支
  hook 檔案再跑」驗證真的會擋下同類 bug）

### ✏️ 編輯
- `scripts/pre-push-sanitize-check.sh`（串接呼叫上面的新 script；第一版用
  `dirname "$0"` 解析路徑，透過真正的 `.git/hooks/pre-push` symlink 呼叫路徑
  測試才發現這樣會靜默失效——`$0` 透過 symlink 呼叫時不會解析成目標檔案位置，
  改用 `git rev-parse --show-toplevel` 取得絕對路徑修正）
- `CONTRIBUTING.md`（Pre-Push Sanitization Check 段落補充新 script 說明）
- `CHANGELOG.md`（Unreleased 條目補上這次的根因修復內容）

（另外私有端 `~/.claude/skills/engineering-discipline-loop/hooks/` 也同步從
「手動複製的備份」改成對 `~/.claude/hooks/` 的 symlink，消除同一種模式的另一
個潛在漏洞——這個改動在本機，不影響公開 repo。）

## 2026-07-09 21:45
### ➕ 新增（補齊 SKILL.md 已引用但公開 repo缺漏的 4 支 hook script）
- `hooks/discipline-loop-dependency-check.js`
- `hooks/discipline-loop-diff-size-check.js`
- `hooks/discipline-loop-entry-check.js`
- `hooks/discipline-loop-ship-gate-check.js`
- `hooks/README.md`（新寫，說明每支 hook 用途、安裝方式、已知限制）

### ✏️ 編輯
- `README.md`（Install 區塊新增「Hooks (optional)」小節連到 `hooks/README.md`）
- `CHANGELOG.md`（新增 Unreleased 條目，說明這是補交付缺口而非邏輯變更，不觸發 SKILL.md 版號）

## 2026-07-09 11:20
### ✏️ 編輯（同步 v1.15.0 → v1.16.0，內容經確認不含 VIA 專屬資訊，直接複製內部檔案）
- `SKILL.md`
- `CHANGELOG.md`
- `CLAUDE.md`（順帶修正過期的 E01-E11 引用為 E01-E24）
- `CONTRIBUTING.md`（同上）
- `README.md`（版本範圍更新至 v1.16.0）
- `references/eval-scenarios.md`
- `references/output-templates.md`
- `references/governance.md`

## 2026-07-04 09:05
### ✏️ 編輯
- `CHANGELOG.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `README.md`
- `SKILL.md`
- `eval-scenarios.md`
- `output-templates.md`
- `quality-standards.md`

## 2026-07-03 09:04
### ➕ 新增
- `CHANGELOG.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `FORK_REPORT.md`
- `LICENSE`
- `README.md`
- `SKILL.md`
- `eval-scenarios.md`
- `governance.md`
- `init.md`
- `output-spec.md`
- `output-templates.md`
- `quality-standards.md`
