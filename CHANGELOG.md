# Changelog — engineering-discipline-loop

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
