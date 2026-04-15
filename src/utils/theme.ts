import { themeConfig } from '@/data/theme';
import { activeStyle, currentStyle } from '@/data/styles';

export function getStyleClass() {
  return currentStyle.className;
}

export function getStyleName() {
  return activeStyle;
}

export function getThemeCss() {
  const declarations = Object.entries(themeConfig.variables)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join('\n');

  return `:root {\n${declarations}\n}`;
}
