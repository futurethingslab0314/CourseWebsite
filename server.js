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
const enableProjectMappingSync = (process.env.ENABLE_PROJECT_MAPPING_SYNC || '').toLowerCase() === 'true';
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

const normalizeNotionId = (value = '') => value.toString().replace(/-/g, '').toLowerCase();

const extractNotionId = (raw = '') => {
  const text = raw.trim();
  if (!text) return '';
  const firstSegment = text.split(/[,\s;]/).map((s) => s.trim()).find(Boolean) || text;
  const direct = firstSegment.match(/^[0-9a-fA-F-]{32,36}$/);
  if (direct) return firstSegment;
  const urlMatch = firstSegment.match(/([0-9a-fA-F]{32})/);
  if (urlMatch) return urlMatch[1];
  const cleaned = firstSegment.replace(/[^0-9a-fA-F-]/g, '');
  if (/^[0-9a-fA-F-]{32,36}$/.test(cleaned)) return cleaned;
  return firstSegment;
};

const findFirstProp = (props = {}, keys = []) => {
  for (const key of keys) {
    if (props[key]) return props[key];
  }
  const entries = Object.entries(props);
  for (const key of keys) {
    const hit = entries.find(([name]) => name.toLowerCase() === key.toLowerCase());
    if (hit) return hit[1];
  }
  return undefined;
};

const findRelationProp = (props = {}, keywords = []) => {
  const entries = Object.entries(props);
  const exact = entries.find(([name, prop]) =>
    prop?.type === 'relation' && keywords.some((kw) => name.toLowerCase() === kw.toLowerCase())
  );
  if (exact) return exact[1];

  const fuzzy = entries.find(([name, prop]) =>
    prop?.type === 'relation' && keywords.some((kw) => name.toLowerCase().includes(kw.toLowerCase()))
  );
  return fuzzy ? fuzzy[1] : undefined;
};

const hasPublishedStatus = (props = {}) => {
  const statusProp = findFirstProp(props, ['Status', 'status', 'PublishStatus', 'State']);
  if (!statusProp) return true;
  const value = propText(statusProp).trim().toLowerCase();
  if (!value) return true;
  if (
    value.includes('draft') ||
    value.includes('unpublish') ||
    value.includes('private') ||
    value.includes('archived') ||
    value.includes('停用')
  ) {
    return false;
  }
  if (
    value.includes('published') ||
    value.includes('publish') ||
    value.includes('發佈') ||
    value.includes('發布')
  ) {
    return true;
  }
  return true;
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
  const slugRaw = propText(findFirstProp(props, ['Slug', 'slug']));
  const fallbackSlug = pickTitle(props).trim().toLowerCase().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-');
  const projectRelation = findRelationProp(props, ['Projects', 'Project', 'course project', 'projects']);
  const densityRaw = propText(findFirstProp(props, ['Density', 'density'])).trim().toLowerCase();
  const accentThemeRaw = propText(findFirstProp(props, ['AccentTheme', 'Accent Theme', 'accentTheme'])).trim().toLowerCase();
  const mediaPriorityRaw = propText(findFirstProp(props, ['MediaPriority', 'Media Priority', 'mediaPriority'])).trim().toLowerCase();
  const density = densityRaw === 'compact' || densityRaw === 'comfortable' || densityRaw === 'immersive' ? densityRaw : undefined;
  const accentTheme = accentThemeRaw === 'theme-1' || accentThemeRaw === 'theme-2' || accentThemeRaw === 'auto' ? accentThemeRaw : undefined;
  const mediaPriority = mediaPriorityRaw === 'image' || mediaPriorityRaw === 'text' || mediaPriorityRaw === 'balanced' ? mediaPriorityRaw : undefined;
  return {
    id: page.id,
    slug: (slugRaw || fallbackSlug || page.id).trim(),
    courseName: propText(findFirstProp(props, ['CourseName', 'Name', 'Title'])) || pickTitle(props) || 'Untitled Course',
    courseSummary: propText(findFirstProp(props, ['CourseSummary', 'Summary', 'Description'])),
    coverImage: propFiles(findFirstProp(props, ['CoverImage', 'Cover', 'Image']))[0] || '',
    courseLink: propText(findFirstProp(props, ['CourseLink', 'Link'])),
    status: propText(findFirstProp(props, ['Status', 'status'])),
    density,
    accentTheme,
    mediaPriority,
    projectIds: propRelationIds(projectRelation)
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

const findPropNameInSchema = (dbProperties = {}, candidates = []) => {
  const names = Object.keys(dbProperties);
  for (const candidate of candidates) {
    const exact = names.find((name) => name === candidate);
    if (exact) return exact;
  }
  for (const candidate of candidates) {
    const insensitive = names.find((name) => name.toLowerCase() === candidate.toLowerCase());
    if (insensitive) return insensitive;
  }
  for (const candidate of candidates) {
    const fuzzy = names.find((name) => name.toLowerCase().includes(candidate.toLowerCase()));
    if (fuzzy) return fuzzy;
  }
  return null;
};

const isWritablePropType = (propType) => ['url', 'title', 'select', 'status', 'rich_text'].includes(propType);

const buildPropertyPayloadByType = (propType, value) => {
  if (propType === 'url') return { url: value };
  if (propType === 'title') {
    return {
      title: [{ type: 'text', text: { content: value } }]
    };
  }
  if (propType === 'select') return { select: { name: value } };
  if (propType === 'status') return { status: { name: value } };
  return {
    rich_text: [{ type: 'text', text: { content: value } }]
  };
};

const pickByTypeAndName = (propsEntries, types = [], nameKeywords = []) => {
  const filtered = propsEntries.filter(([_, prop]) => types.includes(prop?.type));
  const named = filtered.find(([name]) => nameKeywords.some((kw) => name.toLowerCase().includes(kw)));
  if (named) return named[0];
  return filtered[0]?.[0] || '';
};

const analyzeSourceSchema = (dbProperties = {}) => {
  const entries = Object.entries(dbProperties);
  const titleProp = entries.find(([_, prop]) => prop?.type === 'title')?.[0] || '';
  const fieldMapping = {};

  const titleField = titleProp || pickByTypeAndName(entries, ['rich_text'], ['title', 'name', 'project', '作品']);
  const textField = pickByTypeAndName(entries, ['rich_text'], ['intro', 'description', 'summary', 'story', 'content', 'text', '介紹', '描述']);
  const linkField = pickByTypeAndName(entries, ['url', 'rich_text'], ['url', 'link', 'website', 'site', '連結']);
  const colorField = pickByTypeAndName(entries, ['select', 'multi_select', 'rich_text'], ['color', 'palette', 'hex', '色']);

  const fileFields = entries.filter(([_, prop]) => prop?.type === 'files').map(([name]) => name);
  const galleryField =
    fileFields.find((name) => ['gallery', 'images', 'photos', 'works', '圖集', '作品'].some((kw) => name.toLowerCase().includes(kw))) || '';
  const imageField =
    fileFields.find((name) => ['cover', 'main', 'hero', 'thumbnail', 'image', '封面', '主圖'].some((kw) => name.toLowerCase().includes(kw))) ||
    fileFields[0] ||
    '';

  if (titleField) fieldMapping.title = titleField;
  if (textField) fieldMapping.text = textField;
  if (galleryField) fieldMapping.gallery = galleryField;
  if (imageField) fieldMapping.image = imageField;
  if (linkField) fieldMapping.link = linkField;
  if (colorField) fieldMapping.color = colorField;

  let uiPattern = 'generic-cards';
  if (fieldMapping.gallery) uiPattern = 'gallery-story';
  else if (fieldMapping.color) uiPattern = 'color-swatch';
  else if (fieldMapping.link) uiPattern = 'link-cards';

  return {
    fieldMapping,
    uiPattern
  };
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

const syncProjectMappings = async ({ projectPageId, includeUnpublished = true, overwrite = false } = {}) => {
  if (!notionApiKey) throw new Error('Missing env var: NOTION_API_KEY');
  if (!projectsDatabaseId) throw new Error('Missing env var: NOTION_DATABASE_ID_THEME_2 (Projects DB)');

  const projectDb = await retrieveNotionDatabase(projectsDatabaseId);
  const projectDbProps = projectDb?.properties || {};
  const fieldMappingPropName = findPropNameInSchema(projectDbProps, ['FieldMapping', 'Field Mapping', 'Mapping']);
  const uiPatternPropName = findPropNameInSchema(projectDbProps, ['UiPattern', 'UI Pattern', 'Pattern']);
  if (!fieldMappingPropName && !uiPatternPropName) {
    throw new Error('Projects DB missing FieldMapping/UiPattern properties');
  }

  const fieldMappingPropType = fieldMappingPropName ? projectDbProps[fieldMappingPropName]?.type : null;
  const uiPatternPropType = uiPatternPropName ? projectDbProps[uiPatternPropName]?.type : null;

  if (fieldMappingPropName && fieldMappingPropType && !isWritablePropType(fieldMappingPropType)) {
    throw new Error(`FieldMapping property type "${fieldMappingPropType}" is not writable. Use rich_text/title/url/select/status.`);
  }
  if (uiPatternPropName && uiPatternPropType && !isWritablePropType(uiPatternPropType)) {
    throw new Error(`UiPattern property type "${uiPatternPropType}" is not writable. Use rich_text/title/url/select/status.`);
  }

  const pages = await queryAllNotionPages(projectsDatabaseId);
  const sourceDbCache = new Map();
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  for (const page of pages) {
    if (projectPageId && normalizeNotionId(page.id) !== normalizeNotionId(projectPageId)) continue;
    if (!includeUnpublished && !hasPublishedStatus(page.properties)) {
      skipped += 1;
      continue;
    }

    const project = normalizeProject(page);
    if (!project.sourceDatabaseId) {
      skipped += 1;
      failures.push({ projectId: page.id, reason: 'Missing SourceDatabaseId' });
      continue;
    }

    try {
      let sourceDb = sourceDbCache.get(project.sourceDatabaseId);
      if (!sourceDb) {
        sourceDb = await retrieveNotionDatabase(project.sourceDatabaseId);
        sourceDbCache.set(project.sourceDatabaseId, sourceDb);
      }

      const analyzed = analyzeSourceSchema(sourceDb.properties || {});
      const mappingJson = JSON.stringify(analyzed.fieldMapping);
      const payload = {};

      if (fieldMappingPropName && fieldMappingPropType) {
        const current = propText(page.properties?.[fieldMappingPropName] || '').trim();
        const shouldWriteFieldMapping = overwrite ? current !== mappingJson : current.length === 0;
        if (shouldWriteFieldMapping) {
          payload[fieldMappingPropName] = buildPropertyPayloadByType(fieldMappingPropType, mappingJson);
        }
      }

      if (uiPatternPropName && uiPatternPropType) {
        const current = propText(page.properties?.[uiPatternPropName] || '').trim();
        const shouldWriteUiPattern = overwrite ? current !== analyzed.uiPattern : current.length === 0;
        if (shouldWriteUiPattern) {
          if (uiPatternPropType === 'select') {
            const options = projectDbProps?.[uiPatternPropName]?.select?.options || [];
            const hasOption = options.some((opt) => opt?.name === analyzed.uiPattern);
            if (!hasOption) {
              failed += 1;
              failures.push({
                projectId: page.id,
                sourceDatabaseId: project.sourceDatabaseId,
                reason: `UiPattern select missing option "${analyzed.uiPattern}" in Notion property "${uiPatternPropName}"`
              });
              continue;
            }
          }
          payload[uiPatternPropName] = buildPropertyPayloadByType(uiPatternPropType, analyzed.uiPattern);
        }
      }

      if (Object.keys(payload).length === 0) {
        skipped += 1;
        continue;
      }

      await updateNotionPage(page.id, { properties: payload });
      updated += 1;
    } catch (err) {
      failed += 1;
      failures.push({
        projectId: page.id,
        sourceDatabaseId: project.sourceDatabaseId,
        reason: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  return {
    updated,
    skipped,
    failed,
    total: pages.length,
    failures
  };
};

const syncSingleCourseLink = async ({ baseUrl, coursePageId, slug }) => {
  if (!notionApiKey) throw new Error('Missing env var: NOTION_API_KEY');
  if (!coursesDatabaseId) throw new Error('Missing env var: NOTION_DATABASE_ID_THEME_1 (Courses DB)');
  if (!baseUrl) throw new Error('Missing env var: PUBLIC_SITE_URL or SITE_BASE_URL');
  if (!coursePageId && !slug) throw new Error('Provide coursePageId or slug');

  const db = await retrieveNotionDatabase(coursesDatabaseId);
  const courseLinkProp = db?.properties?.CourseLink;
  if (!courseLinkProp) throw new Error('Courses DB missing CourseLink property');
  const courseLinkPropType = courseLinkProp.type || 'url';

  const pages = await queryAllNotionPages(coursesDatabaseId);
  const target = pages.find((page) => {
    if (coursePageId && normalizeNotionId(page.id) === normalizeNotionId(coursePageId)) return true;
    if (slug) {
      const normalized = normalizeCourse(page);
      return normalized.slug.toLowerCase() === slug.toLowerCase();
    }
    return false;
  });

  if (!target) {
    throw new Error('Target course not found in Courses database');
  }

  if (!hasPublishedStatus(target.properties)) {
    throw new Error('Target course is not published');
  }

  const course = normalizeCourse(target);
  if (!course.slug) {
    throw new Error('Target course has no slug');
  }

  const targetUrl = buildCourseUrl(baseUrl, course.slug);
  if (course.courseLink !== targetUrl) {
    await updateNotionPage(course.id, {
      properties: {
        CourseLink: buildCourseLinkPropPayload(courseLinkPropType, targetUrl)
      }
    });
  }

  return {
    updated: course.courseLink === targetUrl ? 0 : 1,
    coursePageId: course.id,
    slug: course.slug,
    courseLink: targetUrl
  };
};

const normalizeProject = (page) => {
  const props = page.properties || {};
  const orderValue = Number(propText(findFirstProp(props, ['Order', 'Sort', 'Index'])));
  const sourceRaw = propText(
    findFirstProp(props, ['SourceDatabaseId', 'SourceDatabaseID', 'Source DB Id', 'SourceDbId', 'SourceDatabase', 'Source DB'])
  );
  const densityRaw = propText(findFirstProp(props, ['Density', 'density'])).trim().toLowerCase();
  const accentThemeRaw = propText(findFirstProp(props, ['AccentTheme', 'Accent Theme', 'accentTheme'])).trim().toLowerCase();
  const mediaPriorityRaw = propText(findFirstProp(props, ['MediaPriority', 'Media Priority', 'mediaPriority'])).trim().toLowerCase();
  const courseRelation = findRelationProp(props, ['Course', 'Courses', '課程']);
  const density = densityRaw === 'compact' || densityRaw === 'comfortable' || densityRaw === 'immersive' ? densityRaw : undefined;
  const accentTheme = accentThemeRaw === 'theme-1' || accentThemeRaw === 'theme-2' || accentThemeRaw === 'auto' ? accentThemeRaw : undefined;
  const mediaPriority = mediaPriorityRaw === 'image' || mediaPriorityRaw === 'text' || mediaPriorityRaw === 'balanced' ? mediaPriorityRaw : undefined;
  return {
    id: page.id,
    projectName: propText(findFirstProp(props, ['ProjectName', 'Name', 'Title'])) || pickTitle(props) || 'Untitled Project',
    tabName: propText(findFirstProp(props, ['TabName', 'ProjectName', 'Name'])) || pickTitle(props) || 'Project',
    order: Number.isFinite(orderValue) ? orderValue : Number.MAX_SAFE_INTEGER,
    sourceDatabaseId: extractNotionId(sourceRaw),
    status: propText(findFirstProp(props, ['Status', 'status'])),
    uiPattern: propText(findFirstProp(props, ['UiPattern', 'UI Pattern', 'Pattern'])),
    fieldMapping: propText(findFirstProp(props, ['FieldMapping', 'Field Mapping', 'Mapping'])),
    density,
    accentTheme,
    mediaPriority,
    courseIds: propRelationIds(courseRelation)
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

app.all('/api/admin/sync-course-link', async (req, res) => {
  if (courseLinkSyncSecret) {
    const incomingSecret = req.get('x-sync-secret') || req.body?.secret || req.query?.secret;
    if (incomingSecret !== courseLinkSyncSecret) {
      return res.status(401).json({ error: 'Unauthorized sync request' });
    }
  }

  const body = req.body || {};
  const query = req.query || {};
  const baseUrl = body.baseUrl || query.baseUrl || siteBaseUrl;
  const coursePageId =
    body.coursePageId ||
    body.pageId ||
    body.page_id ||
    body.id ||
    query.coursePageId ||
    query.pageId ||
    query.page_id ||
    query.id;
  const slug = body.slug || query.slug;

  if (!coursePageId && !slug) {
    return res.status(400).json({
      error: 'Missing target course identifier',
      detail: 'Provide coursePageId/pageId/id or slug in webhook body/query.'
    });
  }

  try {
    const result = await syncSingleCourseLink({ baseUrl, coursePageId, slug });
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to sync one course link',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.all('/api/admin/sync-project-mappings', async (req, res) => {
  if (courseLinkSyncSecret) {
    const incomingSecret = req.get('x-sync-secret') || req.body?.secret || req.query?.secret;
    if (incomingSecret !== courseLinkSyncSecret) {
      return res.status(401).json({ error: 'Unauthorized sync request' });
    }
  }

  const body = req.body || {};
  const query = req.query || {};
  const projectPageId = body.projectPageId || body.pageId || body.id || query.projectPageId || query.pageId || query.id;
  const includeUnpublishedRaw = body.includeUnpublished ?? query.includeUnpublished;
  const includeUnpublished =
    includeUnpublishedRaw === undefined ? true : String(includeUnpublishedRaw).toLowerCase() === 'true';
  const overwriteRaw = body.overwrite ?? query.overwrite;
  const overwrite = overwriteRaw === undefined ? false : String(overwriteRaw).toLowerCase() === 'true';

  try {
    const result = await syncProjectMappings({ projectPageId, includeUnpublished, overwrite });
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to sync project mappings',
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
  if (enableProjectMappingSync) {
    syncProjectMappings()
      .then((result) => {
        console.log(`Project mapping sync done. updated=${result.updated} skipped=${result.skipped} failed=${result.failed}`);
      })
      .catch((error) => {
        console.error('Project mapping sync failed:', error instanceof Error ? error.message : error);
      });
  }
});
