/**
 * Profile store (zustand). `hydrate()` runs once from the root layout;
 * screens read `profile` and treat `null` as "not onboarded yet".
 *
 * Stage 5b.1: `hydrate()` is now registry-aware (see `resolveActiveProfile()`
 * below), and two new actions - `createAdditionalProfile()` /
 * `switchActiveProfile()` - add a second profile and switch between saved
 * profiles. `profile.current` (the legacy key, via `getCurrent`/`save`/
 * `clear`) remains the compatibility backup throughout - nothing here ever
 * writes, resets, or repairs it; it is only ever read as a fallback.
 */
import { create } from 'zustand';

import type { Profile } from '@/core/types';

import {
  profileRepo,
  type CreateProfileResult,
  type ProfileInput,
  type SetActiveProfileResult,
} from './repo';
import { runStartupMigration } from './startup';

/**
 * How the currently-loaded `profile` was determined - NOT the same thing as
 * whether a profile exists. Distinguishes a confidently-resolved registry
 * selection from the legacy fallback, and further distinguishes an
 * ORDINARY legacy fallback (no active selection has ever been made - the
 * expected state for every existing install, and for a fresh one before
 * onboarding) from a DEGRADED one (the registry or active pointer could not
 * be trusted - malformed, dangling, or unreadable). A `'degraded'`
 * resolution is still backed by the same legacy `profile.current` value as
 * `'legacy'` - the distinction exists so a future UI can choose to show it
 * as uncertain rather than as a normal, confirmed selection. Nothing in
 * this module ever repairs, resets, or guesses at the registry because of
 * either fallback case - both resolve identically (read `profile.current`),
 * only the reported `resolution` differs.
 */
export type ProfileResolution = 'resolved' | 'legacy' | 'degraded';

export interface ResolvedActiveProfile {
  profile: Profile | null;
  resolution: ProfileResolution;
}

/**
 * Decides which profile `hydrate()` should load, given the current (post-
 * migration) registry state. Never writes anything.
 *
 * Handles every real `ActiveProfileResult` variant (verified against
 * `repo.ts`'s actual union, not assumed):
 *  - `resolved`               -> use the resolved registry profile directly.
 *  - `unset`                  -> genuine absence of an active selection -
 *    fall back to `profile.current`, resolution `'legacy'` (no warning -
 *    this is the ordinary state for every pre-switching install and for a
 *    fresh one before onboarding).
 *  - `dangling`               -> the pointer does not resolve to any entry.
 *  - `registry_malformed`     -> `profiles.all` failed validation.
 *  - `active_id_malformed`    -> `profiles.activeId` failed validation.
 *  - `registry_read_failure`  -> the underlying read of `profiles.all` threw.
 *  - `active_id_read_failure` -> the underlying read of `profiles.activeId` threw.
 *    Each of these five falls back to `profile.current` exactly like
 *    `'unset'` does, but is reported as `'degraded'` and logged distinctly
 *    (status-specific, and for the two read-failure cases, the error's
 *    `.message` only - never the raw error object, matching the same
 *    PII-safety discipline already established in `startup.ts`'s
 *    `logMigrationFailure`). None of them ever overwrite, clear, or repair
 *    the registry or the pointer - only `profileRepo.getActiveProfile()`
 *    and `profileRepo.getCurrent()` are called, both read-only.
 */
export async function resolveActiveProfile(): Promise<ResolvedActiveProfile> {
  const activeResult = await profileRepo.getActiveProfile();

  switch (activeResult.status) {
    case 'resolved':
      return { profile: activeResult.profile, resolution: 'resolved' };

    case 'unset': {
      const profile = await profileRepo.getCurrent();
      return { profile, resolution: 'legacy' };
    }

    case 'dangling':
      console.warn(
        '[profile store] profiles.activeId does not resolve to any registry entry - using legacy profile.current; not a confirmed active profile:',
        activeResult.activeId,
      );
      return { profile: await profileRepo.getCurrent(), resolution: 'degraded' };

    case 'registry_malformed':
    case 'active_id_malformed':
      console.warn(
        `[profile store] ${activeResult.status} - using legacy profile.current; not a confirmed active profile.`,
      );
      return { profile: await profileRepo.getCurrent(), resolution: 'degraded' };

    case 'registry_read_failure':
    case 'active_id_read_failure': {
      const message = activeResult.error instanceof Error ? activeResult.error.message : 'unknown error';
      console.warn(
        `[profile store] ${activeResult.status} - using legacy profile.current; not a confirmed active profile:`,
        message,
      );
      return { profile: await profileRepo.getCurrent(), resolution: 'degraded' };
    }

    default: {
      // Exhaustiveness guard - if `ActiveProfileResult` ever gains a new
      // variant, this fails to compile rather than silently falling through.
      const exhaustive: never = activeResult;
      throw new Error(`Unhandled ActiveProfileResult status: ${JSON.stringify(exhaustive)}`);
    }
  }
}

interface ProfileState {
  profile: Profile | null;
  /** False until the first read from storage resolves (success or failure). */
  hydrated: boolean;
  /** How `profile` was determined - see `ProfileResolution`'s own docs. */
  profileResolution: ProfileResolution;
  /** Load the persisted profile from AsyncStorage. Called once on app launch. */
  hydrate: () => Promise<void>;
  save: (input: ProfileInput) => Promise<Profile>;
  reset: () => Promise<void>;
  updateFlags: (flags: Partial<Profile>) => void;
  /**
   * Adds a new profile to the registry via `profileRepo.createProfile()`.
   * Never touches `profile.current`, never activates the new profile, and
   * never changes the in-memory `profile` - the caller must separately call
   * `switchActiveProfile()` if it wants to switch to what was just created.
   * Returns the repository's full tagged result unchanged, including every
   * validation/storage failure status.
   */
  createAdditionalProfile: (input: ProfileInput) => Promise<CreateProfileResult>;
  /**
   * Switches the active registry profile via `profileRepo.setActiveProfile()`.
   * Updates the in-memory `profile` ONLY when the repository reports
   * `status: 'activated'` - every other status (including an unexpected
   * rejection, caught defensively below) leaves the previously-loaded
   * profile completely untouched. Never writes `profile.current`, never
   * touches Remedies storage directly. Takes a profile id rather than a
   * caller-supplied `Profile` object, since the repository is what verifies
   * the id actually exists before activating it.
   */
  switchActiveProfile: (profileId: string) => Promise<SetActiveProfileResult>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  hydrated: false,
  profileResolution: 'legacy',

  hydrate: async () => {
    try {
      // Migration writes only `profiles.all`/`profiles.activeId`, never
      // `profile.current` - but `resolveActiveProfile()` below now reads the
      // registry, so it must only run once migration (if any is pending)
      // has settled. `runStartupMigration()`'s own singleton means this is
      // never a second, independent migration run - it shares whatever run
      // `app/_layout.tsx` already kicked off (or starts the only run, if
      // this happens to be the first caller). Any rejection is already
      // logged inside `runStartupMigration()` itself (`logMigrationFailure`)
      // - swallowed here so hydration proceeds regardless of why migration
      // did or didn't succeed; see `resolveActiveProfile()` for why a
      // classified abort and a swallowed rejection are handled identically.
      await runStartupMigration().catch(() => {});

      const { profile, resolution } = await resolveActiveProfile();
      set({ profile, profileResolution: resolution, hydrated: true });
    } catch {
      // Storage unreadable - start clean rather than blocking the launch.
      set({ profile: null, profileResolution: 'legacy', hydrated: true });
    }
  },

  save: async (input) => {
    const profile = await profileRepo.save(input);
    set({ profile, profileResolution: 'legacy' });
    return profile;
  },

  reset: async () => {
    await profileRepo.clear();
    set({ profile: null, profileResolution: 'legacy' });
  },

  updateFlags: (flags) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...flags } : null,
    }));
  },

  createAdditionalProfile: async (input) => {
    return profileRepo.createProfile(input);
  },

  switchActiveProfile: async (profileId) => {
    try {
      const result = await profileRepo.setActiveProfile(profileId);
      if (result.status === 'activated') {
        set({ profile: result.profile, profileResolution: 'resolved' });
      }
      return result;
    } catch (error) {
      // `profileRepo.setActiveProfile()` is designed to never reject (every
      // failure is reported via a tagged status instead - see repo.ts) -
      // this is a defensive safety net only, matching the same discipline
      // already established for `runStartupMigration()`'s rejection
      // recovery. In-memory state is left completely untouched (the `set()`
      // above is never reached on this path), and a synthetic
      // `write_failure` is returned so every caller can treat this action's
      // result uniformly - a tagged status, never a thrown exception to
      // separately handle.
      return { status: 'write_failure', error };
    }
  },
}));
