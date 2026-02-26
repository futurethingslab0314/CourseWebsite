import React, { useEffect, useMemo, useState } from 'react';
import { Course, Project } from './types';
import { fetchCourses, fetchProjects, fetchSourceDatabase } from './services/courseService';

type SourceSnapshot = {
  dbTitle: string;
  fields: { name: string; type: string }[];
  items: {
    id: string;
    title: string;
    text: string;
    images: string[];
    links: string[];
    colors: string[];
    fields: Record<string, { text: string; images: string[]; links: string[]; colors: string[] }>;
  }[];
  error?: string;
};

type Mapping = Partial<Record<'title' | 'text' | 'image' | 'gallery' | 'link' | 'color', string>>;
type Pattern = 'gallery-story' | 'color-swatch' | 'link-cards' | 'generic-cards';

const parseCourseSlug = () => {
  const match = window.location.pathname.match(/^\/courses\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const normalizeId = (value: string) => (value || '').replace(/-/g, '').toLowerCase();
const isCourseMatch = (course: Course, slug: string) => course.slug.toLowerCase() === slug.toLowerCase();

const parseFieldMapping = (raw: string): Mapping => {
  const value = (raw || '').trim();
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') return parsed as Mapping;
  } catch {
    const mapping: Mapping = {};
    value
      .split(/[,\n;]/)
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => {
        const [k, v] = token.split(':').map((x) => x.trim());
        if (k && v) (mapping as Record<string, string>)[k] = v;
      });
    return mapping;
  }
  return {};
};

const resolvePattern = (uiPatternRaw: string, source: SourceSnapshot | undefined): Pattern => {
  const manual = (uiPatternRaw || '').trim().toLowerCase();
  if (manual === 'gallery-story' || manual === 'gallery') return 'gallery-story';
  if (manual === 'color-swatch' || manual === 'swatch') return 'color-swatch';
  if (manual === 'link-cards' || manual === 'links') return 'link-cards';
  if (manual === 'generic-cards' || manual === 'generic') return 'generic-cards';
  if (!source) return 'generic-cards';

  const hasGallery = source.items.some((item) => item.images.length > 1);
  const hasColor = source.items.some((item) => item.colors.length > 0);
  const hasLink = source.items.some((item) => item.links.length > 0);
  if (hasGallery) return 'gallery-story';
  if (hasColor) return 'color-swatch';
  if (hasLink) return 'link-cards';
  return 'generic-cards';
};

const resolveMappedItem = (item: SourceSnapshot['items'][number], mapping: Mapping) => {
  const titleField = mapping.title ? item.fields[mapping.title] : undefined;
  const textField = mapping.text ? item.fields[mapping.text] : undefined;
  const imageField = mapping.image ? item.fields[mapping.image] : undefined;
  const galleryField = mapping.gallery ? item.fields[mapping.gallery] : undefined;
  const linkField = mapping.link ? item.fields[mapping.link] : undefined;
  const colorField = mapping.color ? item.fields[mapping.color] : undefined;

  return {
    title: titleField?.text || item.title,
    text: textField?.text || item.text,
    images: [...(galleryField?.images || []), ...(imageField?.images || []), ...item.images].slice(0, 10),
    links: [...(linkField?.links || []), ...item.links].slice(0, 8),
    colors: [...(colorField?.colors || []), ...item.colors].slice(0, 10)
  };
};

const SectionContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-[var(--container-max)] px-5 sm:px-8 lg:px-12">{children}</div>
);

const PatternGallery: React.FC<{ items: ReturnType<typeof resolveMappedItem>[] }> = ({ items }) => (
  <div className="space-y-[var(--grid-gap-sm)]">
      {items.map((item) => (
        <article key={`${item.title}-${item.text}`} className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-sm)]">
          {item.images[0] ? <img src={item.images[0]} alt={item.title} className="h-56 w-full object-cover sm:h-72" /> : null}
          <div className="p-4 sm:p-5">
            <h3 className="font-['Space_Grotesk'] text-[var(--type-h3)] font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
            {item.text ? <p className="mt-2 text-[var(--type-body)] text-[var(--color-text-secondary)]">{item.text}</p> : null}
            {item.links.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.links.slice(0, 3).map((link) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer" className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-1.5 text-[var(--type-caption)] text-[var(--color-accent-theme-2)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-status-info)]">
                    Open link
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      ))}
  </div>
);

const PatternSwatch: React.FC<{ items: ReturnType<typeof resolveMappedItem>[] }> = ({ items }) => (
  <div className="grid gap-[var(--grid-gap-md)] lg:grid-cols-2">
    {items.map((item) => (
      <article key={`${item.title}-${item.text}`} className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 shadow-[var(--shadow-sm)]">
        <h3 className="font-['Space_Grotesk'] text-[var(--type-h3)] font-semibold">{item.title}</h3>
        {item.text ? <p className="mt-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">{item.text}</p> : null}
        {item.colors.length ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {item.colors.map((color) => (
              <div key={`${item.title}-${color}`} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] p-2">
                <div className="h-8 rounded-[var(--radius-sm)] border border-black/10" style={{ backgroundColor: color }} />
                <p className="mt-1 truncate font-mono text-[var(--type-micro)] text-[var(--color-text-secondary)]">{color}</p>
              </div>
            ))}
          </div>
        ) : null}
      </article>
    ))}
  </div>
);

const PatternLinks: React.FC<{ items: ReturnType<typeof resolveMappedItem>[] }> = ({ items }) => (
  <div className="grid gap-[var(--grid-gap-sm)] sm:grid-cols-2 lg:grid-cols-3">
    {items.map((item) => (
      <article key={`${item.title}-${item.text}`} className="flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 shadow-[var(--shadow-sm)]">
        <h3 className="font-['Space_Grotesk'] text-[var(--type-h3)] font-semibold">{item.title}</h3>
        {item.text ? <p className="mt-2 flex-grow text-[var(--type-caption)] text-[var(--color-text-secondary)]">{item.text}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {item.links.slice(0, 3).map((link) => (
            <a key={link} href={link} target="_blank" rel="noreferrer" className="rounded-[var(--radius-md)] bg-[var(--color-accent-theme-1)] px-3 py-1.5 text-[var(--type-caption)] font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-status-info)]">
              Visit
            </a>
          ))}
        </div>
      </article>
    ))}
  </div>
);

const PatternGeneric: React.FC<{ items: ReturnType<typeof resolveMappedItem>[] }> = ({ items }) => (
  <div className="space-y-[var(--grid-gap-sm)]">
    {items.map((item) => (
      <article key={`${item.title}-${item.text}`} className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 shadow-[var(--shadow-sm)]">
        <h3 className="font-['Space_Grotesk'] text-[var(--type-h3)] font-semibold">{item.title}</h3>
        {item.text ? <p className="mt-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">{item.text}</p> : null}
        {item.images.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.images.slice(0, 4).map((img) => (
              <img key={img} src={img} alt={item.title} className="h-16 w-16 rounded-[var(--radius-md)] object-cover" />
            ))}
          </div>
        ) : null}
      </article>
    ))}
  </div>
);

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sourceMap, setSourceMap] = useState<Record<string, SourceSnapshot>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSlug, setActiveSlug] = useState<string | null>(parseCourseSlug());

  useEffect(() => {
    const onPopState = () => setActiveSlug(parseCourseSlug());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [courseList, projectList] = await Promise.all([fetchCourses(), fetchProjects()]);
        setCourses(courseList);
        setProjects(projectList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Load failed');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentCourse = useMemo(() => {
    if (!activeSlug) return null;
    return courses.find((course) => isCourseMatch(course, activeSlug)) || null;
  }, [courses, activeSlug]);

  const courseProjects = useMemo(() => {
    if (!currentCourse) return [];
    const explicitIds = new Set((currentCourse.projectIds || []).map(normalizeId));
    const courseId = normalizeId(currentCourse.id);
    return projects
      .filter((project) => {
        const projectId = normalizeId(project.id);
        const linkedCourseIds = (project.courseIds || []).map(normalizeId);
        return explicitIds.has(projectId) || linkedCourseIds.includes(courseId);
      })
      .sort((a, b) => a.order - b.order);
  }, [currentCourse, projects]);

  useEffect(() => {
    if (!currentCourse) return;
    const uncachedDbIds = courseProjects.map((project) => project.sourceDatabaseId).filter((dbId) => dbId && !sourceMap[dbId]);
    if (!uncachedDbIds.length) return;

    const loadSources = async () => {
      const entries = await Promise.all(
        uncachedDbIds.map(async (dbId) => {
          try {
            const snapshot = await fetchSourceDatabase(dbId);
            return [dbId, { dbTitle: snapshot.title, fields: snapshot.properties.map((p) => ({ name: p.name, type: p.type })), items: snapshot.items }] as const;
          } catch (err) {
            return [dbId, { dbTitle: dbId, fields: [], items: [], error: err instanceof Error ? err.message : 'Failed to load source database' }] as const;
          }
        })
      );
      setSourceMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    };

    loadSources();
  }, [courseProjects, currentCourse, sourceMap]);

  const goToCourse = (slug: string) => {
    window.history.pushState({}, '', `/courses/${encodeURIComponent(slug)}`);
    setActiveSlug(slug);
  };
  const goHome = () => {
    window.history.pushState({}, '', '/');
    setActiveSlug(null);
  };

  if (loading) return <div className="min-h-screen bg-[var(--color-bg-canvas)] p-10 text-center text-[var(--type-body)] text-[var(--color-text-secondary)]">Loading course data...</div>;
  if (error) return <div className="min-h-screen bg-[var(--color-bg-canvas)] p-10 text-center text-[var(--type-body)] text-red-700">Error: {error}</div>;

  if (!activeSlug) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-canvas)] py-[var(--section-padding-y)]">
        <SectionContainer>
          <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6 shadow-[var(--shadow-md)] sm:p-10">
            <p className="text-[var(--type-micro)] tracking-[var(--tracking-wide)] text-[var(--color-accent-theme-2)]">COURSE WEBSITE</p>
            <h1 className="mt-2 font-['Space_Grotesk'] text-[var(--type-display)] font-bold leading-[1.05] text-[var(--color-text-primary)]">Notion-Driven Course Showcase</h1>
            <p className="mt-4 max-w-3xl text-[var(--type-body)] text-[var(--color-text-secondary)]">
              Core tokens are fixed. Assignment pages vary only by `UiPattern` and `FieldMapping`, with data sourced from each project `SourceDatabaseId`.
            </p>
          </section>

          <section className="mt-[var(--space-10)] grid gap-[var(--grid-gap-md)] md:grid-cols-2">
            {courses.map((course) => (
              <article key={course.id} className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-sm)]">
                {course.coverImage ? <img src={course.coverImage} alt={course.courseName} className="h-56 w-full object-cover" /> : null}
                <div className="p-5 sm:p-6">
                  <p className="text-[var(--type-micro)] tracking-[var(--tracking-wide)] text-[var(--color-accent-theme-1)]">/{course.slug}</p>
                  <h2 className="mt-1 font-['Space_Grotesk'] text-[var(--type-h2)] font-semibold text-[var(--color-text-primary)]">{course.courseName}</h2>
                  <p className="mt-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">{course.courseSummary || 'No summary provided.'}</p>
                  <button onClick={() => goToCourse(course.slug)} className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-accent-theme-1)] px-4 py-2 text-[var(--type-caption)] font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-status-info)]">
                    Open course
                  </button>
                </div>
              </article>
            ))}
          </section>
        </SectionContainer>
      </main>
    );
  }

  if (!currentCourse) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-canvas)] py-[var(--section-padding-y)]">
        <SectionContainer>
          <p className="text-[var(--type-body)] text-[var(--color-text-secondary)]">Course not found: /courses/{activeSlug}</p>
          <button onClick={goHome} className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-4 py-2 text-[var(--type-caption)]">Back home</button>
        </SectionContainer>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-canvas)] py-[var(--section-padding-y)]">
      <SectionContainer>
        <button onClick={goHome} className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2 text-[var(--type-caption)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-status-info)]">
          Back to all courses
        </button>
        <section className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-md)]">
          {currentCourse.coverImage ? <img src={currentCourse.coverImage} alt={currentCourse.courseName} className="h-60 w-full object-cover md:h-80" /> : null}
          <div className="p-6 sm:p-8">
            <h1 className="font-['Space_Grotesk'] text-[var(--type-h1)] font-bold leading-tight text-[var(--color-text-primary)]">{currentCourse.courseName}</h1>
            <p className="mt-3 max-w-4xl text-[var(--type-body)] text-[var(--color-text-secondary)]">{currentCourse.courseSummary || 'No summary provided.'}</p>
          </div>
        </section>

        <section className="mt-[var(--space-10)] space-y-[var(--grid-gap-md)]">
          {courseProjects.map((project) => {
            const source = sourceMap[project.sourceDatabaseId];
            const mapping = parseFieldMapping(project.fieldMapping);
            const pattern = resolvePattern(project.uiPattern, source);
            const mappedItems = (source?.items || []).map((item) => resolveMappedItem(item, mapping)).slice(0, 8);

            return (
              <article key={project.id} className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                <div>
                  <h2 className="font-['Space_Grotesk'] text-[var(--type-h2)] font-semibold text-[var(--color-text-primary)]">{project.tabName || project.projectName}</h2>
                  <p className="mt-1 text-[var(--type-caption)] text-[var(--color-text-secondary)]">{project.projectName}</p>
                </div>

                <div className="mt-4">
                  {pattern === 'gallery-story' ? <PatternGallery items={mappedItems} /> : null}
                  {pattern === 'color-swatch' ? <PatternSwatch items={mappedItems} /> : null}
                  {pattern === 'link-cards' ? <PatternLinks items={mappedItems} /> : null}
                  {pattern === 'generic-cards' ? <PatternGeneric items={mappedItems} /> : null}

                  {source && source.items.length === 0 ? <p className="mt-3 text-[var(--type-caption)] text-[var(--color-text-secondary)]">No work items available.</p> : null}
                </div>
              </article>
            );
          })}

          {courseProjects.length === 0 ? (
            <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-8 text-center text-[var(--type-body)] text-[var(--color-text-secondary)]">
              No published projects linked to this course.
            </section>
          ) : null}
        </section>
      </SectionContainer>
    </main>
  );
};

export default App;
