
import { Theme1Project, Theme2Project, Student } from '../types';
import { CONFIG } from '../config';

/**
 * Utility to extract text from Notion's complex property types (title, rich_text, url, number, select)
 */
const getPropValue = (prop: any): string => {
  if (!prop) return "";
  const type = prop.type;
  switch (type) {
    case 'title':
      return prop.title?.map((t: any) => t.plain_text).join("") || "";
    case 'rich_text':
      return prop.rich_text?.map((t: any) => t.plain_text).join("") || "";
    case 'multi_select':
      return prop.multi_select?.map((s: any) => s.name).join(",") || "";
    case 'select':
      return prop.select?.name || "";
    case 'url':
      return prop.url || "";
    case 'number':
      return prop.number?.toString() || "";
    case 'files':
      return prop.files?.map((f: any) => f.file?.url || f.external?.url).filter(Boolean).join(",") || "";
    default:
      return "";
  }
};

/**
 * Specifically extract file URLs from a files property
 */
const getFileUrls = (prop: any): string[] => {
  if (!prop || prop.type !== 'files') return [];
  return prop.files?.map((f: any) => f.file?.url || f.external?.url).filter(Boolean) || [];
};

const parseStudents = (ids: string, names: string): Student[] => {
  const idList = (ids || "").split(";;").map(s => s.trim()).filter(Boolean);
  const nameList = (names || "").split(";;").map(s => s.trim()).filter(Boolean);
  
  // Use the longest list as base to ensure no names are skipped
  const maxLength = Math.max(idList.length, nameList.length);
  const students: Student[] = [];
  
  for (let i = 0; i < maxLength; i++) {
    students.push({
      id: idList[i] || `ID-MISSING-${i}`, 
      name: nameList[i] || idList[i] || "Unknown Student"
    });
  }
  
  return students;
};

const parseTags = (tagsRaw: any): string[] => {
  if (!tagsRaw) return [];
  if (tagsRaw.type === 'multi_select') {
    return tagsRaw.multi_select.map((s: any) => s.name);
  }
  const str = getPropValue(tagsRaw);
  return str.split(/[,;]/).map(t => t.trim()).filter(Boolean);
};

const ensureArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.results)) return data.results;
  }
  return [];
};

export const fetchTheme1Projects = async (refresh = false): Promise<Theme1Project[]> => {
  try {
    const url = refresh ? `${CONFIG.API_THEME_1}&t=${Date.now()}` : CONFIG.API_THEME_1;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const rawData = await res.json();
    const records = ensureArray(rawData);
    
    return records.map((record: any) => {
      const props = record.properties || {};
      
      const dataCards: string[][] = Object.keys(props)
        .filter(key => key.toLowerCase().startsWith("datacard"))
        .sort()
        .map(key => getPropValue(props[key]))
        .filter(val => val.length > 0)
        .map(val => val.split(";;").map((s: string) => s.trim()));

      const imageUrls = getFileUrls(props.mainImage);

      return {
        id: record.id || Math.random().toString(),
        name: getPropValue(props.Name) || "Untitled Project",
        year: getPropValue(props.year),
        projectIntro: getPropValue(props.ProjectIntro),
        tags: parseTags(props.Tags),
        group: getPropValue(props.Group),
        students: parseStudents(getPropValue(props.StudentID), getPropValue(props.StudentName)),
        mainImage: imageUrls[0] || "https://picsum.photos/800/600",
        dataCards,
        answer: getPropValue(props.Answer)
      };
    });
  } catch (error) {
    console.error("Error fetching Theme 1:", error);
    return [];
  }
};

export const fetchTheme2Projects = async (refresh = false): Promise<Theme2Project[]> => {
  try {
    const url = refresh ? `${CONFIG.API_THEME_2}&t=${Date.now()}` : CONFIG.API_THEME_2;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const rawData = await res.json();
    const records = ensureArray(rawData);
    
    return records.map((record: any) => {
      const props = record.properties || {};
      const gallery = getFileUrls(props.Gallery);
      const captions = getPropValue(props.Caption).split(";;").map((s: string) => s.trim());

      return {
        id: record.id || Math.random().toString(),
        name: getPropValue(props.Name) || "Untitled Project",
        year: getPropValue(props.Year || props.year),
        projectIntro: getPropValue(props.ProjectIntro),
        tags: parseTags(props.Tag || props.Tags),
        group: getPropValue(props.Group),
        students: parseStudents(getPropValue(props.StudentID), getPropValue(props.StudentName)),
        gallery: gallery.length > 0 ? gallery : ["https://picsum.photos/800/600"],
        captions,
        videoUrl: getPropValue(props.VideoURL)
      };
    });
  } catch (error) {
    console.error("Error fetching Theme 2:", error);
    return [];
  }
};
