export interface LinkConfig {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
  external?: boolean;
}

export interface ImageResource {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

export interface VideoResource {
  type: 'video';
  src: string;
  title: string;
  poster?: string;
  caption?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export type MediaResource = ImageResource | VideoResource;

export const assetConfig = {
  icons: {
    favicon: '/favicon.svg',
    brand: '/favicon.svg'
  },
  images: {
    siteBackground: {
      type: 'image',
      src: '/media/site-background.svg',
      alt: ''
    },
    heroVisual: {
      type: 'image',
      src: '/media/hero-visual.svg',
      alt: 'Abstract interface panels representing a personal portfolio system'
    },
    aboutProfile: {
      type: 'image',
      src: '/media/about-profile.svg',
      alt: 'Abstract profile card illustration'
    },
    projectAstro: {
      type: 'image',
      src: '/media/project-astro.svg',
      alt: 'Abstract browser layout for an Astro portfolio site'
    },
    projectMobile: {
      type: 'image',
      src: '/media/project-mobile.svg',
      alt: 'Abstract mobile design system screens'
    },
    projectFilter: {
      type: 'image',
      src: '/media/project-filter.svg',
      alt: 'Abstract message filtering workflow'
    },
    videoPoster: {
      type: 'image',
      src: '/media/video-poster.svg',
      alt: 'Video poster placeholder'
    }
  },
  videos: {
    intro: {
      type: 'video',
      src: '',
      title: 'Intro video',
      poster: '/media/video-poster.svg',
      caption: 'Add a local video file under public/media and set this src when you want to show a video.',
      controls: true
    }
  }
} as const;
