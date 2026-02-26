import React from 'react';
import { CARD_STYLE_REGISTRY, CardStyleKey } from '../../card-style-registry';
import CardShell from './CardShell';
import { CardRenderProps } from './types';
import GalleryStoryCard from './variants/GalleryStoryCard';
import ColorSwatchCard from './variants/ColorSwatchCard';
import LinkCardsCard from './variants/LinkCardsCard';
import GenericCard from './variants/GenericCard';

const componentMap: Record<CardStyleKey, React.FC<{ projectTitle: string; items: CardRenderProps['items'] }>> = {
  'gallery-story': GalleryStoryCard,
  'color-swatch': ColorSwatchCard,
  'link-cards': LinkCardsCard,
  'generic-cards': GenericCard,
};

const densityVars: Record<CardRenderProps['density'], Record<string, string>> = {
  compact: {
    '--card-padding': '1rem',
    '--card-gap': '0.75rem',
  },
  comfortable: {
    '--card-padding': '1.5rem',
    '--card-gap': '1rem',
  },
  immersive: {
    '--card-padding': '2rem',
    '--card-gap': '1.25rem',
  },
};

const mediaVars: Record<CardRenderProps['mediaPriority'], Record<string, string>> = {
  text: {
    '--gallery-columns': '1',
    '--gallery-hero-height': '280px',
    '--link-grid-columns': '2',
  },
  balanced: {
    '--gallery-columns': '2',
    '--gallery-hero-height': '360px',
    '--link-grid-columns': '3',
  },
  image: {
    '--gallery-columns': '2',
    '--gallery-hero-height': '460px',
    '--link-grid-columns': '4',
  },
};

const accentColorForTheme = (accentTheme: CardRenderProps['accentTheme']) => {
  if (accentTheme === 'theme-2') return 'var(--color-accent-theme-2)';
  return 'var(--color-accent-theme-1)';
};

const CardRenderer: React.FC<CardRenderProps> = ({
  styleKey,
  projectTitle,
  items,
  density,
  accentTheme,
  mediaPriority,
  variables,
}) => {
  const VariantComponent = componentMap[styleKey] || GenericCard;
  const registry = CARD_STYLE_REGISTRY[styleKey];

  const style = {
    '--pattern-accent': accentColorForTheme(accentTheme),
    ...densityVars[density],
    ...mediaVars[mediaPriority],
    ...(variables || {}),
  } as React.CSSProperties;

  if (!items.length) {
    return (
      <CardShell className={registry.className} style={style}>
        <p className="card__text">No source content available for this project yet.</p>
      </CardShell>
    );
  }

  return (
    <CardShell className={registry.className} style={style}>
      <VariantComponent projectTitle={projectTitle} items={items} />
    </CardShell>
  );
};

export default CardRenderer;
