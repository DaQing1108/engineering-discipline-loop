# Knowledge Governance

> 由 `SKILL.md` 引用。記錄本 Skill 的 owner、依賴關係、更新/淘汰條件與已知限制。

**Owner：** 你（本 Skill 的使用者）

**適用範圍：** 你的組織中所有產品線的 Claude Code coding 任務執行。

**可信度等級：** T2（正式 SOP，允許依情境調整）

| 等級 | 意義 | 本 Skill 使用方式 |
|------|------|-----------------|
| T2 | 操作與背景依據（正式文件、SOP） | 作為 coding 任務的標準執行程序，允許依任務特性調整路徑判斷 |

**最後確認日期：** 2026-08-24（第二輪健檢，見下方紀錄；未觸發版本修法）

**可選整合關係（非必需依賴，本 Skill 內建 fallback，未安裝仍可完整運作）：**
- 可選整合 `harness-rules`（Pre-flight Check、風險等級定義、L3/L4 阻擋邏輯）— 未安裝時使用內建簡化風險評估（見 SKILL.md 0-C）
- 可選整合 `task-router`（L0–L4 風險等級分類定義）— 未安裝時不影響本 Skill 獨立運作
- 若你已安裝 `harness-rules` 並升版，建議確認風險等級定義是否有異動
- 概念借用（非執行依賴，v1.16.0）：`minimal-fix` 的 path denylist、`loop-verifier` 的
  ESCALATE_HUMAN 判定，均以文字規則內嵌，不呼叫該兩個 Skill；上游 loop-engineering
  更新時不自動同步，需人工比對
- 概念借用（非執行依賴）：若你的環境另外安裝了 [mattpocock/skills](https://github.com/mattpocock/skills)，
  SKILL.md 於 Step 0-B／Step 4／Step 6／Step 7 標註了可借用其 `/tdd`、`/code-review`、
  `/grill-with-docs` 的技巧作為輔助手法；未安裝該套件不影響本 Skill 完整運作，這些標註
  只是選用參考，不呼叫該套件的 skill 取代本 loop 的 Step 順序

**v1.17 候選項目（2026-07-07 v1.16.0 規劃時評估後延期）：**

| 候選 | 延期原因 | 啟動條件 |
|------|---------|---------|
| 批次/排程模式（Step 0 來源偵測分支 + Lite Path 強制 Plan 關卡 + `loop-budget` Skill 整合做 token 治理） | 三份 log 無任何排程觸發使用記錄，YAGNI；且 loop-budget 的 `loop-budget.md`／`loop-run-log.md` 狀態檔 bootstrap 設計、批次下「等待核准」機制（state 檔 pending + 0-A 續跑 + 通知缺口）均未定案 | task-router × loop-triage 整合落地，且出現第一個真實排程呼叫場景 |
| denylist hook 化（`discipline-loop-denylist-check.js`，PreToolUse 工具層攔截） | v1.16.0 先上文字層規則驗證清單設計；v1.14 教訓顯示文字規則可能被 agent 跳過，hook 版才是一致的長期做法 | denylist 文字規則實際觸發過一次以上，或發現被跳過的案例；hook 設計時需一併納入誤判豁免機制（例：同名模式一次性放行，避免 auth-mock/ 類 fixture 目錄造成噪音） |

**更新觸發條件：**
- [ ] `harness-rules`（若已安裝）升版且新增或修改風險等級定義
- [ ] `task-router`（若已安裝）升版且修改 L0–L4 分類標準
- [ ] 你的工程團隊採用新的測試框架或 git workflow，導致 hooks 設計需要調整
- [ ] 實際使用中發現新的失敗模式，需補入錯誤處理
- [ ] 版本內容涉及新增/修改 hooks 或任何非文字交付物時，同步到這個公開 repo 的清單 MUST
  包含對應檔案，不能只同步文字描述（2026-07-09 教訓，見已知限制表最後一列；
  `check-referenced-files.sh` 已自動化此檢查，此處僅作人工複查提醒）
- [ ] 距上次確認已超過 **3 個月**

**淘汰條件：**
- 你的組織採用外部 CI/CD 平台全面取代本地 hooks 機制
- 被 `engineering-discipline-loop` v2.0.0 完全取代

**被取代文件：** 無（v1.0.0 為初版）

**模型升級健檢（工作流 C 觸發二，v1.14.0 新增）：**

| 觸發條件 | 健檢門檻 | 健檢範圍 |
|---------|---------|---------|
| 底層 Claude 模型版本升級 | `hook-trigger-log.log` 累積滿 20 筆（dependency_block／line_warning／needs_confirmation／denylist_hit 四類分開計數，合計滿 20；denylist_hit 為 v1.16.0 新增之文字層規則落 log，非 hook 產生），或距本次上線滿六週，兩者先到者觸發 | ①四類事件個別發生頻率與比例，評估 A2（拆除/降級對應 STOP 點）是否具備決策條件，denylist_hit 筆數同時作為 v1.17「denylist hook 化」啟動條件的判定依據 ②`step7-verification-log.log` 累積筆數是否足以開始設計 B2 準確率量測方法（v1.18 起改為「按任務複雜度分層量測 FAIL 率」，見下方第二輪健檢紀錄——目的已從「討論觸發」修正為「回答該用哪一層模型」，單純合計 PASS/FAIL 不夠，需按任務複雜度分層才看得出模型能力邊界） ③是否已發生模型版本升級，若是一併檢視既有 STOP 點與 checklist 是否可精簡 |

健檢審查 MUST 分開檢視四類事件的個別筆數，不得只看合計總數下判斷；某一類筆數不足時，該類對應決策應繼續等待。工作流 C「觸發一：健檢執行」本身、A2、B2 分析與信任分數，均待第一輪健檢後才進入下一輪 spec 討論範圍。

**第一輪健檢紀錄（2026-07-06，v1.15.0 觸發修法）：**

v1.14.0 於 2026-07-03 上線，健檢門檻（20 筆或六週）於 **3 天內**就被 `hook-trigger-log.log` 累積的 38 筆事件（`line_warning` 35、`dependency_block` 3、`needs_confirmation` 0）大幅超過，但因機制設計是「純記錄不分析」，門檻超標本身直到人工檢查才被發現——證實了「兩者先到者觸發」在缺乏主動提醒的情況下形同虛設。逐筆比對後另外發現：`line_warning` 的 35 筆中，絕大多數是 `Write` 建立全新檔案被誤判為「單次改動超過 50 行」；`step7-verification-log.log` 僅 1 個 task_id 被記錄，但同期至少 6–7 個獨立任務存在。v1.15.0 已針對性修復（見 CHANGELOG.md）。

**第二輪健檢紀錄（2026-08-24，門檻雙雙超標，未觸發版本修法）：**

觸發依據：`hook-trigger-log.log` 累積事件遠超 20 筆合計門檻；距上次確認已超過六週門檻。逐類拆分後：`line_warning` 佔絕大多數、`dependency_block` 與 `needs_confirmation` 各佔少數、`denylist_hit` 為 0。

① A2（STOP 點拆除/降級）：抽查後**不具備拆除或降級的決策條件**——`line_warning` 逐筆核對，內容均為真實的大幅改動（測試檔、元件、session tmp 檔），未見 v1.14.0 那次「`Write` 建新檔被誤判」的舊模式重現；`dependency_block` 與 `needs_confirmation` 皆為真實情境。三個 STOP 點目前攔的都是真事件，無噪音訊號支持拆除。`line_warning` 佔比偏高本身是否代表 50 行閾值偏敏感，需要更細的人工抽查才能下判斷，留待下一輪。`denylist_hit` 0 筆 → v1.17 候選「denylist hook 化」**維持延期，未達啟動條件**。

② B2（準確率量測方法）：`step7-verification-log.log` 已累積足量橫跨多個 task_id 的紀錄，相較第一輪僅 1 個 task_id 已有足夠資料基礎可以開始設計。**設計方向在本輪修正**：原始 B2 目的是量測 Step 7 checklist 本身準確率；更實際的問題是「哪個任務複雜度該用哪一層模型」，單純統計 PASS/FAIL 合計筆數無法回答，需要在 `step7-verification-log.log` 的紀錄格式補一欄「任務複雜度分類」。**已於 v1.18.0 實作**：Step 7.5 寫入格式新增風險等級欄位（任務ID／風險等級／AC編號／判定結果），風險等級直接取自 `.loop-state.md` 的 `risk_level`（0-C 判定結果），不需額外分類邏輯；v1.18.0 之前的舊格式紀錄不回填。累積足量分層資料後（建議至少每個等級各 10+ 筆判定）才進入「比較 FAIL 率分布」的分析階段，這部分分析本身仍待下一輪健檢或使用者需要時再進行。

③ 模型版本升級：本輪未確認發生底層模型版本切換；本輪健檢由「是否該切換模型層級」的探索性提問觸發，而非既有的版本升級事件，STOP 點/checklist 精簡評估本輪不適用（無版本升級可比對）。

**已知限制（結構化治理表）：**

| 限制 | 影響等級 | 解法方向 | 目標版本 |
|------|----------|----------|----------|
| 多人協作 `.loop-state.md` 互相覆蓋 | 低（單人使用為主） | 加 user prefix：`.loop-state-{username}.md`；v2 升級觸發條件：（1）同一 repo 有兩人以上同時使用 discipline-loop，或（2）CI/CD 環境需要讀取 state 檔，或（3）一週內發生一次以上 state 檔衝突 | v1.3 |
| `/ship` 原子性依賴本機 hooks 設定，Skill 無法確認 hooks 實際生效 | 中（hooks 未設定時靜默失敗） | Step 0 加 hooks 存在性檢查，已在 v1.1.0 的 L-STEP 5.5 部分解決 | ✅ v1.1 |
| Step 7 Checklist 取代不了真人 review | 中（品質上限受 checklist 設計本身限制） | Step 7 補入真人 review 觸發條件（改動 > 100 行、涉及 auth 邏輯等） | v1.3 |
| `CLAUDE.md` 提案若使用者略過確認，Skill 無法阻擋 | 低（人工確認為必要設計） | 記錄為已知限制，無自動解法 | — |
| Chat / Cowork 環境無法完整執行 | 低（已在 v1.2.0 補入降級模式） | 已在 Step 0.0 補入環境偵測與「僅規劃」降級 | ✅ v1.2 |
| 依賴偵測 hook 為 fail-open 設計，且對 pyproject.toml/Cargo.toml/go.mod 用 heuristic 判斷 | 中（fail-open 在腳本自身異常時會靜默放行；text manifest heuristic 對非依賴的 key=value 行也可能誤觸發 needs_confirmation） | fail-open 為刻意取捨（全域 hook，寧可偶爾漏判也不能讓所有專案的 Edit/Write 因腳本 bug 卡死）；heuristic 誤觸發已在健檢審查時一併檢視 needs_confirmation 類別比例 | v1.14 |
| `line_warning` 警告傳達機制自 v1.14.0 上線以來未真正生效（純 stderr + exit 0，Claude Code 官方文件確認此組合訊息不會傳入 Claude 上下文，只有 exit 2 才會，但會阻斷工具呼叫） | 高（設計目的完全落空，agent 從未真正收到過警告，僅 log 側寫入正常） | 改用官方文件確認的 exit 0 + stdout JSON `hookSpecificOutput.additionalContext` 機制，已於 v1.15.0 修復並套用到所有新增 hook | ✅ v1.15 |
| skill 目錄本身無版本控制（僅有落後版本的 GitHub 鏡像 `engineering-discipline-loop-oss`） | ✅ 已解決（2026-07-07）：skill 目錄已建立私有本地 git repo，與公開 OSS mirror 分開管理；本機遙測 log 透過 `.gitignore` 排除，維持既有「非 git 管理」設計；discipline-loop 專屬 hook script 於 repo 內 `hooks/`（2026-07-09 起改為對共用全域 hooks 設定檔目錄的 symlink，見下方新增列，不再是需手動同步的複本）；該全域 hooks 設定檔本身是跨 skill 共用的執行期設定，非 discipline-loop 所有，刻意不納入此 repo | 已解決，無殘留範圍 | ✅ v1.16 |
| `diff-size-check.js` 從 v1.14.0 的 PostToolUse+async 改為 v1.15.0 的 PreToolUse+同步，每次 Write/Edit/MultiEdit 新增約 30-80ms 的 hook 進程啟動延遲（三支 hook 各自獨立進程，累計可能 ~150-250ms） | 低（是 additionalContext 機制的必要代價：警告要在工具執行前送達才有意義，PreToolUse 無法 async） | 已知取捨，不視為缺陷；若未來延遲明顯影響體驗，可評估把三支 hook 合併成一支進程以省去重複啟動成本 | — |
| 官方文件記載同一 matcher 下多支 hook 平行執行、各自 additionalContext 都會送達，但實測一度只看到其中一支訊息（後續發現主因是測試方法混淆了 scratch 目錄與 session 實際 cwd，無法完全排除是否仍有平行執行的邊界案例） | 低（v1.15.0 已改為每支 hook 獨立 matcher 區塊，此寫法官方文件確認安全，重測後正確） | 已採用較保守寫法；若日後又混用同一 matcher 掛多支 hook 且行為異常，優先檢查此處 | — |
| ✅ 已解決：`eval-scenarios.md` E22 的 `pass_condition` 曾落後於 v1.17.0 的 entry-check 閘門化——SKILL.md 角色定位與 frontmatter 已描述「PreToolUse deny 閘門，L1 不豁免」，但 E22 場景文字仍描述較早版本的 warn-only + 節流行為 | 已解決：E22 改寫為 deny 語意（含 escape hatch） | 已解決，無殘留範圍 | ✅ v1.17 |
| ✅ 已解決（2026-08-24，v1.19.0）：entry-check hook（v1.17.0）的 `hasLoopState(cwd)` 檢查的是 session 的 cwd，不是目標檔案所在目錄，也不是子專案 git repo 根目錄；若你在一個「非 git 的 meta-workspace，內含多個獨立子專案 git repo」的多專案佈局下使用（例如一個統一的工作目錄底下放了好幾個獨立專案），session cwd 可能固定停在該 workspace 根目錄，與 SKILL.md 慣例的「state 檔放在專案根目錄」（子專案 git repo 根目錄）不一致，導致對子專案內任何 CODE_EXTENSIONS 副檔名的編輯即使子專案根目錄已有正確的 `.loop-state-*.md` 仍會被 deny | ✅ 已解決：`hasLoopState` 改為從 file_path 所在目錄向上搜尋 `.loop-state-*.md`，遇最近的 `.git` 目錄即停止（專案邊界，防止 sibling 子專案互相誤放行——樹拓樸保證 sibling 不可能是彼此祖先），一路到頂無 `.git` 才 fallback 回退檢查 cwd（相容非 git 環境）。新增 `eval-scenarios.md` E25 涵蓋此情境（子專案有/無 state 檔、sibling 不互相放行、既有單專案行為不回歸、非 git fallback、symlink） | 已解決，殘留一條新限制見下 | ✅ v1.19 |
| 巢狀 `.git`（git submodule／vendored dependency 內含自己的 `.git`）情境下，`hasLoopState` 向上搜尋會在到達真正專案根目錄的 `.loop-state-*.md` 之前，先撞到內層 `.git` 邊界而誤 deny | 低（fail-closed 非洩漏風險；評估後判定這不是缺陷，而是行為一致） | **不採用「軟化 .git 邊界」的方向**：找不到 state 檔時繼續往上走過 `.git`，會重新打開「往上逃逸到不相關祖先」的風險——子專案沒有 state 檔時，只要某個上層祖先目錄（例如 meta-workspace 根目錄）剛好有 state 檔，就會被誤放行。`.git` 硬邊界不只防 sibling 互放，同時是防「逃逸到祖先」的唯一機制。內層 `.git`（submodule／vendored deps）本身就是獨立專案邊界，deny 訊息已指出解法（在內層目錄建 `.loop-state-*.md`）——編輯 vendored 程式碼本來就該經過同等紀律 | 已評估，維持現狀，無殘留範圍 |
| ✅ 已解決（2026-07-09）：`SKILL.md` 明文指名 4 支 hook script 已兩個版本週期（v1.13.0→v1.15.0→v1.16.0），但這個公開鏡像從未實際同步 `hooks/` 目錄——文字描述跟著既有的「同步 = 複製 .md 檔」慣例一起過去，檔案本身屬於過去慣例沒涵蓋的新類別，沒人多想一步去搬；且沒有任何機制比對「文件講的」與「repo 裡實際有的」，導致落差安靜存在到被人工查證才發現 | ✅ 已解決：新增 `scripts/check-referenced-files.sh`（掃描 .md 內反引號檔名、比對 repo 實際檔案，串接進 `pre-push-sanitize-check.sh`，已用「先刪掉一支 hook 檔案再跑」驗證真的會擋下同類回歸）。經驗：「同步到別的地方」這類判斷值得花一分鐘實際 `find`/`grep`/`git log` 查證現況，而不是憑印象回答 | 已解決，無殘留範圍（不涉及 SKILL.md 版本異動，屬 repo/tooling 修復） | — |
