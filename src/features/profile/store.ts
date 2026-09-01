/**
 * Profile store (zustand). One profile in v1. `hydrate()` runs once from the
 * root layout; screens read `profile` and treat `null` as "not onboarded yet".
 */
import { create } from 'zustand';

import type { Profile } from '@/core/types';

import { profileRepo, type ProfileInput } from './repo';

interface ProfileState {
  profile: Profile | null;
  /** False until the first read from storage resolves (success or failure). */
  hydrated: boolean;
  /** Load the persisted profile from AsyncStorage. Called once on app launch. */
  hydrate: () => Promise<void>;
  save: (input: ProfileInput) => Promise<Profile>;
  reset: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const profile = await profileRepo.getCurrent();
      set({ profile, hydrated: true });
    } catch {
      // Storage unreadable - start clean rather than blocking the launch.
      set({ profile: null, hydrated: true });
    }
  },

  save: async (input) => {
    const profile = await profileRepo.save(input);
    set({ profile });
    return profile;
  },

  reset: async () => {
    await profileRepo.clear();
    set({ profile: null });
  },
}));
