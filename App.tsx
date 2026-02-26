
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeType, Theme1Project, Theme2Project, Filters } from './types';
import { fetchTheme1Projects, fetchTheme2Projects } from './services/dataService';
import ProjectCardTheme1 from './components/ProjectCardTheme1';
import ProjectCardTheme2 from './components/ProjectCardTheme2';
import FilterBar from './components/FilterBar';
import { CONFIG } from './config';

const App: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState<ThemeType>(ThemeType.SEEING_LIKE_A_THING);
  const [theme1Data, setTheme1Data] = useState<Theme1Project[]>([]);
  const [theme2Data, setTheme2Data] = useState<Theme2Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({ year: '', tag: '' });

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [t1, t2] = await Promise.all([
        fetchTheme1Projects(isRefresh),
        fetchTheme2Projects(isRefresh)
      ]);
      setTheme1Data(t1);
      setTheme2Data(t2);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentProjects = useMemo(() => {
    const data = activeTheme === ThemeType.SEEING_LIKE_A_THING ? theme1Data : theme2Data;
    return data.filter(p => {
      const yearMatch = filters.year === '' || p.year === filters.year;
      const tagMatch = filters.tag === '' || p.tags.includes(filters.tag);
      return yearMatch && tagMatch;
    });
  }, [activeTheme, theme1Data, theme2Data, filters]);

  const availableYears = useMemo(() => {
    const data = activeTheme === ThemeType.SEEING_LIKE_A_THING ? theme1Data : theme2Data;
    const years = new Set<string>();
    data.forEach(p => { if (p.year) years.add(p.year); });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [activeTheme, theme1Data, theme2Data]);

  const availableTags = useMemo(() => {
    const data = activeTheme === ThemeType.SEEING_LIKE_A_THING ? theme1Data : theme2Data;
    const tags = new Set<string>();
    data.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [activeTheme, theme1Data, theme2Data]);

  const currentThemeStyle = CONFIG.THEME_STYLES[activeTheme];

  return (
    <div className="min-h-screen flex flex-col selection:bg-black selection:text-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-5 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-none mb-1.5">
              Data-Enabled <span className="text-gray-300">Creative</span> Design
            </h1>
            <div className="flex items-center gap-2">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Course Portfolio • {CONFIG.UNIVERSITY}
               </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8 lg:gap-12">
            <nav className="flex gap-8">
              <button 
                onClick={() => { setActiveTheme(ThemeType.SEEING_LIKE_A_THING); setFilters({year: '', tag: ''}); }}
                className={`text-[11px] font-black uppercase tracking-widest transition-all pb-1.5 border-b-2 ${activeTheme === ThemeType.SEEING_LIKE_A_THING ? CONFIG.THEME_STYLES["Seeing Like a Thing"].navActive : 'text-gray-300 border-transparent hover:text-gray-500'}`}
              >
                Seeing Like a Thing
              </button>
              <button 
                onClick={() => { setActiveTheme(ThemeType.EVERYDAY_DATA_TRACKING); setFilters({year: '', tag: ''}); }}
                className={`text-[11px] font-black uppercase tracking-widest transition-all pb-1.5 border-b-2 ${activeTheme === ThemeType.EVERYDAY_DATA_TRACKING ? CONFIG.THEME_STYLES["Everyday Data Tracking"].navActive : 'text-gray-300 border-transparent hover:text-gray-500'}`}
              >
                Everyday Tracking
              </button>
            </nav>

            <button 
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="group flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-full hover:bg-black hover:text-white transition-all disabled:opacity-50 shadow-sm"
            >
              <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {refreshing ? 'Syncing...' : 'Sync Data'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12 md:px-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-50 pb-8">
           <div className="flex flex-col gap-2">
              <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${currentThemeStyle.accent}`}>Current Theme</span>
              <h2 className="text-4xl font-light tracking-tight">{activeTheme}</h2>
           </div>
           <FilterBar 
            filters={filters} 
            availableYears={availableYears} 
            availableTags={availableTags}
            onFilterChange={setFilters}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="flex flex-col items-center gap-5">
              <div className={`w-10 h-10 border-4 border-gray-100 rounded-full animate-spin`} style={{ borderTopColor: activeTheme === ThemeType.SEEING_LIKE_A_THING ? 'black' : '#2563eb' }}></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Curating Exhibition...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {currentProjects.length > 0 ? (
              currentProjects.map(project => (
                activeTheme === ThemeType.SEEING_LIKE_A_THING 
                  ? <ProjectCardTheme1 key={project.id} project={project as Theme1Project} />
                  : <ProjectCardTheme2 key={project.id} project={project as Theme2Project} />
              ))
            ) : (
              <div className="py-32 text-center">
                <h3 className="text-2xl font-light text-gray-300 uppercase tracking-widest italic">No matching records found.</h3>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 py-16 px-6 md:px-12 bg-gray-50/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          <div className="flex flex-col gap-4">
             <a href={CONFIG.LAB_URL} target="_blank" rel="noopener noreferrer" className="inline-block group">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-black transition-colors block mb-1">Laboratory</span>
                <span className="text-lg font-light tracking-tight group-hover:underline">{CONFIG.LAB_NAME}</span>
             </a>
             <p className="text-xs font-medium text-gray-400 leading-relaxed max-w-xs">
              A research-driven creative computing collective at {CONFIG.UNIVERSITY}.
             </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 block mb-1">Instruction</span>
              <p className="text-sm font-medium text-gray-600">
                授課 by <a href={CONFIG.INSTRUCTOR_URL} target="_blank" rel="noopener noreferrer" className="text-black font-bold underline underline-offset-4 hover:bg-black hover:text-white transition-all">{CONFIG.INSTRUCTOR_NAME}</a>
              </p>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
              {CONFIG.COPYRIGHT}
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-6">
            <div className="flex flex-col md:items-end">
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 mb-2">Design Philosophy</span>
               <div className="text-xl font-light tracking-widest text-gray-900">DESIGN x DATA x INSIGHT</div>
            </div>
            <div className="h-px w-24 bg-gray-200"></div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {CONFIG.UNIVERSITY}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
