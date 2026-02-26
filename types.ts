
export interface Student {
  id: string;
  name: string;
}

export interface DataCardItem {
  label: string;
  value: string;
}

export interface ProjectBase {
  id: string;
  name: string;
  year: string;
  projectIntro: string;
  tags: string[];
  group: string;
  students: Student[];
}

export interface Theme1Project extends ProjectBase {
  mainImage: string;
  dataCards: string[][]; // Each inner array is a split datacard content
  answer: string;
}

export interface Theme2Project extends ProjectBase {
  gallery: string[];
  captions: string[];
  videoUrl?: string;
}

export enum ThemeType {
  SEEING_LIKE_A_THING = "Seeing Like a Thing",
  EVERYDAY_DATA_TRACKING = "Everyday Data Tracking"
}

export interface Filters {
  year: string;
  tag: string;
}

export interface Course {
  id: string;
  slug: string;
  courseName: string;
  courseSummary: string;
  coverImage: string;
  courseLink: string;
  status: string;
  density?: 'compact' | 'comfortable' | 'immersive';
  accentTheme?: 'theme-1' | 'theme-2' | 'auto';
  mediaPriority?: 'image' | 'text' | 'balanced';
  projectIds: string[];
}

export interface Project {
  id: string;
  projectName: string;
  tabName: string;
  order: number;
  sourceDatabaseId: string;
  status: string;
  uiPattern: string;
  fieldMapping: string;
  density?: 'compact' | 'comfortable' | 'immersive';
  accentTheme?: 'theme-1' | 'theme-2' | 'auto';
  mediaPriority?: 'image' | 'text' | 'balanced';
  courseIds: string[];
}

export interface NotionDatabaseProperty {
  id: string;
  name: string;
  type: string;
}

export interface NormalizedSourceItem {
  id: string;
  title: string;
  text: string;
  images: string[];
  links: string[];
  colors: string[];
  fields: Record<string, { text: string; images: string[]; links: string[]; colors: string[] }>;
}
