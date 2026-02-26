# UI Style Refactor Blueprint

## Goal
- Split `gallery-story`, `color-swatch`, `link-cards`, `generic-cards` into a clear, maintainable style system.
- Make style settings easy to locate and easy to tune manually without touching content data.

## Proposed Folder Structure
```txt
src/
  styles/
    tokens/
      color.css
      typography.css
      spacing.css
      radius.css
      shadow.css
      motion.css
      index.css
    cards/
      base.css
      gallery-story.css
      color-swatch.css
      link-cards.css
      generic-cards.css
      index.css
  components/
    cards/
      CardShell.tsx
      CardRenderer.tsx
      variants/
        GalleryStoryCard.tsx
        ColorSwatchCard.tsx
        LinkCardsCard.tsx
        GenericCard.tsx
      index.ts
  config/
    card-style-registry.ts
  content/
    cards/
      home-cards.json
      featured-cards.json
  pages/
    style-playground.tsx
```

## Layering Rules
1. `tokens`: global design language only (no per-variant exceptions).
2. `styles/cards/*.css`: variant-level visual differences only.
3. `components/cards/CardShell`: shared structure (header/body/footer).
4. `content/cards/*.json`: content only, no style logic.
5. `card-style-registry.ts`: single source of truth for mapping and usage.

## `card-style-registry.ts` Example
```ts
// src/config/card-style-registry.ts
export type CardStyleKey =
  | "gallery-story"
  | "color-swatch"
  | "link-cards"
  | "generic-cards";

export const CARD_STYLE_REGISTRY = {
  "gallery-story": {
    className: "card--gallery-story",
    component: "GalleryStoryCard",
    cssFile: "src/styles/cards/gallery-story.css",
    usedIn: ["home", "gallery"],
  },
  "color-swatch": {
    className: "card--color-swatch",
    component: "ColorSwatchCard",
    cssFile: "src/styles/cards/color-swatch.css",
    usedIn: ["home", "design-system"],
  },
  "link-cards": {
    className: "card--link-cards",
    component: "LinkCardsCard",
    cssFile: "src/styles/cards/link-cards.css",
    usedIn: ["resources"],
  },
  "generic-cards": {
    className: "card--generic-cards",
    component: "GenericCard",
    cssFile: "src/styles/cards/generic-cards.css",
    usedIn: ["home", "archive"],
  },
} as const;
```

## CSS Strategy for Manual Tuning
Use per-variant CSS variables on top of shared base styles.

```css
/* base.css */
.card {
  border-radius: var(--card-radius, 12px);
  padding: var(--card-padding, 16px);
  gap: var(--card-gap, 12px);
}

/* gallery-story.css */
.card--gallery-story {
  --card-bg: var(--color-surface-1);
  --card-title-size: var(--font-size-xl);
  --card-gap: 14px;
}
```

## Style Playground Requirements
`/style-playground` should include:
1. Same mock content rendered in all 4 styles at once.
2. Left control panel for `bg`, `title-size`, `gap`, `radius`, `border`, `shadow`.
3. Visible mapping info: style key, CSS file, component name.
4. One-click copy for current variable values.

## Execution Plan
1. Create folders and placeholder files (`tokens`, `cards`, `config`, `components`).
2. Extract shared card structure/style into `base.css`.
3. Move per-style differences into dedicated variant CSS files.
4. Create `card-style-registry.ts` with mapping and usage pages.
5. Build `CardRenderer` to switch by `styleKey`.
6. Build `style-playground` for live variable tuning.
7. Migrate existing pages incrementally (one page at a time).
8. Remove obsolete classes and duplicated legacy styles.

## Acceptance Checklist
- You can find any style setting file in under 5 seconds.
- All 4 styles can be switched by `styleKey`.
- Same content data works across all 4 variants.
- Manual style tuning is done mostly in variant CSS variables.
- Desktop + mobile both pass visual checks (including playground page).

## Naming Conventions
- Style key: `kebab-case` (e.g., `gallery-story`)
- CSS class: `card--{styleKey}`
- Component: `{PascalCase}Card`
- Tokens: `--color-*`, `--space-*`, `--font-*`, `--radius-*`

## MVP Milestones (60-90 min each)
1. **Milestone 1: Scaffolding**
- Create folders/files and wire `styles/cards/index.css`.
- Add empty registry and style key type.

2. **Milestone 2: Base + 1 Variant**
- Extract shared `CardShell` + `base.css`.
- Migrate one style first (`generic-cards`) end-to-end.

3. **Milestone 3: Remaining Variants**
- Migrate `gallery-story`, `color-swatch`, `link-cards`.
- Ensure all are selectable via `CardRenderer`.

4. **Milestone 4: Playground + Cleanup**
- Ship `/style-playground` with live controls.
- Remove duplicate old styles and update docs/comments.
