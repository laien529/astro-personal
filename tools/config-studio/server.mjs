import { createServer } from 'node:http';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const projectsConfigPath = join(rootDir, 'content/site-projects.json');
const legacyContentPath = join(rootDir, 'content/site-content.json');
const publicDir = join(rootDir, 'public');
const userContentDir = join(publicDir, 'user-content');
const projectContentDir = join(userContentDir, 'projects');
const port = Number(process.env.CONFIG_STUDIO_PORT || process.env.PORT || 8787);
const host = process.env.CONFIG_STUDIO_HOST || '127.0.0.1';
const previewOrigin = process.env.SITE_PREVIEW_ORIGIN || 'http://localhost:4321';
const imageExtensions = new Set(['.avif', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.webp']);
const reservedPaths = new Set(['about', 'contact', 'projects']);
const defaultContactLinks = [
  { label: '邮箱', labelEn: 'Email', href: 'mailto:hello@example.com' },
  { label: 'GitHub', labelEn: 'GitHub', href: 'https://github.com/yourname' },
  { label: 'LinkedIn', labelEn: 'LinkedIn', href: 'https://www.linkedin.com/in/yourname' }
];

function padIndex(index) {
  return String(index + 1).padStart(2, '0');
}

function normalizeProjectPath(input) {
  return String(input || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function projectDir(project) {
  return join(projectContentDir, normalizeProjectPath(project.path));
}

function moduleDir(project, moduleIndex) {
  return join(projectDir(project), 'modules', `module-${padIndex(moduleIndex)}`);
}

function itemDir(project, moduleIndex, itemIndex) {
  return join(moduleDir(project, moduleIndex), `item-${padIndex(itemIndex)}`);
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function isImageFile(fileName) {
  return imageExtensions.has(extname(fileName).toLowerCase());
}

function toPublicPath(absolutePath) {
  return `/${absolutePath.slice(publicDir.length + 1).replaceAll('\\', '/')}`;
}

function safeUserContentPath(publicPath) {
  if (typeof publicPath !== 'string' || !publicPath.startsWith('/user-content/')) {
    throw new Error('Only files under /user-content/ can be changed.');
  }

  const absolutePath = normalize(join(publicDir, publicPath));
  const allowedRoot = normalize(userContentDir);

  if (!absolutePath.startsWith(allowedRoot)) {
    throw new Error('Invalid file path.');
  }

  return absolutePath;
}

function listImages(folder) {
  if (!existsSync(folder)) {
    return [];
  }

  return readdirSync(folder)
    .filter((fileName) => isImageFile(fileName))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .map((fileName) => toPublicPath(join(folder, fileName)));
}

function normalizeContactLinks(links) {
  return (Array.isArray(links) ? links : defaultContactLinks)
    .map((link) => ({
      label: String(link?.label ?? ''),
      labelEn: String(link?.labelEn ?? ''),
      href: normalizeContactHref(link)
    }))
    .filter((link) => link.label || link.href);
}

function stripMailto(value) {
  return String(value || '').trim().replace(/^mailto:/i, '');
}

function normalizeContactHref(link) {
  const label = String(link?.label ?? '');
  const href = stripMailto(link?.href);
  if (!href) {
    return '';
  }

  const looksLikeEmail = label.includes('邮箱') || /email/i.test(label) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href);
  if (looksLikeEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href)) {
    return `mailto:${href}`;
  }

  return String(link?.href ?? '').trim();
}

function legacyConfig() {
  const content = JSON.parse(readFileSync(legacyContentPath, 'utf-8'));
  const path = normalizeProjectPath(content.path || content.projectName || content.mainTitle || 'project');

  return {
    defaultProjectPath: path,
    contactLinks: defaultContactLinks,
    projects: [
      {
        projectName: content.projectName || content.mainTitle || 'Project',
        path,
        icon: content.icon || '',
        backgroundColor: content.backgroundColor || '',
        backgroundImage: content.backgroundImage || '',
        softenBackgroundImage: Boolean(content.softenBackgroundImage),
        titleFontFamily: content.titleFontFamily || '',
        mainTitleFontSize: content.mainTitleFontSize || '',
        subtitleFontSize: content.subtitleFontSize || '',
        moduleTitleFontSize: content.moduleTitleFontSize || '',
        itemTitleFontSize: content.itemTitleFontSize || '',
        mainTitle: content.mainTitle || '',
        mainTitleEn: content.mainTitleEn || '',
        subtitle: content.subtitle || '',
        subtitleEn: content.subtitleEn || '',
        intro: content.intro || '',
        introEn: content.introEn || '',
        modules: Array.isArray(content.modules) ? content.modules : []
      }
    ]
  };
}

function readConfig() {
  if (existsSync(projectsConfigPath)) {
    return validateConfig(JSON.parse(readFileSync(projectsConfigPath, 'utf-8')));
  }

  return validateConfig(legacyConfig());
}

function writeConfig(config) {
  const validConfig = validateConfig(config);
  writeFileSync(projectsConfigPath, `${JSON.stringify(validConfig, null, 2)}\n`);
}

function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must be an object.');
  }

  const rawProjects = Array.isArray(config.projects) ? config.projects : [];
  if (rawProjects.length === 0) {
    throw new Error('At least one project is required.');
  }

  const usedPaths = new Set();
  const projects = rawProjects.map((project, index) => {
    const fallbackPath = `project-${padIndex(index)}`;
    let path = normalizeProjectPath(project?.path || project?.projectName || project?.mainTitle || fallbackPath);

    if (!path) {
      path = fallbackPath;
    }

    if (reservedPaths.has(path)) {
      throw new Error(`Project path "${path}" conflicts with an existing route.`);
    }

    if (usedPaths.has(path)) {
      throw new Error(`Project path "${path}" is duplicated.`);
    }
    usedPaths.add(path);

    const modules = Array.isArray(project?.modules) ? project.modules : [];

    return {
      projectName: String(project?.projectName || project?.mainTitle || `Project ${index + 1}`),
      path,
      icon: String(project?.icon ?? ''),
      backgroundColor: String(project?.backgroundColor ?? ''),
      backgroundImage: String(project?.backgroundImage ?? ''),
      softenBackgroundImage:
        project?.softenBackgroundImage === true ||
        String(project?.softenBackgroundImage ?? '').trim().toLowerCase() === 'true',
      titleFontFamily: String(project?.titleFontFamily ?? ''),
      mainTitleFontSize: String(project?.mainTitleFontSize ?? ''),
      subtitleFontSize: String(project?.subtitleFontSize ?? ''),
      moduleTitleFontSize: String(project?.moduleTitleFontSize ?? ''),
      itemTitleFontSize: String(project?.itemTitleFontSize ?? ''),
      mainTitle: String(project?.mainTitle ?? ''),
      mainTitleEn: String(project?.mainTitleEn ?? ''),
      subtitle: String(project?.subtitle ?? ''),
      subtitleEn: String(project?.subtitleEn ?? ''),
      intro: String(project?.intro ?? ''),
      introEn: String(project?.introEn ?? ''),
      modules: modules.map((module) => ({
        title: String(module?.title ?? ''),
        titleEn: String(module?.titleEn ?? ''),
        intro: String(module?.intro ?? ''),
        introEn: String(module?.introEn ?? ''),
        backgroundImage: module?.backgroundImage ? String(module.backgroundImage) : '',
        items: (Array.isArray(module?.items) ? module.items : []).map((item) => ({
          title: String(item?.title ?? ''),
          titleEn: String(item?.titleEn ?? ''),
          intro: String(item?.intro ?? ''),
          introEn: String(item?.introEn ?? '')
        }))
      }))
    };
  });

  const defaultProjectPath = normalizeProjectPath(config.defaultProjectPath || projects[0].path);

  return {
    defaultProjectPath: projects.some((project) => project.path === defaultProjectPath) ? defaultProjectPath : projects[0].path,
    contactLinks: normalizeContactLinks(config.contactLinks),
    projects
  };
}

function ensureContentFolders(config) {
  ensureDir(projectContentDir);
  config.projects.forEach((project) => {
    ensureDir(projectDir(project));
    project.modules.forEach((module, moduleIndex) => {
      ensureDir(moduleDir(project, moduleIndex));
      module.items.forEach((_, itemIndex) => ensureDir(itemDir(project, moduleIndex, itemIndex)));
    });
  });
}

function legacyModuleDir(moduleIndex) {
  return join(userContentDir, 'modules', `module-${padIndex(moduleIndex)}`);
}

function legacyItemDir(moduleIndex, itemIndex) {
  return join(legacyModuleDir(moduleIndex), `item-${padIndex(itemIndex)}`);
}

function getManifest(config = readConfig()) {
  ensureContentFolders(config);

  return {
    projects: config.projects.map((project, projectIndex) => ({
      backgroundRoot: toPublicPath(projectDir(project)),
      iconImages: listImages(projectDir(project)).filter((path) => path.includes('/icon.')),
      backgroundImages: listImages(projectDir(project)).filter((path) => path.includes('/background.')),
      modules: project.modules.map((module, moduleIndex) => {
        const backgroundImages = listImages(moduleDir(project, moduleIndex)).filter((path) => path.includes('/background.'));

        return {
          backgroundImages:
            backgroundImages.length > 0 || projectIndex !== 0
              ? backgroundImages
              : listImages(legacyModuleDir(moduleIndex)).filter((path) => path.includes('/background.')),
          items: module.items.map((_, itemIndex) => {
            const images = listImages(itemDir(project, moduleIndex, itemIndex));

            return {
              images:
                images.length > 0 || projectIndex !== 0
                  ? images
                  : listImages(legacyItemDir(moduleIndex, itemIndex))
            };
          })
        };
      })
    }))
  };
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 60 * 1024 * 1024) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });

    request.on('error', reject);
  });
}

function sendJson(response, data, status = 200) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(JSON.stringify(data));
}

function sendHtml(response, html) {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(html);
}

function contentType(filePath) {
  const extension = extname(filePath).toLowerCase();
  const types = {
    '.avif': 'image/avif',
    '.gif': 'image/gif',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
  };

  return types[extension] || 'application/octet-stream';
}

function sendPublicFile(response, publicPath, method = 'GET') {
  const absolutePath = normalize(join(publicDir, publicPath));
  const allowedRoot = normalize(publicDir);

  if (!absolutePath.startsWith(allowedRoot) || !existsSync(absolutePath)) {
    sendError(response, new Error('Not found.'), 404);
    return;
  }

  response.writeHead(200, {
    'content-type': contentType(absolutePath),
    'cache-control': 'no-store'
  });
  if (method === 'HEAD') {
    response.end();
    return;
  }
  response.end(readFileSync(absolutePath));
}

function sendError(response, error, status = 400) {
  sendJson(response, { ok: false, error: error.message || String(error) }, status);
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) {
    throw new Error('Upload data is invalid.');
  }

  return {
    mime: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
}

function extensionFromUpload(fileName, mime) {
  const fromName = extname(fileName || '').toLowerCase();
  if (imageExtensions.has(fromName)) {
    return fromName;
  }

  const map = {
    'image/avif': '.avif',
    'image/gif': '.gif',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/svg+xml': '.svg',
    'image/webp': '.webp'
  };

  return map[mime] || '.jpg';
}

function nextImageName(folder, extension) {
  const nextNumber = listImages(folder).length + 1;
  return `${String(nextNumber).padStart(2, '0')}${extension}`;
}

function uploadImage(payload) {
  const config = readConfig();
  const projectIndex = Number(payload.projectIndex);
  const moduleIndex = Number(payload.moduleIndex);
  const itemIndex = Number(payload.itemIndex);
  const project = config.projects[projectIndex];
  const { mime, buffer } = parseDataUrl(payload.dataUrl);
  const extension = extensionFromUpload(payload.fileName, mime);

  if (!project) {
    throw new Error('Invalid project index.');
  }

  if (payload.kind === 'projectIcon') {
    const folder = projectDir(project);
    ensureDir(folder);
    listImages(folder)
      .filter((path) => path.includes('/icon.'))
      .forEach((path) => rmSync(safeUserContentPath(path), { force: true }));

    const outputPath = join(folder, `icon${extension}`);
    writeFileSync(outputPath, buffer);
    project.icon = toPublicPath(outputPath);
    writeConfig(config);

    const nextConfig = readConfig();
    return { path: toPublicPath(outputPath), config: nextConfig, manifest: getManifest(nextConfig) };
  }

  if (payload.kind === 'projectBackground') {
    const folder = projectDir(project);
    ensureDir(folder);
    listImages(folder)
      .filter((path) => path.includes('/background.'))
      .forEach((path) => rmSync(safeUserContentPath(path), { force: true }));

    const outputPath = join(folder, `background${extension}`);
    writeFileSync(outputPath, buffer);
    project.backgroundImage = toPublicPath(outputPath);
    writeConfig(config);

    const nextConfig = readConfig();
    return { path: toPublicPath(outputPath), config: nextConfig, manifest: getManifest(nextConfig) };
  }

  if (!Number.isInteger(moduleIndex) || moduleIndex < 0 || moduleIndex >= project.modules.length) {
    throw new Error('Invalid module index.');
  }

  if (payload.kind === 'moduleBackground') {
    const folder = moduleDir(project, moduleIndex);
    ensureDir(folder);
    listImages(folder)
      .filter((path) => path.includes('/background.'))
      .forEach((path) => rmSync(safeUserContentPath(path), { force: true }));

    const outputPath = join(folder, `background${extension}`);
    writeFileSync(outputPath, buffer);
    project.modules[moduleIndex].backgroundImage = toPublicPath(outputPath);
    writeConfig(config);

    const nextConfig = readConfig();
    return { path: toPublicPath(outputPath), config: nextConfig, manifest: getManifest(nextConfig) };
  }

  if (payload.kind === 'itemImage') {
    if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= project.modules[moduleIndex].items.length) {
      throw new Error('Invalid item index.');
    }

    const folder = itemDir(project, moduleIndex, itemIndex);
    ensureDir(folder);
    const outputPath = join(folder, nextImageName(folder, extension));
    writeFileSync(outputPath, buffer);

    return { path: toPublicPath(outputPath), config, manifest: getManifest(config) };
  }

  throw new Error('Invalid upload kind.');
}

function deleteImage(payload) {
  const config = readConfig();
  const path = String(payload.path || '');
  rmSync(safeUserContentPath(path), { force: true });

  config.projects.forEach((project) => {
    if (project.icon === path) {
      project.icon = '';
    }

    if (project.backgroundImage === path) {
      project.backgroundImage = '';
    }

    project.modules.forEach((module) => {
      if (module.backgroundImage === path) {
        module.backgroundImage = '';
      }
    });
  });

  writeConfig(config);
  const nextConfig = readConfig();
  return { config: nextConfig, manifest: getManifest(nextConfig) };
}

function runBuild() {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'build'], { cwd: rootDir, shell: false });
    let output = '';

    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });

    child.on('close', (code) => {
      resolve({ ok: code === 0, code, output: output.slice(-60000) });
    });
  });
}

function compactTranslateSource(config) {
  return {
    contactLinks: config.contactLinks.map((link) => ({ label: link.label })),
    projects: config.projects.map((project) => ({
      projectName: project.projectName,
      mainTitle: project.mainTitle,
      subtitle: project.subtitle,
      intro: project.intro,
      modules: project.modules.map((module) => ({
        title: module.title,
        intro: module.intro,
        items: module.items.map((item) => ({
          title: item.title,
          intro: item.intro
        }))
      }))
    }))
  };
}

function stripJsonFence(value) {
  return String(value || '')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function readModelText(data) {
  if (typeof data?.output_text === 'string') {
    return data.output_text;
  }

  const choiceText = data?.choices?.[0]?.message?.content;
  if (typeof choiceText === 'string') {
    return choiceText;
  }

  if (Array.isArray(choiceText)) {
    return choiceText.map((part) => part.text || '').join('');
  }

  throw new Error('Translation response does not contain text.');
}

function mergeEnglishFields(config, translated) {
  const nextConfig = JSON.parse(JSON.stringify(config));

  translated.contactLinks?.forEach((link, index) => {
    if (nextConfig.contactLinks[index] && link?.labelEn) {
      nextConfig.contactLinks[index].labelEn = String(link.labelEn);
    }
  });

  translated.projects?.forEach((project, projectIndex) => {
    const nextProject = nextConfig.projects[projectIndex];
    if (!nextProject) return;
    if (project?.mainTitleEn) nextProject.mainTitleEn = String(project.mainTitleEn);
    if (project?.subtitleEn) nextProject.subtitleEn = String(project.subtitleEn);
    if (project?.introEn) nextProject.introEn = String(project.introEn);

    project?.modules?.forEach((module, moduleIndex) => {
      const nextModule = nextProject.modules[moduleIndex];
      if (!nextModule) return;
      if (module?.titleEn) nextModule.titleEn = String(module.titleEn);
      if (module?.introEn) nextModule.introEn = String(module.introEn);

      module?.items?.forEach((item, itemIndex) => {
        const nextItem = nextModule.items[itemIndex];
        if (!nextItem) return;
        if (item?.titleEn) nextItem.titleEn = String(item.titleEn);
        if (item?.introEn) nextItem.introEn = String(item.introEn);
      });
    });
  });

  return validateConfig(nextConfig);
}

async function generateEnglishDraft(payload) {
  const endpoint = process.env.TRANSLATE_API_URL;
  const apiKey = process.env.TRANSLATE_API_KEY;
  const model = process.env.TRANSLATE_MODEL;

  if (!endpoint || !apiKey || !model) {
    throw new Error('自动生成英文需要先配置 TRANSLATE_API_URL、TRANSLATE_API_KEY、TRANSLATE_MODEL。当前已支持手动填写英文文案。');
  }

  const config = validateConfig(payload.config);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'Translate Chinese or mixed-language website configuration text into natural English. Return JSON only. Preserve array order and do not add markdown.'
        },
        {
          role: 'user',
          content:
            'Return this shape with English fields only: { "contactLinks": [{ "labelEn": "" }], "projects": [{ "mainTitleEn": "", "subtitleEn": "", "introEn": "", "modules": [{ "titleEn": "", "introEn": "", "items": [{ "titleEn": "", "introEn": "" }] }] }] }. Source JSON: ' +
            JSON.stringify(compactTranslateSource(config))
        }
      ]
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || '英文生成服务请求失败。');
  }

  const translated = JSON.parse(stripJsonFence(readModelText(data)));
  return mergeEnglishFields(config, translated);
}

const page = String.raw`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Project 配置台</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f5f7;
        --panel: #ffffff;
        --text: #1d1d1f;
        --muted: #6e6e73;
        --line: rgba(0, 0, 0, 0.1);
        --blue: #0071e3;
        --blue-dark: #0066cc;
        --danger: #c9342f;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
        color: var(--text);
        background: var(--bg);
      }
      button, input, textarea { font: inherit; }
      .topbar {
        position: sticky;
        top: 0;
        z-index: 10;
        border-bottom: 1px solid var(--line);
        background: rgba(251, 251, 253, 0.86);
        backdrop-filter: blur(18px);
      }
      .topbar-inner {
        width: min(1180px, calc(100% - 32px));
        min-height: 56px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .brand { font-weight: 700; }
      .actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
      .contact-list { display: grid; gap: 12px; }
      .contact-row { display: grid; grid-template-columns: 1fr 1fr 1.4fr auto; gap: 10px; align-items: end; }
      .shell { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 56px; }
      .hero { display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: end; margin-bottom: 20px; }
      h1 { margin: 0 0 8px; font-size: clamp(32px, 5vw, 56px); line-height: 1.05; }
      .hint, .status, .small { color: var(--muted); }
      .status { min-height: 20px; font-size: 14px; }
      .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 20px; }
      .grid { display: grid; gap: 16px; }
      .field { display: grid; gap: 8px; }
      label { font-size: 13px; color: var(--muted); }
      input[type="text"], textarea, select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 12px 14px;
        color: var(--text);
        background: #fff;
        outline: none;
      }
      textarea { min-height: 92px; resize: vertical; }
      input:focus, textarea:focus, select:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.14); }
      .button { border: 0; border-radius: 999px; padding: 10px 16px; color: #fff; background: var(--blue); cursor: pointer; }
      .button:hover { background: var(--blue-dark); }
      .button.secondary { color: var(--blue); background: transparent; }
      .button.ghost { color: var(--text); background: rgba(0, 0, 0, 0.06); }
      .button.danger { color: var(--danger); background: rgba(201, 52, 47, 0.08); }
      .project-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
      .project-tab { color: var(--text); background: #fff; border: 1px solid var(--line); }
      .project-tab.active { color: #fff; background: var(--blue); border-color: var(--blue); }
      .module { margin-top: 18px; }
      .module-head, .item-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
      .module-title, .item-title { margin: 0; }
      .module-title { font-size: 24px; }
      .item-title { font-size: 18px; }
      .split { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 16px; }
      .preview { display: grid; gap: 10px; align-content: start; }
      .preview img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 14px; border: 1px solid var(--line); background: #f5f5f7; }
      .visual-settings { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr); gap: 16px; align-items: start; }
      .type-controls { display: grid; gap: 16px; }
      .type-preview {
        display: grid;
        gap: 12px;
        min-height: 100%;
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 18px;
        background: linear-gradient(180deg, #fff, #f7f7f8);
        overflow: hidden;
      }
      .type-preview-label {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
      }
      .type-preview-main,
      .type-preview-subtitle,
      .type-preview-module,
      .type-preview-item {
        margin: 0;
        line-height: 1.05;
        word-break: break-word;
      }
      .type-preview-subtitle { color: var(--muted); }
      .type-preview-module { margin-top: 8px; }
      .type-preview-item { color: #3a3a3c; }
      .file { display: block; width: 100%; border: 1px dashed var(--line); border-radius: 12px; padding: 12px; background: #fafafa; }
      .items { display: grid; gap: 14px; margin-top: 16px; }
      .item { border: 1px solid var(--line); border-radius: 16px; padding: 16px; background: #fbfbfd; }
      .item-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 16px; }
      .images { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; }
      .image-tile { position: relative; }
      .image-tile img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; border: 1px solid var(--line); background: #fff; }
      .image-tile button { position: absolute; top: 5px; right: 5px; border: 0; border-radius: 999px; color: #fff; background: rgba(0, 0, 0, 0.56); cursor: pointer; }
      .image-tile .download {
        position: absolute;
        left: 5px;
        bottom: 5px;
        display: inline-grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 999px;
        color: #fff;
        background: rgba(0, 0, 0, 0.56);
        text-decoration: none;
      }
      .download-link {
        display: inline-flex;
        justify-content: center;
        border-radius: 999px;
        padding: 8px 12px;
        color: var(--blue);
        background: rgba(0, 113, 227, 0.08);
        text-decoration: none;
      }
      .empty { border: 1px dashed var(--line); border-radius: 12px; padding: 18px; text-align: center; color: var(--muted); background: #fff; }
      pre { white-space: pre-wrap; max-height: 320px; overflow: auto; border-radius: 14px; padding: 14px; background: #111; color: #eee; }
      @media (max-width: 860px) {
        .hero, .split, .item-grid, .contact-row, .visual-settings { grid-template-columns: 1fr; }
        .topbar-inner { align-items: flex-start; flex-direction: column; padding: 12px 0; }
        .actions { justify-content: flex-start; }
      }
    </style>
  </head>
  <body>
    <header class="topbar">
      <div class="topbar-inner">
        <div>
          <div class="brand">Project 配置台</div>
          <div class="status" id="status">正在加载...</div>
        </div>
        <div class="actions">
          <button class="button ghost" id="reload">重新加载</button>
          <button class="button secondary" id="addProject">新增 Project</button>
          <button class="button secondary" id="addModule">新增模块</button>
          <button class="button secondary" id="translate">生成英文草稿</button>
          <button class="button" id="save">保存配置</button>
          <button class="button ghost" id="build">构建站点</button>
        </div>
      </div>
    </header>
    <main class="shell">
      <section class="hero">
        <div>
          <h1>多 Project 可视化配置</h1>
          <p class="hint">每个 project 都有自己的 path。访问地址是 /path，例如 http://localhost:4321/chengkeying。</p>
        </div>
      </section>
      <div id="app"></div>
      <section class="panel" style="margin-top: 18px;">
        <h2 style="margin-top: 0;">构建日志</h2>
        <pre id="log">尚未执行构建。</pre>
      </section>
    </main>
    <script>
      let config = null;
      let manifest = null;
      let activeProjectIndex = 0;
      const previewOrigin = '__PREVIEW_ORIGIN__';
      const app = document.getElementById('app');
      const statusEl = document.getElementById('status');
      const logEl = document.getElementById('log');

      function setStatus(message) { statusEl.textContent = message; }
      function activeProject() { return config.projects[activeProjectIndex]; }
      function activeManifest() { return manifest.projects[activeProjectIndex] || { iconImages: [], backgroundImages: [], modules: [] }; }
      function normalizePath(value) {
        return String(value || '').trim().replace(/^\/+|\/+$/g, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
      }
      function stripMailto(value) {
        return String(value || '').trim().replace(/^mailto:/i, '');
      }
      function isEmailContact(link) {
        const href = stripMailto(link.href);
        const value = String((link.label || '') + ' ' + (link.labelEn || '') + ' ' + href).toLowerCase();
        return value.includes('邮箱') || value.includes('email') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href);
      }
      function displayContactHref(link) {
        return isEmailContact(link) ? stripMailto(link.href) : String(link.href || '');
      }
      function normalizeContactHrefForEditor(link) {
        const href = stripMailto(link.href);
        if (isEmailContact({ ...link, href }) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href)) {
          return 'mailto:' + href;
        }
        return href;
      }
      function escapeHtml(value) {
        return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
      }
      const fontPresets = [
        { label: '跟随当前风格', value: '', note: '使用当前 style 默认字体。' },
        { label: '苹果官网感', value: '"SF Pro Display", "PingFang SC", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif', note: '干净、现代，适合产品展示。' },
        { label: '中文黑体稳重', value: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif', note: '清晰稳重，适合中文内容。' },
        { label: '杂志宋体感', value: '"Songti SC", "Noto Serif CJK SC", "Times New Roman", serif', note: '更像杂志标题，有文艺感。' },
        { label: '圆润亲和', value: '"Arial Rounded MT Bold", "PingFang SC", "Microsoft YaHei", sans-serif', note: '更柔和，适合生活方式项目。' }
      ];
      const sizePresets = {
        mainTitleFontSize: [
          { label: '跟随当前风格', value: '', note: '使用当前 style 默认主标题大小。' },
          { label: '标准', value: 'clamp(3.5rem, 7vw, 6rem)', note: '适合大多数项目首页。' },
          { label: '大', value: 'clamp(4.5rem, 9vw, 8rem)', note: '更接近苹果首页的大标题。' },
          { label: '超大', value: 'clamp(5.5rem, 11vw, 9.5rem)', note: '强视觉冲击，适合标题较短时使用。' }
        ],
        subtitleFontSize: [
          { label: '跟随当前风格', value: '', note: '使用当前 style 默认副标题大小。' },
          { label: '小', value: '16px', note: '克制、轻量。' },
          { label: '标准', value: 'clamp(1rem, 1.4vw, 1.2rem)', note: '常规说明文字大小。' },
          { label: '大', value: 'clamp(1.05rem, 1.6vw, 1.35rem)', note: '当前推荐值，醒目但不抢标题。' }
        ],
        moduleTitleFontSize: [
          { label: '跟随当前风格', value: '', note: '使用当前 style 默认模块标题大小。' },
          { label: '标准', value: 'clamp(2.7rem, 5vw, 4.5rem)', note: '适合常规模块。' },
          { label: '大', value: 'clamp(3.2rem, 5.8vw, 5.2rem)', note: '模块标题更像产品页标题。' },
          { label: '超大', value: 'clamp(3.8rem, 7vw, 6rem)', note: '适合模块很少、想强化视觉节奏。' }
        ],
        itemTitleFontSize: [
          { label: '跟随当前风格', value: '', note: '使用当前 style 默认卡片标题大小。' },
          { label: '标准', value: 'clamp(1.3rem, 2.3vw, 2.35rem)', note: '适合卡片内容较多时。' },
          { label: '大', value: 'clamp(1.55rem, 2.7vw, 2.65rem)', note: '当前推荐值，卡片标题更突出。' },
          { label: '超大', value: 'clamp(1.8rem, 3.2vw, 3rem)', note: '适合标题短、图片主导的卡片。' }
        ]
      };
      const previewFallbacks = {
        titleFontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", Arial, sans-serif',
        mainTitleFontSize: '64px',
        subtitleFontSize: '18px',
        moduleTitleFontSize: '44px',
        itemTitleFontSize: '28px'
      };
      function cleanCssValue(value) {
        return String(value || '').replace(/[;{}]/g, '').trim();
      }
      function selectedPreset(options, value) {
        return options.find((option) => option.value === String(value || '')) || { label: '当前自定义', value: String(value || ''), note: '这是已有配置值；重新选择后会保存为预设。' };
      }
      function renderPresetSelect(field, label, options, value) {
        const selected = selectedPreset(options, value);
        const list = options.some((option) => option.value === String(value || '')) ? options : [selected, ...options];
        return [
          '<div class="field">',
          '<label>' + escapeHtml(label) + '</label>',
          '<select data-scope="project" data-field="' + escapeHtml(field) + '">',
          list.map((option) => '<option value="' + escapeHtml(option.value) + '"' + (option.value === String(value || '') ? ' selected' : '') + '>' + escapeHtml(option.label) + '</option>').join(''),
          '</select>',
          '<div class="small" data-preset-note="' + escapeHtml(field) + '">' + escapeHtml(selected.note) + '</div>',
          '</div>'
        ].join('');
      }
      function projectPreviewStyles(project) {
        return {
          titleFontFamily: cleanCssValue(project.titleFontFamily) || previewFallbacks.titleFontFamily,
          mainTitleFontSize: cleanCssValue(project.mainTitleFontSize) || previewFallbacks.mainTitleFontSize,
          subtitleFontSize: cleanCssValue(project.subtitleFontSize) || previewFallbacks.subtitleFontSize,
          moduleTitleFontSize: cleanCssValue(project.moduleTitleFontSize) || previewFallbacks.moduleTitleFontSize,
          itemTitleFontSize: cleanCssValue(project.itemTitleFontSize) || previewFallbacks.itemTitleFontSize
        };
      }
      function renderTypographyPreview(project) {
        const styles = projectPreviewStyles(project);
        return [
          '<div class="type-preview" data-type-preview style="font-family: ' + escapeHtml(styles.titleFontFamily) + ';">',
          '<p class="type-preview-label">字体 / 字号实时预览</p>',
          '<p class="type-preview-subtitle" data-preview-subtitle style="font-size: ' + escapeHtml(styles.subtitleFontSize) + ';">' + escapeHtml(project.subtitle || '副标题示例') + '</p>',
          '<p class="type-preview-main" data-preview-main style="font-size: ' + escapeHtml(styles.mainTitleFontSize) + ';">' + escapeHtml(project.mainTitle || '主标题示例') + '</p>',
          '<p class="type-preview-module" data-preview-module style="font-size: ' + escapeHtml(styles.moduleTitleFontSize) + ';">模块标题示例</p>',
          '<p class="type-preview-item" data-preview-item style="font-size: ' + escapeHtml(styles.itemTitleFontSize) + ';">滚动卡片标题示例</p>',
          '</div>'
        ].join('');
      }
      function refreshTypographyPreview() {
        const project = activeProject();
        const preview = app.querySelector('[data-type-preview]');
        if (!project || !preview) return;
        const styles = projectPreviewStyles(project);
        preview.style.fontFamily = styles.titleFontFamily;
        const subtitle = preview.querySelector('[data-preview-subtitle]');
        const main = preview.querySelector('[data-preview-main]');
        const moduleTitle = preview.querySelector('[data-preview-module]');
        const itemTitle = preview.querySelector('[data-preview-item]');
        if (subtitle) {
          subtitle.textContent = project.subtitle || '副标题示例';
          subtitle.style.fontSize = styles.subtitleFontSize;
        }
        if (main) {
          main.textContent = project.mainTitle || '主标题示例';
          main.style.fontSize = styles.mainTitleFontSize;
        }
        if (moduleTitle) moduleTitle.style.fontSize = styles.moduleTitleFontSize;
        if (itemTitle) itemTitle.style.fontSize = styles.itemTitleFontSize;
        app.querySelectorAll('[data-preset-note]').forEach((note) => {
          const field = note.dataset.presetNote;
          const options = field === 'titleFontFamily' ? fontPresets : sizePresets[field];
          if (!options) return;
          note.textContent = selectedPreset(options, project[field]).note;
        });
      }
      async function api(path, options = {}) {
        const response = await fetch(path, { headers: { 'content-type': 'application/json' }, ...options });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || '请求失败');
        return data;
      }
      function syncInput(target) {
        const { scope, moduleIndex, itemIndex, contactIndex, field } = target.dataset;
        if (scope === 'config') config[field] = target.value;
        if (scope === 'contact') {
          const contact = config.contactLinks[Number(contactIndex)];
          contact[field] = target.value;
          contact.href = normalizeContactHrefForEditor(contact);
        }
        if (scope === 'project') {
          activeProject()[field] =
            field === 'path'
              ? normalizePath(target.value)
              : field === 'softenBackgroundImage'
                ? target.value === 'true'
                : target.value;
          if (field === 'projectName' && !activeProject().mainTitle) activeProject().mainTitle = target.value;
        }
        if (scope === 'module') activeProject().modules[Number(moduleIndex)][field] = target.value;
        if (scope === 'item') activeProject().modules[Number(moduleIndex)].items[Number(itemIndex)][field] = target.value;
      }
      function render() {
        if (!config.projects.length) {
          config.projects.push(newProject());
          activeProjectIndex = 0;
        }
        if (!Array.isArray(config.contactLinks)) config.contactLinks = [];
        if (activeProjectIndex >= config.projects.length) activeProjectIndex = 0;
        const project = activeProject();
        const projectManifest = activeManifest();
        const projectIcon = project.icon || projectManifest.iconImages?.[0] || '';
        const projectBackground = project.backgroundImage || projectManifest.backgroundImages?.[0] || '';
        const projectUrl = '/' + project.path;
        const absoluteProjectUrl = previewOrigin.replace(/\/$/, '') + projectUrl;
        app.innerHTML = [
          renderProjectTabs(),
          renderContactLinks(),
          '<section class="panel grid">',
          '<div class="field"><label>默认 Project</label><select data-scope="config" data-field="defaultProjectPath">' + config.projects.map((project) => '<option value="' + escapeHtml(project.path) + '"' + (config.defaultProjectPath === project.path ? ' selected' : '') + '>' + escapeHtml(project.projectName || project.path) + ' /' + escapeHtml(project.path) + '</option>').join('') + '</select></div>',
          '<div class="field"><label>projectName Project 名称</label><input type="text" data-scope="project" data-field="projectName" value="' + escapeHtml(project.projectName) + '"></div>',
          '<div class="field"><label>path 访问路径，只填英文、数字、短横线</label><input type="text" data-scope="project" data-field="path" value="' + escapeHtml(project.path) + '"><div class="small">访问 URL：<a href="' + escapeHtml(absoluteProjectUrl) + '" target="_blank">' + escapeHtml(absoluteProjectUrl) + '</a></div></div>',
          '<div class="field"><label>icon 页面 Icon 路径</label><input type="text" data-scope="project" data-field="icon" value="' + escapeHtml(project.icon || '') + '"><div class="small">用于左上角图标和浏览器页签 icon。留空会按背景色 + 主标题首字母自动生成。</div></div>',
          '<div class="preview">' + (projectIcon ? '<img src="' + escapeHtml(projectIcon) + '?v=' + Date.now() + '" alt="Project Icon 预览"><a class="download-link" href="' + escapeHtml(projectIcon) + '" download>下载页面 Icon</a>' : '<div class="empty">未配置 icon，将自动生成首字母图标。</div>') + '<label class="file">上传页面 Icon<input type="file" accept="image/*" data-kind="projectIcon"></label></div>',
          '<div class="field"><label>backgroundColor Project 整体背景色，可填 #f5f5f7 / rgb(...) / transparent；留空则使用浏览器默认背景</label><input type="text" data-scope="project" data-field="backgroundColor" value="' + escapeHtml(project.backgroundColor || '') + '"></div>',
          '<div class="field"><label>backgroundImage Project 整页背景图路径</label><input type="text" data-scope="project" data-field="backgroundImage" value="' + escapeHtml(project.backgroundImage || '') + '"><div class="small">也可以只上传图片，系统会保存到 /user-content/projects/' + escapeHtml(project.path) + '/background.*</div></div>',
          '<div class="preview">' + (projectBackground ? '<img src="' + escapeHtml(projectBackground) + '?v=' + Date.now() + '" alt="Project 背景图预览"><a class="download-link" href="' + escapeHtml(projectBackground) + '" download>下载整页背景图</a>' : '<div class="empty">暂无整页背景图</div>') + '<label class="file">上传 Project 整页背景图<input type="file" accept="image/*" data-kind="projectBackground"></label></div>',
          '<div class="field"><label>背景图弱化</label><select data-scope="project" data-field="softenBackgroundImage"><option value="false"' + (project.softenBackgroundImage ? '' : ' selected') + '>关闭，保留原图</option><option value="true"' + (project.softenBackgroundImage ? ' selected' : '') + '>开启，自动弱化</option></select><div class="small">适合深色或细节很多的背景图。开启后会自动做轻微虚化、提亮和玻璃感蒙层，让文字和内容更容易看清。</div></div>',
          '<div class="visual-settings"><div class="type-controls">',
          renderPresetSelect('titleFontFamily', '标题字体', fontPresets, project.titleFontFamily),
          renderPresetSelect('mainTitleFontSize', '主标题字号', sizePresets.mainTitleFontSize, project.mainTitleFontSize),
          renderPresetSelect('subtitleFontSize', '副标题字号', sizePresets.subtitleFontSize, project.subtitleFontSize),
          renderPresetSelect('moduleTitleFontSize', '模块标题字号', sizePresets.moduleTitleFontSize, project.moduleTitleFontSize),
          renderPresetSelect('itemTitleFontSize', '滚动卡片标题字号', sizePresets.itemTitleFontSize, project.itemTitleFontSize),
          '</div>',
          renderTypographyPreview(project),
          '</div>',
          '<div class="field"><label>mainTitle 主标题</label><input type="text" data-scope="project" data-field="mainTitle" value="' + escapeHtml(project.mainTitle) + '"></div>',
          '<div class="field"><label>mainTitleEn 英文主标题</label><input type="text" data-scope="project" data-field="mainTitleEn" value="' + escapeHtml(project.mainTitleEn || '') + '"></div>',
          '<div class="field"><label>subtitle 副标题</label><input type="text" data-scope="project" data-field="subtitle" value="' + escapeHtml(project.subtitle) + '"></div>',
          '<div class="field"><label>subtitleEn 英文副标题</label><input type="text" data-scope="project" data-field="subtitleEn" value="' + escapeHtml(project.subtitleEn || '') + '"></div>',
          '<div class="field"><label>intro 介绍文案</label><textarea data-scope="project" data-field="intro">' + escapeHtml(project.intro) + '</textarea></div>',
          '<div class="field"><label>introEn 英文介绍文案</label><textarea data-scope="project" data-field="introEn">' + escapeHtml(project.introEn || '') + '</textarea></div>',
          '<div class="actions"><button class="button danger" data-action="removeProject">删除当前 Project</button></div>',
          '</section>',
          (project.modules || []).map(renderModule).join('')
        ].join('');

        app.querySelectorAll('input[type="text"], textarea, select').forEach((input) => {
          input.addEventListener('input', () => {
            syncInput(input);
            refreshTypographyPreview();
          });
          input.addEventListener('change', () => {
            syncInput(input);
            refreshTypographyPreview();
          });
        });
        app.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => handleAction(button)));
        app.querySelectorAll('input[type="file"]').forEach((input) => input.addEventListener('change', () => handleUpload(input)));
      }
      function renderProjectTabs() {
        return '<div class="project-tabs">' + config.projects.map((project, index) => '<button class="button project-tab ' + (index === activeProjectIndex ? 'active' : '') + '" data-action="selectProject" data-project-index="' + index + '">' + escapeHtml(project.projectName || project.path || ('Project ' + (index + 1))) + '</button>').join('') + '</div>';
      }
      function renderContactLinks() {
        const rows = (config.contactLinks || []).map((link, index) => [
          '<div class="contact-row">',
          '<div class="field"><label>中文名称</label><input type="text" data-scope="contact" data-contact-index="' + index + '" data-field="label" value="' + escapeHtml(link.label) + '"></div>',
          '<div class="field"><label>英文名称</label><input type="text" data-scope="contact" data-contact-index="' + index + '" data-field="labelEn" value="' + escapeHtml(link.labelEn || '') + '"></div>',
          '<div class="field"><label>' + (isEmailContact(link) ? '邮箱地址，系统会自动生成邮件链接' : '链接') + '</label><input type="text" data-scope="contact" data-contact-index="' + index + '" data-field="href" value="' + escapeHtml(displayContactHref(link)) + '"></div>',
          '<button class="button danger" data-action="removeContact" data-contact-index="' + index + '">删除</button>',
          '</div>'
        ].join('')).join('');
        return [
          '<section class="panel grid" style="margin-bottom: 18px;">',
          '<div class="module-head"><h2 class="module-title">社交媒体 / 联系方式</h2><button class="button secondary" data-action="addContact">新增联系方式</button></div>',
          '<div class="contact-list">' + (rows || '<div class="empty">暂无联系方式，点击“新增联系方式”。</div>') + '</div>',
          '</section>'
        ].join('');
      }
      function renderModule(module, moduleIndex) {
        const moduleManifest = activeManifest().modules[moduleIndex] || { backgroundImages: [], items: [] };
        const background = module.backgroundImage || moduleManifest.backgroundImages[0] || '';
        const itemHtml = (module.items || []).map((item, itemIndex) => renderItem(item, moduleIndex, itemIndex)).join('');
        return [
          '<section class="panel module">',
          '<div class="module-head"><h2 class="module-title">模块 ' + (moduleIndex + 1) + '</h2><div class="actions">',
          '<button class="button ghost" data-action="moveModuleUp" data-module-index="' + moduleIndex + '">上移</button>',
          '<button class="button ghost" data-action="moveModuleDown" data-module-index="' + moduleIndex + '">下移</button>',
          '<button class="button danger" data-action="removeModule" data-module-index="' + moduleIndex + '">删除模块</button>',
          '</div></div>',
          '<div class="split"><div class="grid">',
          '<div class="field"><label>模块 title 标题</label><input type="text" data-scope="module" data-module-index="' + moduleIndex + '" data-field="title" value="' + escapeHtml(module.title) + '"></div>',
          '<div class="field"><label>模块 titleEn 英文标题</label><input type="text" data-scope="module" data-module-index="' + moduleIndex + '" data-field="titleEn" value="' + escapeHtml(module.titleEn || '') + '"></div>',
          '<div class="field"><label>模块 intro 介绍</label><textarea data-scope="module" data-module-index="' + moduleIndex + '" data-field="intro">' + escapeHtml(module.intro) + '</textarea></div>',
          '<div class="field"><label>模块 introEn 英文介绍</label><textarea data-scope="module" data-module-index="' + moduleIndex + '" data-field="introEn">' + escapeHtml(module.introEn || '') + '</textarea></div>',
          '<div class="field"><label>backgroundImage 背景图片路径</label><input type="text" data-scope="module" data-module-index="' + moduleIndex + '" data-field="backgroundImage" value="' + escapeHtml(module.backgroundImage) + '"></div>',
          '</div><div class="preview">',
          background ? '<img src="' + escapeHtml(background) + '?v=' + Date.now() + '" alt="模块背景预览"><a class="download-link" href="' + escapeHtml(background) + '" download>下载背景图</a>' : '<div class="empty">暂无背景图</div>',
          '<label class="file">上传模块背景图<input type="file" accept="image/*" data-kind="moduleBackground" data-module-index="' + moduleIndex + '"></label>',
          '</div></div>',
          '<div class="module-head" style="margin-top: 18px;"><h3 class="item-title">模块子项</h3><button class="button secondary" data-action="addItem" data-module-index="' + moduleIndex + '">新增子项</button></div>',
          '<div class="items">' + (itemHtml || '<div class="empty">暂无子项，点击“新增子项”。</div>') + '</div>',
          '</section>'
        ].join('');
      }
      function renderItem(item, moduleIndex, itemIndex) {
        const itemManifest = activeManifest().modules[moduleIndex]?.items[itemIndex] || { images: [] };
        const images = itemManifest.images || [];
        const imageHtml = images.map((image) => '<div class="image-tile"><img src="' + escapeHtml(image) + '?v=' + Date.now() + '" alt=""><a class="download" href="' + escapeHtml(image) + '" download title="下载图片">↓</a><button title="删除图片" data-action="deleteImage" data-path="' + escapeHtml(image) + '">×</button></div>').join('');
        return [
          '<article class="item">',
          '<div class="item-head"><h4 class="item-title">子项 ' + (itemIndex + 1) + '</h4><div class="actions">',
          '<button class="button ghost" data-action="moveItemUp" data-module-index="' + moduleIndex + '" data-item-index="' + itemIndex + '">上移</button>',
          '<button class="button ghost" data-action="moveItemDown" data-module-index="' + moduleIndex + '" data-item-index="' + itemIndex + '">下移</button>',
          '<button class="button danger" data-action="removeItem" data-module-index="' + moduleIndex + '" data-item-index="' + itemIndex + '">删除子项</button>',
          '</div></div>',
          '<div class="item-grid"><div class="grid">',
          '<div class="field"><label>子项 title 标题</label><input type="text" data-scope="item" data-module-index="' + moduleIndex + '" data-item-index="' + itemIndex + '" data-field="title" value="' + escapeHtml(item.title) + '"></div>',
          '<div class="field"><label>子项 titleEn 英文标题</label><input type="text" data-scope="item" data-module-index="' + moduleIndex + '" data-item-index="' + itemIndex + '" data-field="titleEn" value="' + escapeHtml(item.titleEn || '') + '"></div>',
          '<div class="field"><label>子项 intro 介绍</label><textarea data-scope="item" data-module-index="' + moduleIndex + '" data-item-index="' + itemIndex + '" data-field="intro">' + escapeHtml(item.intro) + '</textarea></div>',
          '<div class="field"><label>子项 introEn 英文介绍</label><textarea data-scope="item" data-module-index="' + moduleIndex + '" data-item-index="' + itemIndex + '" data-field="introEn">' + escapeHtml(item.introEn || '') + '</textarea></div>',
          '</div><div class="preview">',
          '<div class="images">' + (imageHtml || '<div class="empty">暂无图片</div>') + '</div>',
          '<label class="file">上传子项图片数组<input type="file" accept="image/*" multiple data-kind="itemImage" data-module-index="' + moduleIndex + '" data-item-index="' + itemIndex + '"></label>',
          '<div class="small">图片会保存到 /user-content/projects/' + escapeHtml(activeProject().path) + '/modules/module-' + String(moduleIndex + 1).padStart(2, '0') + '/item-' + String(itemIndex + 1).padStart(2, '0') + '/</div>',
          '</div></div>',
          '</article>'
        ].join('');
      }
      function newProject() {
        const next = config ? config.projects.length + 1 : 1;
        return { projectName: '新 Project ' + next, path: 'project-' + String(next).padStart(2, '0'), icon: '', backgroundColor: '', backgroundImage: '', softenBackgroundImage: false, titleFontFamily: '', mainTitleFontSize: '', subtitleFontSize: '', moduleTitleFontSize: '', itemTitleFontSize: '', mainTitle: '新 Project ' + next, mainTitleEn: '', subtitle: '填写副标题', subtitleEn: '', intro: '填写介绍文案。', introEn: '', modules: [] };
      }
      function move(array, from, to) {
        if (to < 0 || to >= array.length) return;
        const [item] = array.splice(from, 1);
        array.splice(to, 0, item);
      }
      function handleAction(button) {
        const action = button.dataset.action;
        const projectIndex = Number(button.dataset.projectIndex);
        const moduleIndex = Number(button.dataset.moduleIndex);
        const itemIndex = Number(button.dataset.itemIndex);
        if (action === 'selectProject') activeProjectIndex = projectIndex;
        if (action === 'addContact') config.contactLinks.push({ label: '新联系方式', labelEn: '', href: '' });
        if (action === 'removeContact') config.contactLinks.splice(Number(button.dataset.contactIndex), 1);
        if (action === 'addItem') activeProject().modules[moduleIndex].items.push({ title: '新子项', titleEn: '', intro: '填写子项介绍。', introEn: '' });
        if (action === 'removeItem' && confirm('确定删除这个子项吗？图片文件不会自动删除。')) activeProject().modules[moduleIndex].items.splice(itemIndex, 1);
        if (action === 'moveItemUp') move(activeProject().modules[moduleIndex].items, itemIndex, itemIndex - 1);
        if (action === 'moveItemDown') move(activeProject().modules[moduleIndex].items, itemIndex, itemIndex + 1);
        if (action === 'removeModule' && confirm('确定删除这个模块吗？图片文件不会自动删除。')) activeProject().modules.splice(moduleIndex, 1);
        if (action === 'moveModuleUp') move(activeProject().modules, moduleIndex, moduleIndex - 1);
        if (action === 'moveModuleDown') move(activeProject().modules, moduleIndex, moduleIndex + 1);
        if (action === 'removeProject' && config.projects.length > 1 && confirm('确定删除当前 Project 吗？图片文件不会自动删除。')) {
          config.projects.splice(activeProjectIndex, 1);
          activeProjectIndex = Math.max(0, activeProjectIndex - 1);
          config.defaultProjectPath = config.projects[0].path;
        }
        if (action === 'deleteImage') deleteImage(button.dataset.path);
        if (action !== 'deleteImage') render();
      }
      function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      async function handleUpload(input) {
        const files = Array.from(input.files || []);
        if (files.length === 0) return;
        setStatus('正在上传图片...');
        try {
          for (const file of files) {
            const dataUrl = await readFileAsDataUrl(file);
            const result = await api('/api/upload', {
              method: 'POST',
              body: JSON.stringify({ kind: input.dataset.kind, projectIndex: activeProjectIndex, moduleIndex: Number(input.dataset.moduleIndex), itemIndex: Number(input.dataset.itemIndex), fileName: file.name, dataUrl })
            });
            config = result.config;
            manifest = result.manifest;
          }
          setStatus('图片已上传。');
          render();
        } catch (error) {
          setStatus(error.message);
        } finally {
          input.value = '';
        }
      }
      async function deleteImage(path) {
        if (!confirm('确定删除这张图片吗？')) return;
        try {
          const result = await api('/api/image', { method: 'DELETE', body: JSON.stringify({ path }) });
          config = result.config;
          manifest = result.manifest;
          setStatus('图片已删除。');
          render();
        } catch (error) {
          setStatus(error.message);
        }
      }
      async function load() {
        try {
          const data = await api('/api/config');
          config = data.config;
          manifest = data.manifest;
          activeProjectIndex = Math.max(0, config.projects.findIndex((project) => project.path === config.defaultProjectPath));
          setStatus('已加载。');
          render();
        } catch (error) {
          setStatus(error.message);
        }
      }
      async function save() {
        try {
          setStatus('正在保存...');
          const data = await api('/api/config', { method: 'PUT', body: JSON.stringify({ config }) });
          config = data.config;
          manifest = data.manifest;
          activeProjectIndex = Math.min(activeProjectIndex, config.projects.length - 1);
          setStatus('已保存。');
          render();
        } catch (error) {
          setStatus(error.message);
        }
      }
      async function build() {
        try {
          logEl.textContent = '正在构建...';
          setStatus('正在构建站点...');
          const data = await api('/api/build', { method: 'POST', body: '{}' });
          logEl.textContent = data.output || '构建完成。';
          setStatus(data.ok ? '构建成功。' : '构建失败，请查看日志。');
        } catch (error) {
          setStatus(error.message);
          logEl.textContent = error.message;
        }
      }
      async function translate() {
        try {
          setStatus('正在生成英文草稿...');
          const data = await api('/api/translate', { method: 'POST', body: JSON.stringify({ config }) });
          config = data.config;
          manifest = data.manifest;
          setStatus('英文草稿已生成，检查后点击保存。');
          render();
        } catch (error) {
          setStatus(error.message);
        }
      }
      document.getElementById('reload').addEventListener('click', load);
      document.getElementById('save').addEventListener('click', save);
      document.getElementById('build').addEventListener('click', build);
      document.getElementById('translate').addEventListener('click', translate);
      document.getElementById('addProject').addEventListener('click', () => {
        config.projects.push(newProject());
        activeProjectIndex = config.projects.length - 1;
        render();
      });
      document.getElementById('addModule').addEventListener('click', () => {
        activeProject().modules.push({ title: '新模块', titleEn: '', intro: '填写模块介绍。', introEn: '', backgroundImage: '', items: [] });
        render();
      });
      load();
    </script>
  </body>
</html>`;

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || `${host}:${port}`}`);

  try {
    if (request.method === 'GET' && url.pathname === '/') {
      sendHtml(response, page.replaceAll('__PREVIEW_ORIGIN__', previewOrigin));
      return;
    }

    if (
      (request.method === 'GET' || request.method === 'HEAD') &&
      (url.pathname.startsWith('/user-content/') || url.pathname.startsWith('/media/'))
    ) {
      sendPublicFile(response, url.pathname, request.method);
      return;
    }

    if (request.method === 'GET' && (url.pathname === '/api/config' || url.pathname === '/api/content')) {
      const config = readConfig();
      sendJson(response, { ok: true, config, content: config.projects[0], manifest: getManifest(config) });
      return;
    }

    if (request.method === 'PUT' && (url.pathname === '/api/config' || url.pathname === '/api/content')) {
      const body = await readJsonBody(request);
      writeConfig(body.config || body.content);
      const config = readConfig();
      ensureContentFolders(config);
      sendJson(response, { ok: true, config, manifest: getManifest(config) });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/upload') {
      const body = await readJsonBody(request);
      sendJson(response, { ok: true, ...uploadImage(body) });
      return;
    }

    if (request.method === 'DELETE' && url.pathname === '/api/image') {
      const body = await readJsonBody(request);
      sendJson(response, { ok: true, ...deleteImage(body) });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/build') {
      sendJson(response, await runBuild());
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/translate') {
      const body = await readJsonBody(request);
      const config = await generateEnglishDraft(body);
      sendJson(response, { ok: true, config, manifest: getManifest(config) });
      return;
    }

    sendError(response, new Error('Not found.'), 404);
  } catch (error) {
    sendError(response, error);
  }
});

server.listen(port, host, () => {
  console.log(`Config Studio is running at http://${host}:${port}`);
  console.log('Press Ctrl+C to stop.');
});
