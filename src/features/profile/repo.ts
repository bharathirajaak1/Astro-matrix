/**
 * Profile persistence. Two coexisting layers:
 *
 *  - LEGACY: a single profile at `profile.current` (`getCurrent` / `save` /
 *    `clear`) - unchanged from v1, still the only thing onboarding writes
 *    to. Kept exactly as-is per the approved Stage 2 plan: a frozen
 *    compatibility backup, never redefined to mean "the active profile."
 *  - REGISTRY (Stage 3): multiple saved profiles at `profiles.all`, with
 *    `profiles.activeId` naming which one is active. `createProfile` /
 *    `updateProfile` / `setActiveProfile` / `getActiveProfile` operate
 *    here; `getAll` / `getById` are redefined to read this registry
 *    instead of the single legacy slot, matching this file's own original
 *    intent ("the API is already list-shaped... so multi-profile can land
 *    later without touching callers") - nothing in production calls
 *    either today, so this redefinition is safe.
 *
 * Not wired into onboarding, profile-switching UI, or Remedies yet - this
 * module only establishes the repository surface and (Stage 5a) its shared
 * mutation queue. `src/features/profile/startup.ts` is the one other caller
 * of that queue today, via `enqueueRegistryMutation` (exported below) - see
 * that export's own doc comment for why migration needed to join it.
 */
import type { NumerologySystem, Profile } from '@/core/types';
import { getItem, removeItem, setItem } from '@/lib/storage';
import { readClassified, type StorageReadResult } from './registryStorage';
import {
  isValidActiveId,
  isValidDob,
  isValidFullName,
  isValidNumerologySystem,
  isValidProfileArray,
} from './validation';

const CURRENT_KEY = 'profile.current';
// Duplicated from `migration.ts`'s own local constants rather than shared,
// since migration.ts is out of scope for this stage and must not be
// touched - these are the exact same approved key names, not new ones.
const PROFILES_ALL_KEY = 'profiles.all';
const ACTIVE_ID_KEY = 'profiles.activeId';

export interface ProfileInput {
  fullName: string;
  /** ISO 'YYYY-MM-DD'. */
  dob: string;
  system: NumerologySystem;
}

/** Any subset of `ProfileInput`'s fields - `id`/`createdAt` are never
 *  part of this shape, so a caller can't accidentally request changing
 *  either through `updateProfile`. */
export type ProfileUpdateInput = Partial<ProfileInput>;

function generateId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type CreateProfileResult =
  | { status: 'created'; profile: Profile }
  | { status: 'invalid_input'; reason: string }
  | { status: 'registry_malformed'; raw: string }
  | { status: 'registry_read_failure'; error: unknown }
  | { status: 'write_failure'; error: unknown };

export type UpdateProfileResult =
  | { status: 'updated'; profile: Profile }
  | { status: 'not_found' }
  | { status: 'invalid_input'; reason: string }
  | { status: 'registry_malformed'; raw: string }
  | { status: 'registry_read_failure'; error: unknown }
  | { status: 'write_failure'; error: unknown };

export type SetActiveProfileResult =
  | { status: 'activated'; profile: Profile }
  | { status: 'not_found' }
  | { status: 'registry_malformed'; raw: string }
  | { status: 'registry_read_failure'; error: unknown }
  | { status: 'write_failure'; error: unknown };

export type FindProfileResult =
  | { status: 'found'; profile: Profile }
  | { status: 'not_found' }
  | { status: 'malformed'; raw: string }
  | { status: 'read_failure'; error: unknown };

export type ActiveProfileResult =
  | { status: 'resolved'; profile: Profile }
  | { status: 'unset' }
  | { status: 'dangling'; activeId: string }
  | { status: 'registry_malformed'; raw: string }
  | { status: 'registry_read_failure'; error: unknown }
  | { status: 'active_id_malformed'; raw: string }
  | { status: 'active_id_read_failure'; error: unknown };

/**
 * Serializes every `profiles.all` / `profiles.activeId` read-modify-write
 * cycle so two operations initiated close together can never both read the
 * same starting state and then each write back a version that clobbers the
 * other's change. Mirrors the write queue already established in
 * `ritualStore.ts`'s `enqueuePersist`: a rejected operation still rejects to
 * its own caller, but never permanently blocks whatever is enqueued next.
 *
 * Exported (Stage 5a) because this is no longer purely an internal detail of
 * `createProfile`/`updateProfile`/`setActiveProfile` below - ANY code that
 * performs a read-modify-write against `profiles.all` or `profiles.activeId`
 * must route it through this exact queue, including
 * `src/features/profile/startup.ts`'s `runStartupMigration()`, which wraps
 * its call to `migrateLegacyProfileToRegistry()` (from `migration.ts`) in
 * this same primitive. That migration module itself is untouched and has no
 * knowledge of this queue - the wrapping happens entirely at the call site
 * in `startup.ts`, not inside `migration.ts`, so the migration algorithm's
 * own behavior and result types are unaffected by this change.
 *
 * Deliberately NOT applied to pure reads (`getAll` / `getById` /
 * `getActiveProfile`) or to the unrelated legacy `profile.current` key
 * (`getCurrent` / `save` / `clear`) - serializing those would add latency
 * with no corresponding correctness benefit, since nothing else performs a
 * conflicting read-modify-write against either.
 */
let registryMutationQueue: Promise<unknown> = Promise.resolve();

export function enqueueRegistryMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = registryMutationQueue.then(operation, operation);
  registryMutationQueue = result.catch(() => {});
  return result;
}

export const profileRepo = {
  // --- Legacy (unchanged from v1) ---

  async getCurrent(): Promise<Profile | null> {
    return getItem<Profile>(CURRENT_KEY);
  },

  /**
   * Create or update the current (single, legacy) profile. Keeps `id` /
   * `createdAt` stable for an edit to the same person (name/DOB unchanged
   * - e.g. fixing the numerology system). Generates a new `id` (and
   * `createdAt`) when `fullName` or `dob` actually changes, since those
   * are this app's identity signals - everything keyed to the old `id`
   * (e.g. Remedies ritual progress) should not carry over to what is, in
   * effect, a different person.
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

  // --- Registry (Stage 3) ---

  /** Every saved profile, in stored order. Distinguishes absent / valid
   *  (including empty) / malformed / read_failure explicitly - never
   *  collapses malformed or unreadable data into an empty list. */
  async getAll(): Promise<StorageReadResult<Profile[]>> {
    return readClassified<Profile[]>(PROFILES_ALL_KEY, isValidProfileArray);
  },

  async getById(id: string): Promise<FindProfileResult> {
    const result = await readClassified<Profile[]>(PROFILES_ALL_KEY, isValidProfileArray);
    if (result.status === 'malformed' || result.status === 'read_failure') {
      return result;
    }
    const registry = result.status === 'ok' ? result.value : [];
    const found = registry.find((p) => p.id === id);
    return found ? { status: 'found', profile: found } : { status: 'not_found' };
  },

  /** Resolves `profiles.activeId` against `profiles.all`. Never falls
   *  back to `profile.current`, and never repairs a dangling pointer -
   *  only reports which of the explicit states applies. */
  async getActiveProfile(): Promise<ActiveProfileResult> {
    const registryResult = await readClassified<Profile[]>(PROFILES_ALL_KEY, isValidProfileArray);
    if (registryResult.status === 'malformed') {
      return { status: 'registry_malformed', raw: registryResult.raw };
    }
    if (registryResult.status === 'read_failure') {
      return { status: 'registry_read_failure', error: registryResult.error };
    }
    const registry = registryResult.status === 'ok' ? registryResult.value : [];

    const activeIdResult = await readClassified<string | null>(ACTIVE_ID_KEY, isValidActiveId);
    if (activeIdResult.status === 'malformed') {
      return { status: 'active_id_malformed', raw: activeIdResult.raw };
    }
    if (activeIdResult.status === 'read_failure') {
      return { status: 'active_id_read_failure', error: activeIdResult.error };
    }
    const activeId = activeIdResult.status === 'ok' ? activeIdResult.value : null;

    if (activeId === null) return { status: 'unset' };

    const profile = registry.find((p) => p.id === activeId);
    return profile ? { status: 'resolved', profile } : { status: 'dangling', activeId };
  },

  /** Always generates a fresh id and appends - never deduplicates by name
   *  or DOB, so two different people (or the same person entered twice)
   *  can coexist as distinct entries. Never touches `profiles.activeId`. */
  async createProfile(input: ProfileInput): Promise<CreateProfileResult> {
    const trimmedName = input.fullName.trim();
    if (!isValidFullName(trimmedName)) {
      return { status: 'invalid_input', reason: 'fullName must be non-empty' };
    }
    if (!isValidDob(input.dob)) {
      return { status: 'invalid_input', reason: 'dob must be a real, past calendar date in YYYY-MM-DD form' };
    }
    // Defensive: `input.system` is typed as `NumerologySystem` at compile
    // time, but a value reaching this function from an untyped boundary
    // (e.g. `as any`, or a caller that bypasses the type) must still be
    // rejected at runtime rather than written unvalidated.
    if (!isValidNumerologySystem(input.system)) {
      return { status: 'invalid_input', reason: 'system must be a supported numerology system' };
    }

    return enqueueRegistryMutation(async () => {
      const registryResult = await readClassified<Profile[]>(PROFILES_ALL_KEY, isValidProfileArray);
      if (registryResult.status === 'malformed') {
        return { status: 'registry_malformed', raw: registryResult.raw };
      }
      if (registryResult.status === 'read_failure') {
        return { status: 'registry_read_failure', error: registryResult.error };
      }
      const registry = registryResult.status === 'ok' ? registryResult.value : [];

      const profile: Profile = {
        id: generateId(),
        fullName: trimmedName,
        dob: input.dob,
        system: input.system,
        createdAt: new Date().toISOString(),
      };

      try {
        await setItem(PROFILES_ALL_KEY, [...registry, profile]);
      } catch (error) {
        return { status: 'write_failure', error };
      }

      return { status: 'created', profile };
    });
  },

  /** Updates only the entry whose id matches exactly - rejects unknown
   *  ids rather than creating one, preserves `id`/`createdAt` always, and
   *  never touches `profiles.activeId`. Unspecified fields keep their
   *  existing value. */
  async updateProfile(id: string, input: ProfileUpdateInput): Promise<UpdateProfileResult> {
    return enqueueRegistryMutation(async () => {
      const registryResult = await readClassified<Profile[]>(PROFILES_ALL_KEY, isValidProfileArray);
      if (registryResult.status === 'malformed') {
        return { status: 'registry_malformed', raw: registryResult.raw };
      }
      if (registryResult.status === 'read_failure') {
        return { status: 'registry_read_failure', error: registryResult.error };
      }
      const registry = registryResult.status === 'ok' ? registryResult.value : [];

      const index = registry.findIndex((p) => p.id === id);
      if (index === -1) return { status: 'not_found' };
      const existing = registry[index] as Profile;

      const trimmedName = input.fullName !== undefined ? input.fullName.trim() : existing.fullName;
      if (!isValidFullName(trimmedName)) {
        return { status: 'invalid_input', reason: 'fullName must be non-empty' };
      }
      const dob = input.dob !== undefined ? input.dob : existing.dob;
      if (!isValidDob(dob)) {
        return { status: 'invalid_input', reason: 'dob must be a real, past calendar date in YYYY-MM-DD form' };
      }
      const system = input.system !== undefined ? input.system : existing.system;
      // Validates the COMPLETE resulting value, including `system`
      // inherited unchanged from `existing` when omitted from `input` -
      // not just whatever was newly supplied.
      if (!isValidNumerologySystem(system)) {
        return { status: 'invalid_input', reason: 'system must be a supported numerology system' };
      }

      const updated: Profile = { id: existing.id, fullName: trimmedName, dob, system, createdAt: existing.createdAt };
      const nextRegistry = [...registry];
      nextRegistry[index] = updated;

      try {
        await setItem(PROFILES_ALL_KEY, nextRegistry);
      } catch (error) {
        return { status: 'write_failure', error };
      }

      return { status: 'updated', profile: updated };
    });
  },

  /** Activates an existing profile only - verifies it exists in a valid
   *  registry BEFORE writing the pointer, rejects unknown ids, and never
   *  creates, deletes, updates, or reorders anything in `profiles.all`.
   *  Routed through the shared registry queue (Stage 5a) because it reads
   *  `profiles.all` before deciding whether to write - without the queue, a
   *  concurrent `createProfile`/`updateProfile` (or migration) could commit
   *  a registry change after this method's read but before its write,
   *  letting it activate an id that reflects stale registry state. */
  async setActiveProfile(id: string): Promise<SetActiveProfileResult> {
    return enqueueRegistryMutation(async () => {
      const registryResult = await readClassified<Profile[]>(PROFILES_ALL_KEY, isValidProfileArray);
      if (registryResult.status === 'malformed') {
        return { status: 'registry_malformed', raw: registryResult.raw };
      }
      if (registryResult.status === 'read_failure') {
        return { status: 'registry_read_failure', error: registryResult.error };
      }
      const registry = registryResult.status === 'ok' ? registryResult.value : [];

      const profile = registry.find((p) => p.id === id);
      if (!profile) return { status: 'not_found' };

      try {
        await setItem(ACTIVE_ID_KEY, id);
      } catch (error) {
        return { status: 'write_failure', error };
      }

      return { status: 'activated', profile };
    });
  },
};
