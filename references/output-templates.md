# 輸出格式模板

> 由 `SKILL.md` 引用。以下都是條件觸發才需要輸出的格式模板（環境不符、斷點續跑、風險評估
> fallback、L4 阻斷、三次終止、ship 失敗），本身不是判斷邏輯——判斷「要不要」輸出這些訊息
> 的邏輯仍在 `SKILL.md` 對應的 Step 裡，這裡只放「輸出什麼」的格式。

## 0-0：環境不符警告（Chat / Cowork 環境時輸出）

```
⚠️ 環境不符：discipline-loop 需要在 Claude Code 執行

你目前在 [Chat / Cowork] 環境，無法執行以下操作：
  - 讀寫 .loop-state.md
  - 執行 git 指令與 hooks
  - 呼叫 /ship

建議行動：
  1. 切換到 Claude Code
  2. 貼上原始指令：/discipline-loop [你的任務描述]

如果只需要任務規劃（不執行），輸入「僅規劃」繼續。
```

收到「僅規劃」→ 執行 Step 1 EXPLORE + Step 2 PLAN，輸出完整 Plan 後停止，不繼續 Step 3 以後。

## 0-A：斷點續跑清單（發現未完成任務時輸出）

```
📂 發現未完成的任務

[若有多個，逐一列出]
#1  task-id: [task-id]
    任務：[task]
    開始時間：[started_at]
    風險等級：[risk_level] / 路徑：[path]
    目前進度：Step [current_step]
    已完成 Steps：[completed_steps 列表，每條一句摘要]

#2  task-id: [task-id]
    ...

選擇：
  A) 繼續 #[N] 的斷點（從 Step [current_step] 接續）
  B) 開始新任務（現有 state 檔保留，不刪除）

請回覆 A 或 B（若選 A 請指定編號，例如：A1）。
```

收到 **A（或 A1/A2...）** → 載入對應 `.loop-state-{task-id}.md`，從 `current_step` 接續，跳過 0-B / 0-C / 0-D
收到 **B** → 繼續 0-B，建立新的 state 檔（不刪除現有檔案）

## 0-C：內建風險評估 fallback（harness-rules 未安裝時使用）

```
內建風險評估（harness-rules 未安裝時使用）
────────────────────────────────────────
L0：文字修正、config 微調，無邏輯異動
L1：Bug fix、UI 調整，改動單一模組且無 DB 操作
L2：新功能、重構、跨模組改動
L3：架構調整、DB schema 變更、跨服務異動
L4：生產資料遷移、不可回滾的基礎設施變更

判斷標準：依任務描述自行評估，有疑慮一律升級，不降級。
```

**⚠️ fallback 時輸出：**
```
⚠️ harness-rules 未安裝，使用內建風險評估（fallback mode）。
判定風險等級：[L0–L3]
建議安裝 harness-rules Skill 以獲得更精確的評估。
```

## 0-C：L4 阻斷輸出格式

```
🚫 L4 BLOCKED — 任務風險等級超出自動執行範圍

任務：[任務描述]
風險判定：L4（[判定原因]）

L4 任務需要人工完整審核後才能執行，包含：
  • 確認回滾計畫已準備就緒
  • 確認受影響的下游系統已通知
  • 確認執行時間窗口（避免尖峰時段）

請在確認上述事項後，以明確指令重新啟動任務，或改用 CI/CD pipeline 執行。
```

## Step 3：新增依賴確認（manifest 偵測到新增 top-level 套件時輸出）

```
📦 偵測到新增依賴：[套件名稱]（來源：[manifest 檔案]）

理由：[為什麼需要這個依賴]
是否有更輕量的替代方案：[有/無，說明]

請確認後回覆「proceed」繼續，或提出其他方案。
```

收到「proceed」→ 繼續 Step 4。未確認前不得繼續。既有套件僅版本號變化不觸發此格式。

## 三次終止：⛔ LOOP BLOCKED（同一 Step 失敗達三次時輸出）

```
⛔ LOOP BLOCKED
Step [N] 失敗 3 次，已停止執行。

嘗試記錄：
  第 1 次：[失敗原因與嘗試的解法]
  第 2 次：[失敗原因與嘗試的解法]
  第 3 次：[失敗原因與嘗試的解法]

根因判斷：[我認為問題根源在哪]
建議行動：[人工介入的建議方向]

等待指示，不自動繼續。
```

## Rollback：🛑 SHIP FAILED（`/ship` 失敗時輸出）

執行：
```bash
git stash
```

輸出：
```
🛑 SHIP FAILED
原因：[具體錯誤訊息]
已執行：git stash（stash 編號：stash@{N}）
Working tree 已回到乾淨狀態。
.loop-state.md 保留，下次 session 可繼續。
```
