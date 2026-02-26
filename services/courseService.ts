import { Course, NotionDatabaseProperty, NormalizedSourceItem, Project } from '../types';

const ensureArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  return [];
};

const readRichText = (items: any[] = []): string =>
  items.map((item) => item?.plain_text || '').join('');

const readPropText = (prop: any): string => {
  if (!prop) return '';
  switch (prop.type) {
    case 'title':
      return readRichText(prop.title);
    case 'rich_text':
      return readRichText(prop.rich_text);
    case 'select':
      return prop.select?.name || '';
    case 'status':
      return prop.status?.name || '';
    case 'url':
      return prop.url || '';
    case 'email':
      return prop.email || '';
    case 'phone_number':
      return prop.phone_number || '';
    case 'number':
      return typeof prop.number === 'number' ? String(prop.number) : '';
    case 'date':
      return prop.date?.start || '';
    case 'multi_select':
      return (prop.multi_select || []).map((item: any) => item.name).join(', ');
    default:
      return '';
  }
};

const readPropFiles = (prop: any): string[] => {
  if (!prop || prop.type !== 'files') return [];
  return ensureArray(prop.files)
    .map((file: any) => file?.file?.url || file?.external?.url)
    .filter(Boolean);
};

const readPropUrl = (prop: any): string[] => {
  if (!prop) return [];
  const text = readPropText(prop);
  if (!text) return [];
  if (prop.type === 'url') return [text];
  if (/^https?:\/\//.test(text)) return [text];
  return [];
};

const readPropColor = (prop: any): string[] => {
  if (!prop) return [];
  const text = readPropText(prop).trim();
  if (!text) return [];
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text)) return [text];
  return [];
};

const pickTitle = (properties: Record<string, any>): string => {
  const entry = Object.values(properties).find((prop: any) => prop?.type === 'title');
  return readPropText(entry);
};

export const fetchCourses = async (): Promise<Course[]> => {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error(`Failed to fetch courses: ${res.status}`);
  const data = await res.json();
  return ensureArray(data.results) as Course[];
};

export const fetchProjects = async (): Promise<Project[]> => {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  const data = await res.json();
  return ensureArray(data.results) as Project[];
};

export const fetchSourceDatabase = async (
  databaseId: string
): Promise<{ title: string; properties: NotionDatabaseProperty[]; items: NormalizedSourceItem[] }> => {
  const res = await fetch(`/api/source-database/${encodeURIComponent(databaseId)}`);
  if (!res.ok) throw new Error(`Failed to fetch source DB ${databaseId}: ${res.status}`);
  const data = await res.json();

  const rawProperties = data?.database?.properties || {};
  const properties: NotionDatabaseProperty[] = Object.entries(rawProperties).map(([name, value]: [string, any]) => ({
    id: value?.id || name,
    name,
    type: value?.type || 'unknown'
  }));

  const rows = ensureArray(data.rows);
  const items: NormalizedSourceItem[] = rows.map((row: any) => {
    const props = row?.properties || {};
    const title = pickTitle(props) || 'Untitled';
    const textFields: string[] = [];
    const images: string[] = [];
    const links: string[] = [];
    const colors: string[] = [];
    const fields: Record<string, { text: string; images: string[]; links: string[]; colors: string[] }> = {};

    Object.entries(props).forEach(([name, prop]: [string, any]) => {
      const text = readPropText(prop);
      const propImages = readPropFiles(prop);
      const propLinks = readPropUrl(prop);
      const propColors = readPropColor(prop);
      if (text && prop.type !== 'title') textFields.push(text);
      images.push(...propImages);
      links.push(...propLinks);
      colors.push(...propColors);
      fields[name] = {
        text,
        images: propImages,
        links: propLinks,
        colors: propColors
      };
    });

    return {
      id: row?.id || `${databaseId}-${Math.random()}`,
      title,
      text: textFields.filter(Boolean).slice(0, 4).join(' | '),
      images: images.slice(0, 6),
      links: links.slice(0, 4),
      colors: colors.slice(0, 8),
      fields
    };
  });

  return {
    title: data?.database?.title || 'Source Database',
    properties,
    items
  };
};
