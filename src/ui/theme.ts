/**
 * Design tokens + a `useTheme()` hook. Colors are theme-aware (light / dark via
 * the OS setting); spacing / radius / typography are shared.
 */
import { useColorScheme } from 'react-native';

export interface ColorTokens {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  danger: string;
  gridEmpty: string;
  gridFilled: string;
  overlay: string;
}

const light: ColorTokens = {
  bg: '#F6F5F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EEE9',
  border: '#E4E1DA',
  text: '#1C1B1A',
  textMuted: '#6C6862',
  primary: '#6C4CE0',
  primarySoft: '#EEE9FC',
  onPrimary: '#FFFFFF',
  accent: '#B8791F',
  accentSoft: '#F6EAD5',
  danger: '#C1443B',
  gridEmpty: '#F0EEE9',
  gridFilled: '#EEE9FC',
  overlay: 'rgba(28,27,26,0.55)',
};

const dark: ColorTokens = {
  bg: '#141317',
  surface: '#1F1D24',
  surfaceAlt: '#26232B',
  border: '#332F3A',
  text: '#F3F1EE',
  textMuted: '#9C978F',
  primary: '#B7A0FF',
  primarySoft: '#2B2442',
  onPrimary: '#1A1330',
  accent: '#E7B968',
  accentSoft: '#3A2F1C',
  danger: '#F0837A',
  gridEmpty: '#26232B',
  gridFilled: '#2B2442',
  overlay: 'rgba(0,0,0,0.6)',
};

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

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const name: ThemeName = scheme === 'dark' ? 'dark' : 'light';
  return {
    name,
    colors: name === 'dark' ? dark : light,
    spacing,
    radius,
    typography,
  };
}
