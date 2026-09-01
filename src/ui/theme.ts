/**
 * `useTheme()`: the active colour palette plus shared spacing / radius /
 * typography. By default the palette follows the OS setting, but a user
 * preference (Settings > Appearance) can pin light or dark regardless of the
 * system. Colour values themselves live in `palette.ts` so they stay unit
 * -testable without pulling in React Native.
 */
import { useColorScheme } from 'react-native';

import { useThemePreferenceStore } from '@/features/preferences/themeStore';

import { PALETTES, type ColorTokens, type ThemeName } from './palette';

export type { ColorTokens, ThemeName };
export { PALETTES };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.2 },
  title: { fontSize: 22, fontWeight: '700' as const },
  heading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.3 },
  caption: { fontSize: 12, fontWeight: '500' as const },
} as const;

export interface Theme {
  name: ThemeName;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

function buildTheme(name: ThemeName): Theme {
  return { name, colors: PALETTES[name], spacing, radius, typography };
}

/**
 * The active theme: the user's Appearance preference when set to Light/Dark,
 * otherwise whatever the OS reports.
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const preference = useThemePreferenceStore((s) => s.preference);
  const name: ThemeName =
    preference === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : preference;
  return buildTheme(name);
}
