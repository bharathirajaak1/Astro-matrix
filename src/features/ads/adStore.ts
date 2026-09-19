import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AD_STORAGE_KEY = '@astro_matrix_ad_unlocks';
export const DAILY_AD_CAP = 2;

interface AdState {
  dailyWatchCount: number;
  lastWatchDate: string; // YYYY-MM-DD
  unlockedRemedies: string[]; // List of remedy IDs or numbers unlocked via ad today
  hydrate: () => Promise<void>;
  canWatchAd: () => boolean;
  recordAdWatch: (remedyKey: string) => Promise<boolean>;
  isRemedyUnlockedByAd: (remedyKey: string) => boolean;
}

const getTodayString = (): string => new Date().toISOString().split('T')[0];

export const useAdStore = create<AdState>((set, get) => ({
  dailyWatchCount: 0,
  lastWatchDate: getTodayString(),
  unlockedRemedies: [],

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(AD_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const today = getTodayString();

      // Reset count if it is a new calendar day
      if (parsed.lastWatchDate !== today) {
        set({ dailyWatchCount: 0, lastWatchDate: today, unlockedRemedies: [] });
        await AsyncStorage.setItem(
          AD_STORAGE_KEY,
          JSON.stringify({ dailyWatchCount: 0, lastWatchDate: today, unlockedRemedies: [] })
        );
      } else {
        set({
          dailyWatchCount: parsed.dailyWatchCount ?? 0,
          lastWatchDate: parsed.lastWatchDate,
          unlockedRemedies: parsed.unlockedRemedies ?? [],
        });
      }
    } catch (err) {
      console.warn('Failed to hydrate ad store:', err);
    }
  },

  canWatchAd: () => {
    const today = getTodayString();
    const state = get();
    if (state.lastWatchDate !== today) return true;
    return state.dailyWatchCount < DAILY_AD_CAP;
  },

  recordAdWatch: async (remedyKey: string) => {
    const today = getTodayString();
    const state = get();
    const isNewDay = state.lastWatchDate !== today;
    const currentCount = isNewDay ? 0 : state.dailyWatchCount;

    if (currentCount >= DAILY_AD_CAP) {
      return false;
    }

    const updatedCount = currentCount + 1;
    const updatedUnlocked = Array.from(
      new Set([...(isNewDay ? [] : state.unlockedRemedies), remedyKey])
    );

    set({
      dailyWatchCount: updatedCount,
      lastWatchDate: today,
      unlockedRemedies: updatedUnlocked,
    });

    try {
      await AsyncStorage.setItem(
        AD_STORAGE_KEY,
        JSON.stringify({
          dailyWatchCount: updatedCount,
          lastWatchDate: today,
          unlockedRemedies: updatedUnlocked,
        })
      );
    } catch (err) {
      console.warn('Failed to save ad unlock:', err);
    }

    return true;
  },

  isRemedyUnlockedByAd: (remedyKey: string) => {
    const today = getTodayString();
    const state = get();
    if (state.lastWatchDate !== today) return false;
    return state.unlockedRemedies.includes(remedyKey);
  },
}));