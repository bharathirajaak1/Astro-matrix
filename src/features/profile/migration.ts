/**
 * One-time, idempotent, retry-safe migration of the legacy single-profile
 * record (`profile.current`) into the future multi-profile registry
 * (`profiles.all` / `profiles.activeId`).
 *
 * Deliberately NOT wired into app startup, onboarding, or any UI - this
 * module is exercised only against mocked storage in tests. Wiring it in
 * is a separate, later stage.
 *
 * Design notes (per the approved plan and its amendments):
 *
 *  - The registry merge ("data step") and the active-pointer decision
 *    ("pointer step") are evaluated as two INDEPENDENT steps every run,
 *    never short-circuited by each other. This is what makes a retry
 *    after a partial failure (registry write ok, pointer write failed)
 *    safe: re-running finds the data step already satisfied (a no-op)
 *    and simply completes the pointer step on its own, without
 *    re-deciding or re-writing anything that already succeeded.
 *  - No additional "migration marker" or other persisted decision state
 *    is used or needed - the pointer step's own "set only if currently
 *    unset" rule is already idempotent by construction. (This was the
 *    exact question the approved plan's amendment resolved: the marker
 *    was found unnecessary once the no-op check stopped incorrectly
 *    short-circuiting the pointer check too.)
 *  - `profile.current` is only ever READ here, never written.
 *  - If the legacy profile itself can't be safely read (malformed or a
 *    read failure), this run performs NO writes at all - not even
 *    initializing an absent registry to `[]` - since we cannot be
 *    certain there isn't a legacy profile that should have been merged
 *    in first. A later, successful run handles it correctly once legacy
 *    becomes readable again.
 *  - A present-but-invalid/dangling `profiles.activeId` is never
 *    overwritten, cleared, or "repaired" here, and never guessed at -
 *    whether legacy exists or not. What DOES happen (per the approved
 *    correction to the original design): whenever the registry and the
 *    active pointer can both be safely read, this module checks whether
 *    the pointer resolves to a real entry in the (possibly just-merged)
 *    registry, and reports it via `MigrationResult.danglingActiveId` if
 *    not - purely informational, so a later startup-integration stage
 *    doesn't have to re-derive this itself. The pointer's VALUE is never
 *    touched either way; only whether it resolves is reported.
 */
import type { Profile } from '@/core/types';
import { setItem } from '@/lib/storage';
import { readClassified } from './registryStorage';
import { isValidActiveId, isValidProfile, isValidProfileArray } from './validation';

const PROFILES_ALL_KEY = 'profiles.all';
const ACTIVE_ID_KEY = 'profiles.activeId';
const LEGACY_KEY = 'profile.current';

export type DataStepOutcome =
  | 'initialized_empty'
  | 'merged'
  | 'already_present'
  | 'conflict'
  | 'no_legacy'
  | 'aborted';

export type PointerStepOutcome = 'set' | 'left_unchanged' | 'skipped' | 'aborted';

export type UnreadableReason = 'malformed' | 'read_failure';

export interface ProfileConflict {
  id: string;
  registryVersion: Profile;
  legacyVersion: Profile;
}

export interface MigrationResult {
  dataStep: DataStepOutcome;
  pointerStep: PointerStepOutcome;
  conflict?: ProfileConflict;
  /**
   * Present only when the active pointer was readable, non-null, and does
   * NOT match any entry in the final registry. Purely informational - the
   * pointer itself is never overwritten, cleared, or repaired because of
   * this. Absent whenever the pointer is unset, matches a real entry, or
   * couldn't be safely read at all (see `abortReason.activeId` for that).
   */
  danglingActiveId?: string;
  abortReason?: {
    registry?: UnreadableReason | 'write_failure';
    legacy?: UnreadableReason;
    activeId?: UnreadableReason | 'write_failure';
  };
}

function profilesAreEqual(a: Profile, b: Profile): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** `undefined` when the pointer is unset or resolves to a real entry;
 *  otherwise the dangling id itself, verbatim. */
function findDanglingActiveId(currentActiveId: string | null, registry: readonly Profile[]): string | undefined {
  if (currentActiveId === null) return undefined;
  return registry.some((p) => p.id === currentActiveId) ? undefined : currentActiveId;
}

/**
 * Runs the migration once. Safe to call repeatedly (idempotent) and safe
 * to retry after any partial failure - see the module doc comment above.
 */
export async function migrateLegacyProfileToRegistry(): Promise<MigrationResult> {
  const registryRead = await readClassified<Profile[]>(PROFILES_ALL_KEY, isValidProfileArray);
  if (registryRead.status === 'malformed' || registryRead.status === 'read_failure') {
    return {
      dataStep: 'aborted',
      pointerStep: 'skipped',
      abortReason: { registry: registryRead.status },
    };
  }
  const registry: Profile[] = registryRead.status === 'ok' ? registryRead.value : [];
  const registryWasAbsent = registryRead.status === 'absent';

  const legacyRead = await readClassified<Profile>(LEGACY_KEY, isValidProfile);
  if (legacyRead.status === 'malformed' || legacyRead.status === 'read_failure') {
    // Whether there's a legacy profile to merge can't be determined
    // safely - perform NO writes this run, not even initializing an
    // absent registry (see module doc comment).
    return {
      dataStep: 'aborted',
      pointerStep: 'skipped',
      abortReason: { legacy: legacyRead.status },
    };
  }
  const legacy: Profile | null = legacyRead.status === 'ok' ? legacyRead.value : null;

  // --- Case B: no legacy profile to migrate. No merge, no pointer write -
  // but the pointer is still independently checked for danglingness, since
  // that check needs no legacy profile to be meaningful.
  if (legacy === null) {
    let finalRegistry = registry;
    if (registryWasAbsent) {
      try {
        await setItem(PROFILES_ALL_KEY, []);
      } catch {
        return { dataStep: 'aborted', pointerStep: 'skipped', abortReason: { registry: 'write_failure' } };
      }
      finalRegistry = [];
    }
    const dataStep: DataStepOutcome = registryWasAbsent ? 'initialized_empty' : 'no_legacy';

    const activeIdRead = await readClassified<string | null>(ACTIVE_ID_KEY, isValidActiveId);
    if (activeIdRead.status === 'malformed' || activeIdRead.status === 'read_failure') {
      // Distinguishes malformed data from a valid-but-dangling id - never
      // classify the former as the latter, and never guess/repair either way.
      return { dataStep, pointerStep: 'aborted', abortReason: { activeId: activeIdRead.status } };
    }
    const currentActiveId = activeIdRead.status === 'ok' ? activeIdRead.value : null;
    const dangling = findDanglingActiveId(currentActiveId, finalRegistry);

    return {
      dataStep,
      pointerStep: 'skipped',
      ...(dangling !== undefined ? { danglingActiveId: dangling } : {}),
    };
  }

  // --- Data step (Case A: a legacy profile exists) ---
  const existingEntry = registry.find((p) => p.id === legacy.id);
  let dataStep: DataStepOutcome;
  let finalRegistry = registry;

  if (existingEntry === undefined) {
    const merged = [...registry, legacy];
    try {
      await setItem(PROFILES_ALL_KEY, merged);
    } catch {
      return { dataStep: 'aborted', pointerStep: 'skipped', abortReason: { registry: 'write_failure' } };
    }
    dataStep = 'merged';
    finalRegistry = merged;
  } else if (profilesAreEqual(existingEntry, legacy)) {
    dataStep = 'already_present';
  } else {
    return {
      dataStep: 'conflict',
      pointerStep: 'skipped',
      conflict: { id: legacy.id, registryVersion: existingEntry, legacyVersion: legacy },
    };
  }

  // --- Pointer step - evaluated INDEPENDENTLY of the data step above,
  // including when the data step was itself a no-op ('already_present').
  // Never reached for 'conflict' or when there's no legacy.id to point at
  // ('initialized_empty' / 'no_legacy') - both returned above already.
  const activeIdRead = await readClassified<string | null>(ACTIVE_ID_KEY, isValidActiveId);
  if (activeIdRead.status === 'malformed' || activeIdRead.status === 'read_failure') {
    return { dataStep, pointerStep: 'aborted', abortReason: { activeId: activeIdRead.status } };
  }
  // 'absent' and a stored explicit `null` are both treated as "unset".
  const currentActiveId = activeIdRead.status === 'ok' ? activeIdRead.value : null;

  if (currentActiveId === null) {
    try {
      await setItem(ACTIVE_ID_KEY, legacy.id);
    } catch {
      return { dataStep, pointerStep: 'aborted', abortReason: { activeId: 'write_failure' } };
    }
    return { dataStep, pointerStep: 'set' };
  }

  // Already set - whether to the legacy id, to some other valid profile,
  // or even to a dangling id that resolves to nothing - never touched or
  // "fixed" here. The dangling case is reported, not corrected.
  const dangling = findDanglingActiveId(currentActiveId, finalRegistry);
  return {
    dataStep,
    pointerStep: 'left_unchanged',
    ...(dangling !== undefined ? { danglingActiveId: dangling } : {}),
  };
}
