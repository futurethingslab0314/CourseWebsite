import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const notionApiKey = process.env.NOTION_API_KEY;
const notionVersion = process.env.NOTION_VERSION || '2022-06-28';

const themeDatabaseMap = {
  '1': process.env.NOTION_DATABASE_ID_THEME_1,
  '2': process.env.NOTION_DATABASE_ID_THEME_2
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

const queryNotionDatabase = async (databaseId) => {
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${notionApiKey}`,
      'Notion-Version': notionVersion,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API ${response.status}: ${errorText}`);
  }

  return response.json();
};

app.get('/api/notion', async (req, res) => {
  if (!notionApiKey) {
    return res.status(500).json({
      error: 'Missing env var: NOTION_API_KEY'
    });
  }

  const theme = req.query.theme?.toString();
  const databaseId = theme ? themeDatabaseMap[theme] : undefined;

  if (!databaseId) {
    return res.status(400).json({
      error: 'Invalid or missing theme. Use /api/notion?theme=1 or theme=2'
    });
  }

  try {
    const data = await queryNotionDatabase(databaseId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch Notion database',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
