# 冷啟動流程（Discipline-Loop Init）

> 由 `SKILL.md` 引用。
> ⚠️ 命名注意：若你的 Claude Code 設定中另外安裝了一個同樣命名為 `init` 的 skill（例如某些通用初始化工具會用「Initialize a new CLAUDE.md file with codebase documentation」這類描述），請注意兩者不是同一個東西。本流程專屬於 engineering-discipline-loop 的冷啟動掃描，觸發詞請用「discipline-loop 初始化」或直接描述「第一次在這個專案用 discipline-loop」，避免與其他同名 skill 混淆。

**使用時機**：第一次在新專案使用本 Skill 之前執行一次。

**執行步驟**：

**init-1：環境掃描**

掃描以下內容並輸出摘要：
- 專案語言與框架（`package.json`、`pyproject.toml`、`go.mod` 等）
- 現有測試框架
- 現有 `.git/hooks/` 狀態
- 是否有 `CLAUDE.md`
- `.gitignore` 是否包含 `.loop-state-*.md`

**init-2：Hooks 提案**（若不存在）

根據掃描結果，提案 `pre-commit` 和 `pre-push` 的內容，格式如下：

```
📋 Hooks 提案

pre-commit（建議內容）：
  [具體 shell 指令]

pre-push（建議內容）：
  [具體 shell 指令]

確認後我將寫入 .git/hooks/。是否確認？
```

等你回覆確認後才寫入，不自動執行。

**init-3：CLAUDE.md 提案**（若不存在）

提案基本 CLAUDE.md 結構（命名規範、禁止 patterns、review gates），等你確認後建立。

**init-4：`.gitignore` 更新**

確認 `.gitignore` 包含 `.loop-state-*.md`，若沒有則提案加入（等確認）。

**init-5：完成確認**

```
✅ discipline-loop 初始化完成
環境：[語言 / 框架]
測試框架：[名稱]
Hooks：[已存在 / 已建立 / 待建立]
CLAUDE.md：[已存在 / 已建立 / 待建立]
.gitignore：[已包含 .loop-state-*.md]

可以開始使用 /discipline-loop 了。
```
