import React, { useMemo, useState } from 'react';
import { CARD_STYLE_REGISTRY, CardStyleKey } from '../card-style-registry';
import { CardRenderer, MappedItem } from '../components/cards';

type PlaygroundVars = {
  bg: string;
  titleSize: string;
  gap: string;
  radius: string;
  border: string;
  shadow: string;
};

const MOCK_ITEMS: MappedItem[] = [
  {
    title: 'Urban Sound Diary',
    text: 'A process-driven exploration of daily acoustic traces.',
    images: ['https://picsum.photos/seed/playground-1/900/600', 'https://picsum.photos/seed/playground-2/900/600'],
    links: ['https://example.com/slides', 'https://example.com/github'],
    colors: ['#1B3A57', '#4A90A4', '#E4C16F', '#F5EFE6'],
  },
  {
    title: 'Transit Memory Palette',
    text: 'Color system derived from metro movement logs and memory mapping.',
    images: ['https://picsum.photos/seed/playground-3/900/600'],
    links: ['https://example.com/spec-sheet'],
    colors: ['#21334F', '#A4BBD1', '#E9D7A5'],
  },
];

const StylePlaygroundPage: React.FC = () => {
  const [vars, setVars] = useState<PlaygroundVars>({
    bg: '#ffffff',
    titleSize: '1.05rem',
    gap: '1rem',
    radius: '1rem',
    border: '#dde3ea',
    shadow: '0 6px 18px rgba(18, 24, 38, 0.06)',
  });

  const styleVars = useMemo(
    () => ({
      '--card-bg': vars.bg,
      '--card-title-size': vars.titleSize,
      '--card-gap': vars.gap,
      '--card-radius': vars.radius,
      '--card-border': vars.border,
      '--card-shadow': vars.shadow,
    }),
    [vars]
  );

  const copyVars = async () => {
    const text = Object.entries(styleVars)
      .map(([k, v]) => `${k}: ${v};`)
      .join('\n');

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  const styleKeys = Object.keys(CARD_STYLE_REGISTRY) as CardStyleKey[];

  return (
    <main className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
      <div className="mx-auto grid w-full max-w-[1320px] gap-6 px-4 py-6 lg:grid-cols-[320px,1fr] lg:px-8">
        <aside className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 shadow-[var(--shadow-sm)] lg:sticky lg:top-6 lg:h-fit">
          <h1 className="font-['Space_Grotesk'] text-[var(--type-h2)] font-semibold">Style Playground</h1>
          <p className="mt-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">Tune shared CSS variables and compare all 4 style variants side by side.</p>

          <div className="mt-4 grid gap-3">
            <label className="text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">
              bg
              <input className="mt-1 w-full rounded border border-[var(--color-border-subtle)] px-2 py-1" value={vars.bg} onChange={(e) => setVars((s) => ({ ...s, bg: e.target.value }))} />
            </label>
            <label className="text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">
              title-size
              <input className="mt-1 w-full rounded border border-[var(--color-border-subtle)] px-2 py-1" value={vars.titleSize} onChange={(e) => setVars((s) => ({ ...s, titleSize: e.target.value }))} />
            </label>
            <label className="text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">
              gap
              <input className="mt-1 w-full rounded border border-[var(--color-border-subtle)] px-2 py-1" value={vars.gap} onChange={(e) => setVars((s) => ({ ...s, gap: e.target.value }))} />
            </label>
            <label className="text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">
              radius
              <input className="mt-1 w-full rounded border border-[var(--color-border-subtle)] px-2 py-1" value={vars.radius} onChange={(e) => setVars((s) => ({ ...s, radius: e.target.value }))} />
            </label>
            <label className="text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">
              border
              <input className="mt-1 w-full rounded border border-[var(--color-border-subtle)] px-2 py-1" value={vars.border} onChange={(e) => setVars((s) => ({ ...s, border: e.target.value }))} />
            </label>
            <label className="text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">
              shadow
              <input className="mt-1 w-full rounded border border-[var(--color-border-subtle)] px-2 py-1" value={vars.shadow} onChange={(e) => setVars((s) => ({ ...s, shadow: e.target.value }))} />
            </label>
          </div>

          <button onClick={copyVars} className="mt-4 w-full rounded-[var(--radius-sm)] bg-[var(--color-text-primary)] px-3 py-2 text-[var(--type-caption)] text-white">
            Copy current variables
          </button>
        </aside>

        <section className="grid gap-4">
          {styleKeys.map((styleKey) => {
            const metadata = CARD_STYLE_REGISTRY[styleKey];
            return (
              <article key={styleKey} className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 shadow-[var(--shadow-sm)]">
                <div className="mb-3 grid gap-1 text-[var(--type-micro)] text-[var(--color-text-secondary)] sm:grid-cols-3">
                  <p><strong>style key:</strong> {styleKey}</p>
                  <p><strong>css file:</strong> {metadata.cssFile}</p>
                  <p><strong>component:</strong> {metadata.component}</p>
                </div>
                <CardRenderer
                  styleKey={styleKey}
                  projectTitle="Playground Mock"
                  items={MOCK_ITEMS}
                  density="comfortable"
                  accentTheme="theme-1"
                  mediaPriority="balanced"
                  variables={styleVars}
                />
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
};

export default StylePlaygroundPage;
