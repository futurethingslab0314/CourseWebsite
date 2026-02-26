import { CardStyleKey } from '../../card-style-registry';

export type Density = 'compact' | 'comfortable' | 'immersive';
export type AccentTheme = 'theme-1' | 'theme-2' | 'auto';
export type MediaPriority = 'image' | 'text' | 'balanced';

export type MappedItem = {
  title: string;
  text: string;
  images: string[];
  links: string[];
  colors: string[];
};

export type CardRenderProps = {
  styleKey: CardStyleKey;
  projectTitle: string;
  items: MappedItem[];
  density: Density;
  accentTheme: AccentTheme;
  mediaPriority: MediaPriority;
  variables?: Record<string, string>;
};
