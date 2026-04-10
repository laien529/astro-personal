# Project Structure Document

## Goal

This project is a static-first Astro website for a personal homepage, portfolio, and project archive. It is organized so that Figma page sections map cleanly to Astro components.

## Directory overview

```text
astro-portfolio-template/
├─ public/                    # Static files copied as-is to the final build
├─ src/
│  ├─ assets/                 # Local assets that can be optimized later
│  ├─ components/
│  │  ├─ cards/               # Reusable content cards
│  │  ├─ layout/              # Navbar, Footer, SEO head
│  │  ├─ sections/            # Page sections mapped from the design
│  │  └─ ui/                  # Basic UI primitives
│  ├─ content/                # Project content collection
│  ├─ data/                   # Shared content and config
│  ├─ layouts/                # Shared page shells
│  ├─ pages/                  # File-based routes
│  ├─ styles/                 # Global styles
│  └─ utils/                  # Small helper functions
├─ deploy/                    # Deployment config samples
├─ astro.config.mjs           # Astro config
├─ package.json               # Scripts and dependencies
└─ tsconfig.json              # TypeScript config
```

## Route map

- `/` → `src/pages/index.astro`
- `/about` → `src/pages/about.astro`
- `/projects` → `src/pages/projects/index.astro`
- `/projects/[slug]` → `src/pages/projects/[slug].astro`
- `/contact` → `src/pages/contact.astro`

## Layouts

### `src/layouts/MainLayout.astro`
Used by all top-level pages. It provides:
- HTML shell
- SEO tags
- Navbar
- Footer
- Global CSS import

### `src/layouts/ProjectDetailLayout.astro`
Used by each project detail page. It wraps the project metadata and markdown content into a standard detail page.

## Components

### UI primitives
- `Button.astro`
- `Container.astro`
- `SectionHeader.astro`
- `SocialLink.astro`
- `Tag.astro`

### Layout components
- `Navbar.astro`
- `Footer.astro`
- `SeoHead.astro`

### Card components
- `ProjectCard.astro`
- `SkillCard.astro`
- `TimelineItem.astro`

### Section components
- `HeroSection.astro`
- `AboutPreviewSection.astro`
- `FeaturedProjectsSection.astro`
- `SkillsSection.astro`
- `ContactCtaSection.astro`
- `AboutIntroSection.astro`
- `ExperienceTimelineSection.astro`
- `ProjectsGridSection.astro`
- `ContactFormSection.astro`

## Content model

Projects are stored as markdown files in `src/content/projects/`.

Each project uses this frontmatter shape:

```yaml
---
title: "Project title"
summary: "One-paragraph summary"
publishDate: "2026-01-01"
tech: ["Astro", "TypeScript"]
featured: true
github: "https://github.com/..."
demo: "https://example.com/..."
---
```

## Data files

### `src/data/site.ts`
Site identity, title, hero copy, contact email, and CTA labels.

### `src/data/navigation.ts`
Top navigation items.

### `src/data/socials.ts`
Social links shown in the footer and contact page.

### `src/data/skills.ts`
Skill labels and timeline entries.

## Styling model

Global styles live in `src/styles/global.css`.

This file includes:
- color tokens
- spacing and container width
- button styles
- card and panel styles
- responsive grid rules

## How to extend the project

### Add a new page
1. Create a new `.astro` file in `src/pages/`
2. Wrap it with `MainLayout`
3. Build the page using existing section and UI components

### Add a new project entry
1. Add a markdown file in `src/content/projects/`
2. Fill in frontmatter fields
3. Write project content below the frontmatter

### Change branding
1. Update `src/data/site.ts`
2. Update colors in `src/styles/global.css`
3. Replace `public/favicon.svg`

## Recommended next upgrades

- Add a blog collection
- Add `@astrojs/sitemap`
- Add analytics
- Connect a contact form backend
- Split `global.css` into smaller CSS modules or layers if the site grows
