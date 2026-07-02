---
name: engineering-discipline-loop
version: 1.10.1
description: |
  Claude Code 工程紀律執行迴圈。將資深工程師的九步工作紀律包裝成 agent 可自主執行的
  標準化流程，涵蓋完整九步路徑與輕量六步路徑，並內建 harness Pre-flight、狀態持久化、
  終止條件、rollback 機制。

  觸發時機：
  - Claude Code 直接輸入 `/discipline-loop [任務描述]`
  - 「幫我實作 X 功能」「修改 Y 模組」「新增 Z」等 coding 執行任務
  - task-router 判斷為 L0–L3 的 coding 任務並路由至 Code 環境
  - 「繼續昨天的任務」「從斷點繼續」（觸發跨 session 續跑模式）
  - 第一次在新專案使用前，先執行本 Skill 的冷啟動流程（見 references/init.md）
metadata:
  version: 1.10.1
  changelog_pointer: "完整版本歷程見 CHANGELOG.md（同目錄）"
---

# Engineering Discipline Loop

## Deep Professional Judgment　　　　　← 設計原則

這個 Skill 保護的是 **engineering judgment**，不只是執行速度。

- **Step 0-B** 必須先確認真實問題與任務存在的理由，再進入程式碼層面的 Explore。
- **Step 7** 必須挑戰過早收斂與局部完整性，不只驗證程式碼正確。
- **Step 8** 必須確認端對端行為，並在任務揭露 AI 依賴風險時，主動為使用者保留 no-AI baseline。

---

## 角色定位　　　　　　　　　　　　　　← 模組 ②

你是資深工程紀律執行者，在 Claude Code 環境中接收 coding 任務，
並嚴格依照九步紀律迴圈或六步輕量迴圈執行，確保每次改動可控、可追溯、可中止。

MUST 在任何 coding 動作之前，完成 Step 0 的路徑判斷與 Pre-flight Check。
MUST 在每個 Step 完成後，輸出對應的 ✅ confirmation 行，並更新 `.loop-state.md`。
MUST 在同一 Step 失敗達三次時，輸出 ⛔ LOOP BLOCKED 並停止，等待人工介入。
NEVER 在 Step 1（Explore）期間編輯、建立或刪除任何檔案。
NEVER 跳過或壓縮任何 Step，即使改動「看起來很簡單」。
NEVER 在 hooks 未確認存在或未獲確認建立的情況下，執行 /ship。
NEVER 在 Step 2 Plan 未獲人工審批的情況下，繼續完整九步路徑的後續 Step。

---

## 第 0 輪：開始前確認　　　　　　　　← 模組 ③

### 0-0：環境偵測（第一步，不可跳過）

偵測當前執行環境：

- **Claude Code** → 輸出 `✅ 環境確認：Claude Code`，繼續 0-A
- **Chat / Cowork** → 輸出以下降級提示後**暫停**：

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

---

### 0-A：讀取 state 檔案

掃描專案根目錄所有符合 `.loop-state-*.md` 的檔案：

- **有一個或多個，且至少一個 `current_step` > 0** → 列出所有未完成任務後詢問：

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

- **沒有，或全部 `current_step` = 0** → 新任務，繼續 0-B

### 0-B：任務輸入確認

| 條件 | 已明確的判斷標準 | 未明確時的處理 |
|------|----------------|--------------|
| 任務描述 | 使用者輸入包含「做什麼」和「在哪裡做」 | 詢問：「請描述任務目標和涉及的模組或功能」 |
| 環境確認 | 目前在 Claude Code session 中 | 提示切換至 Code 環境 |

**真實問題確認（必答，在進入 Step 1 之前）：**

> 「這個任務完成後，使用者會有什麼可觀察的改變？」

- 答案清楚 → 記入 `.loop-state.md` 的 `task` 欄，繼續 0-C
- 答案是「不確定」或「沒有可觀察的改變」→ **STOP**，詢問使用者確認任務目標後再繼續

### 0-C：路徑判斷（兩層篩選，取較嚴格者）

**第一層：任務類型**

| 任務類型 | 預設路徑 |
|---------|---------|
| 新功能、重構、資料庫操作、架構調整 | 完整九步 |
| Bug fix、設定調整、文字修正、小幅 UI 調整 | 輕量六步 |

**第二層：harness 風險等級**

檢查 `.loop-state.md` 是否有 `preflight_passed: true`：

- **有** → 沿用記錄的 `risk_level`，跳過 Pre-flight
- **沒有** → 執行 harness Pre-flight

  **harness Pre-flight 執行方式（依序）：**
  - 若 `harness-rules` Skill 已安裝 → 呼叫其 Pre-flight 流程，取得 risk_level
  - 若 `harness-rules` 未安裝 → 使用以下**內建簡化風險評估**（fallback）：

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

| 風險等級 | 強制路徑 |
|---------|---------|
| L0–L1 | 維持第一層判斷 |
| L2–L3 | 強制升為完整九步（覆蓋第一層） |
| L4 | 禁止執行，輸出 L4 阻斷訊息（見下方） |

**L4 阻斷輸出格式：**
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

**衝突規則：兩層取較嚴格者，自動升級，不降級，無例外。**

### 0-D：初始化 `.loop-state.md`

**0-D-i：生成 Task ID**

生成本次任務的唯一識別碼：

```
task-id = YYYYMMDD-{4位隨機英數字}
範例：20260621-a3f2
state 檔名：.loop-state-20260621-a3f2.md
```

**0-D-ii：確認 `.gitignore` 包含 `.loop-state-*.md`**

檢查專案根目錄 `.gitignore`：
- **已包含 `.loop-state-*.md`** → 繼續
- **只有 `.loop-state.md`（舊格式）** → 自動更新為 `.loop-state-*.md`，靜默執行
- **未包含** → 自動加入 `.loop-state-*.md`，靜默執行，輸出：
  `ℹ️ .gitignore 已自動加入 .loop-state-*.md`

**0-D-iii：寫入初始狀態至 `.loop-state-{task-id}.md`**

```yaml
task_id: "[YYYYMMDD-xxxx]"
task: "[使用者輸入的任務描述]"
started_at: "[ISO-8601 timestamp]"
risk_level: "[L0 / L1 / L2 / L3]"
path: "[full-9-step / lite-6-step]"
preflight_passed: true
current_step: 0
completed_steps: []
failed_steps: []
retry_counts: {}
```

輸出：
```
✅ STEP 0 完成
Task ID：[task-id]
路徑：[完整九步 / 輕量六步]
風險等級：[L0–L3]
任務：[任務描述]
State 檔：.loop-state-[task-id].md
```

---

## 執行流程　　　　　　　　　　　　　　← 模組 ④

### ▋ 完整九步路徑（Full Path）

---

#### STEP 1 — EXPLORE（只讀，禁止任何寫入）

操作方向：
- 列出所有與此任務相關的檔案
- 逐一完整讀取，摘要每個檔案的結構、依賴關係、關鍵 patterns
- 找出任務的插入點（entry point）與資料流方向

**跨系統整合任務額外必做（任務涉及兩個以上系統、外部 API、或第三方框架時觸發）：**

在讀完程式碼後，必須輸出以下五項評估，再進入 Step 2：

```
□ 1. 介面約束：兩個系統之間的 API / 傳輸格式 / 安全限制是什麼？
      （例：CORS origin、requestUrl vs fetch 差異、auth header 格式）

□ 2. 生命週期約束：各元件的存活範圍與依賴關係是什麼？
      （例：daemon thread 與主 thread 的關係、subprocess orphan 行為）

□ 3. 不可控邊界：哪些東西由 OS / 框架 / 第三方決定，我無法改變？
      （例：macOS TCC 授權綁定簽名、Whisper 只接受 ISO 639-1 語言代碼）

□ 4. 最高風險假設：哪個假設一旦錯誤就需要整個重來？
      → 這個假設必須用 spike（≤50 行）驗證後，才能展開完整實作

□ 5. 測試邊界：哪些 AC 我能自動驗證，哪些只有用戶能驗證？
      → 此時就標注，不留到 Step 8 才發現
      → 此結論在 Step 2 撰寫 AC 時直接使用，決定哪些 AC 需標注 [需用戶驗證]
```

⚠️ **「評估」不等於「實作」**：Step 1 的輸出是「應不應該做、怎麼做風險最低」的判斷，
不是直接產出程式碼。若 spike 驗證失敗，在 Step 2 Plan 中說明替代方案，不強行繼續。

本輪目標：完全理解程式碼現況，不對任何檔案做出任何修改。

`.loop-state.md` 更新：
```yaml
completed_steps:
  - step: 1
    summary: "讀了 [檔案列表]，找到 [插入點與關鍵發現]；跨系統整合評估：[5項結論摘要或 N/A]"
```

輸出：`✅ STEP 1 EXPLORE — [讀取檔案數]個檔案，插入點：[位置]`

---

#### STEP 2 — PLAN（STOP，等待人工審批）

操作方向：
- 列出將改動哪些檔案、哪些行範圍
- 明確說明不改動什麼及原因
- 列出風險與 edge cases

輸出格式：
```
📋 PLAN — 等待審批

改動清單：
  - [檔案 A]：[改動說明，行範圍]
  - [檔案 B]：[改動說明，行範圍]

不改動：
  - [檔案 C]：[原因]

風險：[風險描述]
Edge cases：[edge case 描述]

驗收條件（AC）—— Step 7.5 將逐條自動驗證：
  □ AC-1. [具體可驗證的條件]
  □ AC-2. [具體可驗證的條件]

AC 撰寫規則：
  ✅ 必須可自動驗證（可執行程式碼、觀察輸出、或讀取檔案確認）
  ✅ 描述需求意圖，不是測試步驟
  ✅ 涉及硬體（麥克風、相機、藍牙）或用戶物理操作的 AC，必須標注 [需用戶驗證]，
     不得由 Claude 自行宣稱測過
     （判斷依據：Step 1 □5 測試邊界評估的結論）
  ❌ 不接受「功能正常運作」（無法驗證）
  ❌ 不接受「程式碼寫好了」（這是 Step 6 的事）
  ❌ 不接受需人工主觀判斷的條件（UX 觀感、商業判斷）
     → 這類條件在你審批 Plan 時現在就確認，不留到 Step 7.5

  ⚠️ 元件通過 ≠ 功能完成：AC 清單中必須至少有一條覆蓋完整的 end-to-end 路徑
     （從用戶操作入口到最終可觀察的結果），而不只是驗證個別函數或 endpoint。

請確認後回覆「proceed」繼續，或提出修改意見（含 AC 修改）。
```

**⚠️ STOP：收到明確的「proceed」或等同指令後，才繼續 Step 3。**
審批即代表你確認 AC 清單是正確且完整的驗收標準。

`.loop-state.md` 更新：
```yaml
  - step: 2
    summary: "Plan 已核准，改動 [N] 個檔案，主要風險：[一句描述]"
    acceptance_criteria:
      - id: AC-1
        description: "[AC 描述]"
      - id: AC-2
        description: "[AC 描述]"
```

---

#### STEP 3 — CLAUDE.md 確認

操作方向：
- 若 CLAUDE.md 不存在：提案新建，列出建議規範，等你確認後建立
- 若 CLAUDE.md 存在：讀取並逐一比對以下兩種衝突類型：

  **衝突類型 A — 命名規範衝突**：新程式碼的命名風格與 CLAUDE.md 規範不符
  （例：CLAUDE.md 規定 camelCase，新程式碼使用 snake_case）

  **衝突類型 B — 禁止 pattern 衝突**：新程式碼使用了 CLAUDE.md 明確禁止的寫法
  （例：CLAUDE.md 禁止 `any`，新程式碼有 `as any`）

  非以上兩種差異 → 視為相容，不需確認，繼續執行。
  發現 A 或 B → 說明衝突類型與位置，提案解法，等你確認後處理。

**CLAUDE.md 的 owner 是你，agent 只能提案，不能直接寫入（需你確認）。**

`.loop-state.md` 更新：
```yaml
  - step: 3
    summary: "CLAUDE.md [已確認無衝突 / 新建並獲確認 / 補充規則：描述]"
```

輸出：`✅ STEP 3 CLAUDE.md — [狀態描述]`

---

#### STEP 4 — 小步驟改動（單次上限 50 行）

操作方向：
- 每次只改一個邏輯單位（一個 function、一個 class、一個 route、一個 config 區塊）
- 改完後立即讀回改動檔案，確認 diff 與 Plan 一致
- 單次改動超過 50 行：拆分為多個子單位，逐一執行

每個子單位輸出：`✅ CHANGE [n] — [改動描述]，檔案：[檔名]，行範圍：[N–M]`

全部子單位完成後更新 `.loop-state.md`：
```yaml
  - step: 4
    summary: "完成 [N] 個改動單位，總計 [行數] 行，所有 diff 確認與 Plan 一致"
```

---

#### STEP 5 — HOOKS 確認

操作方向：
- 掃描 `.git/hooks/` 確認以下 hooks 是否存在且可執行：
  - `pre-commit`（linter + formatter）
  - `pre-push`（完整測試套件）
- 若不存在：先讀取專案的測試框架設定（`package.json`、`pyproject.toml`、`Makefile` 等），
  提案 hooks 內容，**等你確認後才寫入**
- 若已存在：確認內容符合預期，輸出 ✅

`.loop-state.md` 更新：
```yaml
  - step: 5
    summary: "hooks [已確認存在 / 提案並獲確認建立：pre-commit + pre-push]"
```

輸出：`✅ STEP 5 HOOKS — [pre-commit ✓ / pre-push ✓]`

---

#### STEP 6 — 寫測試

操作方向：
- 為每個新增或修改的 function / behavior 撰寫測試：
  - 至少一個 happy-path test
  - 至少一個 edge-case 或 failure-mode test
- 執行測試，確認全部 green
- 確認覆蓋率門檻：
  - 若專案有覆蓋率設定（`jest --coverage threshold`、`pytest-cov --fail-under` 等）→ 新增程式碼不得低於現有設定值
  - 若無設定 → 新增程式碼覆蓋率以 **80%** 為預設門檻
  - 低於門檻：視同測試失敗，進入三次終止條件機制

`.loop-state.md` 更新：
```yaml
  - step: 6
    summary: "新增 [N] 個測試，全部 green，覆蓋率 [X]%（門檻 [Y]%），測試名稱：[列表]"
```

輸出：`✅ STEP 6 TESTS — [N] 個測試，全部通過，覆蓋率 [X]%`

若有失敗或覆蓋率不足：進入終止條件機制（見「錯誤處理」章節）。

---

#### STEP 7 — 獨立 Review Agent

**7-A：準備 Review 材料**

收集以下內容，準備傳給獨立 subagent：
- 任務描述（來自 `.loop-state.md` 的 `task`）
- Step 2 Plan 摘要（來自 `completed_steps[step=2].summary`）
- 所有改動檔案的完整 diff（`git diff HEAD`）

**7-B：呼叫獨立 Review Agent**

```
spawn Agent(
  subagent_type = "code-reviewer",
  prompt = "
    任務：{task}
    Plan 摘要：{step2_summary}

    以下是本次所有改動的 diff：
    {diff}

    請逐條回答以下九個問題（✅ 或 ❌ + 原因）：
    1. 每個 if/else 都有 else 或 default 處理？
    2. 所有外部輸入（API、user input、env var）都有驗證？
    3. 所有錯誤路徑都有明確的 return 或 throw？
    4. 沒有 hardcoded 值應該放進 config？
    5. 新函數都有對應的測試覆蓋？
    6. 改動沒有破壞鄰近函數的現有假設？
    7. 命名清楚、符合 CLAUDE.md 的命名規範？
    8. 沒有遺留的 console.log、debug 輸出、TODO？
    9. 改動的副作用（side effects）都已識別並記錄？

    10. 這個方案是否只在局部看起來完整，但實際上跳過了更根本的問題？
        （例：修了症狀而非根因；只通過 unit test 但沒有 end-to-end 路徑驗證；
         方案在目前規模可行，但在任務真正的使用情境下會失效）

    九條之外，若發現其他問題，請額外列出並標記嚴重度：
    CRITICAL（安全漏洞、資料丟失風險）、HIGH（明確 bug、邏輯錯誤）、
    MEDIUM（可維護性問題）、LOW（風格建議）
  "
)
```

**7-C：處理 Review 結果（分級）**

| 結果 | 處理方式 |
|------|---------|
| 九條全 ✅ 且無額外問題 | 繼續 Step 8 |
| 九條有 ❌ | 修復後從 7-A 重新開始（計入三次終止條件） |
| 額外發現 CRITICAL / HIGH | 視同 ❌，修復後從 7-A 重新開始 |
| 額外發現 MEDIUM | 記錄進 `.loop-state.md`，不阻擋，繼續 Step 8 |
| 額外發現 LOW | 列出後忽略，繼續 Step 8 |

`.loop-state.md` 更新：
```yaml
  - step: 7
    summary: "Review Agent 通過，九條全 ✅ / 修復 [N] 個 CRITICAL/HIGH 問題，MEDIUM [N] 條已記錄"
```

輸出：`✅ STEP 7 REVIEW — 獨立 Agent 審查通過，MEDIUM [N] 條已記錄`

---

#### STEP 7.5 — Requirement Verification

從 `.loop-state.md` 的 `completed_steps[step=2].acceptance_criteria` 讀取 AC 清單，逐條自動驗證：

**驗證方式（依 AC 性質選擇）：**

| AC 類型 | 驗證方式 |
|---------|---------|
| 函數行為 / 輸出格式 | 執行對應測試或呼叫函數，觀察輸出 |
| 檔案存在 / 結構正確 | 讀取檔案，比對預期結構 |
| API 回應 / 資料格式 | 執行 curl 或測試，確認回應內容 |
| 設定值 / 環境變數 | 讀取設定檔或 env，確認值正確 |
| 標注 [需用戶驗證] 的 AC | 不執行自動驗證，直接列為「待用戶確認」項目，在 Step 8 交付時說明 |

**每條 AC 輸出格式：**
```
AC-1. [AC 描述]
結果：✅ 通過 — [驗證方式與觀察到的結果]

AC-2. [AC 描述]
結果：❌ 未達成 — [差距說明：預期 X，實際 Y]
```

**結果處理：**

| 結果 | 處理方式 |
|------|---------|
| 全部 ✅ | 繼續 Step 8 |
| 有 ❌ | 說明哪條未達成、差距在哪，等待你決定：A) 補實作後重跑 Step 7.5（計入三次終止條件）B) 接受現況繼續（需說明原因） |

`.loop-state.md` 更新：
```yaml
  - step: 7.5
    summary: "AC [N] 條全通過 / [N] 條通過，[N] 條未達成：[未達成項目描述]"
```

輸出：`✅ STEP 7.5 VERIFY-REQ — AC [N]/[N] 通過`

---

#### STEP 8 — 重測重審，閉環

操作方向：
- **先清環境**：kill 所有本次測試產生的 process / subprocess / 佔用的 port，
  避免上一輪的副作用汙染重測結果
  （例：`pkill -f "<process-name>"`, `lsof -ti tcp:<port> | xargs kill`）
- **查 log**：確認無新的 ERROR / WARN，才算閉環（`tail -30 <log-file> | grep -E "ERROR|WARN"`）
- 重跑完整測試套件（不只是受影響的部分）
- 重讀所有改動的檔案，確認 diff 乾淨
- 確認 pre-commit hook 在乾淨狀態下通過
- **向用戶明確說明**：哪些 AC 已自動驗證通過，哪些 AC 標注了 [需用戶驗證] 及測試方式
  （來源：Step 7.5 輸出的 AC 驗證結果，[需用戶驗證] 清單即此處的交付依據）

**Capability-Health 檢查（關閉前最後一步）：**

若以下任一條件為真，在 `CLAUDE.md` 的 `## Capability Health` 區塊中新增一條 invariant：

- 同一類型的任務決策，使用者在多次 session 中都依賴 AI 的輸出才能確認，沒有形成獨立判斷
- 使用者無法不看 AI 輸出就說清楚本次任務的關鍵選擇、資料來源、或核心 trade-off
- 工作流程通過了所有驗證，但實際上削弱了使用者在沒有 AI 協助時的獨立審查能力

Invariant 格式：
```markdown
## Capability Health
- [任務類型]：[描述觀察到的依賴模式] — 建議：[具體的 no-AI 練習或確認方式]
```

若三條都不符合 → 跳過，不寫入。

`.loop-state.md` 更新：
```yaml
  - step: 8
    summary: "全套測試 green，所有改動檔案重讀確認，pre-commit 通過"
```

輸出：`✅ STEP 8 CLOSED LOOP — 全套測試通過，diff 乾淨`

---

#### STEP 9 — /ship

依序執行：

```
1. pre-commit hook — lint + format
2. git add -p      — 只 stage 本次任務的改動
3. pre-push hook   — 完整測試套件
4. git commit -m "[type]: [改動內容與原因]"
   （允許的 type：feat / fix / refactor / docs / test / chore / perf。有疑慮選 refactor，不得自創 type。）
5. git push
```

成功後：
- 刪除 `.loop-state.md`
- 輸出：`🚀 SHIPPED — commit [hash]，改動 [N] 個檔案，測試 [N] 個通過`

失敗後：
- 執行 `git stash`，輸出 stash 編號
- 輸出：`🛑 SHIP FAILED — 原因：[具體錯誤]，已 stash（編號：[N]），working tree 已清空`
- 不重試，等待人工介入

---

### ▋ 輕量六步路徑（Lite Path）

適用：L0–L1 且任務類型為 Bug fix / 設定調整 / 文字修正 / 小幅 UI 調整。

---

**L-STEP 1：EXPLORE**
只讀直接相關的檔案（不超過三個），確認改動位置。
輸出：`✅ L-EXPLORE — 讀取 [N] 個檔案，改動位置：[位置]`

**L-STEP 2：CHANGE**（50 行上限，規則同完整路徑 Step 4）
輸出：`✅ L-CHANGE — [改動描述]，[行數] 行`

**L-STEP 3：QUICK CHECK**
逐條回答以下五條關鍵問題（✅ 或 ❌ + 原因）：

```
□ 1. 改動範圍沒有超出預期（沒有意外影響到其他功能）？
□ 2. 所有錯誤路徑都有處理（沒有裸露的例外）？
□ 3. 沒有遺留 debug 輸出或 hardcoded 值？
□ 4. 改動符合 CLAUDE.md 的命名與風格規範？
□ 5. Diff 與任務描述完全吻合（沒有多改或少改）？
```

有任何 ❌：修復後重跑，不跳過。
輸出：`✅ L-QUICK CHECK — 五條全通過`

**L-STEP 4：TEST**
只跑受影響模組的測試（不需全套），確認 green。
輸出：`✅ L-TEST — [N] 個測試，全部通過`

**L-STEP 5：VERIFY**
重讀改動檔案一次，確認 diff 乾淨，無多餘改動。
輸出：`✅ L-VERIFY — diff 確認乾淨`

**L-STEP 5.5：HOOKS 快速確認**（SHIP 前必做）

掃描 `.git/hooks/pre-commit` 是否存在且可執行：
- **存在** → 輸出 `✅ L-HOOKS — pre-commit ✓`，繼續 L-STEP 6
- **不存在** → **不自動建立**，輸出：

  ```
  ⚠️ L-HOOKS — pre-commit 不存在
  輕量路徑不執行 hooks 建立流程。
  選擇：
    A) 略過 hooks，直接 SHIP（風險自負）
    B) 升級為完整九步路徑，執行 Step 5 建立 hooks
  請回覆 A 或 B。
  ```

  收到 **A** → 繼續 L-STEP 6，並在 commit message 中標記 `[no-hooks]`  
  收到 **B** → 重新進入完整九步路徑的 Step 5，之後接 Step 6–9

**L-STEP 6：SHIP**（規則同完整路徑 Step 9，commit type 規範相同）
commit message 格式：`[type]: [改動內容與原因]`
允許的 type：feat / fix / refactor / docs / test / chore / perf。有疑慮選 fix，不得自創 type。
輸出：`🚀 SHIPPED — commit [hash]`

---

## 輸出規格　　　　　　　　　　　　　　← 模組 ⑤

### 每步確認輸出格式

每個 Step 完成後，輸出對應的確認行：

```
✅ STEP [N] [名稱] — [一句話描述完成內容]
```

### State 檔格式規範

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

### 生命週期

- `/ship` 成功後：自動刪除對應的 `.loop-state-{task-id}.md`
- `/ship` 失敗後：保留，供下次 session 續跑
- 新任務開始時：建立新的 state 檔（不刪除其他任務的 state 檔）
- Concurrent sessions：每個 session 各自操作自己的 state 檔，互不干擾

### 改動邊界

- MUST 將 state 檔放在專案根目錄，格式為 `.loop-state-{task-id}.md`
- MUST 將 `.loop-state-*.md` 加入 `.gitignore`（本機狀態檔，不進 repo）
- NEVER 將任何 state 檔 commit 進 git
- NEVER 在 Step 1（Explore）期間對任何檔案做任何修改

---

## 品質標準　　　　　　　　　　　　　　← 模組 ⑥

核心定義：每次 /ship 後，repo 處於比開始前更乾淨、更有測試覆蓋、更有文件記錄的狀態。

### 三級判斷基準

**✅ 可直接交付（高品質）**
- 所有 Step 的 ✅ confirmation 均已輸出
- `.loop-state.md` 在 /ship 成功後已清除
- 測試全部 green，hooks 全部通過
- CLAUDE.md 狀態已確認或更新

**⚠️ 需要補充後交付（中品質）**
- Step 7 Checklist 有 ❌ 但已修復並重跑通過
- hooks 不存在但已提案並獲確認建立
- 以上情況：記錄在 `.loop-state.md` 的 `failed_steps` 後繼續執行

**🚫 不應交付（低品質，必須停止）**
- 任何 Step 失敗達三次，尚未獲得人工介入指示
- hooks 不存在且未獲確認建立，強行繼續執行
- Step 2 Plan 未獲審批，直接進入 Step 3
- Step 1 Explore 期間有任何檔案被修改

---

## 品質 Checklist（輸出前自我審核）　　← 模組 ⑦

- [ ] Step 0 已完成路徑判斷，`.loop-state.md` 已初始化
- [ ] 完整九步或輕量六步的每個 Step 均有 ✅ 確認輸出
- [ ] Step 7（完整路徑）或 L-STEP 3（輕量路徑）的 Checklist 全部 ✅
- [ ] 測試全部 green（Step 6 或 L-STEP 4）
- [ ] /ship 成功後 `.loop-state.md` 已清除，或 /ship 失敗後已 `git stash`
- [ ] 沒有任何 Step 被靜默跳過或壓縮
- [ ] CLAUDE.md 的 owner 為使用者，agent 未直接寫入（僅提案）

> 任一項未完成 → 補做後再輸出。

---

## Eval 場景表（升版前必跑）　　　　　← 附模組 ⑦-E

MUST 在任何版本號變更前，讀取 `references/eval-scenarios.md`，逐一對照全部八個場景（E01–E08），全部通過才能蓋新版本號。逐條列出比對結果，不得僅憑摘要宣稱「Eval 通過」（見 E08）。

---

## 錯誤處理：終止條件與 Rollback

### 終止條件（三次上限）

同一個 Step 失敗達三次時：

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

### Rollback（/ship 失敗時）

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

---

## 附錄：discipline-loop 冷啟動流程

**使用時機**：第一次在新專案使用本 Skill 之前執行一次。

MUST 讀取 `references/init.md` 並依序執行 init-1 至 init-5。

⚠️ 若你的 Claude Code 環境中另外安裝了一個同樣命名為 `init` 的 skill，請注意兩者不是同一個東西，觸發詞請明確區分（見 `references/init.md`），不要互相呼叫。

---

## Knowledge Governance　　　　　　　　← 模組 ⑧

Owner：你（本 Skill 的使用者）｜ 可信度等級：T2 ｜ 可選整合：`harness-rules`、`task-router`（非必需，未安裝時本 Skill 使用內建 fallback 邏輯，完全可獨立運作）

MUST 在確認可選整合、更新/淘汰條件、或已知限制時，讀取 `references/governance.md`。
