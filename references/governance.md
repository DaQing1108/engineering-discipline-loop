# Knowledge Governance

> 由 `SKILL.md` 引用。記錄本 Skill 的 owner、依賴關係、更新/淘汰條件與已知限制。

**Owner：** 你（本 Skill 的使用者）

**適用範圍：** 你的組織中所有產品線的 Claude Code coding 任務執行。

**可信度等級：** T2（正式 SOP，允許依情境調整）

| 等級 | 意義 | 本 Skill 使用方式 |
|------|------|-----------------|
| T2 | 操作與背景依據（正式文件、SOP） | 作為 coding 任務的標準執行程序，允許依任務特性調整路徑判斷 |

**最後確認日期：** 2026-07-02

**可選整合關係（非必需依賴，本 Skill 內建 fallback，未安裝仍可完整運作）：**
- 可選整合 `harness-rules`（Pre-flight Check、風險等級定義、L3/L4 阻擋邏輯）— 未安裝時使用內建簡化風險評估（見 SKILL.md 0-C）
- 可選整合 `task-router`（L0–L4 風險等級分類定義）— 未安裝時不影響本 Skill 獨立運作
- 若你已安裝 `harness-rules` 並升版，建議確認風險等級定義是否有異動

**更新觸發條件：**
- [ ] `harness-rules`（若已安裝）升版且新增或修改風險等級定義
- [ ] `task-router`（若已安裝）升版且修改 L0–L4 分類標準
- [ ] 你的工程團隊採用新的測試框架或 git workflow，導致 hooks 設計需要調整
- [ ] 實際使用中發現新的失敗模式，需補入錯誤處理
- [ ] 距上次確認已超過 **3 個月**

**淘汰條件：**
- 你的組織採用外部 CI/CD 平台全面取代本地 hooks 機制
- 被 `engineering-discipline-loop` v2.0.0 完全取代

**被取代文件：** 無（v1.0.0 為初版）

**已知限制（結構化治理表）：**

| 限制 | 影響等級 | 解法方向 | 目標版本 |
|------|----------|----------|----------|
| 多人協作 `.loop-state.md` 互相覆蓋 | 低（單人使用為主） | 加 user prefix：`.loop-state-{username}.md`；v2 升級觸發條件：（1）同一 repo 有兩人以上同時使用 discipline-loop，或（2）CI/CD 環境需要讀取 state 檔，或（3）一週內發生一次以上 state 檔衝突 | v1.3 |
| `/ship` 原子性依賴本機 hooks 設定，Skill 無法確認 hooks 實際生效 | 中（hooks 未設定時靜默失敗） | Step 0 加 hooks 存在性檢查，已在 v1.1.0 的 L-STEP 5.5 部分解決 | ✅ v1.1 |
| Step 7 Checklist 取代不了真人 review | 中（品質上限受 checklist 設計本身限制） | Step 7 補入真人 review 觸發條件（改動 > 100 行、涉及 auth 邏輯等） | v1.3 |
| `CLAUDE.md` 提案若使用者略過確認，Skill 無法阻擋 | 低（人工確認為必要設計） | 記錄為已知限制，無自動解法 | — |
| Chat / Cowork 環境無法完整執行 | 低（已在 v1.2.0 補入降級模式） | 已在 Step 0.0 補入環境偵測與「僅規劃」降級 | ✅ v1.2 |
