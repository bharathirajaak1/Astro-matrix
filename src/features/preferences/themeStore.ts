/**
 * The Appearance preference (Settings > Appearance): follow the OS, or pin
 * light/dark. Persisted via `lib/storage.ts`; `src/ui/theme.ts` reads it.
 */
import { create } from 'zustand';

import { getItem, setItem } from '@/lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

const PREFERENCE_KEY = 'preferences.theme';

interface ThemePreferenceState {
  preference: ThemePreference;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPreference: (next: ThemePreference) => Promise<void>;
}

export const useThemePreferenceStore = create<ThemePreferenceState>((set) => ({
  preference: 'system',
  hydrated: false,

  hydrate: async () => {
    try {
      const stored = await getItem<{ preference: ThemePreference }>(PREFERENCE_KEY);
      set({ preference: stored?.preference ?? 'system', hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  setPreference: async (next) => {
    set({ preference: next });
    await setItem(PREFERENCE_KEY, { preference: next });
  },
}));
