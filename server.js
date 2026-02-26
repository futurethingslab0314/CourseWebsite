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
const coursesDatabaseId = process.env.NOTION_DATABASE_ID_THEME_1;
const projectsDatabaseId = process.env.NOTION_DATABASE_ID_THEME_2;
const siteBaseUrl = process.env.PUBLIC_SITE_URL || process.env.SITE_BASE_URL || '';
const enableCourseLinkWriteback = (process.env.ENABLE_COURSE_LINK_WRITEBACK || '').toLowerCase() === 'true';
const courseLinkSyncSecret = process.env.COURSE_LINK_SYNC_SECRET || '';

const themeDatabaseMap = {
  '1': process.env.NOTION_DATABASE_ID_THEME_1,
  '2': process.env.NOTION_DATABASE_ID_THEME_2
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
app.use(express.json());

const notionHeaders = {
  Authorization: `Bearer ${notionApiKey}`,
  'Notion-Version': notionVersion,
  'Content-Type': 'application/json'
};

const queryNotionDatabase = async (databaseId, body = {}) => {
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: notionHeaders,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API ${response.status}: ${errorText}`);
  }

  return response.json();
};

const retrieveNotionDatabase = async (databaseId) => {
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    method: 'GET',
    headers: notionHeaders
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API ${response.status}: ${errorText}`);
  }

  return response.json();
};

const updateNotionPage = async (pageId, body) => {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API ${response.status}: ${errorText}`);
  }

  return response.json();
};

const queryAllNotionPages = async (databaseId, initialBody = {}) => {
  const allResults = [];
  let hasMore = true;
  let nextCursor = undefined;

  while (hasMore) {
    const body = nextCursor ? { ...initialBody, start_cursor: nextCursor } : initialBody;
    const page = await queryNotionDatabase(databaseId, body);
    const results = Array.isArray(page.results) ? page.results : [];
    allResults.push(...results);
    hasMore = Boolean(page.has_more);
    nextCursor = page.next_cursor;
  }

  return allResults;
};

const propText = (prop) => {
  if (!prop) return '';
  switch (prop.type) {
    case 'title':
      return (prop.title || []).map((item) => item.plain_text).join('');
    case 'rich_text':
      return (prop.rich_text || []).map((item) => item.plain_text).join('');
    case 'select':
      return prop.select?.name || '';
    case 'status':
      return prop.status?.name || '';
    case 'url':
      return prop.url || '';
    case 'number':
      return typeof prop.number === 'number' ? String(prop.number) : '';
    case 'relation':
      return (prop.relation || []).map((item) => item.id).join(',');
    case 'multi_select':
      return (prop.multi_select || []).map((item) => item.name).join(',');
    case 'files':
      return (prop.files || [])
        .map((item) => item?.file?.url || item?.external?.url)
        .filter(Boolean)
        .join(',');
    default:
      return '';
  }
};

const propFiles = (prop) => {
  if (!prop || prop.type !== 'files') return [];
  return (prop.files || [])
    .map((item) => item?.file?.url || item?.external?.url)
    .filter(Boolean);
};

const propRelationIds = (prop) => {
  if (!prop || prop.type !== 'relation') return [];
  return (prop.relation || []).map((item) => item.id).filter(Boolean);
};

const hasPublishedStatus = (props = {}) => {
  const statusProp = props.Status || props.status;
  if (!statusProp) return true;
  const value = propText(statusProp).trim().toLowerCase();
  return value === 'published';
};

const pickTitle = (props = {}) => {
  const preferred = ['CourseName', 'ProjectName', 'Name', 'name', 'Title', 'title'];
  for (const key of preferred) {
    const text = propText(props[key]);
    if (text) return text;
  }
  const firstTitleEntry = Object.values(props).find((prop) => prop?.type === 'title');
  return propText(firstTitleEntry);
};

const normalizeCourse = (page) => {
  const props = page.properties || {};
  const slugRaw = propText(props.Slug || props.slug);
  const fallbackSlug = pickTitle(props).trim().toLowerCase().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-');
  return {
    id: page.id,
    slug: (slugRaw || fallbackSlug || page.id).trim(),
    courseName: propText(props.CourseName) || pickTitle(props) || 'Untitled Course',
    courseSummary: propText(props.CourseSummary),
    coverImage: propFiles(props.CoverImage)[0] || '',
    courseLink: propText(props.CourseLink),
    status: propText(props.Status),
    projectIds: propRelationIds(props.Projects)
  };
};

const buildCourseUrl = (baseUrl, slug) => {
  const cleanBase = (baseUrl || '').trim().replace(/\/+$/, '');
  return `${cleanBase}/courses/${encodeURIComponent(slug)}`;
};

const buildCourseLinkPropPayload = (courseLinkPropType, url) => {
  if (courseLinkPropType === 'url') return { url };
  if (courseLinkPropType === 'rich_text') {
    return {
      rich_text: [
        {
          type: 'text',
          text: { content: url }
        }
      ]
    };
  }
  if (courseLinkPropType === 'title') {
    return {
      title: [
        {
          type: 'text',
          text: { content: url }
        }
      ]
    };
  }
  return { url };
};

const syncCourseLinks = async (baseUrl) => {
  if (!notionApiKey) throw new Error('Missing env var: NOTION_API_KEY');
  if (!coursesDatabaseId) throw new Error('Missing env var: NOTION_DATABASE_ID_THEME_1 (Courses DB)');
  if (!baseUrl) throw new Error('Missing env var: PUBLIC_SITE_URL or SITE_BASE_URL');

  const db = await retrieveNotionDatabase(coursesDatabaseId);
  const courseLinkProp = db?.properties?.CourseLink;
  if (!courseLinkProp) {
    throw new Error('Courses DB missing CourseLink property');
  }
  const courseLinkPropType = courseLinkProp.type || 'url';

  const pages = await queryAllNotionPages(coursesDatabaseId);
  let updated = 0;
  let skipped = 0;

  for (const page of pages) {
    const course = normalizeCourse(page);
    if (!hasPublishedStatus(page.properties)) {
      skipped += 1;
      continue;
    }
    if (!course.slug) {
      skipped += 1;
      continue;
    }

    const targetUrl = buildCourseUrl(baseUrl, course.slug);
    if (course.courseLink === targetUrl) {
      skipped += 1;
      continue;
    }

    await updateNotionPage(course.id, {
      properties: {
        CourseLink: buildCourseLinkPropPayload(courseLinkPropType, targetUrl)
      }
    });
    updated += 1;
  }

  return { updated, skipped, total: pages.length };
};

const normalizeProject = (page) => {
  const props = page.properties || {};
  const orderValue = Number(propText(props.Order));
  return {
    id: page.id,
    projectName: propText(props.ProjectName) || pickTitle(props) || 'Untitled Project',
    tabName: propText(props.TabName) || propText(props.ProjectName) || pickTitle(props) || 'Project',
    order: Number.isFinite(orderValue) ? orderValue : Number.MAX_SAFE_INTEGER,
    sourceDatabaseId: propText(props.SourceDatabaseId).trim(),
    status: propText(props.Status),
    uiPattern: propText(props.UiPattern),
    fieldMapping: propText(props.FieldMapping),
    courseIds: propRelationIds(props.Course)
  };
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

app.get('/api/courses', async (_req, res) => {
  if (!notionApiKey) {
    return res.status(500).json({ error: 'Missing env var: NOTION_API_KEY' });
  }
  if (!coursesDatabaseId) {
    return res.status(500).json({ error: 'Missing env var: NOTION_DATABASE_ID_THEME_1 (Courses DB)' });
  }

  try {
    const pages = await queryAllNotionPages(coursesDatabaseId);
    const courses = pages
      .map(normalizeCourse)
      .filter((_course, index) => hasPublishedStatus(pages[index].properties));
    return res.json({ results: courses });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch courses',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/projects', async (_req, res) => {
  if (!notionApiKey) {
    return res.status(500).json({ error: 'Missing env var: NOTION_API_KEY' });
  }
  if (!projectsDatabaseId) {
    return res.status(500).json({ error: 'Missing env var: NOTION_DATABASE_ID_THEME_2 (Projects DB)' });
  }

  try {
    const pages = await queryAllNotionPages(projectsDatabaseId);
    const projects = pages
      .map(normalizeProject)
      .filter((_project, index) => hasPublishedStatus(pages[index].properties))
      .sort((a, b) => a.order - b.order);
    return res.json({ results: projects });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch projects',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/source-database/:databaseId', async (req, res) => {
  if (!notionApiKey) {
    return res.status(500).json({ error: 'Missing env var: NOTION_API_KEY' });
  }

  const databaseId = req.params.databaseId;
  if (!databaseId) {
    return res.status(400).json({ error: 'Missing databaseId' });
  }

  try {
    const [database, rows] = await Promise.all([
      retrieveNotionDatabase(databaseId),
      queryAllNotionPages(databaseId)
    ]);
    return res.json({
      database: {
        id: database.id,
        title: (database.title || []).map((item) => item.plain_text).join(''),
        properties: database.properties || {}
      },
      rows
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch source database',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/admin/sync-course-links', async (req, res) => {
  if (courseLinkSyncSecret) {
    const incomingSecret = req.get('x-sync-secret') || req.body?.secret;
    if (incomingSecret !== courseLinkSyncSecret) {
      return res.status(401).json({ error: 'Unauthorized sync request' });
    }
  }

  const baseUrl = req.body?.baseUrl || siteBaseUrl;
  try {
    const result = await syncCourseLinks(baseUrl);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to sync course links',
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
  if (enableCourseLinkWriteback) {
    syncCourseLinks(siteBaseUrl)
      .then((result) => {
        console.log(`CourseLink sync done. updated=${result.updated} skipped=${result.skipped} total=${result.total}`);
      })
      .catch((error) => {
        console.error('CourseLink sync failed:', error instanceof Error ? error.message : error);
      });
  }
});
