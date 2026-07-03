# Changelog — engineering-discipline-loop

## v1.13.0
兩項補強（依賴鎖定與觸發計數）：
1. Step 3 新增「依賴變更檢查」：比對 manifest（package.json/pyproject.toml/Cargo.toml/go.mod
   等）diff，偵測到新增 top-level 套件時，MUST 讀取 output-templates.md 的「Step 3：新增依賴
   確認」格式並輸出，等待確認才能繼續 Step 4；既有套件僅版本號變化視為升級，不觸發
2. Step 1 新增觸發條件計數：命中既有三類額外必做條件（跨系統整合/UI-前端/驗收型任務）時，
   追加寫入 `references/trigger-counts.log`（本機執行時產生，已加入 `.gitignore`，不隨 repo
   分發），可用於長期累積 Step 1 各類觸發條件的實際發生頻率

新增 E10（新增依賴攔截）、E11（既有依賴升版正確放行），Eval 場景表由九個增為十一個；
同步修正 E08 pass_condition 內過時的「E01–E07」為「E01–E11」。
逐條對照 E01–E11 全數通過，Step 0、2、4–9 及 L-STEP 決策邏輯本體未動，僅擴充 Step 1、3。

## v1.12.0
五項補強，來自一輪實戰使用（五段式 UI 改版任務，五次完整/輕量紀律迴圈）的觀察：
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

## v1.11.1
壓到 600 行以內（低風險收尾）：
1. 修正 0-D-i 遺留的重複內容——task-id 格式範例與 `references/output-spec.md` 的「檔名格式」
   重複（v1.11.0 已修過 0-D-iii 同類重複，這條漏掉了），改為指向同一份文件
2. 移除兩處結構上多餘的雙重分隔線（執行流程標題後、輕量六步路徑標題後，各與上一個
   分隔線緊鄰重複）

實測效果：`SKILL.md` 611 → 599 行。Step 1–9 / L-STEP 1–6 決策邏輯逐字未動。

## v1.11.0
第二輪瘦身重構（不動核心邏輯）：搬出 9 項條件觸發/純格式內容，全部與 Step 1–9、L-STEP 1–6
的決策邏輯正交（不影響「該不該繼續執行」的判斷，只影響「輸出什麼訊息」）：
1. 環境不符警告、斷點續跑清單、內建風險評估 fallback 表、L4 阻斷輸出、⛔ LOOP BLOCKED、
   🛑 SHIP FAILED/Rollback → 新增 `references/output-templates.md`
2. 輸出規格整節（每步輸出格式、State 檔 schema、生命週期、改動邊界）→ 新增
   `references/output-spec.md`；0-D-iii 的 state 初始化 YAML 範例改為指向同一份文件，
   消除重複內容
3. 品質標準（三級判斷基準）+ 品質 Checklist → 新增 `references/quality-standards.md`

明確排除：Step 1–9 每步結尾的 `.loop-state.md 更新` YAML 範例（九步合計約 50–70 行）不搬出——
這塊內容每一步都會被讀寫，搬到 references/ 只會把行數藏起來，不會降低總 token 成本，甚至可能
因為每步都要額外查找而更高。行數指標和 token 成本在此案例上會分歧，優先看 token 成本。

實測效果：`SKILL.md` 803 → 611 行（-24%）。逐條對照 E01–E08 全數通過，Step 1–9 / L-STEP 1–6
決策文字逐字未動。

## v1.10.1
補上 v1.10.0 瘦身重構後發現的 Eval 盲區：E01–E07 只測 Step 0–9 執行路徑，沒有一條測試新增的
`references/*.md` pointer 讀取行為本身。新增 E08（reference pointer 讀取可靠性），
強制版本升級前必須逐條列出 E01–E08 比對結果，禁止僅憑摘要宣稱「Eval 通過」。
`references/eval-scenarios.md` 場景數由七個改為八個，`SKILL.md` 對應 pointer 文字同步更新。

## v1.10.0
瘦身重構（不動核心邏輯）：
1. Eval 場景表 E01–E07 搬至 `references/eval-scenarios.md`
2. Knowledge Governance 搬至 `references/governance.md`，主檔留 owner/依賴 2 行 stub
3. `/init` 冷啟動附錄搬至 `references/init.md`，並改名為「discipline-loop 初始化」以避免與同名 plugin skill `init` 混淆
4. 完整版本歷程搬出 frontmatter，改為本檔案

實測效果：主檔 988 行 → 792 行（-20%），38,169 bytes → ~28,000 bytes（-27%）。Step 1–9 完整九步與 L-STEP 1–6 輕量六步流程逐字未變動。

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
