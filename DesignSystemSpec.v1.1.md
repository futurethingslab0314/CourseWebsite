# Course Website Design System Spec v1.1

## 1. Overview

This document defines a generation-ready design system for course websites.

Objectives:
- Keep one consistent brand/style language across all course pages
- Allow assignment-level visual variation through controlled UI patterns
- Support data-driven rendering with explicit field mapping
- Maintain accessibility and responsive behavior by default

Scope:
- Pure specification (no code changes)
- Intended for AI-assisted generation and future implementation alignment

---

## 2. Two-Layer System Model

### 2.1 Core System (Fixed)

Core System is always stable across pages:
- typography hierarchy
- spacing rhythm
- layout width and breakpoints
- border radius and elevation system
- base color roles (canvas/surface/text/border)
- interaction tone (motion timing, focus treatment)

### 2.2 Pattern System (Flexible)

Pattern System is assignment-specific:
- layout structure
- media emphasis
- information density
- accent usage
- interaction module composition

Constraint:
- Pattern-level overrides must not break Core readability, spacing scale, or semantic heading order.

---

## 3. Core Tokens (Fixed Contract)

Use role-based tokens. Avoid hardcoded one-off styles in generated output.

### 3.1 Color Roles

- `color-bg-canvas`
- `color-bg-surface`
- `color-text-primary`
- `color-text-secondary`
- `color-border-subtle`
- `color-accent-theme-1`
- `color-accent-theme-2`
- `color-status-info`
- `color-status-success`
- `color-status-warning`

### 3.2 Typography Roles

- `font-display`
- `font-body`
- `font-mono` (optional for data blocks)
- `type-display`
- `type-h1`
- `type-h2`
- `type-h3`
- `type-body`
- `type-caption`
- `type-micro`
- `tracking-tight`
- `tracking-normal`
- `tracking-wide`

### 3.3 Spacing, Radius, Elevation

- `space-1` to `space-12` (single scale)
- `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`, `radius-2xl`
- `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`
- `border-thin`, `border-normal`

### 3.4 Layout Tokens

- `container-max`
- `section-padding-y`
- `grid-gap-sm`
- `grid-gap-md`
- `grid-gap-lg`
- `grid-gap-xl`
- `breakpoint-sm`
- `breakpoint-md`
- `breakpoint-lg`
- `breakpoint-xl`

---

## 4. Data Contract for Generation

Each project item should provide:
- `uiPattern` (required): one of pattern keys
- `fieldMapping` (required): source field mapping object
- `sourceDatabaseId` (required): source reference
- `density` (optional): `compact | comfortable | immersive`
- `accentTheme` (optional): `theme-1 | theme-2 | auto`
- `mediaPriority` (optional): `image | text | balanced`

Rendering sequence:
1. Resolve Core tokens
2. Resolve target pattern
3. Apply field mapping from source data
4. Apply allowed pattern overrides
5. Execute fallback rules for missing data

Fallback:
- missing media -> text-first layout
- missing links -> hide link module
- missing colors -> hide swatch module
- missing pattern -> `generic-cards`

---

## 5. Pattern Catalog

Pattern keys:
- `gallery-story`
- `color-swatch`
- `link-cards`
- `generic-cards`

For each pattern, generator must follow:
- intent
- required fields
- optional fields
- layout recipe
- interaction recipe
- allowed overrides

---

## 6. Pattern Specs + JSON Examples + Text Layout Diagrams

## 6.1 Pattern: `gallery-story`

Intent:
- Visual narrative for process-oriented assignments

Required fields:
- title
- text
- images (at least 1)

Optional fields:
- captions
- videoUrl
- links
- tags
- contributors

Allowed overrides:
- `density`
- `accentTheme`
- image aspect preference

### JSON Example

```json
{
  "uiPattern": "gallery-story",
  "sourceDatabaseId": "db_project_process_2026",
  "density": "immersive",
  "accentTheme": "theme-2",
  "mediaPriority": "image",
  "fieldMapping": {
    "title": "Project Name",
    "text": "Project Intro",
    "gallery": "Process Images",
    "link": "Reference Links"
  },
  "item": {
    "title": "Urban Sound Diary",
    "text": "A process-driven exploration of daily acoustic traces.",
    "images": [
      "https://example.com/process-1.jpg",
      "https://example.com/process-2.jpg",
      "https://example.com/process-3.jpg"
    ],
    "captions": [
      "Week 1 field recording.",
      "Pattern clustering.",
      "Final interaction prototype."
    ],
    "videoUrl": "https://www.youtube.com/watch?v=abc123xyz",
    "links": [
      "https://example.com/slides",
      "https://example.com/github"
    ],
    "tags": ["field research", "data viz"],
    "contributors": [
      { "name": "Student A", "id": "B12345678" },
      { "name": "Student B", "id": "B12345679" }
    ]
  }
}
```

### Layout Diagram (Desktop)

```text
+--------------------------------------------------------------+
| Project Header (title, theme badge, meta)                   |
+-------------------------------+------------------------------+
| Sticky Insight Column         | Gallery Stream               |
| - intro text                  | - image card 1 + caption     |
| - contributors                | - image card 2 + caption     |
| - tags                        | - image card N + caption     |
|                               | - optional video block       |
+-------------------------------+------------------------------+
| Optional Links Row                                           |
+--------------------------------------------------------------+
```

### Layout Diagram (Mobile)

```text
+----------------------------------+
| Header                           |
+----------------------------------+
| Intro / Meta                     |
+----------------------------------+
| Video (optional)                 |
+----------------------------------+
| Gallery card 1                   |
| Gallery card 2                   |
| Gallery card N                   |
+----------------------------------+
| Links (optional)                 |
+----------------------------------+
```

---

## 6.2 Pattern: `color-swatch`

Intent:
- Color logic, palette systems, and material studies

Required fields:
- title
- text
- colors (at least 1)

Optional fields:
- images
- links
- tags

Allowed overrides:
- swatch density
- swatch size tier
- accentTheme

### JSON Example

```json
{
  "uiPattern": "color-swatch",
  "sourceDatabaseId": "db_color_studies_2026",
  "density": "comfortable",
  "accentTheme": "theme-1",
  "mediaPriority": "balanced",
  "fieldMapping": {
    "title": "Study Name",
    "text": "Color Narrative",
    "color": "Palette Hex",
    "image": "Moodboard"
  },
  "item": {
    "title": "Transit Memory Palette",
    "text": "Color system derived from metro movement logs and memory mapping.",
    "colors": ["#1B3A57", "#4A90A4", "#E4C16F", "#F5EFE6"],
    "images": ["https://example.com/moodboard-1.jpg"],
    "links": ["https://example.com/spec-sheet"],
    "tags": ["palette", "material"]
  }
}
```

### Layout Diagram (Desktop)

```text
+--------------------------------------------------------------+
| Header (title + short narrative)                             |
+-------------------------------+------------------------------+
| Swatch Grid                   | Explanation Panel            |
| [#1] [#2] [#3] [#4]           | - concept text               |
| [#5] [#6] ...                 | - optional mood image        |
|                               | - optional links             |
+-------------------------------+------------------------------+
```

### Layout Diagram (Mobile)

```text
+----------------------------------+
| Header                           |
+----------------------------------+
| Swatch Grid                      |
+----------------------------------+
| Text Narrative                   |
+----------------------------------+
| Mood image / links (optional)    |
+----------------------------------+
```

---

## 6.3 Pattern: `link-cards`

Intent:
- Reference-heavy assignments, resources, toolkits, publication lists

Required fields:
- title
- text
- links (at least 1)

Optional fields:
- images
- tags
- contributors

Allowed overrides:
- card density
- card emphasis level
- accentTheme

### JSON Example

```json
{
  "uiPattern": "link-cards",
  "sourceDatabaseId": "db_reading_toolkit_2026",
  "density": "compact",
  "accentTheme": "auto",
  "mediaPriority": "text",
  "fieldMapping": {
    "title": "Resource Title",
    "text": "Summary",
    "link": "URL List",
    "image": "Preview Image"
  },
  "item": {
    "title": "Situated Data Reading Pack",
    "text": "Curated links for theory, methods, and implementation references.",
    "links": [
      "https://example.com/paper-1",
      "https://example.com/paper-2",
      "https://example.com/toolkit"
    ],
    "images": ["https://example.com/preview.jpg"],
    "tags": ["reading", "methods"],
    "contributors": [{ "name": "TA Team", "id": "TA-01" }]
  }
}
```

### Layout Diagram (Desktop)

```text
+--------------------------------------------------------------+
| Header (title, scope, filters optional)                      |
+--------------------------------------------------------------+
| Link Card Grid (2-3 columns)                                 |
| +-----------------+ +-----------------+ +-----------------+  |
| | title           | | title           | | title           |  |
| | summary         | | summary         | | summary         |  |
| | CTA             | | CTA             | | CTA             |  |
| +-----------------+ +-----------------+ +-----------------+  |
+--------------------------------------------------------------+
```

### Layout Diagram (Mobile)

```text
+----------------------------------+
| Header                           |
+----------------------------------+
| Link Card 1                      |
| Link Card 2                      |
| Link Card N                      |
+----------------------------------+
```

---

## 6.4 Pattern: `generic-cards`

Intent:
- Safe fallback for mixed or incomplete datasets

Required fields:
- title
- text

Optional fields:
- images
- links
- colors
- tags

Allowed overrides:
- density
- accentTheme

### JSON Example

```json
{
  "uiPattern": "generic-cards",
  "sourceDatabaseId": "db_misc_projects_2026",
  "density": "comfortable",
  "accentTheme": "auto",
  "mediaPriority": "balanced",
  "fieldMapping": {
    "title": "Name",
    "text": "Description",
    "image": "Main Visual",
    "link": "References"
  },
  "item": {
    "title": "Daily Tracking Probe",
    "text": "A mixed-format assignment with text, visuals, and references.",
    "images": ["https://example.com/main.jpg"],
    "links": ["https://example.com/report"],
    "colors": ["#2A2A2A", "#EAEAEA"],
    "tags": ["mixed format"]
  }
}
```

### Layout Diagram (Desktop)

```text
+--------------------------------------------------------------+
| Header                                                       |
+--------------------------------------------------------------+
| Card List                                                    |
| +----------------------------------------------------------+ |
| | Title + meta                                             | |
| | Text preview                                              | |
| | Optional media / links / tags modules                    | |
| +----------------------------------------------------------+ |
+--------------------------------------------------------------+
```

### Layout Diagram (Mobile)

```text
+----------------------------------+
| Header                           |
+----------------------------------+
| Generic Card 1                   |
| Generic Card 2                   |
| Generic Card N                   |
+----------------------------------+
```

---

## 7. Generator Rules (Must Follow)

- Always prioritize Core token usage over one-off styling
- Resolve `uiPattern` first, then map content fields
- Never render empty visual modules (no blank gallery/links blocks)
- Preserve semantic heading order (`h1 > h2 > h3`)
- Keep CTA style consistent within one page
- Respect mobile-first collapse behavior for dense sections

---

## 8. Accessibility and Responsive Baseline

- Color contrast must satisfy WCAG AA
- Focus states are required for all interactive elements
- Modal must include close button, backdrop close, and keyboard escape path
- Image elements need meaningful `alt`
- Small screens must keep full content access without hover dependency

---

## 9. QA Checklist (Generation Gate)

- Pattern key resolved correctly
- Field mapping applied without missing critical content
- Core token usage complete (color/space/type/radius/elevation/layout)
- No hardcoded style drift outside token roles
- Desktop and mobile layouts both valid
- Fallback behavior works for missing data
- Accessibility baseline checks pass

---

## 10. Versioning

- `v1.1` adds generation-ready JSON examples and text layout diagrams
- Next minor version should add:
  - pattern selection matrix (when to choose each pattern)
  - strict optional/required schema definitions
  - sample multi-project page payload

