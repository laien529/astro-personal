# Astro Portfolio Template

A deployable Astro starter for a personal homepage, portfolio, or project showcase.

## Included pages

- Home
- About
- Projects
- Project detail
- Contact

## Quick start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production output will be generated in `dist/`.

## One-click run and deploy

Visual content studio:

```bash
npm run config:studio
```

Local static preview:

```bash
npm run oneclick
```

Local dev server:

```bash
bash deploy/one_click.sh dev 4321
```

Remote static deployment:

```bash
bash deploy/one_click.sh remote user@example.com /var/www/astro-personal "sudo systemctl reload nginx"
```

The remote command builds `dist/`, uploads it to a timestamped release directory, and switches `current` to the new release.

## Content editing

- For non-technical content updates, edit `content/site-projects.json` and upload images under `public/user-content/`
- Update site identity in `src/data/site.ts`
- Switch visual styles in `src/data/styles.ts`
- Update theme colors and global background in `src/data/theme.ts`
- Update icons, images, and video resources in `src/data/assets.ts`
- Update page sections, section order, copy, buttons, and media in `src/data/pageContent.ts`
- Update navigation in `src/data/navigation.ts`
- Update social links in `src/data/socials.ts`
- Update skills and timeline in `src/data/skills.ts`
- Add new project files in `src/content/projects/`

See `OPERATING_CONTENT.md` for non-technical content updates and `CONFIGURATION.md` for the full configuration guide.

## Deployment

See `PROJECT_STRUCTURE.md` and `DEPLOYMENT_GUIDE.md`.
