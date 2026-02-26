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

const isCourseMatch = (course: Course, slug: string) => course.slug.toLowerCase() === slug.toLowerCase();
const normalizeId = (value: string) => (value || '').replace(/-/g, '').toLowerCase();

const parseFieldMapping = (raw: string): Mapping => {
  const value = (raw || '').trim();
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') return parsed as Mapping;
  } catch {
    const pairs = value.split(/[,\n;]/).map((x) => x.trim()).filter(Boolean);
    const mapping: Mapping = {};
    pairs.forEach((pair) => {
      const [k, v] = pair.split(':').map((x) => x.trim());
      if (k && v) (mapping as Record<string, string>)[k] = v;
    });
    return mapping;
  }
  return {};
};

const resolvePattern = (
  uiPatternRaw: string,
  source: SourceSnapshot | undefined
): Pattern => {
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

const resolveMappedItem = (
  item: SourceSnapshot['items'][number],
  mapping: Mapping
) => {
  const titleField = mapping.title ? item.fields[mapping.title] : undefined;
  const textField = mapping.text ? item.fields[mapping.text] : undefined;
  const imageField = mapping.image ? item.fields[mapping.image] : undefined;
  const galleryField = mapping.gallery ? item.fields[mapping.gallery] : undefined;
  const linkField = mapping.link ? item.fields[mapping.link] : undefined;
  const colorField = mapping.color ? item.fields[mapping.color] : undefined;

  return {
    title: titleField?.text || item.title,
    text: textField?.text || item.text,
    images: [
      ...(imageField?.images || []),
      ...(galleryField?.images || []),
      ...item.images
    ].slice(0, 8),
    links: [...(linkField?.links || []), ...item.links].slice(0, 6),
    colors: [...(colorField?.colors || []), ...item.colors].slice(0, 8)
  };
};

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
    const uncachedDbIds = courseProjects
      .map((project) => project.sourceDatabaseId)
      .filter((dbId) => dbId && !sourceMap[dbId]);
    if (uncachedDbIds.length === 0) return;

    const loadSources = async () => {
      const entries = await Promise.all(
        uncachedDbIds.map(async (dbId) => {
          try {
            const snapshot = await fetchSourceDatabase(dbId);
            return [
              dbId,
              {
                dbTitle: snapshot.title,
                fields: snapshot.properties.map((p) => ({ name: p.name, type: p.type })),
                items: snapshot.items
              }
            ] as const;
          } catch (err) {
            return [
              dbId,
              {
                dbTitle: dbId,
                fields: [],
                items: [],
                error: err instanceof Error ? err.message : 'Failed to load source database'
              }
            ] as const;
          }
        })
      );
      setSourceMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    };

    loadSources();
  }, [courseProjects, currentCourse, sourceMap]);

  const goToCourse = (slug: string) => {
    const path = `/courses/${encodeURIComponent(slug)}`;
    window.history.pushState({}, '', path);
    setActiveSlug(slug);
  };

  const goHome = () => {
    window.history.pushState({}, '', '/');
    setActiveSlug(null);
  };

  if (loading) return <div className="min-h-screen bg-[#f8f6f1] p-10 text-center text-lg">Loading course data...</div>;
  if (error) return <div className="min-h-screen bg-[#f8f6f1] p-10 text-center text-red-700">Error: {error}</div>;

  if (!activeSlug) {
    return (
      <div className="min-h-screen bg-[#f8f6f1] px-6 py-10 text-[#171511] md:px-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#171511]/10 bg-white/75 p-8 shadow-[0_20px_60px_rgba(23,21,17,.08)]">
          <h1 className="font-['Space_Grotesk'] text-4xl font-bold md:text-6xl">CourseWebsite</h1>
          <p className="mt-4 max-w-3xl text-[#3b352d]">
            已接上 Notion 流程：Courses(`NOTION_DATABASE_ID_THEME_1`) {'->'} Projects(`NOTION_DATABASE_ID_THEME_2`) {'->'} SourceDatabaseId {'->'} /courses/[slug]
          </p>
        </div>
        <div className="mx-auto mt-8 grid max-w-6xl gap-6 md:grid-cols-2">
          {courses.map((course) => (
            <article key={course.id} className="overflow-hidden rounded-3xl border border-[#171511]/10 bg-white">
              {course.coverImage ? <img src={course.coverImage} alt={course.courseName} className="h-52 w-full object-cover" /> : null}
              <div className="p-6">
                <div className="text-xs font-semibold tracking-[0.14em] text-[#7f3f00]">/{course.slug}</div>
                <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold">{course.courseName}</h2>
                <p className="mt-3 line-clamp-3 text-sm text-[#4b443b]">{course.courseSummary || 'No summary.'}</p>
                <button onClick={() => goToCourse(course.slug)} className="mt-5 rounded-full bg-[#171511] px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white">
                  OPEN COURSE
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="min-h-screen bg-[#f8f6f1] p-10 text-center text-[#171511]">
        <p>Course not found: /courses/{activeSlug}</p>
        <button onClick={goHome} className="mt-4 rounded-full bg-[#171511] px-4 py-2 text-white">Back Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1] px-6 py-10 text-[#171511] md:px-10">
      <div className="mx-auto max-w-6xl">
        <button onClick={goHome} className="mb-4 text-xs font-semibold tracking-[0.12em] text-[#7f3f00] underline">← ALL COURSES</button>
        <section className="overflow-hidden rounded-3xl border border-[#171511]/10 bg-white">
          {currentCourse.coverImage ? <img src={currentCourse.coverImage} alt={currentCourse.courseName} className="h-64 w-full object-cover md:h-80" /> : null}
          <div className="p-7 md:p-9">
            <h1 className="font-['Space_Grotesk'] text-3xl font-bold md:text-5xl">{currentCourse.courseName}</h1>
            <p className="mt-4 max-w-4xl text-[#4b443b]">{currentCourse.courseSummary || 'No summary provided.'}</p>
          </div>
        </section>

        <section className="mt-8 space-y-6">
          {courseProjects.map((project) => {
            const source = sourceMap[project.sourceDatabaseId];
            const mapping = parseFieldMapping(project.fieldMapping);
            const pattern = resolvePattern(project.uiPattern, source);
            const mappedItems = (source?.items || []).map((item) => resolveMappedItem(item, mapping)).slice(0, 6);

            return (
              <article key={project.id} className="rounded-3xl border border-[#171511]/10 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-['Space_Grotesk'] text-2xl font-bold">{project.tabName || project.projectName}</h2>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-xs font-semibold text-[#0c4a6e]">Pattern: {pattern}</span>
                    <span className="rounded-full bg-[#fff8e6] px-3 py-1 text-xs font-semibold text-[#7f3f00]">Source DB: {project.sourceDatabaseId || 'missing'}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-[#5a5348]">Project: {project.projectName}</p>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-[#171511]/10 bg-[#f8fafc] p-4 md:col-span-1">
                    <h3 className="text-sm font-semibold tracking-[0.12em] text-[#334155]">Detected Schema</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(source?.fields || []).map((field) => (
                        <span key={`${field.name}-${field.type}`} className="rounded-full bg-white px-3 py-1 text-xs text-[#334155] ring-1 ring-[#334155]/20">{field.name} ({field.type})</span>
                      ))}
                      {!source ? <span className="text-xs text-[#64748b]">Loading source schema...</span> : null}
                    </div>
                    {Object.keys(mapping).length ? (
                      <div className="mt-4 rounded-xl border border-[#171511]/10 bg-white p-3 text-xs text-[#475569]">
                        <div className="mb-2 font-semibold">FieldMapping</div>
                        {Object.entries(mapping).map(([key, value]) => (
                          <div key={key}>{key}: {value}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-[#171511]/10 bg-[#faf9f6] p-4 md:col-span-2">
                    <h3 className="text-sm font-semibold tracking-[0.12em] text-[#44403c]">Rendered Items ({source?.dbTitle || 'Source Database'})</h3>
                    {pattern === 'gallery-story' ? (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {mappedItems.map((item) => (
                          <div key={item.title + item.text} className="overflow-hidden rounded-xl border border-[#171511]/10 bg-white">
                            {item.images[0] ? <img src={item.images[0]} alt={item.title} className="h-36 w-full object-cover" /> : null}
                            <div className="p-3">
                              <div className="text-sm font-semibold">{item.title}</div>
                              {item.text ? <p className="mt-1 text-xs text-[#57534e]">{item.text}</p> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {pattern === 'color-swatch' ? (
                      <div className="mt-3 space-y-3">
                        {mappedItems.map((item) => (
                          <div key={item.title + item.text} className="rounded-xl border border-[#171511]/10 bg-white p-3">
                            <div className="text-sm font-semibold">{item.title}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.colors.map((color) => (
                                <span key={color} className="inline-flex items-center gap-2 rounded-full border border-[#171511]/10 bg-white px-2 py-1 text-xs">
                                  <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                                  {color}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {pattern === 'link-cards' ? (
                      <div className="mt-3 space-y-3">
                        {mappedItems.map((item) => (
                          <div key={item.title + item.text} className="rounded-xl border border-[#171511]/10 bg-white p-3">
                            <div className="text-sm font-semibold">{item.title}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.links.map((link) => (
                                <a key={link} href={link} target="_blank" rel="noreferrer" className="rounded-full bg-[#eef7ff] px-3 py-1 text-xs text-[#0c4a6e] underline">
                                  Link
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {pattern === 'generic-cards' ? (
                      <div className="mt-3 space-y-3">
                        {mappedItems.map((item) => (
                          <div key={item.title + item.text} className="rounded-xl border border-[#171511]/10 bg-white p-3">
                            <div className="text-sm font-semibold">{item.title}</div>
                            {item.text ? <p className="mt-1 text-xs text-[#57534e]">{item.text}</p> : null}
                            {item.images.length ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.images.slice(0, 3).map((img) => (
                                  <img key={img} src={img} alt={item.title} className="h-14 w-14 rounded-lg object-cover" />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {source && source.items.length === 0 ? <p className="mt-3 text-xs text-[#78716c]">No rows found in source database.</p> : null}
                    {source?.error ? (
                      <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        Source DB load failed: {source.error}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}

          {courseProjects.length === 0 ? (
            <div className="rounded-3xl border border-[#171511]/10 bg-white p-10 text-center text-[#57534e]">No published projects linked to this course.</div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default App;
