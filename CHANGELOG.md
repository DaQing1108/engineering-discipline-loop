# Changelog — engineering-discipline-loop

## Unreleased
Repo-completeness fix, not a skill-logic change (no `SKILL.md` version bump):
`SKILL.md` has named and described the four `PreToolUse` hook scripts since the
v1.13.0 → v1.15.0 sync (`00f61b4`), but this public mirror never actually shipped
the `hooks/` directory — the text landed, the files didn't. Added `hooks/` with
the four scripts (`discipline-loop-entry-check.js`,
`discipline-loop-dependency-check.js`, `discipline-loop-diff-size-check.js`,
`discipline-loop-ship-gate-check.js`) plus `hooks/README.md` covering what each
one does and how to register them in `settings.json`, since the previous
internal-only registration convention (a shared `hooks.json`) doesn't apply to
external installs. Linked from the main `README.md` Install section.

Also added `scripts/check-referenced-files.sh`, chained into the existing
`pre-push-sanitize-check.sh`, so this exact class of bug (prose in `SKILL.md`
naming a file that was never actually shipped) fails the push instead of
sitting unnoticed for two version syncs. Also fixed a stale `E01–E11` mention
in `README.md` (should have read `E01–E24` since the v1.16.0 sync).

## v1.16.0
整合 loop-engineering（cobusgreyling OSS）概念的第一批補強，範圍經 RICE/YAGNI 評估後收窄
（批次/排程模式 + loop-budget 整合延至 v1.17，理由與啟動條件見 governance.md）：
1. Step 4 新增 Path denylist 文字規則（三條比對規則：.env 系列／auth·payments·secrets·
   credentials 目錄段／secret·credential·apikey·token 字樣的設定金鑰檔），L-STEP 2 明文
   同樣適用；命中時輸出「Denylist 阻擋」模板等待 A/B 回覆。專案 CLAUDE.md `## Denylist`
   區塊可覆寫預設清單。概念借自 minimal-fix，內嵌文字不建立 Skill 依賴；hook 化列 v1.17 候選
2. Step 7-B prompt 新增「環境無法實際驗證時回報 ESCALATE_HUMAN，不得未執行宣稱 ✅」指令；
   Step 7-C 分級表新增 ESCALATE_HUMAN 處理列（不視為失敗、不計入三次終止條件、停在 Step 7
   輸出人工驗證清單等待指示）。補上 v1.15.0 Step 6「無 CLI/API 宣告」在 Step 7 缺少的對應
   分支。概念借自 loop-verifier
3. 修正既有文件 bug：v1.15.0 升版時 E19–E22 場景本體已補齊（見 v1.15.0 條目 4），但
   eval-scenarios.md 檔頭計數文字與 E08 引用範圍文字未同步更新，遺留在「十八個」／E01–E18
   （純文字描述滯後，場景數量本身無誤）；本次一併修正為二十四／E01–E24，並在 E08 加註提醒
   未來新增場景需同步更新此兩處
4. 新增 E23（denylist 阻擋）、E24（ESCALATE_HUMAN），Eval 場景表增為二十四個
5. output-templates.md 新增「Denylist 阻擋」「ESCALATE_HUMAN」兩個輸出模板
6. governance.md 記錄概念借用關係（非執行依賴）與 v1.17 兩個候選項目

## v1.15.0
第一輪健檢（2026-07-06，v1.14.0 上線後 3 天，20 筆門檻已被 38 筆事件大幅超過）觸發的修法：
1. `discipline-loop-diff-size-check.js` 修復兩個問題：(a) `Write` 建立全新檔案不再誤判為
   「單次改動超過 50 行」，改用寫入前 `fs.existsSync` 判斷是否為新檔案；覆寫既有檔案時改算
   「新增行數」而非總行數；(b) 警告傳達機制從 PostToolUse + stderr + exit 0（Claude Code 官方
   文件確認此組合訊息不會傳入 Claude 上下文）改為 PreToolUse + exit 0 + stdout JSON
   `hookSpecificOutput.additionalContext`（唯一官方確認可靠、不阻斷的傳達方式）；同時修正
   PostToolUse 時序問題（寫入已完成才檢查 existsSync 恆為 true，無法判斷寫入前狀態）
2. 新增 `discipline-loop-ship-gate-check.js`（PreToolUse on Bash，比對 `git commit`）：
   `.loop-state` 顯示已進入 Step 7.5 但 `step7-verification-log.log` 無對應 task_id 記錄時，
   透過 additionalContext 提醒，不阻擋 commit
3. 新增 `discipline-loop-entry-check.js`（PreToolUse on Write/Edit/MultiEdit）：工作目錄無任何
   `.loop-state-*.md` 時提醒，不阻擋；同 cwd 10 分鐘內節流，避免同一輕量任務被連續提醒洗版
4. `references/eval-scenarios.md` 新增 E19–E22（needs_confirmation regression、新檔案不誤判、
   ship-gate 警告、entry-check 警告與節流），更新 E15 反映 additionalContext 機制，Eval 場景表
   由十八個增為二十二個
5. `SKILL.md` 新增四條文字規則：Step 7 同等風險端點審查強度一致性、`.loop-state` schema 新增
   `scope_exception` 欄位與事故處理正式宣告流程、Step 6／L-STEP 4 無 CLI/API 環境的人工驗證
   宣告分支、及時止損（同一技術性問題卡 2–3 次須主動換路徑或問使用者）
6. `references/governance.md` 記錄第一輪健檢結果與兩項新增已知限制（line_warning 傳達機制失效
   已修復；hooks/skill 目錄無版控，記錄待後續處理）

逐條對照 E01–E22 全數通過。Step 0、1、2、5、8、9 主體決策邏輯未動，擴充 Step 3（文字提及新
hook）、Step 4（行數判斷 hook 位置與機制）、Step 6（無 CLI/API 驗證分支）、Step 7（審查強度一致
性）、錯誤處理（及時止損）。

**獨立 review 第一輪抓到 1 個 CRITICAL + 4 個 HIGH，修復後第二輪重審：**
- CRITICAL：`Write`/`Edit`/`MultiEdit` 的「新增行數」原用 `Set` 判斷「這行是否曾出現過」，會
  嚴重低估大範圍重寫（舊檔案裡任何曾出現過的行，即使現在是新區塊的一部分也不計入）。改用
  multiset（頻率表）差異計算，三種工具改動統一用同一套邏輯判斷淨新增行數
- HIGH：`ship-gate-check.js` 的 `task_id:`／`step: 7.5` regex 未錨定，可能被自由文字欄位誤判；
  改為錨定行首（multiline flag），比對實際 YAML key 而非任意子字串
- HIGH：`entry-check.js`／`ship-gate-check.js` 補上 `cwd`/檔案存在性檢查，與既有
  `dependency-check.js` 的風格一致
- HIGH：settings.json 原本三支 hook 掛在同一個 `Write|Edit|MultiEdit` matcher 底下，實測發現
  訊息傳達不穩定（詳見下方「已知不確定性」）；改為每支 hook 各自獨立的 matcher 區塊，官方文件
  確認此為安全寫法，重測後行為正確
- MEDIUM（資安審查）：`ship-gate-check.js`／`diff-size-check.js` 新增 1MB 讀取上限，避免讀取
  異常肥大的 log/檔案拖慢每次 commit 或編輯

明確排除本次範圍：「分類器代打 vs loop 自身授權檢查」的架構層級重新設計（記錄為已知限制，
待下一輪 spec）、輕量六步路徑是否補 Step 7.5 的設計討論、健檢門檻數字本身的調整、
`~/.claude/hooks/` 與 skill 目錄版控化。

**已知不確定性（實測記錄）：** 官方文件記載同一 matcher 下多支 hook 會平行執行，且每支的
`additionalContext` 都會被 Claude 收到；但實測（同一 matcher 掛 3 支 hook）第一次只看到其中一支
的訊息。後續改為每支 hook 各自獨立 matcher 區塊後重測，訊息正確顯示——但同時發現原本「看起來沒
顯示」的那次測試，根因其實是測試方法本身有誤（在 scratch 目錄編輯，但 hook 判斷的是 session 實際
cwd，該處本來就有合法的 `.loop-state`，該支 hook 正確保持沉默）。兩個變因同時存在，無法百分之百
排除「同一 matcher 多支 hook」是否仍有官方文件與實際行為不一致之處；保留獨立 matcher 區塊作為
較保守的寫法，未來若發現異常請優先檢查是否又混用了同一 matcher 掛多支 hook。

決策記錄：Notion 工作總結倉庫（2026-07-06，engineering-discipline-loop v1.14 踩坑與優化討論；
本次 session 內 spec-writer 產出的 v1.15 規格與 harness-rules Pre-flight 核查）

## v1.14.0
工具層依賴／行數 Sensor + Step 7.5 Rubric 化驗收 + 量測基礎設施（Spec v2，取代原 v1 規格）：
1. Step 3 依賴變更檢查改由 PreToolUse hook（`~/.claude/hooks/discipline-loop-dependency-check.js`）
   偵測，取代 agent 自行比對 manifest diff：package.json 用 JSON.parse 比對 top-level 套件差異，
   pyproject.toml/Cargo.toml/go.mod 無輕量 parser，一律回傳 needs_confirmation；hook 判定結果由
   agent 依既有 Step 3 STOP 流程處理，hook 本身不與使用者對話（沿用既有技術限制）
2. Step 4 行數上限改由 PostToolUse hook（`discipline-loop-diff-size-check.js`）輔助偵測，
   超過 50 行時夾帶可行動警示文字（PostToolUse 無法阻擋，僅警示）
3. 兩支 hook 觸發事件（dependency_block／line_warning／needs_confirmation）追加寫入
   `references/hook-trigger-log.log`；放行不算觸發，不寫入
4. Step 7.5 每次 rubric 判定結果追加寫入 `references/step7-verification-log.log`（任務ID／AC編號／
   判定結果），純記錄不分析，為未來 B2（累積 review 準確率）評估預留原始資料
5. `references/governance.md` 新增「模型升級健檢」條目：`hook-trigger-log.log` 三類分開計數
   合計滿 20 筆或距上線滿六週，兩者先到者觸發第一輪健檢審查

新增 E12–E18（依賴偵測 block/放行/needs_confirmation、行數警示、Step 7.5 log 寫入、governance
條目存在性、三類事件分開計數），Eval 場景表由十一個增為十八個。
逐條對照 E01–E18 全數通過，Step 0、1、2、5、6、8、9 及 L-STEP 決策邏輯本體未動，僅擴充
Step 3、4、7.5。`git diff --stat SKILL.md`：14 insertions(+)，9 deletions(-)，符合 45 行門檻。

明確排除本次範圍：A2（依 hook 數據拆除/降級 STOP 點）、B2 分析與信任分數、工作流 C 觸發一
（健檢執行本身）——均待第一輪健檢（20 筆或六週）觸發後另案評估。

決策記錄：Notion 工作總結倉庫（2026-07-03，engineering-discipline-loop v1.14.0 Sensor+Rubric+
量測基礎設施 Spec v2 討論）

## v1.13.0
兩項 RICE 評估排序最高的補強（依賴鎖定 P2 分數 48、觸發計數用於未來 RICE 重估）：
1. Step 3 新增「依賴變更檢查」：比對 manifest（package.json/pyproject.toml/Cargo.toml/go.mod
   等）diff，偵測到新增 top-level 套件時，MUST 讀取 output-templates.md 的「Step 3：新增依賴
   確認」格式並輸出，等待確認才能繼續 Step 4；既有套件僅版本號變化視為升級，不觸發
2. Step 1 新增觸發條件計數：命中既有三類額外必做條件（跨系統整合/UI-前端/驗收型任務）時，
   追加寫入 references/trigger-counts.log（skill 目錄本身非 git 管理，不需額外 .gitignore
   處理），供未來累積數據重新評估 RICE Reach，不要求使用者操作

新增 E10（新增依賴攔截）、E11（既有依賴升版正確放行），Eval 場景表由九個增為十一個；
同步修正 E08 pass_condition 內過時的「E01–E07」為「E01–E11」。
逐條對照 E01–E11 全數通過，Step 0、2、4–9 及 L-STEP 決策邏輯本體未動，僅擴充 Step 1、3。

決策記錄：Notion 工作總結倉庫（2026-07-03，engineering-discipline-loop 依賴鎖定+觸發計數 Spec 討論）

## v1.12.0
來自 Whisper macOS UI 改版 session（5 輪完整/輕量迴圈）的實戰觀察，五項補強：
1. Step 1 新增「UI/前端任務額外必做」：任務涉及視覺改版但無附圖時，MUST 先問使用者有無實際
   視覺稿，不得只憑文字規格判斷視覺密度（比照既有跨系統整合評估的強制詢問模式）
2. 修正 Step 9 SHIP 清理指示與 0-D-i task-id 命名慣例不一致：「刪除 `.loop-state.md`」改為
   「刪除本次任務的 `.loop-state-{task-id}.md`」；同步修正 `quality-standards.md` 兩處同類敘述
3. 新增第三種任務類型「驗收既有、非本次撰寫的程式碼」，Step 1 補「驗收型任務」Explore 技巧
   （id/reference 交叉比對、結構完整性靜態檢查、優先信任既有邏輯不重寫）
4. Step 7-B 明文建議修復後重審優先用 `SendMessage` resume 同一個 review agent，而非重新
   spawn——保留原始審查脈絡，重驗更精準且省 token
5. Step 8 新增「UI-facing 改動需視覺證據」：不得只憑測試通過宣稱完成，環境限制無法截圖時
   須明確告知並說明替代驗證方式；`quality-standards.md` Checklist 同步新增對應項目

新增 E09（UI/前端任務視覺稿確認），Eval 場景表由八個增為九個。
逐條對照 E01–E09 全數通過，Step 2–7、9 及 L-STEP 決策邏輯本體未動，僅擴充 Step 1/7/8/9。

實測效果：主檔 599 → 636 行（五項新增內容的原始成本），收斂措辭後回落至 615 行（+16，約
每項功能 3 行）。未把新增的三項 Step 1 檢查（跨系統整合、UI 視覺稿、驗收型任務）搬進
references/——這些是會影響「能不能進 Step 2」的判斷內容，不是單純的輸出格式模板，比照
v1.11.0 對 Step 1 跨系統區塊的既有處理方式，決策內容留在主檔內，只壓縮措辭不搬遷。

## v1.11.1
壓到 600 行以內（低風險收尾）：
1. 修正 0-D-i 遺留的重複內容——task-id 格式範例與 `references/output-spec.md` 的「檔名格式」
   重複（v1.11.0 已修過 0-D-iii 同類重複，這條漏掉了），改為指向同一份文件
2. 移除兩處結構上多餘的雙重分隔線（執行流程標題後、輕量六步路徑標題後，各與上一個
   分隔線緊鄰重複）

實測效果：`SKILL.md` 611 → 599 行。核算過：178 個空白行沒有一個是意外重複、24 個分隔線
大多各自服務不同結構邊界，這輪已經是低垂果實的極限，margin 只剩 1 行。若要再往下，
唯一路徑是動 Step 1–9 的決策文字本身或先前排除的逐步 YAML 範例，兩者都已評估過不划算。
Step 1–9 / L-STEP 1–6 決策邏輯逐字未動。

## v1.11.0
第二輪瘦身重構（不動核心邏輯）：搬出 9 項條件觸發/純格式內容，全部與 Step 1–9、L-STEP 1–6
的決策邏輯正交（不影響「該不該繼續執行」的判斷，只影響「輸出什麼訊息」）：
1. 0-0 環境不符警告模板、0-A 斷點續跑清單、0-C 內建風險評估 fallback 表、0-C L4 阻斷輸出格式、
   ⛔ LOOP BLOCKED、🛑 SHIP FAILED/Rollback → 新增 `references/output-templates.md`
2. 輸出規格整節（每步輸出格式、State 檔 schema、生命週期、改動邊界）→ 新增 `references/output-spec.md`；
   0-D-iii 的 state 初始化 YAML 範例改為指向同一份文件，消除與輸出規格重複的內容
3. 品質標準（三級判斷基準）+ 品質 Checklist → 新增 `references/quality-standards.md`

明確排除：Step 1–9 每步結尾的 `.loop-state.md 更新` YAML 範例（九步合計約 50–70 行）不搬出——
這塊內容每一步都會被讀寫，搬到 references/ 只會把行數藏起來，不會降低總 token 成本，甚至可能
因為每步都要額外查找而更高。行數指標和 token 成本在此案例上會分歧，優先看 token 成本。

實測效果：主檔 803 行 → 611 行（-24%）。從 v1.10.0 前的起點（988 行）累計 **-38%**。
逐條對照 E01–E08 全數通過，Step 1–9 / L-STEP 1–6 決策文字逐字未動。
評估與決策記錄：[Notion](https://app.notion.com/p/391280a95f7681029f96df94be034460)

## v1.10.1
補上 v1.10.0 瘦身重構後發現的 Eval 盲區：E01–E07 只測 Step 0–9 執行路徑，沒有一條測試新增的
`references/*.md` pointer 讀取行為本身。新增 E08（reference pointer 讀取可靠性），
強制版本升級前必須逐條列出 E01–E08 比對結果，禁止僅憑摘要宣稱「Eval 通過」。
`references/eval-scenarios.md` 場景數由七個改為八個，`SKILL.md` 對應 pointer 文字同步更新。

## v1.10.0
瘦身重構（不動核心邏輯）：
1. Eval 場景表 E01–E07 搬至 `references/eval-scenarios.md`
2. Knowledge Governance 搬至 `references/governance.md`，主檔留 owner/依賴 2 行 stub
3. `/init` 冷啟動附錄搬至 `references/init.md`，並改名為「discipline-loop 初始化」以避免與環境中另一個同名 plugin skill `init` 混淆
4. 完整版本歷程搬出 frontmatter，改為本檔案

實測效果：主檔 988 行 → 792 行（-20%），38,169 bytes → ~28,000 bytes（-27%）。Step 1–9 完整九步與 L-STEP 1–6 輕量六步流程逐字未變動。
評估與決策記錄：[Notion](https://app.notion.com/p/391280a95f7681029f96df94be034460)

## v1.9.0
Deep Professional Judgment 整合：
1. 新增 `## Deep Professional Judgment` 設計原則段落（角色定位之前）
2. Step 0-B 新增「真實問題確認」必答問題，確認任務值得做之後才進 Explore
3. Step 7 Review Agent 問題清單新增第 10 條：過早收斂與局部完整性檢查
4. Step 8 新增 capability-health 觸發規則，將 AI 依賴風險寫入 CLAUDE.md

## v1.8.0
邏輯串聯補強與 Eval 擴充：
1. 版號同步（front matter 修正為 v1.7.0 → v1.8.0）
2. Step 1 □5 → Step 2 AC → Step 7.5 三者加明確 cross-reference，消除「[需用戶驗證]」標注的隱性手交接
3. Eval 場景表補入 E05（跨系統整合）、E06（L4 阻斷）、E07（CLAUDE.md 衝突）
4. `.loop-state` v2 升級時機從「6–12 個月」改為三個可量測觸發條件

## v1.7.0
跨系統整合評估（Step 1 補強）：
Step 1 EXPLORE 新增「跨系統整合任務額外必做」區塊（五項評估）：
介面約束、生命週期約束、不可控邊界、最高風險假設（spike 驗證）、測試邊界預先標注。
明文化「評估 ≠ 實作」，spike 未通過不展開實作。`.loop-state` summary 格式新增跨系統評估欄位。

## v1.6.0
測試紀律補強（兩處）：
1. Step 2 AC 撰寫規則新增：涉及硬體/物理操作必須標注 [需用戶驗證]，不得由 Claude 自行宣稱測過；AC 清單必須有至少一條 end-to-end 路徑，「元件通過 ≠ 功能完成」明文化。
2. Step 8 閉環前新增：先清環境（kill process/port）防止副作用汙染，查 log 確認無 ERROR，交付時明確區分「已驗」vs「需用戶驗」。

## v1.5.0
Requirement Verification（Step 7.5）：
Step 2 Plan 加驗收條件（AC）必填欄位，AC 必須可自動驗證，需人工判斷的條件在 Step 2 審批時當場鎖定。
新增 Step 7.5 在 Review Agent 後逐條自動驗證 AC，有未達成則說明差距，等待 A（補實作）或 B（接受現況）。

## v1.4.0
Task-ID prefix 解決 concurrent sessions 狀態衝突：
`.loop-state.md` 改為 `.loop-state-{YYYYMMDD}-{4碼}.md`，每個任務獨立 state 檔，concurrent sessions 互不干擾。
0-A 支援多 state 檔列表顯示與 A1/A2 選擇續跑。`.gitignore` 改用 wildcard 模式 `.loop-state-*.md`。

## v1.3.0
Step 7 升級為獨立 Review Agent：
self-review checklist 改為 spawn code-reviewer subagent，傳入 task / plan 摘要 / diff，採分級處理：
CRITICAL/HIGH 強制修復，MEDIUM 記錄後繼續，LOW 忽略。

## v1.2.1
三個執行細節補強：
1. Step 3 CLAUDE.md 衝突定義為 A（命名規範）/ B（禁止 pattern）兩類，非此兩類視為相容
2. Step 6 補入覆蓋率門檻，有設定從專案設定，無設定預設 80%，低於門檻視同失敗
3. Step 9 / L-STEP 6 commit type 明確枚舉，禁止自創 type

## v1.2.0
三項可觀察性補強：
1. Step 0.0 環境偵測，Chat/Cowork 降級為「僅規劃」模式
2. 模組 ⑦ 後新增 § Eval 場景表 E01–E04，升版前必跑
3. 已知限制改為結構化治理表，含影響等級與目標版本

## v1.1.0
補強六個設計缺口：
1. harness-rules 未安裝時的內建風險評估 fallback
2. L4 阻斷的標準輸出格式
3. 斷點續跑的狀態顯示格式
4. 輕量路徑 L-STEP 5.5 hooks 快速確認
5. 覆寫舊 `.loop-state.md` 前的確認步驟
6. 主流程的 `.gitignore` 自動確認

## v1.0.0
初版。整合九步工程紀律、輕量六步路徑、harness 條件式 Pre-flight、
`.loop-state.md` 狀態持久化、三次終止條件、git rollback、`/init` 冷啟動指令。
依賴 `harness-rules` v1.0.0。
