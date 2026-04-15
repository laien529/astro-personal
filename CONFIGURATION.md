# 配置化说明

本项目已经改造成配置驱动结构：主题色、背景图、icon、页面板块、文案、图片、链接、视频都可以通过 `src/data/` 配置或 `public/` 资源文件调整，页面工程读取这些配置后生成展示内容。

如果是普通运营用户维护首页内容，优先看 `OPERATING_CONTENT.md`，只需要改 `content/site-projects.json` 和 `public/user-content/`。

## 适配结论

改造前：不完全适配。项目已有 `src/data/site.ts`、`navigation.ts`、`socials.ts`、`skills.ts` 和 Markdown 项目集合，但区块顺序、区块文案、主题变量、背景图、icon、图片、视频入口仍散落在组件和 CSS 中。

改造后：已适配。新增并接入以下配置入口：

- `src/data/site.ts`：站点身份、SEO 基础信息、邮箱、位置、页脚文案、页脚联系方式。
- `src/data/styles.ts`：当前启用的 style，以及每套 style 的主题 token 和 body class。
- `src/data/theme.ts`：主题色、全局背景、圆角、阴影、容器宽度等视觉 token。
- `src/data/assets.ts`：favicon、品牌 icon、图片资源、视频资源。
- `src/data/pageContent.ts`：页面 meta、板块顺序、板块开关、区块文案、按钮链接、区块媒体。
- `src/content/projects/*.md`：项目内容、项目封面、项目视频。
- `public/media/`：可被配置引用的图片、背景图、视频 poster 和未来本地视频文件。

## 资源放置规则

静态资源放在 `public/` 下，页面中使用以 `/` 开头的路径引用。

```text
public/
├─ favicon.svg
└─ media/
   ├─ site-background.svg
   ├─ hero-visual.svg
   ├─ about-profile.svg
   ├─ project-astro.svg
   ├─ project-mobile.svg
   ├─ project-filter.svg
   └─ video-poster.svg
```

新增图片示例：

```text
public/media/my-cover.jpg
```

配置引用：

```ts
src: '/media/my-cover.jpg'
```

## 站点基础信息

文件：`src/data/site.ts`

用于配置站点身份、SEO 默认信息、联系方式和页脚文案。

```ts
export const siteConfig = {
  language: 'zh-CN',
  name: 'Cheng Keying',
  role: 'iOS / Android / Frontend Engineer',
  title: 'Cheng Keying — Developer Portfolio',
  description: 'A clean Astro portfolio template...',
  siteUrl: 'https://example.com',
  email: 'hello@example.com',
  location: 'Changsha, China',
  heroIntro: 'I build user-focused apps...',
  footer: {
    text: 'Built with Astro...',
    contactLinks: [
      { label: '邮箱', href: 'mailto:hello@example.com' },
      { label: 'GitHub', href: 'https://github.com/yourname' }
    ]
  }
};
```

`footer.contactLinks` 会渲染在 project 页面右下角。新增、删除或调整顺序都只改这个数组即可。

上线前务必同步：

- `src/data/site.ts` 的 `siteUrl`
- `astro.config.mjs` 的 `site`

否则 canonical 和 Open Graph URL 可能不一致。

## Style 风格切换

文件：`src/data/styles.ts`

页面数据源不变，风格通过 `activeStyle` 切换。

```ts
export type SiteStyleName = 'portfolio' | 'apple';

export const activeStyle: SiteStyleName = 'apple';
```

当前内置两套风格：

- `portfolio`：原始作品集风格，半透明面板、柔和绿色主色、背景图层。
- `apple`：参考 Apple 中国官网首页和 iPhone 详情页的产品展示节奏，浅灰背景、极简导航、大标题、白色产品模块和蓝色行动链接。

切回原始风格：

```ts
export const activeStyle: SiteStyleName = 'portfolio';
```

切到 Apple 风格：

```ts
export const activeStyle: SiteStyleName = 'apple';
```

切换后运行：

```bash
npm run build
```

### 新增一套 style

1. 在 `SiteStyleName` 中增加名称：

```ts
export type SiteStyleName = 'portfolio' | 'apple' | 'darkProduct';
```

2. 在 `stylePresets` 中新增配置：

```ts
darkProduct: {
  label: 'Dark Product',
  description: 'Dark product launch style.',
  className: 'style-dark-product',
  variables: {
    bg: '#000000',
    panel: '#111111',
    'panel-border': 'rgba(255, 255, 255, 0.12)',
    text: '#f5f5f7',
    muted: '#a1a1a6',
    primary: '#2997ff',
    'primary-strong': '#2997ff',
    'primary-soft': 'rgba(41, 151, 255, 0.16)',
    shadow: 'none',
    radius: '28px',
    container: '1440px',
    'header-bg': 'rgba(0, 0, 0, 0.72)',
    'nav-active-bg': 'rgba(255, 255, 255, 0.12)',
    'button-shadow': 'none',
    'body-background': '#000000'
  }
}
```

3. 在 `src/styles/global.css` 增加 `.style-dark-product` 的结构样式。

4. 把 `activeStyle` 改成新名称。

### style 和内容的边界

属于 style：

- 主题色、背景、字体节奏、圆角、阴影。
- 导航高度、区块留白、卡片形态、按钮视觉。
- 首页是否更像产品模块、详情页是否更像产品详情节奏。

属于内容数据：

- 页面文案、板块顺序、板块开关。
- 图片、视频、链接、项目 Markdown。
- 技能、经历、社交链接、联系方式。

换句话说，style 只改变展示方式；不应该改变 `pageContent`、`projects`、`assets` 这些数据源本身。

## 主题色、背景图和 icon

文件：`src/data/theme.ts`

`theme.ts` 会读取当前 `activeStyle` 对应的 token，并由 `src/layouts/MainLayout.astro` 注入为 CSS 变量，最终由 `src/styles/global.css` 使用。

```ts
export const themeConfig = {
  variables: {
    bg: '#f5faf9',
    text: '#12202b',
    muted: '#5b6b78',
    primary: '#149f95',
    'primary-strong': '#0f766e',
    'primary-soft': '#dff7f3',
    radius: '24px',
    container: '1120px',
    'body-background': [
      'url("/media/site-background.svg") center top / cover fixed no-repeat',
      'linear-gradient(180deg, #f7fcfb 0%, #eef6f4 100%)'
    ].join(', ')
  }
};
```

如果只是调当前风格的主题值，优先改 `src/data/styles.ts` 中对应 preset 的 `variables`。

常改项：

- 主色：`primary`
- 深主色：`primary-strong`
- 浅色标签背景：`primary-soft`
- 页面背景：`body-background`
- 卡片圆角：`radius`
- 最大内容宽度：`container`

文件：`src/data/assets.ts`

icon 入口：

```ts
icons: {
  favicon: '/favicon.svg',
  brand: '/favicon.svg'
}
```

- `favicon` 用于 `<link rel="icon">`。
- `brand` 用于导航栏品牌图标。

## 页面板块配置

文件：`src/data/pageContent.ts`

每个页面都有 `meta` 和 `sections`：

```ts
export const pageContent = {
  home: {
    meta: {
      title: siteConfig.title,
      description: siteConfig.description
    },
    sections: [
      {
        id: 'hero',
        type: 'hero',
        enabled: true
      }
    ]
  }
};
```

板块控制规则：

- 调整数组顺序即可调整页面板块顺序。
- 设置 `enabled: false` 可隐藏板块。
- `spacing: 'tight'` 使用更紧凑的顶部间距。
- 不同 `type` 会映射到不同 Astro section 组件。

当前支持的板块类型：

- `hero`：首页首屏，支持标题、导语、按钮、右侧列表、图片或视频。
- `splitText`：左右分栏文案，支持段落、辅助信息、按钮、图片或视频。
- `projectList`：项目列表，读取 `src/content/projects/*.md`。
- `skills`：技能网格。
- `timeline`：经历时间线。
- `cta`：行动召唤区块。
- `contact`：联系信息区块。
- `mediaFeature`：独立媒体区块，支持图片或视频；默认示例为关闭状态。

## 文案配置

页面通用文案主要放在 `src/data/pageContent.ts`。

示例：修改首页 hero 文案。

```ts
{
  id: 'hero',
  type: 'hero',
  eyebrow: 'Developer Portfolio',
  title: siteConfig.name,
  lead: siteConfig.role,
  body: siteConfig.heroIntro,
  actions: [
    { label: 'View Projects', href: '/projects' },
    { label: 'Contact Me', href: '/contact', variant: 'secondary' }
  ]
}
```

技能和经历仍在 `src/data/skills.ts`：

```ts
export const skills = ['Astro', 'TypeScript', 'Swift'];

export const timeline = [
  {
    year: '2025',
    title: 'Senior Mobile Engineer',
    description: 'Led architecture upgrades...'
  }
];
```

导航和社交链接：

- `src/data/navigation.ts`
- `src/data/socials.ts`

## 图片配置

通用图片资源集中在 `src/data/assets.ts`：

```ts
images: {
  heroVisual: {
    type: 'image',
    src: '/media/hero-visual.svg',
    alt: 'Abstract interface panels representing a personal portfolio system'
  }
}
```

在页面区块里引用：

```ts
media: assetConfig.images.heroVisual
```

项目封面在 Markdown frontmatter 中配置：

```yaml
---
title: "Astro Portfolio Site"
summary: "A lightweight portfolio..."
publishDate: "2026-02-20"
cover: "/media/project-astro.svg"
coverAlt: "Abstract browser layout for an Astro portfolio site"
tech: ["Astro", "TypeScript"]
featured: true
---
```

项目卡片和项目详情页会自动读取 `cover`。

## 视频配置

通用视频资源入口在 `src/data/assets.ts`：

```ts
videos: {
  intro: {
    type: 'video',
    src: '',
    title: 'Intro video',
    poster: '/media/video-poster.svg',
    controls: true
  }
}
```

启用首页视频区块：

1. 把视频文件放到 `public/media/intro.mp4`。
2. 修改 `assetConfig.videos.intro.src`：

```ts
src: '/media/intro.mp4'
```

3. 在 `src/data/pageContent.ts` 将 `intro-video` 板块改成启用：

```ts
{
  id: 'intro-video',
  type: 'mediaFeature',
  enabled: true,
  media: assetConfig.videos.intro
}
```

项目详情页也支持视频：

```yaml
---
title: "Project title"
video:
  src: "/media/project-demo.mp4"
  title: "Project demo video"
  poster: "/media/video-poster.svg"
---
```

## 链接配置

按钮和链接使用统一结构：

```ts
{
  label: 'Contact Me',
  href: '/contact',
  variant: 'secondary',
  external: false
}
```

字段说明：

- `label`：展示文案。
- `href`：站内路径、外部 URL 或 `mailto:`。
- `variant`：`primary` 或 `secondary`。
- `external`：是否强制新窗口打开；HTTP URL 默认会新窗口打开。

导航链接改 `src/data/navigation.ts`。

社交链接改 `src/data/socials.ts`。

项目链接改 Markdown frontmatter：

```yaml
github: "https://github.com/yourname/repo"
demo: "https://example.com/case/project"
```

## 新增项目

在 `src/content/projects/` 下新增 Markdown 文件：

```yaml
---
title: "New Project"
summary: "Short summary"
publishDate: "2026-04-15"
cover: "/media/new-project.jpg"
coverAlt: "Project cover description"
tech: ["Astro", "TypeScript"]
featured: true
github: "https://github.com/yourname/new-project"
demo: "https://example.com/new-project"
video:
  src: "/media/new-project-demo.mp4"
  title: "New Project demo"
  poster: "/media/video-poster.svg"
---

Project content goes here.
```

`featured: true` 的项目会进入首页 Featured Projects。

## 新增页面板块

优先复用现有 `type`。如果确实需要新板块：

1. 在 `src/data/pageContent.ts` 增加新的 section type。
2. 新建或改造 `src/components/sections/*.astro`。
3. 在对应 `src/pages/*.astro` 的 section 映射中接入新 type。
4. 把文案、链接、媒体继续留在配置中，不要写死在组件里。

## 验证

配置或资源修改后运行：

```bash
npm run build
```

当前项目的 `npm run check` 会提示安装 `@astrojs/check` 和 `typescript`。如果需要启用类型检查，请先把这两个包加入 devDependencies。

## 一键运行和部署

可视化运营配置台：

```bash
npm run config:studio
```

脚本：`deploy/one_click.sh`

本地构建并启动静态预览：

```bash
npm run oneclick
```

指定端口：

```bash
bash deploy/one_click.sh local 4321
```

启动开发服务器：

```bash
bash deploy/one_click.sh dev 4321
```

远程静态部署：

```bash
bash deploy/one_click.sh remote user@example.com /var/www/astro-personal "sudo systemctl reload nginx"
```

说明：

- 脚本默认只在 `node_modules` 不存在时安装依赖。
- 设置 `SKIP_INSTALL=1` 可以跳过依赖安装。
- 远程部署会上传到 `remote_base/releases/<timestamp>/`，再把 `remote_base/current` 指向新版本。
- 第三个远程参数是可选 reload 命令，例如重载 Nginx。
- 脚本不写死服务器地址，避免误部署。
