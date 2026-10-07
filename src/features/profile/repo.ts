/**
 * Profile persistence. v1 holds a single profile at `profile.current`, but the
 * API is already list-shaped (`getAll` / `getById`) so multi-profile can land
 * later without touching callers.
 */
import type { NumerologySystem, Profile } from '@/core/types';
import { getItem, removeItem, setItem } from '@/lib/storage';

const CURRENT_KEY = 'profile.current';

export interface ProfileInput {
  fullName: string;
  /** ISO 'YYYY-MM-DD'. */
  dob: string;
  system: NumerologySystem;
}

function generateId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const profileRepo = {
  async getCurrent(): Promise<Profile | null> {
    return getItem<Profile>(CURRENT_KEY);
  },

  async getAll(): Promise<Profile[]> {
    const current = await profileRepo.getCurrent();
    return current ? [current] : [];
  },

  async getById(id: string): Promise<Profile | null> {
    const current = await profileRepo.getCurrent();
    return current && current.id === id ? current : null;
  },

  /**
   * Create or update the current profile. Keeps `id` / `createdAt` stable
   * for an edit to the same person (name/DOB unchanged - e.g. fixing the
   * numerology system). Generates a new `id` (and `createdAt`) when
   * `fullName` or `dob` actually changes, since those are this app's
   * identity signals - everything keyed to the old `id` (e.g. Remedies
   * ritual progress) should not carry over to what is, in effect, a
   * different person.
   */
  async save(input: ProfileInput): Promise<Profile> {
    const existing = await profileRepo.getCurrent();
    const trimmedName = input.fullName.trim();
    const identityChanged =
      !existing || existing.fullName !== trimmedName || existing.dob !== input.dob;

    const profile: Profile = {
      id: identityChanged ? generateId() : existing.id,
      fullName: trimmedName,
      dob: input.dob,
      system: input.system,
      createdAt: identityChanged ? new Date().toISOString() : existing.createdAt,
    };
    await setItem(CURRENT_KEY, profile);
    return profile;
  },

  async clear(): Promise<void> {
    await removeItem(CURRENT_KEY);
  },
};
