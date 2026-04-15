# Agents.md

本文件是本仓库的开发规格，供 Codex、其他 AI agent 和协作者在修改项目时优先阅读。目标是让改动保持小而准、符合现有 Astro 项目结构，并且每次交付前能完成必要验证。

## 项目定位

- 这是一个静态优先的 Astro 个人作品集/项目展示站点。
- 页面由 `src/pages/` 的文件路由驱动，通用页面外壳在 `src/layouts/`，可复用 UI 在 `src/components/`。
- 站点内容主要来自 `src/data/*.ts` 和 `src/content/projects/*.md`，不要把可配置文案、链接、图片、视频或板块开关硬编码进组件。
- 面向运营用户的简化内容来自 `content/site-projects.json`，图片数组来自 `public/user-content/` 文件夹。普通内容维护优先走这两个入口。
- 主题色、背景图、icon、页面板块、文案、图片、链接和视频的配置说明见 `CONFIGURATION.md`。
- 生产输出在 `dist/`。不要手工编辑 `dist/` 内文件；如需同步静态产物，先修改源码，再运行构建生成。

## 技术栈

- Astro 6，静态站点为主。
- TypeScript，`tsconfig.json` 继承 `astro/tsconfigs/strict`。
- CSS 主要集中在 `src/styles/global.css`，使用 CSS 变量和全局类名。
- 包管理使用 npm，仓库包含 `package-lock.json`。不要引入 yarn、pnpm 或 bun 的锁文件，除非用户明确要求迁移。
- 路径别名：`@/*` 指向 `src/*`，组件和数据导入优先使用该别名。

## 常用命令

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
```

- 本地开发使用 `npm run dev`。
- 类型和 Astro 诊断使用 `npm run check`。
- 交付源码改动前至少运行 `npm run check`；影响路由、内容集合、布局或样式时同时运行 `npm run build`。
- `npm run preview` 用于检查构建产物，不替代 `npm run build`。

## 目录职责

- `src/pages/`：Astro 文件路由。新增页面时在这里创建 `.astro` 文件，并使用 `MainLayout`。
- `src/layouts/`：页面外壳。`MainLayout.astro` 提供 HTML shell、SEO、Navbar、Footer 和全局样式；项目详情页使用 `ProjectDetailLayout.astro`。
- `src/components/ui/`：基础 UI 原语，如 `Button`、`Container`、`SectionHeader`、`Tag`、`SocialLink`。
- `src/components/cards/`：可复用内容卡片，如项目卡、技能卡、时间线项。
- `src/components/sections/`：页面区块。首页、关于页、项目页和联系页应优先组合这些 section。
- `src/data/`：站点身份、导航、社交链接、技能和时间线等结构化数据。
- `src/data/theme.ts`：主题色、全局背景、圆角、阴影、容器宽度等 CSS 变量来源。
- `src/data/styles.ts`：style 注册表和当前启用 style。切换风格时优先改 `activeStyle`，不要改内容数据。
- `src/data/assets.ts`：favicon、品牌 icon、图片、视频等资源清单。
- `src/data/pageContent.ts`：页面 meta、板块顺序、板块开关、区块文案、按钮链接和区块媒体。
- `src/content/projects/`：项目内容集合，项目详情页和项目列表从这里读取。
- `src/styles/global.css`：全局视觉 token、布局、响应式规则和组件类。
- `public/`：原样复制到构建输出的静态资源。
- `public/user-content/`：运营用户维护的首页模块资源，子项图片数组通过文件夹自动读取。
- `content/site-projects.json`：运营用户维护的 project 列表。每个 project 有自己的 `path`、主标题、副标题、介绍、模块和子项文案。
- `tools/config-studio/server.mjs`：本地可视化运营配置台，运行 `npm run config:studio` 后可在浏览器编辑 `content/site-projects.json` 和上传 `public/user-content/` 图片。
- `deploy/`：通用部署脚本、Dockerfile 和 Nginx 示例。

## 路由约定

- `/` 对应 `src/pages/index.astro`。
- `/about` 对应 `src/pages/about.astro`。
- `/projects` 对应 `src/pages/projects/index.astro`。
- `/projects/[slug]` 对应 `src/pages/projects/[slug].astro`，slug 来自 `src/content/projects/*.md` 的文件名。
- `/contact` 对应 `src/pages/contact.astro`。

新增路由时，优先保持静态生成；除非需求明确需要服务端运行时，不要引入 SSR 或服务端依赖。

## 内容编辑规则

- 站点名称、职位、标题、描述、邮箱、位置和首页 CTA：改 `src/data/site.ts`。
- 主题色、背景图、圆角、容器宽度：改 `src/data/theme.ts`。
- 整体风格切换：改 `src/data/styles.ts` 的 `activeStyle`，当前支持 `portfolio` 和 `apple`。
- icon、图片、视频资源路径：改 `src/data/assets.ts`，资源文件放在 `public/`。
- 页面板块顺序、开关、区块文案、按钮和区块媒体：改 `src/data/pageContent.ts`。
- 导航：改 `src/data/navigation.ts`。
- 页脚和联系页社交链接：改 `src/data/socials.ts`。
- 技能和经历时间线：改 `src/data/skills.ts`。
- 新增项目：在 `src/content/projects/` 下新增 Markdown 文件，不要直接改项目列表页。

项目 frontmatter 必须符合 `src/content.config.ts`：

```yaml
---
title: "Project title"
summary: "One-paragraph summary"
publishDate: "2026-01-01"
cover: "/optional-cover.jpg"
coverAlt: "Cover image description"
video:
  src: "/media/project-demo.mp4"
  title: "Project demo video"
  poster: "/media/video-poster.svg"
tech: ["Astro", "TypeScript"]
github: "https://github.com/example/repo"
demo: "https://example.com"
featured: true
---
```

- `title`、`summary`、`publishDate` 必填。
- `tech` 默认是空数组，但展示类项目建议填写。
- `github` 和 `demo` 必须是合法 URL。
- `featured: true` 的项目会进入首页 Featured Projects，并按 `publishDate` 倒序排列。

## 组件开发约定

- Astro 组件的 props 使用本地 `interface Props` 声明，并从 `Astro.props` 解构。
- 新的可复用展示能力优先放到 `src/components/ui/`、`cards/` 或 `sections/`，不要在页面文件里堆复杂 markup。
- 页面文件应保持组合式：导入 layout、section 和数据，然后排列页面结构。
- 内部链接保持站内路径，如 `/projects`；外部链接使用现有 `Button` 的 `external={true}` 或在普通 `<a>` 上补齐安全属性。
- 新组件如果只是样式变体，优先复用现有全局类和 CSS 变量，避免创建重复 token。

## 样式规范

- 全局设计 token 在 `:root` 中维护，优先复用 `--bg`、`--panel`、`--text`、`--muted`、`--primary`、`--radius`、`--container` 等变量。
- 布局宽度优先使用 `Container.astro` 和 `.container-shell`。
- 区块间距优先使用 `.section`、`.section-tight`。
- 卡片/面板样式优先使用 `.panel`、`.card`、`.skill-card`。
- 标签使用 `.tag` 和 `.tag-list`。
- 响应式断点当前集中在 `960px` 和 `640px`，新增布局时尽量沿用这些断点。
- 避免在组件内散落大量 `<style>`；本项目当前样式集中在 `src/styles/global.css`，除非局部样式明显更合适。

## SEO 和站点 URL

- 每个页面应通过 `MainLayout` 传入明确的 `title` 和 `description`。
- SEO 标签由 `src/components/layout/SeoHead.astro` 生成。
- 上线前同步修改：
  - `astro.config.mjs` 的 `site`
  - `src/data/site.ts` 的 `siteUrl`
- 二者不一致会导致 canonical 和 Open Graph URL 错误。

## 构建产物和部署

- `dist/` 是构建输出。不要在 `dist/` 里直接修 bug。
- 如果用户要求更新静态部署文件，运行 `npm run build` 生成 `dist/`。
- 通用发布脚本是 `deploy/deploy.sh <user@server> <remote_base_path>`，会构建并上传到 release 目录。
- `deploy_static.sh` 包含本机路径和服务器地址，属于环境绑定脚本；修改或执行前必须确认目标环境。
- Docker 部署使用 `deploy/Dockerfile`，构建阶段基于 `node:22-alpine`，运行阶段基于 `nginx:alpine`。

## 质量门槛

改动完成前按风险选择验证：

- 纯文案或 Markdown：运行 `npm run check`。
- 修改 Astro 组件、页面、内容 schema、路径别名或全局样式：运行 `npm run check` 和 `npm run build`。
- 修改部署脚本：至少做 shell 语法审查；涉及远程服务器的命令不要擅自执行。
- 修改 URL、导航或项目 slug：手动检查生成路径和链接是否符合预期。

当前仓库没有专门的测试框架；不要为了很小的改动强行引入测试框架。若新增复杂逻辑，应先和用户确认是否引入测试工具。

## 协作注意事项

- 保持改动范围贴近用户请求，不做无关重构。
- 不要删除或覆盖用户已有内容，尤其是个人信息、项目描述、部署脚本和已生成的 `dist/` 文件。
- 不要提交真实密钥、服务器凭据或私有访问令牌。
- 遇到现有文件中疑似占位信息，如 `example.com`、`hello@example.com`、`yourname`，不要擅自替换成猜测值；只有用户提供真实信息时再更新。
- 优先使用现有数据文件和组件组织新增内容，避免复制粘贴整页结构。
- 如果需要联网安装依赖、访问远程服务器或执行部署命令，先征得用户许可。

## 常见任务路径

新增项目：

1. 在 `src/content/projects/` 新增 `kebab-case.md` 文件。
2. 填写合法 frontmatter。
3. 编写正文。
4. 如需首页展示，设置 `featured: true`。
5. 运行 `npm run check` 和 `npm run build`。

新增页面：

1. 在 `src/pages/` 新增路由文件。
2. 使用 `MainLayout` 包裹页面。
3. 将大块 UI 拆到 `src/components/sections/`。
4. 如需导航入口，更新 `src/data/navigation.ts`。
5. 运行 `npm run check` 和 `npm run build`。

修改品牌信息：

1. 更新 `src/data/site.ts`。
2. 必要时更新 `src/data/socials.ts` 和 `public/favicon.svg`。
3. 上线前同步 `astro.config.mjs` 的 `site` 与 `siteConfig.siteUrl`。
4. 运行 `npm run check` 和 `npm run build`。

调整视觉风格：

1. 优先改 `src/styles/global.css` 的 CSS 变量。
2. 复用现有 `.section`、`.panel`、`.card`、`.button-row`、`.tag-list` 等结构类。
3. 检查 960px 和 640px 断点下的布局。
4. 运行 `npm run check` 和 `npm run build`。
