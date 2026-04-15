import { assetConfig, type LinkConfig, type MediaResource } from '@/data/assets';
import { siteConfig } from '@/data/site';
import { skills, timeline } from '@/data/skills';
import { socials } from '@/data/socials';

export interface SectionHeaderConfig {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}

interface SectionBase {
  id: string;
  enabled?: boolean;
  spacing?: 'default' | 'tight';
}

export interface HeroSectionConfig extends SectionBase {
  type: 'hero';
  eyebrow?: string;
  title: string;
  lead?: string;
  body?: string;
  actions?: LinkConfig[];
  panel?: {
    label?: string;
    items: string[];
  };
  media?: MediaResource;
}

export interface SplitTextSectionConfig extends SectionBase {
  type: 'splitText';
  header: SectionHeaderConfig;
  paragraphs: string[];
  meta?: string;
  actions?: LinkConfig[];
  media?: MediaResource;
}

export interface ProjectListSectionConfig extends SectionBase {
  type: 'projectList';
  header: SectionHeaderConfig;
  featuredOnly?: boolean;
  action?: LinkConfig;
}

export interface SkillsSectionConfig extends SectionBase {
  type: 'skills';
  header: SectionHeaderConfig;
  items: string[];
}

export interface TimelineSectionConfig extends SectionBase {
  type: 'timeline';
  header: SectionHeaderConfig;
  items: {
    year: string;
    title: string;
    description: string;
  }[];
}

export interface CtaSectionConfig extends SectionBase {
  type: 'cta';
  eyebrow?: string;
  title: string;
  body?: string;
  actions?: LinkConfig[];
}

export interface ContactSectionConfig extends SectionBase {
  type: 'contact';
  header: SectionHeaderConfig;
  cards: {
    title: string;
    body?: string;
    link?: LinkConfig;
    links?: LinkConfig[];
  }[];
}

export interface MediaFeatureSectionConfig extends SectionBase {
  type: 'mediaFeature';
  header: SectionHeaderConfig;
  body?: string;
  media: MediaResource;
  actions?: LinkConfig[];
}

export type PageSectionConfig =
  | HeroSectionConfig
  | SplitTextSectionConfig
  | ProjectListSectionConfig
  | SkillsSectionConfig
  | TimelineSectionConfig
  | CtaSectionConfig
  | ContactSectionConfig
  | MediaFeatureSectionConfig;

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
        eyebrow: 'Developer Portfolio',
        title: siteConfig.name,
        lead: siteConfig.role,
        body: siteConfig.heroIntro,
        actions: [
          { label: 'View Projects', href: '/projects' },
          { label: 'Contact Me', href: '/contact', variant: 'secondary' }
        ],
        panel: {
          label: 'Base Stack',
          items: [
            'Static-first delivery',
            'Reusable components',
            'Fast server deployment',
            'Simple maintenance path'
          ]
        },
        media: assetConfig.images.heroVisual
      },
      {
        id: 'about-preview',
        type: 'splitText',
        header: {
          eyebrow: 'About',
          title: 'Design-first structure, implementation-first decisions'
        },
        paragraphs: [
          'This starter is designed for people who want a polished site without building a heavy web app. It keeps page structure, reusable sections, and deployment workflow straightforward.',
          'Replace the sample content with your own profile, projects, and writing. Keep the layout, or extend it as your site grows.'
        ],
        meta: `Based in ${siteConfig.location}`,
        actions: [{ label: 'Read More', href: '/about' }],
        media: assetConfig.images.aboutProfile
      },
      {
        id: 'featured-projects',
        type: 'projectList',
        featuredOnly: true,
        header: {
          eyebrow: 'Projects',
          title: 'Featured work',
          description: 'A few examples of products, systems, and interfaces built with long-term maintainability in mind.'
        },
        action: { label: 'See All Projects', href: '/projects', variant: 'secondary' }
      },
      {
        id: 'skills',
        type: 'skills',
        header: {
          eyebrow: 'Skills',
          title: 'Core capabilities',
          description: 'A simple skill grid that you can edit in one file.'
        },
        items: skills
      },
      {
        id: 'intro-video',
        type: 'mediaFeature',
        enabled: false,
        header: {
          eyebrow: 'Video',
          title: 'Intro video'
        },
        body: 'Enable this section after adding a local video file to public/media and updating assetConfig.videos.intro.src.',
        media: assetConfig.videos.intro
      },
      {
        id: 'contact-cta',
        type: 'cta',
        eyebrow: 'Contact',
        title: 'Need a landing page, portfolio, or product showcase?',
        body: 'Use this project as a clean base, then swap in your own brand, content, and deployment settings.',
        actions: [
          { label: 'Email Me', href: `mailto:${siteConfig.email}` },
          { label: 'Contact Page', href: '/contact', variant: 'secondary' }
        ]
      }
    ] satisfies PageSectionConfig[]
  },
  about: {
    meta: {
      title: 'About',
      description: 'About this Astro portfolio template'
    },
    sections: [
      {
        id: 'about-intro',
        type: 'splitText',
        spacing: 'tight',
        header: {
          eyebrow: 'About',
          title: 'A portfolio template with enough structure to scale',
          description:
            'Built for developers, designers, and independent creators who want a site that is easy to extend without turning into a framework-heavy app.'
        },
        paragraphs: [
          'The codebase is organized around pages, reusable sections, and shared UI primitives. This keeps layout updates and content changes predictable.',
          'You can add blog pages, case studies, or a CMS later. The first version stays simple: fast pages, clear hierarchy, and a deployment model that works well on your own server.'
        ],
        media: assetConfig.images.aboutProfile
      },
      {
        id: 'timeline',
        type: 'timeline',
        header: {
          eyebrow: 'Experience',
          title: 'Timeline'
        },
        items: timeline
      },
      {
        id: 'skills',
        type: 'skills',
        header: {
          eyebrow: 'Skills',
          title: 'Core capabilities',
          description: 'A simple skill grid that you can edit in one file.'
        },
        items: skills
      }
    ] satisfies PageSectionConfig[]
  },
  projects: {
    meta: {
      title: 'Projects',
      description: 'Project archive'
    },
    sections: [
      {
        id: 'projects-grid',
        type: 'projectList',
        spacing: 'tight',
        header: {
          eyebrow: 'Projects',
          title: 'All projects',
          description: 'Every project comes from a content file, so adding a new entry does not require editing the page itself.'
        }
      }
    ] satisfies PageSectionConfig[]
  },
  contact: {
    meta: {
      title: 'Contact',
      description: 'Contact page for the portfolio starter'
    },
    sections: [
      {
        id: 'contact',
        type: 'contact',
        spacing: 'tight',
        header: {
          eyebrow: 'Contact',
          title: 'Get in touch',
          description:
            'This starter ships with a static contact page. You can keep it simple with email and social links, or later connect it to a form backend.'
        },
        cards: [
          {
            title: 'Email',
            body: 'For a static site, a plain mailto link is the fastest path to deployment.',
            link: { label: siteConfig.email, href: `mailto:${siteConfig.email}` }
          },
          {
            title: 'Social',
            links: socials
          }
        ]
      }
    ] satisfies PageSectionConfig[]
  },
  projectDetail: {
    titleSuffix: 'Project',
    eyebrow: 'Project',
    publishedLabel: 'Published',
    githubLabel: 'GitHub',
    demoLabel: 'Live Demo'
  }
};
