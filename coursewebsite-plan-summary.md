# CourseWebsite Notion-Driven Generation Plan

## Plan
1. Goal: Use the current CourseWebsite UI template to auto-generate different course showcase websites.
2. Data source: Notion `Courses` + `Projects` + each project's `SourceDatabaseId`.
3. Core strategy: Build a schema-driven UI engine (not fixed-field only).
4. Technical direction: Product code handles data/rendering; skills handle repeatable workflows/checks.

## Agreed Decisions
1. Do not use fixed `project1/project2` columns; use relation (`Courses -> Projects`).
2. Different assignment DB schemas are allowed; system should auto-read schema and normalize.
3. Build a lightweight design system (tokens + core components + mapping layer).
4. Skills are needed, but only for workflow automation; core rendering remains in product code.

## Execution Steps
1. Finalize Notion schema.
- Courses: `CourseName`, `Slug`, `CourseSummary`, `CoverImage`, `Status`, `Projects`, `CourseLink`
- Projects: `ProjectName`, `Course`, `TabName`, `Order`, `SourceDatabaseId`, `Status`, `FieldMapping` (optional), `UiPattern` (optional)

2. Build MVP data flow first (without skills).
- Read published courses
- Fetch related projects and sort by `Order`
- Read each `SourceDatabaseId`
- Generate `/courses/[slug]`

3. Implement schema-driven normalization.
- Scan source DB property name/type
- Auto-classify fields (`title`, `image`, `gallery`, `color`, `text`, `link`, ...)
- Normalize into a unified front-end data model

4. Implement UI pattern auto-selection.
- Select UI patterns by field combination (e.g., color swatch, gallery story, generic cards)
- Fallback to generic cards when uncertain
- Support manual overrides via `FieldMapping` / `UiPattern`

5. Add publishing guardrails and write-back.
- Show only `Status=published`
- Missing fields should create warnings, not crash the whole site
- After successful deploy, write back `CourseLink`

6. Add the first two skills.
- `prepublish-check`: pre-release validation
- `schema-mapping-assistant`: mapping + UI suggestion helper

## One-line Conclusion
Build a working schema-driven product core first, then add skills around high-frequency workflows for maintainability.
