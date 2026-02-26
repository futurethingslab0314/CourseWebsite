
import React, { useState, useEffect } from 'react';
import { Theme2Project } from '../types';
import { getTagStyle, CONFIG } from '../config';

interface ProjectCardTheme2Props {
  project: Theme2Project;
}

const ProjectCardTheme2: React.FC<ProjectCardTheme2Props> = ({ project }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Sync body scroll with modal state
  useEffect(() => {
    if (zoomedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [zoomedImage]);

  const coverImage = project.gallery[0] || "https://picsum.photos/800/600";

  const handleZoom = (imgUrl: string) => {
    setZoomedImage(imgUrl);
  };

  const closeZoom = () => {
    setZoomedImage(null);
  };

  const themeStyle = CONFIG.THEME_STYLES["Everyday Data Tracking"];

  return (
    <div className="border-t border-gray-100 last:border-b transition-all">
      <div 
        className="group/item cursor-pointer relative py-12 md:py-20 overflow-hidden"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-full md:w-1/2 aspect-[16/10] overflow-hidden bg-gray-50 rounded-sm shadow-sm group-hover/item:shadow-md transition-shadow">
            <img 
              src={coverImage} 
              alt={project.name} 
              className={`w-full h-full object-cover transition-all duration-1000 ${isExpanded ? 'grayscale-0 scale-100' : 'grayscale group-hover/item:grayscale-0 group-hover/item:scale-105'}`}
            />
          </div>
          <div className="w-full md:w-1/2 flex flex-col pt-2">
            <div className="flex flex-wrap items-center gap-4 mb-5">
               <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-sm ${themeStyle.bg} ${themeStyle.text}`}>
                 主題二：Everyday Tracking
               </span>
               <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                Class of {project.year}
               </span>
            </div>
            
            <h2 className={`text-4xl md:text-5xl font-light tracking-tight leading-none mb-6 transition-all duration-500 ${isExpanded ? 'text-blue-600' : 'text-gray-400 group-hover/item:text-black'}`}>
              {project.name}
            </h2>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Project Team</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-gray-600">
                  {project.students.map(s => (
                    <span key={s.id} className="border-b border-gray-100 pb-0.5 hover:text-black transition-colors">{s.name}</span>
                  ))}
                  <span className="text-gray-300 font-bold ml-auto">{project.group}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Methodologies</span>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(tag => {
                    const style = getTagStyle(tag);
                    return (
                      <span key={tag} className={`text-[10px] font-bold uppercase border px-3 py-1 rounded transition-all ${style.bg} ${style.text} ${style.border}`}>
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-300 group-hover/item:text-blue-600 transition-colors">
              <span className="bg-gray-100 w-8 h-[2px] group-hover/item:bg-blue-600 transition-colors"></span>
              <span>{isExpanded ? 'Minimize Gallery' : 'Expand Case Study'}</span>
              <svg 
                className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="pb-24 px-4 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 pt-12 border-t border-gray-50">
            <div className="md:col-span-4 lg:col-span-3">
              <div className="sticky top-32 space-y-10">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">Insight & Discovery</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap italic border-l-4 border-blue-50 pl-6">
                    {project.projectIntro}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">Contributors</h4>
                  <div className="flex flex-col gap-1 text-[11px] text-gray-500 uppercase tracking-widest">
                    {project.students.map(s => (
                      <div key={s.id} className="flex justify-between border-b border-gray-50 py-3 hover:bg-white transition-colors px-2">
                        <span className="font-bold text-gray-800">{s.name}</span>
                        <span className="text-gray-300">{s.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 lg:col-span-9 space-y-20">
              {project.videoUrl && (
                <div className="group/video relative aspect-video w-full bg-zinc-900 rounded-sm overflow-hidden shadow-2xl">
                   <iframe 
                    src={project.videoUrl.replace("watch?v=", "embed/").split("&")[0]} 
                    className="w-full h-full"
                    allowFullScreen
                    title={project.name}
                   />
                   <div className="absolute top-4 left-4 pointer-events-none">
                     <span className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[9px] font-black uppercase tracking-widest">Video Presentation</span>
                   </div>
                </div>
              )}

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8 flex items-center gap-4">
                  <span>Process Documentation</span>
                  <div className="h-px flex-grow bg-gray-100"></div>
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {project.gallery.map((imgUrl, idx) => (
                    <div key={idx} className="group/img space-y-4">
                      <div 
                        className="aspect-[4/3] overflow-hidden bg-gray-100 rounded-sm shadow-sm cursor-zoom-in ring-1 ring-gray-100 group-hover/img:ring-blue-100 transition-all"
                        onClick={() => handleZoom(imgUrl)}
                      >
                        <img 
                          src={imgUrl} 
                          alt={`${project.name} process ${idx}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                        />
                      </div>
                      {project.captions[idx] && (
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-blue-100 group-hover/img:bg-blue-600 transition-colors"></div>
                          <p className="text-[11px] leading-relaxed text-gray-500 font-medium">
                            {project.captions[idx]}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/98 backdrop-blur-xl p-8 animate-in fade-in duration-500"
          onClick={closeZoom}
        >
          <button 
            className="absolute top-10 right-10 text-black hover:rotate-90 transition-transform z-[110]"
            onClick={(e) => { e.stopPropagation(); closeZoom(); }}
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
              src={zoomedImage} 
              alt="Detailed view" 
              className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCardTheme2;
