# CourseWebsite Notion 驅動生成計畫

## 整體計畫
1. 目標：沿用目前 CourseWebsite 的 UI 模板，自動生成不同課程的成果發表網站。
2. 資料來源：Notion 的 `Courses`、`Projects`，以及每個 project 的 `SourceDatabaseId`。
3. 核心策略：建立 schema-driven UI engine（不依賴固定欄位）。
4. 技術方向：產品程式處理資料與渲染；skill 負責高頻重複流程與檢查。

## 目前共識
1. 不使用固定 `project1/project2` 欄位，改用 relation（`Courses -> Projects`）。
2. 允許不同作業資料庫有不同 schema，系統需自動讀取並正規化。
3. 需要輕量設計系統（tokens + 核心元件 + mapping layer）。
4. 需要 skill，但 skill 只處理流程自動化，不承載核心渲染邏輯。

## 執行步驟
1. 定稿 Notion 資料模型。
- Courses：`CourseName`、`Slug`、`CourseSummary`、`CoverImage`、`Status`、`Projects`、`CourseLink`
- Projects：`ProjectName`、`Course`、`TabName`、`Order`、`SourceDatabaseId`、`Status`、`FieldMapping`（可選）、`UiPattern`（可選）

2. 先完成 MVP 資料流（先不做 skill）。
- 讀取 published 課程
- 抓取關聯 projects 並依 `Order` 排序
- 讀取每個 `SourceDatabaseId`
- 生成 `/courses/[slug]`

3. 實作 schema-driven 正規化。
- 掃描 source DB 的欄位名稱與型別
- 自動分類欄位（`title`、`image`、`gallery`、`color`、`text`、`link`...）
- 轉成統一前端資料模型

4. 實作 UI pattern 自動套版。
- 依欄位組合選擇版型（例如色票、圖集敘事、通用卡片）
- 判斷不確定時 fallback 到通用卡片
- 支援以 `FieldMapping` / `UiPattern` 人工覆寫

5. 加上發佈守門與回寫。
- 僅顯示 `Status=published`
- 缺欄位只記 warning，不讓整站中斷
- 部署成功後回寫 `CourseLink`

6. 補上第一批 skill。
- `prepublish-check`：發佈前檢查
- `schema-mapping-assistant`：mapping 與 UI 建議助手

## 一句話結論
先把可執行的 schema-driven 產品核心做起來，再把高頻流程封裝成 skill，維護成本最低、擴充性最高。
