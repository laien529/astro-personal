import { assetConfig } from '@/data/assets';

export type SiteStyleName = 'portfolio' | 'apple';

export interface SiteStylePreset {
  label: string;
  description: string;
  className: string;
  variables: Record<string, string>;
}

export const activeStyle: SiteStyleName = 'apple';

export const stylePresets: Record<SiteStyleName, SiteStylePreset> = {
  portfolio: {
    label: 'Portfolio',
    description: 'The original soft portfolio style with translucent panels and teal accents.',
    className: 'style-portfolio',
    variables: {
      bg: '#f5faf9',
      panel: 'rgba(255, 255, 255, 0.72)',
      'panel-border': 'rgba(15, 23, 42, 0.08)',
      text: '#12202b',
      muted: '#5b6b78',
      primary: '#149f95',
      'primary-strong': '#0f766e',
      'primary-soft': '#dff7f3',
      shadow: '0 18px 48px rgba(18, 32, 43, 0.08)',
      radius: '24px',
      container: '1120px',
      'header-bg': 'rgba(247, 252, 251, 0.66)',
      'nav-active-bg': 'rgba(255, 255, 255, 0.9)',
      'button-shadow': '0 10px 30px rgba(20, 159, 149, 0.26)',
      'body-background': [
        `url("${assetConfig.images.siteBackground.src}") center top / cover fixed no-repeat`,
        'radial-gradient(circle at top left, rgba(20, 159, 149, 0.16), transparent 28%)',
        'linear-gradient(180deg, #f7fcfb 0%, #eef6f4 100%)'
      ].join(', ')
    }
  },
  apple: {
    label: 'Apple Inspired',
    description: 'A product-led style inspired by apple.com.cn home and iPhone pages: quiet chrome, large centered type, bright product modules, and clean blue links.',
    className: 'style-apple',
    variables: {
      bg: '#f5f5f7',
      panel: '#ffffff',
      'panel-border': 'rgba(0, 0, 0, 0.08)',
      text: '#1d1d1f',
      muted: '#6e6e73',
      primary: '#0071e3',
      'primary-strong': '#0066cc',
      'primary-soft': '#e8f2ff',
      shadow: 'none',
      radius: '28px',
      container: '1440px',
      'header-bg': 'rgba(251, 251, 253, 0.82)',
      'nav-active-bg': 'rgba(0, 0, 0, 0.06)',
      'button-shadow': 'none',
      'body-background': '#f5f5f7'
    }
  }
};

export const currentStyle = stylePresets[activeStyle];
