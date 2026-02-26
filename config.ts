
export const CONFIG = {
  COURSE_NAME: "Data-Enabled Creative Design",
  UNIVERSITY: "National Taiwan University of Science and Technology",
  LAB_NAME: "Future Things Lab",
  LAB_URL: "https://future-things-lab.yuutdesign.com/",
  INSTRUCTOR_NAME: "dr. Yu-Ting Cheng",
  INSTRUCTOR_URL: "https://www.yuutdesign.com/",
  COPYRIGHT: "© 2024-present Data-Enabled Creative Design. All projects created by students.",
  API_THEME_1: "https://notion-proxy-pi.vercel.app/api/notion?db=datagallery01",
  API_THEME_2: "https://notion-proxy-pi.vercel.app/api/notion?db=datagallery02",
  
  // Specific distinct colors for the two main Themes
  THEME_STYLES: {
    "Seeing Like a Thing": {
      bg: "bg-zinc-900",
      text: "text-white",
      border: "border-zinc-800",
      accent: "text-zinc-900",
      navActive: "text-black border-black"
    },
    "Everyday Data Tracking": {
      bg: "bg-blue-600",
      text: "text-white",
      border: "border-blue-700",
      accent: "text-blue-600",
      navActive: "text-blue-600 border-blue-600"
    }
  },

  // Diverse color palette for general tags
  TAG_COLORS: [
    { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
    { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
    { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
    { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
    { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" },
    { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-100" },
    { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
    { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
  ]
};

export const getTagStyle = (tag: string) => {
  if (!tag) return CONFIG.TAG_COLORS[0];
  // Specific override for theme-related tags if they appear
  if (tag.includes("Seeing") || tag.includes("主題一")) return { bg: "bg-zinc-900", text: "text-white", border: "border-zinc-900" };
  if (tag.includes("Tracking") || tag.includes("主題二")) return { bg: "bg-blue-600", text: "text-white", border: "border-blue-600" };

  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CONFIG.TAG_COLORS.length;
  return CONFIG.TAG_COLORS[index];
};
