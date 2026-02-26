
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
