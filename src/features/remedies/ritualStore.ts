import { create } from 'zustand';
import { getItem, setItem } from '@/lib/storage';
import { todayISO } from '@/lib/date';

const RITUAL_STORAGE_KEY = 'remedies.rituals';

export type RitualPeriod = 'morning' | 'midday' | 'evening';

export interface RitualPackProgress {
  morning: boolean;
  midday: boolean;
  evening: boolean;
}

export interface RitualPersistenceData {
  completedNumbers: number[];
  questDay: number;
  lastCompletedDate: string | null;
  /**
   * Date the Active Quest (for the current `questDay`) was last completed, or
   * `null` if today's/the current day's quest has not been completed yet.
   * Distinct from `lastCompletedDate` (which also covers the daily pack) so
   * that `questDay` only advances on a real calendar-day rollover, never
   * immediately on same-day completion - see `hydrate()`.
   */
  lastQuestCompletionDate: string | null;
  streakDays: number;
  dailyPackCompleted: boolean;
  dailyPackItems: RitualPackProgress;
}

export interface RitualState extends RitualPersistenceData {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  completeActiveQuest: (numberToHarmonize: number) => Promise<void>;
  togglePackItem: (period: RitualPeriod) => Promise<void>;
  completeDailyPack: () => Promise<void>;
  resetRituals: () => Promise<void>;
}

const DEFAULT_PACK_ITEMS: RitualPackProgress = {
  morning: false,
  midday: false,
  evening: false,
};

const DEFAULT_STATE: RitualPersistenceData = {
  completedNumbers: [],
  questDay: 1,
  lastCompletedDate: null,
  lastQuestCompletionDate: null,
  streakDays: 1,
  dailyPackCompleted: false,
  dailyPackItems: DEFAULT_PACK_ITEMS,
};

export const useRitualStore = create<RitualState>((set, get) => ({
  ...DEFAULT_STATE,
  hydrated: false,

  hydrate: async () => {
    try {
      const stored = await getItem<RitualPersistenceData>(RITUAL_STORAGE_KEY);
      if (stored) {
        const today = todayISO();
        const isSameDay = stored.lastCompletedDate === today;

        const storedQuestDay = stored.questDay || 1;
        const storedLastQuestCompletionDate = stored.lastQuestCompletionDate ?? null;
        // Only advance once a real calendar day has passed since the Active
        // Quest was completed - never on the same day it was completed, and
        // never when it hasn't been completed at all (`null`).
        const questDayRolledOver =
          storedLastQuestCompletionDate !== null && storedLastQuestCompletionDate !== today;
        const nextQuestDay =
          questDayRolledOver && storedQuestDay < 7 ? storedQuestDay + 1 : storedQuestDay;
        const nextLastQuestCompletionDate = questDayRolledOver ? null : storedLastQuestCompletionDate;

        const hydratedData: RitualPersistenceData = {
          completedNumbers: stored.completedNumbers || [],
          questDay: nextQuestDay,
          lastCompletedDate: stored.lastCompletedDate,
          lastQuestCompletionDate: nextLastQuestCompletionDate,
          streakDays: stored.streakDays || 1,
          dailyPackCompleted: isSameDay ? (stored.dailyPackCompleted ?? false) : false,
          dailyPackItems: isSameDay && stored.dailyPackItems ? stored.dailyPackItems : DEFAULT_PACK_ITEMS,
        };

        // Persist the rollover immediately so a later relaunch doesn't see
        // the same stale `lastQuestCompletionDate` and advance again.
        if (questDayRolledOver) {
          await setItem(RITUAL_STORAGE_KEY, hydratedData);
        }

        set({ ...hydratedData, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  completeActiveQuest: async (num: number) => {
    const state = get();
    const today = todayISO();

    const updatedCompleted = state.completedNumbers.includes(num)
      ? state.completedNumbers
      : [...state.completedNumbers, num];

    const nextStreak = state.lastCompletedDate === today ? state.streakDays : state.streakDays + 1;

    // `questDay` itself is not advanced here - it only moves forward on a
    // real calendar-day rollover, detected in `hydrate()`. Completing today's
    // quest just records that today's quest is done.
    const updatedData: RitualPersistenceData = {
      completedNumbers: updatedCompleted,
      questDay: state.questDay,
      lastCompletedDate: today,
      lastQuestCompletionDate: today,
      streakDays: nextStreak,
      dailyPackCompleted: state.dailyPackCompleted,
      dailyPackItems: state.dailyPackItems,
    };

    set({ ...updatedData });
    await setItem(RITUAL_STORAGE_KEY, updatedData);
  },

  togglePackItem: async (period: RitualPeriod) => {
    const state = get();
    const today = todayISO();

    const updatedItems = {
      ...state.dailyPackItems,
      [period]: !state.dailyPackItems[period],
    };

    const allFinished = updatedItems.morning && updatedItems.midday && updatedItems.evening;
    const nextStreak = (allFinished && state.lastCompletedDate !== today) ? state.streakDays + 1 : state.streakDays;

    const updatedData: RitualPersistenceData = {
      completedNumbers: state.completedNumbers,
      questDay: state.questDay,
      lastCompletedDate: allFinished ? today : state.lastCompletedDate,
      lastQuestCompletionDate: state.lastQuestCompletionDate,
      streakDays: nextStreak,
      dailyPackCompleted: allFinished,
      dailyPackItems: updatedItems,
    };

    set({ ...updatedData });
    await setItem(RITUAL_STORAGE_KEY, updatedData);
  },

  completeDailyPack: async () => {
    const state = get();
    const today = todayISO();
    const nextStreak = state.lastCompletedDate === today ? state.streakDays : state.streakDays + 1;

    const updatedData: RitualPersistenceData = {
      completedNumbers: state.completedNumbers,
      questDay: state.questDay,
      lastCompletedDate: today,
      lastQuestCompletionDate: state.lastQuestCompletionDate,
      streakDays: nextStreak,
      dailyPackCompleted: true,
      dailyPackItems: { morning: true, midday: true, evening: true },
    };

    set({ ...updatedData });
    await setItem(RITUAL_STORAGE_KEY, updatedData);
  },

  resetRituals: async () => {
    set({ ...DEFAULT_STATE, hydrated: true });
    await setItem(RITUAL_STORAGE_KEY, DEFAULT_STATE);
  },
}));