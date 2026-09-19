import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProgressStore {
  completedDays: Record<string, boolean>;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  completedQuests: string[];
  totalQuestDays: number;
  activeQuestNumber: number | null;
  activeQuestDay: number;

  markDayComplete: (date: string) => void;
  advanceQuestDay: (maxDays?: number) => void;
  setActiveQuest: (number: number | null) => void;
  getStreak: () => number;
  isDayComplete: (date: string) => boolean;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      completedDays: {},
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      completedQuests: [],
      totalQuestDays: 0,
  activeQuestNumber: null,
  activeQuestDay: 0,

      markDayComplete: (date: string) => {
        const state = get();
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let newStreak = state.currentStreak;
        if (state.lastCompletionDate === yesterday) {
          newStreak += 1;
        } else if (state.lastCompletionDate !== date) {
          newStreak = 1;
        }

        set({
          completedDays: { ...state.completedDays, [date]: true },
          currentStreak: newStreak,
          longestStreak: Math.max(state.longestStreak, newStreak),
          lastCompletionDate: date,
          totalQuestDays: state.totalQuestDays + 1,
        });
      },

      advanceQuestDay: (maxDays = 7) => {
        const state = get();
        if (state.activeQuestDay >= maxDays) {
          const questKey = `quest_${state.activeQuestNumber}`;
          if (!state.completedQuests.includes(questKey)) {
            set({
              completedQuests: [...state.completedQuests, questKey],
              activeQuestDay: maxDays,
            });
          }
        } else {
          set({ activeQuestDay: state.activeQuestDay + 1 });
        }
      },

      setActiveQuest: (number: number | null) => {
        set({ activeQuestNumber: number, activeQuestDay: number === null ? 0 : 1 });
      },

      getStreak: () => get().currentStreak,

      isDayComplete: (date: string) => {
        return !!get().completedDays[date];
      },

      resetProgress: () => {
    set({
      completedDays: {},
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      completedQuests: [],
      totalQuestDays: 0,
      activeQuestNumber: null,
      activeQuestDay: 0,
    });
  },
    }),
    {
      name: 'astro-matrix-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);