import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

export interface OperatingItem {
  title: string;
  titleEn?: string;
  intro: string;
  introEn?: string;
}

export interface OperatingModule {
  title: string;
  titleEn?: string;
  intro: string;
  introEn?: string;
  backgroundImage?: string;
  items: OperatingItem[];
}

export interface OperatingContent {
  projectName?: string;
  path?: string;
  icon?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  softenBackgroundImage?: boolean;
  titleFontFamily?: string;
  mainTitleFontSize?: string;
  subtitleFontSize?: string;
  moduleTitleFontSize?: string;
  itemTitleFontSize?: string;
  mainTitle: string;
  mainTitleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  intro: string;
  introEn?: string;
  modules: OperatingModule[];
}

export interface OperatingContactLink {
  label: string;
  labelEn?: string;
  href: string;
}

export interface OperatingProjectsConfig {
  defaultProjectPath: string;
  contactLinks?: OperatingContactLink[];
  projects: OperatingContent[];
}

export interface ResolvedOperatingItem extends OperatingItem {
  images: string[];
}

export interface ResolvedOperatingModule extends OperatingModule {
  backgroundImage?: string;
  items: ResolvedOperatingItem[];
}

export interface ResolvedOperatingContent extends OperatingContent {
  modules: ResolvedOperatingModule[];
}

const rootPath = process.cwd();
const projectsConfigPath = join(rootPath, 'content/site-projects.json');
const legacyContentConfigPath = join(rootPath, 'content/site-content.json');
const publicPath = join(rootPath, 'public');
const imageExtensions = new Set(['.avif', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.webp']);
const pinyinBoundaryLocale = 'zh-Hans-CN-u-co-pinyin';
const pinyinInitialBoundaries = [
  { char: '阿', initial: 'A' },
  { char: '芭', initial: 'B' },
  { char: '擦', initial: 'C' },
  { char: '搭', initial: 'D' },
  { char: '蛾', initial: 'E' },
  { char: '发', initial: 'F' },
  { char: '噶', initial: 'G' },
  { char: '哈', initial: 'H' },
  { char: '击', initial: 'J' },
  { char: '喀', initial: 'K' },
  { char: '垃', initial: 'L' },
  { char: '妈', initial: 'M' },
  { char: '拿', initial: 'N' },
  { char: '哦', initial: 'O' },
  { char: '啪', initial: 'P' },
  { char: '期', initial: 'Q' },
  { char: '然', initial: 'R' },
  { char: '撒', initial: 'S' },
  { char: '塌', initial: 'T' },
  { char: '挖', initial: 'W' },
  { char: '昔', initial: 'X' },
  { char: '压', initial: 'Y' },
  { char: '匝', initial: 'Z' }
] as const;
const defaultContactLinks: OperatingContactLink[] = [
  { label: '邮箱', labelEn: 'Email', href: 'mailto:hello@example.com' },
  { label: 'GitHub', href: 'https://github.com/yourname' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/yourname' }
];

function isImageFile(fileName: string) {
  return imageExtensions.has(extname(fileName).toLowerCase());
}

function toPublicPath(folder: string, fileName: string) {
  return `/${folder.replace(/^\/+|\/+$/g, '')}/${fileName}`;
}

function listImages(folder: string, filter?: (fileName: string) => boolean) {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  const absoluteFolder = join(publicPath, cleanFolder);

  if (!existsSync(absoluteFolder)) {
    return [];
  }

  return readdirSync(absoluteFolder)
    .filter((fileName) => isImageFile(fileName))
    .filter((fileName) => (filter ? filter(fileName) : true))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .map((fileName) => toPublicPath(cleanFolder, fileName));
}

export function normalizeProjectPath(input: string) {
  return String(input || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function getProjectFolder(content: OperatingContent) {
  const path = normalizeProjectPath(content.path || content.projectName || content.mainTitle);
  return path ? `user-content/projects/${path}` : 'user-content/projects/project';
}

function moduleFolder(content: OperatingContent, moduleIndex: number) {
  return `${getProjectFolder(content)}/modules/module-${String(moduleIndex + 1).padStart(2, '0')}`;
}

function legacyModuleFolder(moduleIndex: number) {
  return `user-content/modules/module-${String(moduleIndex + 1).padStart(2, '0')}`;
}

function itemFolder(content: OperatingContent, moduleIndex: number, itemIndex: number) {
  return `${moduleFolder(content, moduleIndex)}/item-${String(itemIndex + 1).padStart(2, '0')}`;
}

function legacyItemFolder(moduleIndex: number, itemIndex: number) {
  return `${legacyModuleFolder(moduleIndex)}/item-${String(itemIndex + 1).padStart(2, '0')}`;
}

function getModuleBackground(content: OperatingContent, module: OperatingModule, moduleIndex: number, useLegacyFallback: boolean) {
  if (module.backgroundImage) {
    return module.backgroundImage;
  }

  return listImages(moduleFolder(content, moduleIndex), (fileName) => fileName.startsWith('background.'))[0] ??
    (useLegacyFallback ? listImages(legacyModuleFolder(moduleIndex), (fileName) => fileName.startsWith('background.'))[0] : undefined);
}

function getProjectBackground(content: OperatingContent) {
  if (content.backgroundImage) {
    return content.backgroundImage;
  }

  return listImages(getProjectFolder(content), (fileName) => fileName.startsWith('background.'))[0];
}

function getProjectIcon(content: OperatingContent) {
  if (content.icon) {
    return content.icon;
  }

  return listImages(getProjectFolder(content), (fileName) => fileName.startsWith('icon.'))[0];
}

function getPinyinInitial(char: string) {
  for (let index = pinyinInitialBoundaries.length - 1; index >= 0; index -= 1) {
    const boundary = pinyinInitialBoundaries[index];
    if (char.localeCompare(boundary.char, pinyinBoundaryLocale) >= 0) {
      return boundary.initial;
    }
  }

  return 'A';
}

function getProjectInitial(title: string) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) {
    return 'A';
  }

  for (const char of cleanTitle) {
    if (/[A-Za-z0-9]/.test(char)) {
      return char.toUpperCase();
    }

    if (/\p{Script=Han}/u.test(char)) {
      return getPinyinInitial(char);
    }
  }

  return cleanTitle[0].toUpperCase();
}

function normalizeHexColor(color: string) {
  const cleanColor = String(color || '').trim();
  if (/^#[0-9a-f]{3}$/i.test(cleanColor)) {
    return `#${cleanColor.slice(1).split('').map((char) => char + char).join('')}`;
  }

  if (/^#[0-9a-f]{6}$/i.test(cleanColor)) {
    return cleanColor;
  }

  return '';
}

function getRgbChannels(color: string) {
  const hex = normalizeHexColor(color);
  if (!hex) {
    return null;
  }

  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16)
  };
}

function getProjectIconColors(backgroundColor?: string) {
  const rgb = getRgbChannels(backgroundColor || '');
  if (!rgb) {
    return { background: '#8e8e93', foreground: '#ffffff' };
  }

  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return {
    background: normalizeHexColor(backgroundColor || '') || '#8e8e93',
    foreground: luminance > 0.72 ? '#1d1d1f' : '#ffffff'
  };
}

function getGeneratedProjectIcon(content: OperatingContent) {
  const initial = getProjectInitial(content.mainTitle || content.projectName || 'A');
  const colors = getProjectIconColors(content.backgroundColor);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
    `<rect width="96" height="96" rx="24" fill="${colors.background}"/>`,
    `<text x="48" y="58" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Display','PingFang SC','Helvetica Neue',Arial,sans-serif" font-size="42" font-weight="700" fill="${colors.foreground}">${initial}</text>`,
    '</svg>'
  ].join('');

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getOperatingProjectIcon(content: Pick<OperatingContent, 'icon' | 'backgroundColor' | 'mainTitle' | 'projectName'>) {
  return getProjectIcon(content as OperatingContent) || getGeneratedProjectIcon(content as OperatingContent);
}

function cleanCssValue(value?: string) {
  const cleanValue = String(value || '').trim();
  return cleanValue.replace(/[;{}]/g, '');
}

function cssUrl(value?: string) {
  const cleanValue = String(value || '').trim();
  if (!cleanValue) {
    return '';
  }

  return `url("${cleanValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  const cleanValue = String(value ?? '').trim().toLowerCase();
  return cleanValue === 'true' || cleanValue === '1' || cleanValue === 'yes' || cleanValue === 'on';
}

export function getOperatingProjectCssVars(content: Pick<OperatingContent, 'backgroundColor' | 'backgroundImage' | 'softenBackgroundImage' | 'titleFontFamily' | 'mainTitleFontSize' | 'subtitleFontSize' | 'moduleTitleFontSize' | 'itemTitleFontSize'>) {
  const backgroundColor = cleanCssValue(content.backgroundColor);
  const backgroundImage = cssUrl(content.backgroundImage);
  const softenBackgroundImage = parseBoolean(content.softenBackgroundImage);
  const titleFontFamily = cleanCssValue(content.titleFontFamily);
  const mainTitleFontSize = cleanCssValue(content.mainTitleFontSize);
  const subtitleFontSize = cleanCssValue(content.subtitleFontSize);
  const moduleTitleFontSize = cleanCssValue(content.moduleTitleFontSize);
  const itemTitleFontSize = cleanCssValue(content.itemTitleFontSize);

  return [
    backgroundColor ? `--ops-project-bg: ${backgroundColor};` : '',
    backgroundImage ? `--ops-project-bg-image: ${backgroundImage};` : '',
    backgroundImage
      ? `--ops-project-surface: transparent;`
      : backgroundColor
        ? `--ops-project-surface: ${backgroundColor};`
        : '',
    backgroundImage && softenBackgroundImage ? `--ops-project-bg-filter: blur(14px) saturate(0.82) brightness(1.08);` : '',
    backgroundImage && softenBackgroundImage ? `--ops-project-bg-scale: 1.06;` : '',
    backgroundImage && softenBackgroundImage ? `--ops-project-bg-opacity: 0.72;` : '',
    backgroundImage && softenBackgroundImage ? `--ops-project-bg-overlay: linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.5));` : '',
    titleFontFamily ? `--ops-title-font-family: ${titleFontFamily};` : '',
    mainTitleFontSize ? `--ops-main-title-size: ${mainTitleFontSize};` : '',
    subtitleFontSize ? `--ops-subtitle-size: ${subtitleFontSize};` : '',
    moduleTitleFontSize ? `--ops-module-title-size: ${moduleTitleFontSize};` : '',
    itemTitleFontSize ? `--ops-item-title-size: ${itemTitleFontSize};` : ''
  ].filter(Boolean).join(' ');
}

export function getOperatingBodyStyle(content: Pick<OperatingContent, 'backgroundColor' | 'backgroundImage' | 'softenBackgroundImage' | 'titleFontFamily' | 'mainTitleFontSize' | 'subtitleFontSize' | 'moduleTitleFontSize' | 'itemTitleFontSize'>) {
  const backgroundColor = cleanCssValue(content.backgroundColor) || 'Canvas';
  const cssVars = getOperatingProjectCssVars(content);

  return [
    cssVars,
    `background-color: ${backgroundColor};`
  ].filter(Boolean).join(' ');
}

function emailHref(href: string) {
  const cleanHref = String(href || '').trim();
  if (!cleanHref) {
    return '';
  }

  if (cleanHref.startsWith('mailto:')) {
    return cleanHref;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanHref) ? `mailto:${cleanHref}` : cleanHref;
}

export function getOperatingProjectsConfig(): OperatingProjectsConfig {
  if (existsSync(projectsConfigPath)) {
    const config = JSON.parse(readFileSync(projectsConfigPath, 'utf-8')) as OperatingProjectsConfig;
    return {
      defaultProjectPath: normalizeProjectPath(config.defaultProjectPath || config.projects?.[0]?.path || 'project'),
      contactLinks: Array.isArray(config.contactLinks)
        ? config.contactLinks.map((link) => ({
          label: String(link.label || ''),
          labelEn: link.labelEn ? String(link.labelEn) : undefined,
            href: emailHref(link.href || '')
          }))
        : undefined,
      projects: (config.projects || []).map((project) => ({
        ...project,
        softenBackgroundImage: parseBoolean(project.softenBackgroundImage),
        path: normalizeProjectPath(project.path || project.projectName || project.mainTitle)
      }))
    };
  }

  const legacyContent = JSON.parse(readFileSync(legacyContentConfigPath, 'utf-8')) as OperatingContent;
  const path = normalizeProjectPath(legacyContent.path || legacyContent.projectName || legacyContent.mainTitle || 'project');

  return {
    defaultProjectPath: path,
    contactLinks: defaultContactLinks,
    projects: [
      {
        ...legacyContent,
        projectName: legacyContent.projectName || legacyContent.mainTitle,
        path
      }
    ]
  };
}

export function getOperatingProjectPaths() {
  return getOperatingProjectsConfig().projects.map((project) => project.path).filter(Boolean) as string[];
}

export function getOperatingContactLinks(fallback: OperatingContactLink[] = defaultContactLinks) {
  const configuredLinks = getOperatingProjectsConfig().contactLinks?.filter((link) => link.label && link.href) ?? [];
  return configuredLinks.length > 0 ? configuredLinks : fallback;
}

export function getOperatingContent(projectPath?: string): ResolvedOperatingContent {
  const config = getOperatingProjectsConfig();
  const normalizedPath = normalizeProjectPath(projectPath || config.defaultProjectPath);
  const content =
    config.projects.find((project) => project.path === normalizedPath) ??
    config.projects.find((project) => project.path === config.defaultProjectPath) ??
    config.projects[0];

  if (!content) {
    throw new Error('No operating project is configured.');
  }

  const useLegacyFallback = config.projects[0]?.path === content.path;

  return {
    ...content,
    path: normalizeProjectPath(content.path || content.projectName || content.mainTitle),
    icon: getOperatingProjectIcon(content),
    backgroundImage: getProjectBackground(content),
    softenBackgroundImage: parseBoolean(content.softenBackgroundImage),
    modules: content.modules.map((module, moduleIndex) => ({
      ...module,
      backgroundImage: getModuleBackground(content, module, moduleIndex, useLegacyFallback),
      items: module.items.map((item, itemIndex) => ({
        ...item,
        images:
          listImages(itemFolder(content, moduleIndex, itemIndex)).length > 0
            ? listImages(itemFolder(content, moduleIndex, itemIndex))
            : useLegacyFallback
              ? listImages(legacyItemFolder(moduleIndex, itemIndex))
              : []
      }))
    }))
  };
}
