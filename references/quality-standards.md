# 品質標準與 Checklist

> 由 `SKILL.md` 引用。在 `/ship` 或 `L-STEP 6 SHIP` 前，用這份文件判斷本次交付屬於哪一級，
> 並跑完 Checklist 自我審核。

## 核心定義

每次 `/ship` 後，repo 處於比開始前更乾淨、更有測試覆蓋、更有文件記錄的狀態。

## 三級判斷基準

**✅ 可直接交付（高品質）**
- 所有 Step 的 ✅ confirmation 均已輸出
- 本次任務的 `.loop-state-{task-id}.md` 在 /ship 成功後已清除
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

## 品質 Checklist（輸出前自我審核）

- [ ] Step 0 已完成路徑判斷，`.loop-state.md` 已初始化
- [ ] 完整九步或輕量六步的每個 Step 均有 ✅ 確認輸出
- [ ] Step 7（完整路徑）或 L-STEP 3（輕量路徑）的 Checklist 全部 ✅
- [ ] 測試全部 green（Step 6 或 L-STEP 4）
- [ ] /ship 成功後本次任務的 `.loop-state-{task-id}.md` 已清除，或 /ship 失敗後已 `git stash`
- [ ] 沒有任何 Step 被靜默跳過或壓縮
- [ ] CLAUDE.md 的 owner 為使用者，agent 未直接寫入（僅提案）
- [ ] 若為 UI-facing 改動，已提供視覺證據（截圖/影片），或已說明環境限制與替代驗證方式

> 任一項未完成 → 補做後再輸出。
