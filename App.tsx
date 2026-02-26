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

type MappedItem = {
  title: string;
  text: string;
  images: string[];
  links: string[];
  colors: string[];
};

const PATTERN_LABEL: Record<Pattern, string> = {
  'gallery-story': 'Gallery Story',
  'color-swatch': 'Color Swatch',
  'link-cards': 'Link Cards',
  'generic-cards': 'Generic Cards'
};

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
  if (source.items.some((item) => item.images.length > 1)) return 'gallery-story';
  if (source.items.some((item) => item.colors.length > 0)) return 'color-swatch';
  if (source.items.some((item) => item.links.length > 0)) return 'link-cards';
  return 'generic-cards';
};

const resolveMappedItem = (item: SourceSnapshot['items'][number], mapping: Mapping): MappedItem => {
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

const AppFrame: React.FC<{ children: React.ReactNode; onHome: () => void; homeEnabled: boolean }> = ({ children, onHome, homeEnabled }) => (
  <main className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
    <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <button
          onClick={onHome}
          disabled={!homeEnabled}
          className="text-left font-['Space_Grotesk'] text-[var(--type-h3)] font-semibold tracking-[var(--tracking-tight)] disabled:cursor-default disabled:opacity-100"
        >
          Data-Enabled Creative Design
        </button>
        <p className="text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">
          TemplateA / Course Showcase
        </p>
      </div>
    </header>

    {children}

    <footer className="mt-14 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-2 px-5 py-6 text-[var(--type-micro)] text-[var(--color-text-secondary)] sm:px-8 lg:px-12">
        <p>National Taiwan University of Science and Technology · Future Things Lab</p>
        <p>Core style fixed by TemplateA. Assignment modules vary only by pattern.</p>
      </div>
    </footer>
  </main>
);

const PatternSection: React.FC<{ pattern: Pattern; projectTitle: string; items: MappedItem[] }> = ({ pattern, projectTitle, items }) => {
  if (!items.length) {
    return (
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-8 text-[var(--type-body)] text-[var(--color-text-secondary)]">
        No source content available for this project yet.
      </section>
    );
  }

  if (pattern === 'gallery-story') {
    const cover = items[0].images[0] || 'https://picsum.photos/1200/760';
    return (
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
          <img src={cover} alt={projectTitle} className="h-[34vh] w-full object-cover sm:h-[44vh]" />
        </div>
        <div className="mt-6 grid gap-[var(--grid-gap-md)] lg:grid-cols-[minmax(0,260px),1fr]">
          <aside className="space-y-3 rounded-[var(--radius-md)] bg-[var(--color-bg-canvas)] p-4">
            <p className="text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">Insight</p>
            <p className="text-[var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">{items[0].text || 'No summary available.'}</p>
          </aside>
          <div className="grid gap-[var(--grid-gap-md)] md:grid-cols-2">
            {items.map((item) => (
              <article key={`${projectTitle}-${item.title}-${item.text}`} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3">
                <div className="overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-bg-canvas)]">
                  <img src={item.images[0] || cover} alt={item.title} className="aspect-[4/3] w-full object-cover" />
                </div>
                <h3 className="mt-3 text-[var(--type-h3)] font-medium">{item.title}</h3>
                {item.text ? <p className="mt-1 text-[var(--type-caption)] text-[var(--color-text-secondary)]">{item.text}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (pattern === 'color-swatch') {
    return (
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="grid gap-[var(--grid-gap-md)] lg:grid-cols-[1.1fr,0.9fr]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.flatMap((item) => item.colors).slice(0, 12).map((color) => (
              <div key={`${projectTitle}-${color}`} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white p-3">
                <div className="h-16 rounded-[var(--radius-sm)] border border-black/5" style={{ backgroundColor: color }} />
                <p className="mt-2 font-mono text-[var(--type-micro)] text-[var(--color-text-secondary)]">{color}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-[var(--radius-md)] bg-[var(--color-bg-canvas)] p-5">
            {items.slice(0, 4).map((item) => (
              <article key={`${projectTitle}-${item.title}`}>
                <h3 className="text-[var(--type-h3)] font-medium">{item.title}</h3>
                {item.text ? <p className="mt-1 text-[var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">{item.text}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (pattern === 'link-cards') {
    return (
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="grid gap-[var(--grid-gap-md)] sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={`${projectTitle}-${item.title}-${item.text}`} className="flex h-full flex-col rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white p-4">
              <h3 className="text-[var(--type-h3)] font-medium">{item.title}</h3>
              {item.text ? <p className="mt-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">{item.text}</p> : null}
              <div className="mt-4 space-y-2">
                {item.links.slice(0, 3).map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2 text-[var(--type-micro)] text-[var(--color-accent-theme-1)] hover:border-[var(--color-accent-theme-1)]"
                  >
                    Open resource
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
      <div className="space-y-4">
        {items.map((item) => (
          <article key={`${projectTitle}-${item.title}-${item.text}`} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
            <h3 className="text-[var(--type-h3)] font-medium">{item.title}</h3>
            {item.text ? <p className="mt-2 text-[var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">{item.text}</p> : null}
            {(item.images.length > 0 || item.links.length > 0 || item.colors.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.images[0] ? <img src={item.images[0]} alt={item.title} className="h-16 w-24 rounded-[var(--radius-sm)] object-cover" /> : null}
                {item.links[0] ? <a href={item.links[0]} target="_blank" rel="noreferrer" className="text-[var(--type-micro)] text-[var(--color-accent-theme-1)] underline">Reference link</a> : null}
                {item.colors[0] ? <span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-2 py-1 text-[var(--type-micro)]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.colors[0] }} />{item.colors[0]}</span> : null}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sourceMap, setSourceMap] = useState<Record<string, SourceSnapshot>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSlug, setActiveSlug] = useState<string | null>(parseCourseSlug());
  const [projectPage, setProjectPage] = useState(0);

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
    setProjectPage(0);
  }, [currentCourse?.id]);

  useEffect(() => {
    if (projectPage >= courseProjects.length && courseProjects.length > 0) {
      setProjectPage(0);
    }
  }, [projectPage, courseProjects.length]);

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

  if (loading) {
    return (
      <AppFrame onHome={goHome} homeEnabled={false}>
        <div className="mx-auto w-full max-w-[var(--container-max)] px-5 py-20 text-center text-[var(--type-body)] text-[var(--color-text-secondary)] sm:px-8 lg:px-12">
          Loading course data...
        </div>
      </AppFrame>
    );
  }

  if (error) {
    return (
      <AppFrame onHome={goHome} homeEnabled={Boolean(activeSlug)}>
        <div className="mx-auto w-full max-w-[var(--container-max)] px-5 py-20 text-center text-[var(--type-body)] text-red-700 sm:px-8 lg:px-12">Error: {error}</div>
      </AppFrame>
    );
  }

  if (!activeSlug) {
    return (
      <AppFrame onHome={goHome} homeEnabled={false}>
        <div className="mx-auto w-full max-w-[var(--container-max)] px-5 py-10 sm:px-8 lg:px-12">
          <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-7 shadow-[var(--shadow-md)] sm:p-10">
            <p className="text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">Course Website</p>
            <h1 className="mt-2 font-['Space_Grotesk'] text-[var(--type-display)] font-bold leading-[1.05]">TemplateA Course Index</h1>
            <p className="mt-4 max-w-3xl text-[var(--type-body)] text-[var(--color-text-secondary)]">
              The whole website now follows one fixed visual system. Assignment projects change only through content pattern modules.
            </p>
          </section>

          <section className="mt-[var(--space-10)] grid gap-[var(--grid-gap-md)] md:grid-cols-2">
            {courses.map((course) => (
              <article key={course.id} className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-sm)]">
                {course.coverImage ? <img src={course.coverImage} alt={course.courseName} className="h-52 w-full object-cover" /> : null}
                <div className="p-5 sm:p-6">
                  <p className="text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">/{course.slug}</p>
                  <h2 className="mt-1 font-['Space_Grotesk'] text-[var(--type-h2)] font-semibold">{course.courseName}</h2>
                  <p className="mt-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">{course.courseSummary || 'No summary provided.'}</p>
                  <button
                    onClick={() => goToCourse(course.slug)}
                    className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-accent-theme-1)] px-4 py-2 text-[var(--type-caption)] font-medium text-white hover:opacity-90"
                  >
                    Open course
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>
      </AppFrame>
    );
  }

  if (!currentCourse) {
    return (
      <AppFrame onHome={goHome} homeEnabled={true}>
        <div className="mx-auto w-full max-w-[var(--container-max)] px-5 py-16 sm:px-8 lg:px-12">
          <p className="text-[var(--type-body)] text-[var(--color-text-secondary)]">Course not found: /courses/{activeSlug}</p>
          <button onClick={goHome} className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-4 py-2 text-[var(--type-caption)]">Back home</button>
        </div>
      </AppFrame>
    );
  }

  const activeProject = courseProjects[projectPage];
  const activeSource = activeProject ? sourceMap[activeProject.sourceDatabaseId] : undefined;
  const activePattern = activeProject ? resolvePattern(activeProject.uiPattern, activeSource) : 'generic-cards';
  const activeMapping = activeProject ? parseFieldMapping(activeProject.fieldMapping) : {};
  const mappedItems = activeSource ? activeSource.items.map((item) => resolveMappedItem(item, activeMapping)).slice(0, 8) : [];

  return (
    <AppFrame onHome={goHome} homeEnabled={true}>
      <div className="mx-auto w-full max-w-[var(--container-max)] px-5 py-8 sm:px-8 lg:px-12">
        <section className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-md)]">
          {currentCourse.coverImage ? <img src={currentCourse.coverImage} alt={currentCourse.courseName} className="h-56 w-full object-cover md:h-72" /> : null}
          <div className="p-6 sm:p-8">
            <p className="text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">Course Overview</p>
            <h1 className="mt-2 font-['Space_Grotesk'] text-[var(--type-h1)] font-bold leading-tight">{currentCourse.courseName}</h1>
            <p className="mt-3 max-w-4xl text-[var(--type-body)] text-[var(--color-text-secondary)]">{currentCourse.courseSummary || 'No summary provided.'}</p>
          </div>
        </section>

        {courseProjects.length > 0 ? (
          <section className="mt-7 space-y-4">
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-3 sm:p-4">
              <div className="flex flex-wrap gap-2">
                {courseProjects.map((project, idx) => {
                  const isActive = idx === projectPage;
                  return (
                    <button
                      key={project.id}
                      onClick={() => setProjectPage(idx)}
                      className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] transition-all ${
                        isActive
                          ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-white'
                          : 'border-[var(--color-border-subtle)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'
                      }`}
                    >
                      {project.tabName || `Project ${idx + 1}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeProject ? (
              <>
                <section className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-5 py-4">
                  <div>
                    <h2 className="font-['Space_Grotesk'] text-[var(--type-h2)] font-semibold">{activeProject.tabName || activeProject.projectName}</h2>
                    <p className="mt-1 text-[var(--type-caption)] text-[var(--color-text-secondary)]">Pattern module: {PATTERN_LABEL[activePattern]}</p>
                  </div>
                  <p className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-1 text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">
                    {projectPage + 1} / {courseProjects.length}
                  </p>
                </section>

                <PatternSection pattern={activePattern} projectTitle={activeProject.tabName || activeProject.projectName} items={mappedItems} />

                <div className="flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-3 sm:p-4">
                  <button
                    onClick={() => setProjectPage((p) => Math.max(0, p - 1))}
                    disabled={projectPage === 0}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-4 py-2 text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setProjectPage((p) => Math.min(courseProjects.length - 1, p + 1))}
                    disabled={projectPage === courseProjects.length - 1}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-4 py-2 text-[var(--type-micro)] uppercase tracking-[var(--tracking-wide)] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : null}
          </section>
        ) : (
          <section className="mt-7 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-8 text-center text-[var(--type-body)] text-[var(--color-text-secondary)]">
            No published projects linked to this course.
          </section>
        )}
      </div>
    </AppFrame>
  );
};

export default App;
