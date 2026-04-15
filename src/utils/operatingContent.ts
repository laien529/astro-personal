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
  backgroundColor?: string;
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
