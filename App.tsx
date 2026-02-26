import React, { useEffect, useMemo, useState } from 'react';
import { Course, Project } from './types';
import { fetchCourses, fetchProjects, fetchSourceDatabase } from './services/courseService';
import { CardRenderer, Density, AccentTheme, MediaPriority, MappedItem } from './components/cards';
import { CardStyleKey } from './card-style-registry';

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

const resolvePattern = (uiPatternRaw: string, source: SourceSnapshot | undefined): CardStyleKey => {
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

const resolveDensity = (project: Project | undefined, course: Course | null): Density => {
  if (project?.density === 'compact' || project?.density === 'comfortable' || project?.density === 'immersive') return project.density;
  if (course?.density === 'compact' || course?.density === 'comfortable' || course?.density === 'immersive') return course.density;
  return 'comfortable';
};

const resolveAccentTheme = (project: Project | undefined, course: Course | null, pattern: CardStyleKey): AccentTheme => {
  if (project?.accentTheme === 'theme-1' || project?.accentTheme === 'theme-2' || project?.accentTheme === 'auto') {
    if (project.accentTheme !== 'auto') return project.accentTheme;
  }
  if (course?.accentTheme === 'theme-1' || course?.accentTheme === 'theme-2') return course.accentTheme;
  if (pattern === 'gallery-story') return 'theme-2';
  return 'theme-1';
};

const resolveMediaPriority = (project: Project | undefined, course: Course | null): MediaPriority => {
  if (project?.mediaPriority === 'image' || project?.mediaPriority === 'text' || project?.mediaPriority === 'balanced') return project.mediaPriority;
  if (course?.mediaPriority === 'image' || course?.mediaPriority === 'text' || course?.mediaPriority === 'balanced') return course.mediaPriority;
  return 'balanced';
};

const AppFrame: React.FC<{
  children: React.ReactNode;
  onHome: () => void;
  homeEnabled: boolean;
  headerTitle: string;
  headerSubtitle: string;
}> = ({ children, onHome, homeEnabled, headerTitle, headerSubtitle }) => (
  <main className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
    <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <div className="mx-auto grid w-full max-w-[var(--container-max)] gap-4 px-8 py-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-[var(--type-micro)] leading-[1.5] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">
            {headerSubtitle}
          </p>
          <h2 className="mt-2 text-[var(--type-h3)] leading-[1.4] font-medium">{headerTitle}</h2>
        </div>
        <nav className="flex items-center gap-4">
          <button
            onClick={onHome}
            disabled={!homeEnabled}
            className="border border-[var(--color-border-subtle)] px-4 py-4 text-[var(--type-micro)] leading-[1.5] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)] disabled:opacity-40"
          >
            Course Index
          </button>
          <a href="/style-playground" className="border border-[var(--color-border-subtle)] px-4 py-4 text-[var(--type-micro)] leading-[1.5] uppercase tracking-[var(--tracking-wide)] hover:border-[var(--color-text-primary)]">
            Style Playground
          </a>
        </nav>
      </div>
    </header>

    {children}

    <footer className="mt-16 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-4 px-8 py-6 text-[var(--type-micro)] leading-[1.5] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">
        <p>National Taiwan University of Science and Technology / Design Department</p>
        <p>Lecture by Assistant Prof. Yu-Ting Cheng</p>
      </div>
    </footer>
  </main>
);

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
      <AppFrame onHome={goHome} homeEnabled={false} headerTitle="Course Portfolio Showcase" headerSubtitle="Course Showcase">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-8 py-16 text-center text-[var(--type-body)] leading-[1.5] text-[var(--color-text-secondary)]">
          Loading course data...
        </div>
      </AppFrame>
    );
  }

  if (error) {
    return (
      <AppFrame onHome={goHome} homeEnabled={Boolean(activeSlug)} headerTitle="Course Portfolio Showcase" headerSubtitle="Course Showcase">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-8 py-16 text-center text-[var(--type-body)] leading-[1.5] text-[var(--color-text-primary)]">Error: {error}</div>
      </AppFrame>
    );
  }

  if (!activeSlug) {
    return (
      <AppFrame onHome={goHome} homeEnabled={false} headerTitle="Course Portfolio Showcase" headerSubtitle="Course Showcase">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-8 py-16">
          <section className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
            <p className="text-[var(--type-micro)] leading-[1.5] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">Course Website</p>
            <h1 className="mt-4 text-[var(--type-h1)] leading-[1.2] font-medium">TemplateA Course Index</h1>
            <p className="mt-4 max-w-3xl text-[var(--type-body)] leading-[1.5] text-[var(--color-text-secondary)]">
              The whole website now follows one fixed visual system. Assignment projects change only through content pattern modules.
            </p>
            <a href="/style-playground" className="mt-4 inline-block border border-[var(--color-border-subtle)] px-4 py-4 text-[var(--type-body)] leading-[1.5] text-[var(--color-text-secondary)] hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]">
              Open Style Playground
            </a>
          </section>

          <section className="mt-16 grid gap-10 md:grid-cols-2">
            {courses.map((course) => (
              <article key={course.id} className="overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
                {course.coverImage ? <img src={course.coverImage} alt={course.courseName} className="h-52 w-full object-cover" /> : null}
                <div className="p-6">
                  <p className="text-[var(--type-micro)] leading-[1.5] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">/{course.slug}</p>
                  <h2 className="mt-4 text-[var(--type-h2)] leading-[1.2857] font-medium">{course.courseName}</h2>
                  <p className="mt-4 text-[var(--type-body)] leading-[1.5] text-[var(--color-text-secondary)]">{course.courseSummary || 'No summary provided.'}</p>
                  <button
                    onClick={() => goToCourse(course.slug)}
                    className="mt-4 border border-[var(--color-border-subtle)] px-4 py-4 text-[var(--type-body)] leading-[1.5] text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)]"
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
      <AppFrame onHome={goHome} homeEnabled={true} headerTitle="Course Portfolio Showcase" headerSubtitle="Course Showcase">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-8 py-16">
          <p className="text-[var(--type-body)] leading-[1.5] text-[var(--color-text-secondary)]">Course not found: /courses/{activeSlug}</p>
          <button onClick={goHome} className="mt-4 border border-[var(--color-border-subtle)] px-4 py-4 text-[var(--type-body)] leading-[1.5]">Back home</button>
        </div>
      </AppFrame>
    );
  }

  const activeProject = courseProjects[projectPage];
  const activeSource = activeProject ? sourceMap[activeProject.sourceDatabaseId] : undefined;
  const activePattern = activeProject ? resolvePattern(activeProject.uiPattern, activeSource) : 'generic-cards';
  const activeMapping = activeProject ? parseFieldMapping(activeProject.fieldMapping) : {};
  const mappedItems = activeSource ? activeSource.items.map((item) => resolveMappedItem(item, activeMapping)).slice(0, 8) : [];
  const activeDensity = resolveDensity(activeProject, currentCourse);
  const activeAccentTheme = resolveAccentTheme(activeProject, currentCourse, activePattern);
  const activeMediaPriority = resolveMediaPriority(activeProject, currentCourse);
  const hasCoverImage = Boolean(currentCourse.coverImage);

  return (
    <AppFrame onHome={goHome} homeEnabled={true} headerTitle={currentCourse.courseName} headerSubtitle={currentCourse.slug}>
      <div className="mx-auto w-full max-w-[var(--container-max)] px-8 py-16">
        <section>
          <h1 className="text-[var(--type-h1)] leading-[1.2] font-medium">{currentCourse.courseName}</h1>
          <p className="mt-4 max-w-[680px] text-[var(--type-body)] leading-[1.5] text-[var(--color-text-secondary)]">
            {currentCourse.courseSummary || 'No summary provided.'}
          </p>
          <div className="mt-4 border-t border-[var(--color-border-subtle)]" />
          <div className="mt-6 flex flex-wrap gap-4">
            {courseProjects.map((project, idx) => {
              const isActive = idx === projectPage;
              return (
                <button
                  key={project.id}
                  onClick={() => setProjectPage(idx)}
                  className={`border px-4 py-4 text-[var(--type-micro)] leading-[1.5] uppercase tracking-[var(--tracking-wide)] transition-colors ${isActive
                    ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-white'
                    : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-primary)]'
                    }`}
                >
                  {`Project ${idx + 1}`}
                </button>
              );
            })}
          </div>
        </section>

        {courseProjects.length > 0 && activeProject ? (
          <>
            <section className={`mt-10 grid items-start gap-6 ${hasCoverImage ? 'lg:grid-cols-[3fr_2fr]' : 'grid-cols-1'}`}>
              {hasCoverImage ? (
                <div className="overflow-hidden bg-[var(--color-bg-surface)]">
                  <img src={currentCourse.coverImage} alt={currentCourse.courseName} className="aspect-[4/3] w-full object-cover" />
                </div>
              ) : null}
              <div>
                <h2 className="text-[var(--type-h2)] leading-[1.2857] font-medium">{activeProject.tabName || activeProject.projectName}</h2>
                <p className="mt-4 text-[var(--type-body)] leading-[1.5] text-[var(--color-text-secondary)]">
                  {activeProject.projectDescription || 'No project description provided.'}
                </p>
                <p className="mt-4 text-[var(--type-micro)] leading-[1.5] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-secondary)]">
                  Project {projectPage + 1} of {courseProjects.length}
                </p>
              </div>
            </section>

            <section className="mt-16">
              <div className="mt-4 border-t border-[var(--color-border-subtle)]" />
              <div className="mt-6">
                <CardRenderer
                  styleKey={activePattern}
                  projectTitle={currentCourse.courseName}
                  items={mappedItems}
                  density={activeDensity}
                  accentTheme={activeAccentTheme}
                  mediaPriority={activeMediaPriority}
                />
              </div>
            </section>
          </>
        ) : (
          <section className="mt-16 border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6 text-center text-[var(--type-body)] leading-[1.5] text-[var(--color-text-secondary)]">
            No published projects linked to this course.
          </section>
        )}
      </div>
    </AppFrame>
  );
};

export default App;
