import { create } from 'zustand';
import { getItem, setItem } from '@/lib/storage';
import { todayISO } from '@/lib/date';
import { addDays } from '@/core/forecast';
import type { Digit, Profile } from '@/core/types';
import { resolveActiveNumber } from '@/services/questEngine';

const RITUAL_STORAGE_KEY = 'remedies.rituals';

/** A section of the current day's practice. */
export type PracticePart = 'morning' | 'afternoon' | 'night';

const ALL_PARTS: readonly PracticePart[] = ['morning', 'afternoon', 'night'];

/**
 * The canonical persisted shape for the 21-day cycle. This - and only this -
 * is what is written to AsyncStorage; `activeNumber` and the resolved
 * `PracticeDay` are deliberately never part of it, since both are derived
 * (via `resolveActiveNumber`/`resolveActivePracticeDay` in
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
 *    finished: record it into `completedCycleNumbers` and restart at day 1,
 *    PROVIDED `missingNumbers` was supplied (needed to resolve who was
 *    active). If not supplied, defer the transition rather than guess - a
 *    later call that does supply it will complete it.
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

  const justFinished = resolveActiveNumber(missingNumbers, data.completedCycleNumbers);
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

export const useRitualStore = create<RitualState>((set, get) => ({
  ...DEFAULT_STATE,
  ...legacyCompatFrom(DEFAULT_STATE),
  hydrated: false,

  hydrate: async (profile, missingNumbers) => {
    const activeProfileId = profile?.id ?? null;
    try {
      const stored = await getItem<RitualPersistenceData>(RITUAL_STORAGE_KEY);

      // Only ever hydrate valid 21-day cycle data written by this same
      // profile. No active profile, no stored data, a mismatched profileId,
      // or legacy pre-migration data are all treated as "not this profile's
      // cycle" - never silently inherited or misread.
      if (stored && isCycleData(stored) && activeProfileId !== null && stored.profileId === activeProfileId) {
        const today = todayISO();
        const reconciled = reconcileForNewDay(stored, today, missingNumbers);

        // Persist the reconciliation immediately so a later relaunch doesn't
        // see the same stale completion date and roll over again.
        if (reconciled !== stored) {
          await setItem(RITUAL_STORAGE_KEY, reconciled);
        }

        set({ ...reconciled, ...legacyCompatFrom(reconciled), hydrated: true });
        return;
      }

      // Not this profile's cycle - start fresh rather than inheriting
      // someone else's (or legacy/unowned) progress.
      const freshState: RitualPersistenceData = { ...DEFAULT_STATE, profileId: activeProfileId };
      if (activeProfileId !== null) {
        await setItem(RITUAL_STORAGE_KEY, freshState);
      }
      set({ ...freshState, ...legacyCompatFrom(freshState), hydrated: true });
    } catch {
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
      completedCycleNumbers: state.completedCycleNumbers,
      lastCompletedDate: today,
      lastCycleCompletionDate: dayNowComplete ? today : state.lastCycleCompletionDate,
      streakDays: nextStreak,
    };

    set({ ...updatedData, ...legacyCompatFrom(updatedData) });
    await setItem(RITUAL_STORAGE_KEY, updatedData);
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
    await setItem(RITUAL_STORAGE_KEY, advanced);
  },

  resetRituals: async () => {
    const freshState = { ...DEFAULT_STATE };
    set({ ...freshState, ...legacyCompatFrom(freshState), hydrated: true });
    await setItem(RITUAL_STORAGE_KEY, freshState);
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
