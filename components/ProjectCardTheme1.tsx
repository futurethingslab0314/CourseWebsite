
import React, { useState, useEffect } from 'react';
import { Theme1Project } from '../types';
import { getTagStyle, CONFIG } from '../config';

interface ProjectCardTheme1Props {
  project: Theme1Project;
}

const ProjectCardTheme1: React.FC<ProjectCardTheme1Props> = ({ project }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Use useEffect to handle body scroll locking to prevent the "stuck" issue
  useEffect(() => {
    if (isImageModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isImageModalOpen]);

  const toggleModal = () => {
    setIsImageModalOpen(!isImageModalOpen);
  };

  const themeStyle = CONFIG.THEME_STYLES["Seeing Like a Thing"];

  return (
    <>
      <div className="group/card border-t border-gray-100 pt-10 pb-16 flex flex-col md:flex-row gap-10 animate-in fade-in duration-700">
        <div className="w-full md:w-1/3">
          <div 
            className="group cursor-zoom-in relative overflow-hidden rounded-sm border border-gray-100 shadow-sm"
            onClick={toggleModal}
          >
            <img 
              src={project.mainImage} 
              alt={project.name} 
              className="w-full aspect-[4/5] object-cover grayscale hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
               <svg className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
               </svg>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-2/3 flex flex-col">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
               <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm ${themeStyle.bg} ${themeStyle.text}`}>
                 主題一：Seeing Like a Thing
               </span>
               <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{project.year}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-2 group-hover/card:text-zinc-900 transition-colors">{project.name}</h2>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <span className="text-black">{project.group}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {project.tags.map(tag => {
              const style = getTagStyle(tag);
              return (
                <span 
                  key={tag} 
                  className={`text-[10px] font-bold uppercase border px-3 py-1 rounded transition-all hover:shadow-sm ${style.bg} ${style.text} ${style.border}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>

          <div className="mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 block mb-3">Project Overview</span>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap max-w-2xl">
              {project.projectIntro}
            </p>
          </div>

          <div className="mb-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-4">Interactive Data Card Spec</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {project.dataCards.map((card, idx) => (
                <div key={idx} className="bg-white p-5 rounded-sm text-[11px] font-mono leading-relaxed border border-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-none transition-shadow">
                  {card.map((line, lidx) => (
                    <div key={lidx} className="mb-1 last:mb-0 border-b border-gray-50 pb-1 last:border-0">
                      {line}
                    </div>
                  ))}
                </div>
              ))}
              {project.dataCards.length === 0 && (
                <span className="text-gray-300 text-xs italic">No specific data protocols archived.</span>
              )}
            </div>
          </div>

          <div className="mt-auto">
             {project.answer && (
               <div className="border-t border-gray-100 pt-6">
                  <button 
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="bg-zinc-900 text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all rounded-sm shadow-md active:scale-95"
                  >
                    {showAnswer ? "Collapse Reflection" : "Reveal Team Answer"}
                  </button>
                  {showAnswer && (
                    <div className="mt-6 p-6 bg-zinc-50 border border-zinc-100 text-sm italic text-gray-700 rounded-sm animate-in slide-in-from-top-4 duration-500">
                      <div className="mb-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Critical Reflection</div>
                      {project.answer}
                    </div>
                  )}
               </div>
             )}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-gray-400 uppercase tracking-widest border-t border-gray-50 pt-6">
            {project.students.map(s => (
              <span key={s.id} className="hover:text-black transition-colors">{s.name} <span className="text-gray-200 mx-1">/</span> {s.id}</span>
            ))}
          </div>
        </div>
      </div>

      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/98 backdrop-blur-xl p-8 animate-in fade-in duration-500"
          onClick={toggleModal}
        >
          <button 
            className="absolute top-10 right-10 text-black hover:scale-110 transition-transform z-[110]"
            onClick={(e) => { e.stopPropagation(); toggleModal(); }}
          >
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div 
            className="relative max-w-7xl w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={project.mainImage} 
              alt={project.name} 
              className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
            />
            <div className="mt-10 text-center">
              <h3 className="text-2xl font-light tracking-tight">{project.name}</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 mt-3">{project.group} • {project.year}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectCardTheme1;
