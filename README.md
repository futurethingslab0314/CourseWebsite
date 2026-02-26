# CourseWebsite

This project now fetches Notion data through backend API routes so your Notion token and database IDs can be stored safely in Railway environment variables.

## Environment Variables

Set these variables in Railway:

- `NOTION_API_KEY`: your Notion integration secret
- `NOTION_DATABASE_ID_THEME_1`: Courses database ID
- `NOTION_DATABASE_ID_THEME_2`: Projects database ID
- `NOTION_VERSION` (optional): default is `2022-06-28`
- `PUBLIC_SITE_URL`: deployed site base URL (example: `https://your-domain.com`)
- `ENABLE_COURSE_LINK_WRITEBACK`: set `true` to auto-sync `CourseLink` on server start (recommended in production)
- `ENABLE_PROJECT_MAPPING_SYNC`: set `true` to auto-sync `FieldMapping` + `UiPattern` on server start
- `COURSE_LINK_SYNC_SECRET` (optional): secret for manual sync endpoint
- `PORT` (optional): Railway usually injects this automatically

## Local Development

1. Install dependencies:
   `npm install`
2. Create `.env.local` (or `.env`) and fill in:
   - `NOTION_API_KEY=...`
   - `NOTION_DATABASE_ID_THEME_1=...`
   - `NOTION_DATABASE_ID_THEME_2=...`
3. Start frontend + backend together:
   `npm run dev`

## API Overview

- `GET /api/courses`: reads Courses from `NOTION_DATABASE_ID_THEME_1` (published only)
- `GET /api/projects`: reads Projects from `NOTION_DATABASE_ID_THEME_2` (published only)
- `GET /api/source-database/:databaseId`: fetches schema + rows for each project `SourceDatabaseId`
- `POST /api/admin/sync-course-links`: manually trigger `CourseLink` write-back (header `x-sync-secret` if configured)
- `POST /api/admin/sync-course-link`: manually trigger one course `CourseLink` write-back by `coursePageId` or `slug`
- `ALL /api/admin/sync-project-mappings`: analyze source DB schema and write back `FieldMapping` + `UiPattern` to Projects DB (`projectPageId` optional)
  - Default: manual-first (only fills when fields are empty)
  - Force overwrite: add `overwrite=true`
- `ALL /api/admin/sync-course-style-controls`: sync `Density` + `AccentTheme` + `MediaPriority` from Courses DB to linked Projects DB
  - Default: manual-first (only fills project fields when empty)
  - Force overwrite: add `overwrite=true`
  - Scope one course: pass `coursePageId` or `slug`

The frontend then resolves:
`Courses -> Projects -> SourceDatabaseId -> /courses/[slug]`

## FieldMapping / UiPattern

- `FieldMapping` supports JSON (recommended) or `key:value` text.
- Example:
  `{"title":"作品名稱","text":"敘述","gallery":"作品圖集","link":"專案連結","color":"主色"}`
- Supported mapping keys: `title`, `text`, `image`, `gallery`, `link`, `color`
- `UiPattern` supports:
  - `gallery-story`
  - `color-swatch`
  - `link-cards`
  - `generic-cards`
- If `UiPattern` is empty, system auto-selects based on data.

## Notion Button (Single Course Link)

You can use a Notion Button automation action `Send webhook` to update only the clicked course row.

Example webhook config:

- URL: `https://your-domain.com/api/admin/sync-course-link`
- Method: `POST`
- Header:
  - `Content-Type: application/json`
  - `x-sync-secret: <COURSE_LINK_SYNC_SECRET>` (if configured)
- Body (use Notion page variable for page id):
  - `{"coursePageId":"{{Page ID}}"}`

Alternative by slug:
- `{"slug":"{{Slug}}"}`

## Notion Button (Project Mapping + UiPattern)

You can also add a button in Projects DB to analyze this project source DB and write back:

- URL: `https://your-domain.com/api/admin/sync-project-mappings`
- Method: `POST`
- Header:
  - `Content-Type: application/json`
  - `x-sync-secret: <COURSE_LINK_SYNC_SECRET>` (if configured)
- Body:
  - `{"projectPageId":"{{Page ID}}"}`

This will update the clicked project row:
- `FieldMapping` (JSON string)
- `UiPattern` (`gallery-story` / `color-swatch` / `link-cards` / `generic-cards`)

Tips:
- If your `UiPattern` property is `select`, add these options in Notion first:
  `gallery-story`, `color-swatch`, `link-cards`, `generic-cards`
- Default sync includes unpublished projects. You can restrict via:
  `?includeUnpublished=false`
- To force replace your manual values, use:
  `?overwrite=true`

## Notion Button (Course Style Controls)

When you edit style controls in Courses DB and want to propagate to linked Projects DB:

- URL: `https://your-domain.com/api/admin/sync-course-style-controls`
- Method: `POST`
- Header:
  - `Content-Type: application/json`
  - `x-sync-secret: <COURSE_LINK_SYNC_SECRET>` (if configured)
- Body for one course:
  - `{"coursePageId":"{{Page ID}}"}`

Optional body fields:
- `{"coursePageId":"{{Page ID}}","overwrite":true}` to overwrite existing project values
- `{"slug":"{{Slug}}"}` to target by slug instead of page ID

## Railway Deploy

1. Build command: `npm run build`
2. Start command: `npm run start`
3. Add the environment variables listed above in Railway project settings.
