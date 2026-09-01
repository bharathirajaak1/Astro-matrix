/**
 * Exercises the theme preference store with an in-memory stand-in for
 * `@/lib/storage` (the real one needs the native AsyncStorage module).
 */
jest.mock('@/lib/storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (k: string) => {
      const raw = store.get(k);
      return raw == null ? null : JSON.parse(raw);
    }),
    setItem: jest.fn(async (k: string, v: unknown) => {
      store.set(k, JSON.stringify(v));
    }),
    removeItem: jest.fn(async (k: string) => {
      store.delete(k);
    }),
  };
});

import { useThemePreferenceStore } from '@/features/preferences/themeStore';

beforeEach(() => {
  useThemePreferenceStore.setState({ preference: 'system', hydrated: false });
});

describe('useThemePreferenceStore', () => {
  test('defaults to system before hydration', () => {
    expect(useThemePreferenceStore.getState().preference).toBe('system');
    expect(useThemePreferenceStore.getState().hydrated).toBe(false);
  });

  test('hydrate() with nothing stored resolves to system', async () => {
    await useThemePreferenceStore.getState().hydrate();
    expect(useThemePreferenceStore.getState()).toMatchObject({
      preference: 'system',
      hydrated: true,
    });
  });

  test('setPreference persists and updates state immediately', async () => {
    await useThemePreferenceStore.getState().setPreference('dark');
    expect(useThemePreferenceStore.getState().preference).toBe('dark');

    // A fresh hydrate (simulating the next app launch) reads the persisted value.
    useThemePreferenceStore.setState({ preference: 'system', hydrated: false });
    await useThemePreferenceStore.getState().hydrate();
    expect(useThemePreferenceStore.getState().preference).toBe('dark');
  });

  test('every preference round-trips through persistence', async () => {
    for (const pref of ['system', 'light', 'dark'] as const) {
      await useThemePreferenceStore.getState().setPreference(pref);
      useThemePreferenceStore.setState({ preference: 'light', hydrated: false });
      await useThemePreferenceStore.getState().hydrate();
      expect(useThemePreferenceStore.getState().preference).toBe(pref);
    }
  });
});
