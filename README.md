# CourseWebsite

This project now fetches Notion data through a backend API route (`/api/notion`) so your Notion token and database IDs can be stored safely in Railway environment variables.

## Environment Variables

Set these variables in Railway:

- `NOTION_API_KEY`: your Notion integration secret
- `NOTION_DATABASE_ID_THEME_1`: database ID for theme 1
- `NOTION_DATABASE_ID_THEME_2`: database ID for theme 2
- `NOTION_VERSION` (optional): default is `2022-06-28`
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

## Railway Deploy

1. Build command: `npm run build`
2. Start command: `npm run start`
3. Add the environment variables listed above in Railway project settings.
