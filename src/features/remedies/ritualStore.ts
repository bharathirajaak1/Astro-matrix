import { create } from 'zustand';
import { getItem, setItem } from '@/lib/storage';
import { todayISO } from '@/lib/date';
import { addDays } from '@/core/forecast';
import { orderByLoShuLayout } from '@/core/loShu';
import type { Digit, Profile } from '@/core/types';

const RITUAL_STORAGE_KEY = 'remedies.rituals';

/**
 * The storage key a given profile's ritual progress is written to and read
 * from. Each profile gets its own key - `remedies.rituals.<profileId>` -
 * rather than every profile sharing the single `RITUAL_STORAGE_KEY` record.
 * This is the structural fix for the data-loss risk investigated earlier:
 * with per-profile keys, one profile's writes (via `enqueuePersist` below,
 * which derives the key from the data's own `profileId`) can never land on
 * - and so can never overwrite - a different profile's data, no matter when
 * either profile happens to write or in what order. `null` (no active
 * profile) falls back to the original shared key, matching the pre-existing
 * behavior for that case - in practice nothing ever persists with a `null`
 * profileId through the normal UI flow.
 */
export function ritualStorageKeyForProfile(profileId: string | null): string {
  return profileId ? `${RITUAL_STORAGE_KEY}.${profileId}` : RITUAL_STORAGE_KEY;
}

/** A section of the current day's practice. */
export type PracticePart = 'morning' | 'afternoon' | 'night';

const ALL_PARTS: readonly PracticePart[] = ['morning', 'afternoon', 'night'];

/**
 * The canonical persisted shape for the 21-day cycle. This - and only this -
 * is what is written to AsyncStorage; the active/focus number and the
 * resolved `PracticeDay` are deliberately never part of it, since both are
 * derived (via `resolveCurrentFocusNumber`/`resolveActivePracticeDay` in
 * `src/services/questEngine.ts`) from this state plus the profile's current
 * missing numbers - never stored redundantly here.
 */
export interface RitualPersistenceData {
  /**
   * The `Profile.id` this cycle belongs to, or `null` for legacy/unowned data
   * (persisted before profile ownership existed) or when there is no active
   * profile yet. Never silently reassigned to a different profile - see
   * `hydrate()`.
   */
  profileId: string | null;
  /** 1-21: the day of the *currently active number's* cycle in progress. */
  cycleDay: number;
  /** Sections completed for the current `cycleDay`. Reset on every calendar-
   *  day rollover. */
  completedParts: PracticePart[];
  /**
   * The `PracticeDay.id` (e.g. "n3-d5") that Color Cue / Body & Breath Reset
   * were each last marked done for, or `null` if not done for the current
   * day. The caller (`remedies.tsx`) compares this against the current
   * `practiceDay.id` - a stale value from a previous day simply stops
   * matching once the day changes, so neither field needs to be explicitly
   * cleared on a day transition (`advanceIfDayComplete` already carries them
   * through unchanged via its own spread). Older stored records written
   * before these fields existed hydrate with `undefined` here - `hydrate()`
   * normalizes that to `null` before use.
   */
  colorCueDoneForDayId: string | null;
  resetDoneForDayId: string | null;
  /** Numbers whose full 21-day cycle has finished. */
  completedCycleNumbers: Digit[];
  /** Last calendar date on which ANY ONE section was completed - drives the
   *  streak. Distinct from `lastCycleCompletionDate` below. */
  lastCompletedDate: string | null;
  /**
   * Last calendar date on which ALL THREE sections for that day were
   * completed, or `null` if the current day isn't fully complete yet.
   * `cycleDay` only advances (and a finished 21st day only gets recorded into
   * `completedCycleNumbers`) once a real calendar day has passed since this
   * date - never immediately on same-day completion. See `hydrate()`.
   */
  lastCycleCompletionDate: string | null;
  streakDays: number;
}

/**
 * Legacy fields/actions kept so the current (not-yet-migrated) Remedies UI
 * and Home screen continue to compile and run unchanged. Every one of these
 * is purely DERIVED from `RitualPersistenceData` above (recomputed by
 * `legacyCompatFrom()` after every state change) or DELEGATES to
 * `completeSection()` - none of it is independently persisted, so there is
 * only ever one source of truth on disk. Remove once the UI is migrated.
 */
export type RitualPeriod = 'morning' | 'midday' | 'evening';

export interface RitualPackProgress {
  morning: boolean;
  midday: boolean;
  evening: boolean;
}

interface LegacyCompatState {
  /** = `cycleDay`. The old UI displays this as "Day {questDay} of 7"; it
   *  will read oddly once `cycleDay` exceeds 7, which is expected and left
   *  for the UI migration step to address. */
  questDay: number;
  /** = `completedCycleNumbers`. */
  completedNumbers: number[];
  /** = `completedParts`, reshaped into the old morning/midday/evening map. */
  dailyPackItems: RitualPackProgress;
  /** = `completedParts.length === 3`. */
  dailyPackCompleted: boolean;
  /** = `lastCycleCompletionDate`. */
  lastQuestCompletionDate: string | null;
}

export interface RitualState extends RitualPersistenceData, LegacyCompatState {
  hydrated: boolean;
  /**
   * `missingNumbers` is optional so existing call sites (which predate the
   * 21-day cycle and only ever pass `profile`) keep compiling. Without it,
   * a calendar rollover that lands exactly on crossing a finished 21st day
   * is deferred (not guessed at) until a caller that provides it hydrates -
   * see the implementation below.
   */
  hydrate: (profile: Profile | null, missingNumbers?: Digit[]) => Promise<void>;
  /** The one canonical completion action for the new 21-day cycle. Marks a
   *  single section complete - deliberately does NOT itself advance the
   *  practice day, even once all three are done. See
   *  `advancePracticeDayIfComplete` below. */
  completeSection: (part: PracticePart) => Promise<void>;
  /** Marks Color Cue done for the given PracticeDay id, persisting
   *  immediately. See `colorCueDoneForDayId` above for how staleness across
   *  a day transition is handled without any explicit clearing here. */
  markColorCueDone: (dayId: string) => Promise<void>;
  /** Same as `markColorCueDone`, for the Body & Breath Reset prerequisite. */
  markResetDone: (dayId: string) => Promise<void>;
  /**
   * Advances past the current practice day once (and only once) it has been
   * fully completed - immediately, within the same session, regardless of
   * calendar date. Kept as a separate action from `completeSection` rather
   * than folded into it: `completeSection` resolving is what the UI's
   * existing celebration check reads `completedParts` against, and an
   * advance resets `completedParts` for the new day - folding the two
   * together would make that celebration check see an already-reset array.
   * The expected call order is: `completeSection(part)` -> UI reads
   * `completedParts` for its celebration -> `advancePracticeDayIfComplete`.
   * `missingNumbers` is optional for the same reason as on `hydrate` above
   * (only needed to resolve the next number when crossing day 21); a safe
   * no-op when the current day isn't fully complete yet.
   */
  advancePracticeDayIfComplete: (missingNumbers?: Digit[]) => Promise<void>;
  resetRituals: () => Promise<void>;
  /** @deprecated legacy wrapper - delegates to `completeSection('morning')`. */
  completeActiveQuest: (numberToHarmonize: number) => Promise<void>;
  /** @deprecated legacy wrapper - delegates to `completeSection()`. */
  togglePackItem: (period: RitualPeriod) => Promise<void>;
  /** @deprecated legacy wrapper - completes all three sections. */
  completeDailyPack: () => Promise<void>;
}

const DEFAULT_STATE: RitualPersistenceData = {
  profileId: null,
  cycleDay: 1,
  completedParts: [],
  colorCueDoneForDayId: null,
  resetDoneForDayId: null,
  completedCycleNumbers: [],
  lastCompletedDate: null,
  lastCycleCompletionDate: null,
  streakDays: 0,
};

function legacyCompatFrom(data: RitualPersistenceData): LegacyCompatState {
  return {
    questDay: data.cycleDay,
    completedNumbers: data.completedCycleNumbers,
    dailyPackItems: {
      morning: data.completedParts.includes('morning'),
      midday: data.completedParts.includes('afternoon'),
      evening: data.completedParts.includes('night'),
    },
    dailyPackCompleted: data.completedParts.length === ALL_PARTS.length,
    lastQuestCompletionDate: data.lastCycleCompletionDate,
  };
}

/** A stored record only counts as valid 21-day cycle data if it actually has
 *  this shape - legacy pre-migration records (with the old `questDay`/
 *  `dailyPackItems` fields instead) must never be misread as if they were. */
function isCycleData(value: RitualPersistenceData | null): value is RitualPersistenceData {
  return (
    !!value &&
    typeof value.cycleDay === 'number' &&
    Array.isArray(value.completedParts) &&
    Array.isArray(value.completedCycleNumbers)
  );
}

/**
 * Streak on completing a section "today": 1 for a first-ever completion or
 * after a gap of more than one calendar day, +1 if yesterday was the last
 * completed date (consecutive), unchanged if today was already completed.
 * Uses `addDays` (pure calendar-date arithmetic, no elapsed-ms/timezone
 * math) so this agrees with `cycleDay`'s own date handling.
 */
function nextStreakOnCompletion(
  lastCompletedDate: string | null,
  streakDays: number,
  today: string,
): number {
  if (lastCompletedDate === today) return streakDays;
  if (lastCompletedDate === addDays(today, -1)) return streakDays + 1;
  return 1;
}

/**
 * Streak as read back on hydrate: unchanged if the last completion was today
 * or yesterday (the streak is still "live"), reset to 0 if a calendar day was
 * missed (or nothing has ever been completed).
 */
function streakAfterPossibleGap(
  lastCompletedDate: string | null,
  streakDays: number,
  today: string,
): number {
  if (lastCompletedDate === today) return streakDays;
  if (lastCompletedDate === addDays(today, -1)) return streakDays;
  return 0;
}

/**
 * Which missing number's 21-day cycle just finished, under the same rule
 * `resolveCurrentFocusNumber` (in `src/services/questEngine.ts`) uses for
 * its missing-number branch: Lo Shu grid order (`orderByLoShuLayout` -
 * 4, 9, 2, 3, 5, 7, 8, 1, 6), skipping anything already in
 * `completedCycleNumbers`. This intentionally does NOT need `counts` (the
 * Lo Shu digit tallies) or `resolveCurrentFocusNumber`'s least-represented
 * fallback branch - this store has never received `counts` from any
 * caller, and crediting a finished cycle only ever makes sense for a
 * missing number in the first place; there is no equivalent of "finishing
 * a cycle" for a least-represented fallback number, so that branch simply
 * isn't relevant here. Returns `null` when no missing number is eligible
 * (none supplied, or every one already completed) - nothing new to credit.
 */
function resolveJustFinishedNumber(
  missingNumbers: Digit[],
  completedCycleNumbers: Digit[],
): Digit | null {
  const eligible = orderByLoShuLayout(missingNumbers).filter((n) => !completedCycleNumbers.includes(n));
  return eligible.length > 0 ? eligible[0] : null;
}

/**
 * Pure: advances past the current practice day ONLY once it has been marked
 * fully complete (`lastCycleCompletionDate` set) - regardless of how much
 * (or how little) calendar time has passed since. Practice-day progression
 * is deliberately NOT calendar-gated: a day that is not yet fully complete
 * is returned completely unchanged (by reference, so callers can cheaply
 * detect a no-op), however many calendar days have passed with no activity.
 *
 *  - `lastCycleCompletionDate === null` -> the current day isn't fully
 *    complete yet; nothing to advance, nothing reset.
 *  - the day IS complete and `cycleDay < 21` -> advance by exactly one day,
 *    clearing `completedParts` for the new day.
 *  - the day IS complete and `cycleDay === 21` -> that number's cycle is
 *    finished: record it into `completedCycleNumbers` (via
 *    `resolveJustFinishedNumber`, above) and restart at day 1, PROVIDED
 *    `missingNumbers` was supplied. If not supplied, defer the transition
 *    rather than guess - a later call that does supply it will complete it.
 *
 * Used both by `reconcileForNewDay` (the hydrate-time safety net, for an
 * advance that didn't get to run before the app was last closed) and by the
 * live `advancePracticeDayIfComplete` action below (the normal, same-session
 * path - see that action's own docs for why advancing is kept separate from
 * `completeSection`).
 */
function advanceIfDayComplete(
  data: RitualPersistenceData,
  missingNumbers: Digit[] | undefined,
): RitualPersistenceData {
  if (data.lastCycleCompletionDate === null) return data;

  if (data.cycleDay < 21) {
    return {
      ...data,
      cycleDay: data.cycleDay + 1,
      completedParts: [],
      lastCycleCompletionDate: null,
    };
  }

  if (missingNumbers === undefined) return data;

  const justFinished = resolveJustFinishedNumber(missingNumbers, data.completedCycleNumbers);
  const completedCycleNumbers =
    justFinished !== null && !data.completedCycleNumbers.includes(justFinished)
      ? [...data.completedCycleNumbers, justFinished]
      : data.completedCycleNumbers;

  return {
    ...data,
    cycleDay: 1,
    completedParts: [],
    completedCycleNumbers,
    lastCycleCompletionDate: null,
  };
}

/**
 * The hydrate-time counterpart to `advanceIfDayComplete` above: recomputes
 * the streak-on-a-gap first (always, every hydrate - matching the
 * pre-existing "always recompute on load" behavior so a stale streak is
 * never silently kept), then applies the same calendar-independent advance
 * logic as a safety net, in case a completed day didn't get to advance
 * before the app was last closed.
 */
function reconcileForNewDay(
  stored: RitualPersistenceData,
  today: string,
  missingNumbers: Digit[] | undefined,
): RitualPersistenceData {
  const streakDays = streakAfterPossibleGap(stored.lastCompletedDate, stored.streakDays, today);
  return advanceIfDayComplete({ ...stored, streakDays }, missingNumbers);
}

/** Structural equality for two persisted records - used by `hydrate()` to
 *  skip writing back a reconciliation that didn't actually change anything.
 *  (The previous check compared object references, which was always false -
 *  `reconcileForNewDay` returns a new object via its own spread even when
 *  every field is unchanged - so hydrate() unconditionally rewrote the key
 *  on every single launch. That spurious write is itself one more write
 *  that could land out of order relative to a genuine in-flight completion,
 *  so removing it shrinks the risk surface, not just the I/O.) */
function isSamePersistedData(a: RitualPersistenceData, b: RitualPersistenceData): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Serializes every write this store makes (across every profile - see
 * `ritualStorageKeyForProfile` above for why that's safe) so that two store
 * actions initiated close together (e.g. a prerequisite tap and the
 * `completeSection('morning')` it automatically triggers) can never have
 * their writes land on disk out of the order they were initiated in - each
 * write now waits for every previously-enqueued write to settle (success OR
 * failure) before its own `setItem` call starts.
 *
 * This fixes write ORDERING, not write FRESHNESS: each write's payload is
 * still whatever the caller already built from `get()`/`getItem()` before
 * calling this - queuing does not re-fetch or merge against newer state.
 * A caller that read stale data will still enqueue a stale payload; this
 * only guarantees that payload is written in turn, not jumped ahead of or
 * landed after a fresher one that was enqueued later. In the current call
 * sites this is sufficient because `hydrate()` only ever runs before the UI
 * becomes interactive (gated by `hydrated` in `remedies.tsx`) or on a
 * genuine subsequent profile change (gated by `lastHydratedProfileRef` in
 * `app/_layout.tsx`) - neither can race a live completion tap today.
 *
 * A rejected write is never silently swallowed - the promise returned to
 * the caller still rejects - but it also never permanently blocks the
 * queue: the internal continuation always proceeds to the next write
 * regardless of whether the previous one succeeded or failed.
 */
let writeQueueTail: Promise<void> = Promise.resolve();

function enqueuePersist(data: RitualPersistenceData): Promise<void> {
  const key = ritualStorageKeyForProfile(data.profileId);
  const thisWrite = writeQueueTail.then(() => setItem(key, data));
  writeQueueTail = thisWrite.catch(() => {});
  return thisWrite;
}

/**
 * Incremented once per `hydrate()` invocation so each call can tell whether
 * a *later* `hydrate()` (e.g. for a profile switched to while this one was
 * still awaiting storage reads) has since started. This guards the
 * in-memory `set()` calls only - persistence already lands on the correct
 * profile-scoped key regardless of ordering (see `enqueuePersist` above), so
 * an older call's writes are never cancelled, only its own stale `set()` is.
 */
let hydrateGeneration = 0;

export const useRitualStore = create<RitualState>((set, get) => ({
  ...DEFAULT_STATE,
  ...legacyCompatFrom(DEFAULT_STATE),
  hydrated: false,

  hydrate: async (profile, missingNumbers) => {
    // Captured once, up front - compared against the live counter right
    // before each final `set()` below so a since-superseded call never
    // overwrites a newer profile's in-memory state.
    const myGeneration = ++hydrateGeneration;
    const activeProfileId = profile?.id ?? null;
    try {
      // Look for this profile's own data first - going forward, every
      // profile's progress lives only at its own key (see
      // `ritualStorageKeyForProfile`), so this alone can never surface a
      // different profile's data.
      const scoped = activeProfileId !== null
        ? await getItem<RitualPersistenceData>(ritualStorageKeyForProfile(activeProfileId))
        : null;

      let stored: RitualPersistenceData | null = null;
      // True only when the match came from the legacy shared key - the one
      // case where this hydrate should migrate the record forward to this
      // profile's own key, so it's never read from (or written to) the
      // shared key again afterward.
      let migratingFromLegacyKey = false;

      if (scoped && isCycleData(scoped) && activeProfileId !== null && scoped.profileId === activeProfileId) {
        stored = scoped;
      } else if (activeProfileId !== null) {
        // Back-compat only: data written before per-profile keys existed
        // lives at the single shared `RITUAL_STORAGE_KEY`. Only ever claim
        // it if it genuinely belongs to this profile - never for anyone
        // else, and never written back to that shared key again once found
        // here (see `migratingFromLegacyKey` below).
        const legacy = await getItem<RitualPersistenceData>(RITUAL_STORAGE_KEY);
        if (legacy && isCycleData(legacy) && legacy.profileId === activeProfileId) {
          stored = legacy;
          migratingFromLegacyKey = true;
        }
      }

      if (stored) {
        // Older stored records predate `colorCueDoneForDayId`/
        // `resetDoneForDayId` - treat a missing field as `null` (not done)
        // rather than `undefined`, so every subsequent `=== practiceDay.id`
        // comparison behaves exactly as if the field had always existed.
        const normalized: RitualPersistenceData = {
          ...stored,
          colorCueDoneForDayId: stored.colorCueDoneForDayId ?? null,
          resetDoneForDayId: stored.resetDoneForDayId ?? null,
        };
        const today = todayISO();
        const reconciled = reconcileForNewDay(normalized, today, missingNumbers);

        // Persist the reconciliation (to this profile's own key, via
        // `enqueuePersist`) so a later relaunch doesn't see the same stale
        // completion date and roll over again, or so a legacy-key record
        // gets migrated onto this profile's own key - but only if something
        // actually needs writing (see `isSamePersistedData`).
        if (migratingFromLegacyKey || !isSamePersistedData(reconciled, stored)) {
          await enqueuePersist(reconciled);
        }

        // A newer hydrate() (different profile) started while the above
        // awaited - its result should win, not this stale one.
        if (myGeneration !== hydrateGeneration) return;
        set({ ...reconciled, ...legacyCompatFrom(reconciled), hydrated: true });
        return;
      }

      // No data owned by this profile exists anywhere (a genuinely new
      // profile, or an active profile whose id simply doesn't match
      // whatever is currently stored under any key this hydrate checked) -
      // represent a clean slate in memory ONLY. Deliberately does not
      // persist anything here, unlike before: every subsequent write this
      // profile makes (`completeSection`, `markColorCueDone`, etc.) is
      // already keyed by its OWN `profileId` via `enqueuePersist` ->
      // `ritualStorageKeyForProfile`, so it can only ever land on this
      // profile's own storage slot - never on a different profile's key or
      // on the shared legacy key - regardless of how many actions this
      // profile performs, in what order, or how soon after this hydrate.
      // No separate "wait for the first action" special-case is needed for
      // that guarantee to hold, and no other profile's stored record is
      // read, modified, or persisted to on this path.
      const freshState: RitualPersistenceData = { ...DEFAULT_STATE, profileId: activeProfileId };
      if (myGeneration !== hydrateGeneration) return;
      set({ ...freshState, ...legacyCompatFrom(freshState), hydrated: true });
    } catch {
      if (myGeneration !== hydrateGeneration) return;
      set({ hydrated: true });
    }
  },

  completeSection: async (part: PracticePart) => {
    const state = get();
    if (state.completedParts.includes(part)) {
      // Already completed today - avoid duplicate effects entirely.
      return;
    }

    const today = todayISO();
    const completedParts = [...state.completedParts, part];
    const dayNowComplete = completedParts.length === ALL_PARTS.length;
    const nextStreak = nextStreakOnCompletion(state.lastCompletedDate, state.streakDays, today);

    const updatedData: RitualPersistenceData = {
      profileId: state.profileId,
      cycleDay: state.cycleDay,
      completedParts,
      colorCueDoneForDayId: state.colorCueDoneForDayId,
      resetDoneForDayId: state.resetDoneForDayId,
      completedCycleNumbers: state.completedCycleNumbers,
      lastCompletedDate: today,
      lastCycleCompletionDate: dayNowComplete ? today : state.lastCycleCompletionDate,
      streakDays: nextStreak,
    };

    set({ ...updatedData, ...legacyCompatFrom(updatedData) });
    await enqueuePersist(updatedData);
  },

  /** Marks Color Cue done for the given PracticeDay id, persisting
   *  immediately - mirrors `completeSection`'s persist-then-set pattern.
   *  The `=== practiceDay.id` comparison (done by the caller) is what makes
   *  this naturally read as "not done" again once the day changes; nothing
   *  here needs to clear it on a day transition. */
  markColorCueDone: async (dayId: string) => {
    const state = get();
    if (state.colorCueDoneForDayId === dayId) {
      // Already marked for this day - avoid a redundant write.
      return;
    }

    const updatedData: RitualPersistenceData = {
      profileId: state.profileId,
      cycleDay: state.cycleDay,
      completedParts: state.completedParts,
      colorCueDoneForDayId: dayId,
      resetDoneForDayId: state.resetDoneForDayId,
      completedCycleNumbers: state.completedCycleNumbers,
      lastCompletedDate: state.lastCompletedDate,
      lastCycleCompletionDate: state.lastCycleCompletionDate,
      streakDays: state.streakDays,
    };

    set({ ...updatedData, ...legacyCompatFrom(updatedData) });
    await enqueuePersist(updatedData);
  },

  /** Same as `markColorCueDone`, for the Body & Breath Reset prerequisite. */
  markResetDone: async (dayId: string) => {
    const state = get();
    if (state.resetDoneForDayId === dayId) {
      // Already marked for this day - avoid a redundant write.
      return;
    }

    const updatedData: RitualPersistenceData = {
      profileId: state.profileId,
      cycleDay: state.cycleDay,
      completedParts: state.completedParts,
      colorCueDoneForDayId: state.colorCueDoneForDayId,
      resetDoneForDayId: dayId,
      completedCycleNumbers: state.completedCycleNumbers,
      lastCompletedDate: state.lastCompletedDate,
      lastCycleCompletionDate: state.lastCycleCompletionDate,
      streakDays: state.streakDays,
    };

    set({ ...updatedData, ...legacyCompatFrom(updatedData) });
    await enqueuePersist(updatedData);
  },

  advancePracticeDayIfComplete: async (missingNumbers?: Digit[]) => {
    const state = get();
    // Nothing to advance while the current practice day isn't fully
    // complete yet - a safe no-op, regardless of how it got here.
    if (state.lastCycleCompletionDate === null) {
      return;
    }

    const current: RitualPersistenceData = {
      profileId: state.profileId,
      cycleDay: state.cycleDay,
      completedParts: state.completedParts,
      colorCueDoneForDayId: state.colorCueDoneForDayId,
      resetDoneForDayId: state.resetDoneForDayId,
      completedCycleNumbers: state.completedCycleNumbers,
      lastCompletedDate: state.lastCompletedDate,
      lastCycleCompletionDate: state.lastCycleCompletionDate,
      streakDays: state.streakDays,
    };
    const advanced = advanceIfDayComplete(current, missingNumbers);
    if (advanced === current) {
      // Deferred (day 21 without missingNumbers yet) - nothing to persist.
      return;
    }

    set({ ...advanced, ...legacyCompatFrom(advanced) });
    await enqueuePersist(advanced);
  },

  resetRituals: async () => {
    const profileId = get().profileId;
    const freshState: RitualPersistenceData = { ...DEFAULT_STATE, profileId };
    set({ ...freshState, ...legacyCompatFrom(freshState), hydrated: true });
    await enqueuePersist(freshState);
  },

  // ---------------------------------------------------------------------
  // Legacy wrappers - delegate to `completeSection`, no independent state.
  // ---------------------------------------------------------------------

  completeActiveQuest: async (_numberToHarmonize: number) => {
    await get().completeSection('morning');
  },

  togglePackItem: async (period: RitualPeriod) => {
    const partForPeriod: Record<RitualPeriod, PracticePart> = {
      morning: 'morning',
      midday: 'afternoon',
      evening: 'night',
    };
    await get().completeSection(partForPeriod[period]);
  },

  completeDailyPack: async () => {
    await get().completeSection('morning');
    await get().completeSection('afternoon');
    await get().completeSection('night');
  },
}));
