export type CardStyleKey =
  | 'gallery-story'
  | 'color-swatch'
  | 'link-cards'
  | 'generic-cards';

export const CARD_STYLE_REGISTRY = {
  'gallery-story': {
    className: 'card--gallery-story',
    component: 'GalleryStoryCard',
    cssFile: 'styles/cards/gallery-story.css',
    usedIn: ['course-project'],
  },
  'color-swatch': {
    className: 'card--color-swatch',
    component: 'ColorSwatchCard',
    cssFile: 'styles/cards/color-swatch.css',
    usedIn: ['course-project'],
  },
  'link-cards': {
    className: 'card--link-cards',
    component: 'LinkCardsCard',
    cssFile: 'styles/cards/link-cards.css',
    usedIn: ['course-project'],
  },
  'generic-cards': {
    className: 'card--generic-cards',
    component: 'GenericCard',
    cssFile: 'styles/cards/generic-cards.css',
    usedIn: ['course-project'],
  },
} as const;
