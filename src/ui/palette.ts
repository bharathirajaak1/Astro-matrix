/**
 * Raw colour tokens. Pure data, zero dependencies (no React/React Native), so
 * it can be unit-tested (contrast ratios) without pulling in native modules.
 * `theme.ts` wraps this with the `useTheme()` hook.
 */
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
  dangerSoft: string;
  gridEmpty: string;
  gridFilled: string;
  overlay: string;
}

export type ThemeName = 'light' | 'dark';

// Every text/icon token below is verified at >= 4.5:1 contrast (WCAG AA for
// normal text) against every surface it is drawn on - see
// `__tests__/ui/palette.test.ts`.

export const light: ColorTokens = {
  bg: '#F6F5F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EEE9',
  border: '#E4E1DA',
  text: '#1C1B1A',
  textMuted: '#6C6862',
  primary: '#6C4CE0',
  primarySoft: '#EEE9FC',
  onPrimary: '#FFFFFF',
  accent: '#8C5A0E',
  accentSoft: '#F6EAD5',
  danger: '#B33A31',
  dangerSoft: '#FBEAE8',
  gridEmpty: '#F0EEE9',
  gridFilled: '#EEE9FC',
  overlay: 'rgba(28,27,26,0.55)',
};

export const dark: ColorTokens = {
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
  dangerSoft: '#3A211F',
  gridEmpty: '#26232B',
  gridFilled: '#2B2442',
  overlay: 'rgba(0,0,0,0.6)',
};

export const PALETTES: Record<ThemeName, ColorTokens> = { light, dark };
