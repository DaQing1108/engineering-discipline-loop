# 輸出規格

> 由 `SKILL.md` 引用。這是 `.loop-state-{task-id}.md` 的完整 schema 與生命週期規範，Step
> 0-D-iii 初始化狀態檔、以及 Step 1–9／L-STEP 1–6 每步結尾的 `.loop-state.md 更新` 都依循
> 這份格式；各步驟結尾已內嵌當下該寫哪些欄位，不需要每步都回來讀這份文件，僅在需要完整
> 欄位總覽、檔名規則、生命週期規則、或改動邊界時查閱。

## 每步確認輸出格式

每個 Step 完成後，輸出對應的確認行：

```
✅ STEP [N] [名稱] — [一句話描述完成內容]
```

## State 檔格式規範

**檔名格式：** `.loop-state-{YYYYMMDD}-{4位隨機英數字}.md`
**範例：** `.loop-state-20260621-a3f2.md`

```yaml
task_id: "[YYYYMMDD-xxxx]"
task: "[任務描述，一句話]"
started_at: "[YYYY-MM-DDTHH:MM:SS]"
risk_level: "[L0 / L1 / L2 / L3]"
path: "[full-9-step / lite-6-step]"
preflight_passed: true
current_step: [目前執行到的 step 編號]
scope_exception:
  declared: false  # v1.15.0 新增：事故處理需暫時擴大原定範圍時設為 true
  reason: "[為何需要擴大範圍，例：正式服務 crash loop 需跨專案修復]"
  expanded_scope: "[暫時擴大到的範圍，例：pgm-weekly-report/backend/**]"
completed_steps:
  - step: [N]
    summary: "[一到兩句，記錄這個 step 做了什麼和關鍵發現]"
failed_steps:
  - step: [N]
    reason: "[失敗原因]"
    attempts: [嘗試次數]
retry_counts:
  "[step_N]": [失敗次數]
```

**摘要撰寫規範**：每條 summary 一到兩句，記錄「做了什麼」和「關鍵發現或決策」，
不需要完整說明，夠讓下一個 session 的 agent 不需要重新 Explore 就能接手。

**Step 0-D-iii 初始化時**，寫入上述 schema 的初始值：`current_step: 0`、
`completed_steps: []`、`failed_steps: []`、`retry_counts: {}`，其餘欄位依任務實際內容填入。

## 生命週期

- `/ship` 成功後：自動刪除對應的 `.loop-state-{task-id}.md`
- `/ship` 失敗後：保留，供下次 session 續跑
- 新任務開始時：建立新的 state 檔（不刪除其他任務的 state 檔）
- Concurrent sessions：每個 session 各自操作自己的 state 檔，互不干擾

## 改動邊界

- MUST 將 state 檔放在專案根目錄，格式為 `.loop-state-{task-id}.md`
- MUST 將 `.loop-state-*.md` 加入 `.gitignore`（本機狀態檔，不進 repo）
- NEVER 將任何 state 檔 commit 進 git
- NEVER 在 Step 1（Explore）期間對任何檔案做任何修改
