
import React from 'react';

const roadmap = [
  '讀取已發佈 Courses',
  '依照 Order 載入關聯 Projects',
  '逐一打開 SourceDatabaseId',
  '自動判斷欄位類型並標準化',
  '選擇最適合的 UI Pattern',
  '輸出 /courses/[slug] 並回寫 CourseLink'
];

const courseSchema = [
  'CourseName',
  'Slug',
  'CourseSummary',
  'CoverImage',
  'Status',
  'Projects',
  'CourseLink'
];

const projectSchema = [
  'ProjectName',
  'Course',
  'TabName',
  'Order',
  'SourceDatabaseId',
  'Status',
  'FieldMapping (optional)',
  'UiPattern (optional)'
];

const fieldTypes = ['title', 'image', 'gallery', 'color', 'text', 'link'];

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8f6f1] text-[#171511] selection:bg-[#171511] selection:text-white">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-[-10%] h-80 w-80 rounded-full bg-[#f6c971] blur-3xl" />
        <div className="absolute top-1/3 right-[-6%] h-96 w-96 rounded-full bg-[#9ad0ec] blur-3xl" />
        <div className="absolute bottom-[-8%] left-1/3 h-72 w-72 rounded-full bg-[#f4a7a1] blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <section className="rounded-3xl border border-[#171511]/10 bg-white/75 p-7 shadow-[0_20px_60px_rgba(23,21,17,.08)] backdrop-blur md:p-10">
          <div className="mb-6 inline-flex items-center rounded-full border border-[#171511]/15 bg-white px-4 py-2 text-xs font-semibold tracking-[0.16em] text-[#2d2820]">
            NOTION TYPES READY
          </div>
          <h1 className="font-['Space_Grotesk'] text-4xl font-bold leading-[1.05] md:text-6xl">
            CourseWebsite
            <span className="mt-1 block text-[#7f3f00]">Schema-Driven Design</span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#3b352d] md:text-lg">
            依照你的規劃，網站主軸改為「以課程為中心、專案為關聯、來源資料庫可變」的生成式架構。前端改為可映射不同欄位組合，而不是固定模板欄位。
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#171511]/10 bg-[#fffaf0] p-5">
              <div className="text-xs font-semibold tracking-[0.14em] text-[#7f3f00]">GOAL</div>
              <div className="mt-2 text-lg font-medium">一套 UI 模板生成多門課程網站</div>
            </div>
            <div className="rounded-2xl border border-[#171511]/10 bg-[#f1f8ff] p-5">
              <div className="text-xs font-semibold tracking-[0.14em] text-[#0c4a6e]">SOURCE</div>
              <div className="mt-2 text-lg font-medium">Courses + Projects + SourceDatabaseId</div>
            </div>
            <div className="rounded-2xl border border-[#171511]/10 bg-[#fff3f2] p-5">
              <div className="text-xs font-semibold tracking-[0.14em] text-[#7f1d1d]">STRATEGY</div>
              <div className="mt-2 text-lg font-medium">Schema 掃描 + Normalization + UI Pattern</div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-[#171511]/10 bg-white/85 p-7 backdrop-blur">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold">Notion Schema</h2>
            <p className="mt-2 text-sm text-[#5a5348]">你已完成資料型別，這裡直接對齊 Product 使用欄位。</p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-[#171511]/10 p-4">
                <h3 className="text-sm font-semibold tracking-[0.12em] text-[#7f3f00]">COURSES</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {courseSchema.map((item) => (
                    <span key={item} className="rounded-full bg-[#fff8e6] px-3 py-1 text-xs font-medium text-[#7f3f00]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[#171511]/10 p-4">
                <h3 className="text-sm font-semibold tracking-[0.12em] text-[#0c4a6e]">PROJECTS</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {projectSchema.map((item) => (
                    <span key={item} className="rounded-full bg-[#eef7ff] px-3 py-1 text-xs font-medium text-[#0c4a6e]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-[#171511]/10 bg-white/85 p-7 backdrop-blur">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold">Execution Roadmap</h2>
            <p className="mt-2 text-sm text-[#5a5348]">先做可運行 MVP，再加自動化 skills。</p>
            <ol className="mt-5 space-y-3">
              {roadmap.map((step, index) => (
                <li key={step} className="flex items-start gap-3 rounded-xl border border-[#171511]/10 bg-[#faf9f6] px-4 py-3">
                  <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-[#171511] text-center text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-[#27231b]">{step}</p>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-[#171511]/10 bg-white/85 p-7 backdrop-blur md:p-8">
          <h2 className="font-['Space_Grotesk'] text-2xl font-bold">Schema-Driven Rendering Rules</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#171511]/10 bg-[#f8fafc] p-4">
              <h3 className="text-sm font-semibold tracking-[0.12em] text-[#334155]">AUTO CLASSIFY</h3>
              <p className="mt-2 text-sm text-[#334155]">來源 DB 欄位自動分類：</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {fieldTypes.map((type) => (
                  <span key={type} className="rounded-full bg-white px-3 py-1 text-xs text-[#334155] ring-1 ring-[#334155]/20">
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#171511]/10 bg-[#f8fafc] p-4">
              <h3 className="text-sm font-semibold tracking-[0.12em] text-[#334155]">PATTERN SELECT</h3>
              <p className="mt-2 text-sm text-[#334155]">依欄位組合選擇 UI，無法判斷時 fallback 到 generic cards。</p>
            </div>
            <div className="rounded-2xl border border-[#171511]/10 bg-[#f8fafc] p-4">
              <h3 className="text-sm font-semibold tracking-[0.12em] text-[#334155]">MANUAL OVERRIDE</h3>
              <p className="mt-2 text-sm text-[#334155]">允許 `FieldMapping` / `UiPattern` 介入覆蓋自動判斷。</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#171511]/10 bg-[#171511] p-7 text-[#f8f6f1] md:p-8">
          <h2 className="font-['Space_Grotesk'] text-2xl font-bold">Publishing Guardrails</h2>
          <ul className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <li className="rounded-2xl border border-white/15 bg-white/5 p-4">僅顯示 `Status=published` 內容</li>
            <li className="rounded-2xl border border-white/15 bg-white/5 p-4">缺欄位只拋 warning，不中斷整站</li>
            <li className="rounded-2xl border border-white/15 bg-white/5 p-4">部署成功後回寫 `CourseLink`</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default App;
