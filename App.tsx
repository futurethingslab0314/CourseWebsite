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

const Theme1Page: React.FC<{ projectTitle: string; items: MappedItem[] }> = ({ projectTitle, items }) => {
  const hero = items[0];
  return (
    <article className="border-t border-gray-100 pt-8 pb-14 md:pt-10">
      <div className="flex flex-col gap-10 md:flex-row">
        <div className="w-full md:w-1/3">
          <div className="overflow-hidden rounded-sm border border-gray-100 shadow-sm">
            <img
              src={hero?.images[0] || 'https://picsum.photos/800/1000'}
              alt={hero?.title || projectTitle}
              className="w-full aspect-[4/5] object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight">{projectTitle}</h2>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{hero?.text || ''}</p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.slice(0, 6).map((item) => (
              <div key={`${projectTitle}-${item.title}-${item.text}`} className="bg-white p-4 rounded-sm border border-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.04)]">
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                {item.text ? <p className="mt-2 text-xs text-gray-600 leading-relaxed">{item.text}</p> : null}
                {item.colors.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.colors.slice(0, 4).map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 border border-gray-100 px-2 py-1 text-[10px] rounded-sm">
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};

const Theme2Page: React.FC<{ projectTitle: string; items: MappedItem[] }> = ({ projectTitle, items }) => {
  const cover = items[0]?.images[0] || 'https://picsum.photos/1280/800';
  return (
    <article className="border-t border-gray-100 py-10 md:py-14">
      <div className="group relative">
        <div className="aspect-[16/10] overflow-hidden bg-gray-50 rounded-sm shadow-sm">
          <img src={cover} alt={projectTitle} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
        </div>
        <h2 className="mt-6 text-4xl md:text-5xl font-light tracking-tight leading-none text-gray-800">{projectTitle}</h2>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-4 lg:col-span-3">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap italic border-l-4 border-blue-50 pl-5">
            {items[0]?.text || ''}
          </p>
        </div>
        <div className="md:col-span-8 lg:col-span-9">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {items.slice(0, 8).map((item) => (
              <div key={`${projectTitle}-${item.title}-${item.text}`} className="space-y-3">
                <div className="aspect-[4/3] overflow-hidden rounded-sm border border-gray-100">
                  <img src={item.images[0] || cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                </div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                {item.text ? <p className="text-xs text-gray-500 leading-relaxed">{item.text}</p> : null}
                {item.links.length ? (
                  <div className="flex flex-wrap gap-2">
                    {item.links.slice(0, 3).map((link) => (
                      <a key={link} href={link} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 underline underline-offset-2">
                        View link
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
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

  if (loading) return <div className="min-h-screen bg-[var(--color-bg-canvas)] p-10 text-center text-[var(--type-body)] text-[var(--color-text-secondary)]">Loading course data...</div>;
  if (error) return <div className="min-h-screen bg-[var(--color-bg-canvas)] p-10 text-center text-[var(--type-body)] text-red-700">Error: {error}</div>;

  if (!activeSlug) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-canvas)] py-[var(--section-padding-y)]">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-5 sm:px-8 lg:px-12">
          <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6 shadow-[var(--shadow-md)] sm:p-10">
            <h1 className="font-['Space_Grotesk'] text-[var(--type-display)] font-bold leading-[1.05] text-[var(--color-text-primary)]">Notion-Driven Course Showcase</h1>
            <p className="mt-4 max-w-3xl text-[var(--type-body)] text-[var(--color-text-secondary)]">Open a course to view assignment projects in paged presentation mode.</p>
          </section>

          <section className="mt-[var(--space-10)] grid gap-[var(--grid-gap-md)] md:grid-cols-2">
            {courses.map((course) => (
              <article key={course.id} className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-sm)]">
                {course.coverImage ? <img src={course.coverImage} alt={course.courseName} className="h-56 w-full object-cover" /> : null}
                <div className="p-5 sm:p-6">
                  <p className="text-[var(--type-micro)] tracking-[var(--tracking-wide)] text-[var(--color-accent-theme-1)]">/{course.slug}</p>
                  <h2 className="mt-1 font-['Space_Grotesk'] text-[var(--type-h2)] font-semibold text-[var(--color-text-primary)]">{course.courseName}</h2>
                  <p className="mt-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">{course.courseSummary || 'No summary provided.'}</p>
                  <button onClick={() => goToCourse(course.slug)} className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-accent-theme-1)] px-4 py-2 text-[var(--type-caption)] font-medium text-white hover:opacity-90">
                    Open course
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>
    );
  }

  if (!currentCourse) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-canvas)] py-[var(--section-padding-y)]">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-5 sm:px-8 lg:px-12">
          <p className="text-[var(--type-body)] text-[var(--color-text-secondary)]">Course not found: /courses/{activeSlug}</p>
          <button onClick={goHome} className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-4 py-2 text-[var(--type-caption)]">Back home</button>
        </div>
      </main>
    );
  }

  const activeProject = courseProjects[projectPage];
  const activeSource = activeProject ? sourceMap[activeProject.sourceDatabaseId] : undefined;
  const activePattern = activeProject ? resolvePattern(activeProject.uiPattern, activeSource) : 'generic-cards';
  const activeMapping = activeProject ? parseFieldMapping(activeProject.fieldMapping) : {};
  const mappedItems = activeSource ? activeSource.items.map((item) => resolveMappedItem(item, activeMapping)).slice(0, 8) : [];
  const useTheme2 = activePattern === 'gallery-story' || projectPage % 2 === 1;

  return (
    <main className="min-h-screen bg-[var(--color-bg-canvas)] py-[var(--section-padding-y)]">
      <div className="mx-auto w-full max-w-[var(--container-max)] px-5 sm:px-8 lg:px-12">
        <button onClick={goHome} className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2 text-[var(--type-caption)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          Back to all courses
        </button>

        <section className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-md)]">
          {currentCourse.coverImage ? <img src={currentCourse.coverImage} alt={currentCourse.courseName} className="h-60 w-full object-cover md:h-80" /> : null}
          <div className="p-6 sm:p-8">
            <h1 className="font-['Space_Grotesk'] text-[var(--type-h1)] font-bold leading-tight text-[var(--color-text-primary)]">{currentCourse.courseName}</h1>
            <p className="mt-3 max-w-4xl text-[var(--type-body)] text-[var(--color-text-secondary)]">{currentCourse.courseSummary || 'No summary provided.'}</p>
          </div>
        </section>

        {courseProjects.length > 0 ? (
          <section className="mt-8 rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-white p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              {courseProjects.map((project, idx) => (
                <button
                  key={project.id}
                  onClick={() => setProjectPage(idx)}
                  className={`px-3 py-1.5 text-xs rounded-sm border transition-all ${
                    idx === projectPage ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {project.tabName || `Project ${idx + 1}`}
                </button>
              ))}
            </div>

            {activeProject ? (
              <>
                {useTheme2 ? (
                  <Theme2Page projectTitle={activeProject.tabName || activeProject.projectName} items={mappedItems} />
                ) : (
                  <Theme1Page projectTitle={activeProject.tabName || activeProject.projectName} items={mappedItems} />
                )}

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setProjectPage((p) => Math.max(0, p - 1))}
                    disabled={projectPage === 0}
                    className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-200 rounded-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <p className="text-xs text-gray-500">
                    {projectPage + 1} / {courseProjects.length}
                  </p>
                  <button
                    onClick={() => setProjectPage((p) => Math.min(courseProjects.length - 1, p + 1))}
                    disabled={projectPage === courseProjects.length - 1}
                    className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-200 rounded-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : null}
          </section>
        ) : (
          <section className="mt-8 rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-8 text-center text-[var(--type-body)] text-[var(--color-text-secondary)]">
            No published projects linked to this course.
          </section>
        )}
      </div>
    </main>
  );
};

export default App;
