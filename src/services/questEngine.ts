import { EXPANDED_REMEDIES, ElaboratedRemedy } from '../data/expandedRemedies';
import { DIGITS } from '@/core/numerology';
import { orderByLoShuLayout } from '@/core/loShu';
import type { Digit } from '@/core/types';
import type { PracticeDay, PracticeLibrary } from '@/data/practiceLibrary';

// Priority Hierarchy: 1 -> 3 -> 4 -> 8 -> 7 -> 6 -> 2 -> 5 -> 9
export const HEALING_PRIORITY_ORDER = [1, 3, 4, 8, 7, 6, 2, 5, 9];

export interface QuestStatus {
  activeNumber: number;
  activeRemedy: ElaboratedRemedy;
  upcomingNumbers: number[];
  healedNumbers: number[];
  overallProgress: number; // 0 to 100
}

export interface DailyRitualPack {
  morning: { title: string; text: string; number: number };
  midday: { title: string; text: string; number: number };
  evening: { title: string; text: string; number: number };
}

export function computeQuestHierarchy(
  missingNumbers: number[],
  completedNumbers: number[] = []
): QuestStatus {
  const remainingMissing = missingNumbers.filter((n) => !completedNumbers.includes(n));
  
  // Highest priority missing number
  const sortedRemaining = HEALING_PRIORITY_ORDER.filter((n) => remainingMissing.includes(n));
  const activeNumber = sortedRemaining.length > 0 ? sortedRemaining[0] : 0;
  const upcomingNumbers = sortedRemaining.slice(1);

  const total = missingNumbers.length;
  const progress = total === 0 ? 100 : Math.round((completedNumbers.length / total) * 100);

  return {
    activeNumber,
    activeRemedy: EXPANDED_REMEDIES[activeNumber] || EXPANDED_REMEDIES[3],
    upcomingNumbers,
    healedNumbers: completedNumbers,
    overallProgress: progress,
  };
}

export function generateDailyRitualPack(
  missingNumbers: number[],
  completedNumbers: number[] = []
): DailyRitualPack {
  const status = computeQuestHierarchy(missingNumbers, completedNumbers);
  const primary = status.activeRemedy;
  const secondaryNumber = status.upcomingNumbers[0] || 4; // defaults to Number 4 structure
  const secondary = EXPANDED_REMEDIES[secondaryNumber] || primary;

  return {
    morning: {
      title: `Morning Activation (${primary.title})`,
      text: `Power Color: ${primary.powerColor.name}\n\nStart your day intentionally. As you dress, choose a ${primary.powerColor.name.toLowerCase()} accessory or item. ${primary.powerColor.description}`,
      number: primary.number,
    },
    midday: {
      title: `Midday Mini-Ritual: ${primary.microRitual.title}`,
      text: `At lunchtime, practice ${primary.microRitual.title}. ${primary.microRitual.whatToDo} — ${primary.microRitual.howToDoIt}`,
      number: primary.number,
    },
    evening: {
      title: `Evening Wind-Down (${secondary.title})`,
      text: `Grounding Reflection\n\nBefore you sleep, take 2 minutes to reflect: What went well today? What did you learn? Write one sentence in your journal about today's journey. Then, set your intention for tomorrow: "I will greet the day with purpose." This quiet reflection builds the Number ${secondary.number} energy of structure and discipline, preparing your mind for rest and renewal.`,
      number: secondary.number,
    },
  };
}

// ---------------------------------------------------------------------------
// New resolvers for the upcoming 21-day Practice Library system.
//
// These are additive and do not replace `computeQuestHierarchy` /
// `generateDailyRitualPack` above, which continue to power the current
// Remedies UI unchanged. They will replace the old functions only once the
// Ritual Store and UI have been migrated in a later step.
// ---------------------------------------------------------------------------

/**
 * Which missing number is currently active, reusing the exact same
 * `HEALING_PRIORITY_ORDER` priority rule as `computeQuestHierarchy` above -
 * just against `completedCycleNumbers` (numbers that have finished their full
 * cycle) instead of the old single-tap `completedNumbers`. Pure and
 * deterministic: no date/hash calculation, no randomness, no mutation of
 * either input array. Returns `null` (never the old sentinel `0`) when every
 * missing number has already completed its cycle.
 */
export function resolveActiveNumber(
  missingNumbers: Digit[],
  completedCycleNumbers: Digit[],
): Digit | null {
  const remainingMissing = missingNumbers.filter((n) => !completedCycleNumbers.includes(n));
  const sortedRemaining = HEALING_PRIORITY_ORDER.filter((n) => remainingMissing.includes(n as Digit));
  return sortedRemaining.length > 0 ? (sortedRemaining[0] as Digit) : null;
}

// ---------------------------------------------------------------------------
// Daily Activations Focus Number resolver.
//
// Entirely additive and separate from `resolveActiveNumber`/
// `HEALING_PRIORITY_ORDER`/`computeQuestHierarchy` above, which continue to
// power the existing 21-day cycle unchanged. This resolver deliberately has
// no equivalent of `completedCycleNumbers` - repetition of a Focus Number
// across the 21-day journey is intentional, not a bug to guard against.
// ---------------------------------------------------------------------------

/**
 * The digits tied for the lowest value in `counts` (one or more), in
 * numeric ascending order - the pool consulted once there is no missing (or
 * no eligible missing) number left to work on. Extracted so
 * `resolveFocusNumber` and `resolveCurrentFocusNumber` below fall back
 * identically, rather than each recomputing this. Returns `[]` (never
 * throws) for a malformed `counts` missing a digit's entry - `Math.min`
 * over any `undefined` values yields `NaN`, which nothing in `counts` can
 * ever equal, so the filter below naturally comes back empty.
 */
function leastRepresentedPool(counts: Record<Digit, number>): Digit[] {
  const minCount = Math.min(...DIGITS.map((d) => counts[d]));
  return DIGITS.filter((d) => counts[d] === minCount);
}

/**
 * The Focus Number for a given day, under the new Daily Activations rule:
 *
 *  - `missingNumbers` non-empty -> the pool IS the missing numbers (sorted
 *    numeric ascending). Present-but-low-count numbers are never considered
 *    while any number is missing - missing numbers are always the primary
 *    pool.
 *  - `missingNumbers` empty -> the pool is `leastRepresentedPool(counts)`.
 *
 * The Focus Number is then `pool[(cycleDay - 1) % pool.length]` - the pool
 * rotates deterministically across the 21-day journey, and a number
 * reappearing later in the cycle is expected, not an error.
 *
 * Pure and side-effect-free: never mutates `missingNumbers`, never
 * recalculates the Lo Shu grid (reads the already-computed `counts` from
 * `buildLoShuGrid()` instead). Returns `null`, never throws, if the
 * resulting pool is empty (e.g. a malformed `counts` missing a digit's
 * entry). `cycleDay` is expected to be 1-21 for the normal application
 * path - no behavior beyond the formula above is defined outside that
 * range.
 *
 * Kept exactly as-is (unchanged behavior/signature) since `remedies.tsx`
 * still calls this directly - see `resolveCurrentFocusNumber` below for the
 * unified Lo-Shu-ordered, completed-cycle-aware replacement rule, which
 * does not yet have any call site of its own.
 */
export function resolveFocusNumber(
  missingNumbers: Digit[],
  counts: Record<Digit, number>,
  cycleDay: number,
): Digit | null {
  const pool = missingNumbers.length > 0 ? [...missingNumbers].sort((a, b) => a - b) : leastRepresentedPool(counts);

  if (pool.length === 0) return null;
  return pool[(cycleDay - 1) % pool.length];
}

// ---------------------------------------------------------------------------
// Unified current-focus-number resolver (Daily Activations v2 rule).
//
// Additive - does not replace `resolveFocusNumber` (content selection, used
// by `remedies.tsx` today) or `resolveActiveNumber` (completed-cycle
// crediting, used by `ritualStore.ts` today). Both stay exactly as they are
// until a later step switches their call sites over to this resolver, at
// which point the displayed number and the credited number become the same
// number by construction, rather than two independently-computed ones.
// ---------------------------------------------------------------------------

/**
 * The single number to work on right now, under the approved v2 rule:
 *
 *  - Missing numbers come first, in Lo Shu grid order (`orderByLoShuLayout`
 *    - 4, 9, 2, 3, 5, 7, 8, 1, 6 - rather than `resolveFocusNumber`'s
 *    numeric-ascending order), excluding any already present in
 *    `completedCycleNumbers` - a missing number whose 21-day cycle already
 *    finished is never selected again. The first eligible one in that order
 *    is the result: one number is worked on at a time, to completion,
 *    before the next eligible one is ever chosen.
 *  - If no missing number is eligible - either `missingNumbers` is empty,
 *    or every missing number has already completed its cycle - falls back
 *    to `leastRepresentedPool(counts)`, rotating deterministically by
 *    `cycleDay` (`pool[(cycleDay - 1) % pool.length]`), exactly as
 *    `resolveFocusNumber`'s own "no missing numbers" fallback already does.
 *    This is the smallest compatible way to satisfy "preserve the
 *    previously documented fallback... with deterministic rotation" here:
 *    reusing the exact same day-indexed formula, rather than inventing a
 *    new rotation rule, keeps the two resolvers' fallback behavior
 *    identical and easy to compare.
 *  - Returns `null`, never throws, only if that fallback pool is itself
 *    empty (a malformed `counts`) - matching `resolveFocusNumber`'s own
 *    contract. Note this resolver does NOT return `null` merely because
 *    every missing number is completed; whether/how to surface an
 *    "everything is done" state to the user is a separate, not-yet-decided
 *    product question - this resolver always has *something* eligible to
 *    return as long as `counts` is well-formed.
 *
 * Pure: never mutates `missingNumbers` or `completedCycleNumbers`.
 */
export function resolveCurrentFocusNumber(
  missingNumbers: Digit[],
  completedCycleNumbers: Digit[],
  counts: Record<Digit, number>,
  cycleDay: number,
): Digit | null {
  const eligibleMissing = orderByLoShuLayout(missingNumbers).filter(
    (n) => !completedCycleNumbers.includes(n),
  );
  if (eligibleMissing.length > 0) {
    return eligibleMissing[0];
  }

  const pool = leastRepresentedPool(counts);
  if (pool.length === 0) return null;
  return pool[(cycleDay - 1) % pool.length];
}

/**
 * Looks up the static content for a specific number + cycle day in the
 * Practice Library. Pure data lookup - no fallback, no wraparound, no
 * generated content. Returns `null` if the number isn't in the library, or
 * if that day doesn't exist yet (e.g. day 8+ before that content is added) -
 * the caller decides what to do in that case, this resolver never invents a
 * substitute.
 */
export function resolveActivePracticeDay(
  library: PracticeLibrary,
  activeNumber: Digit,
  cycleDay: number,
): PracticeDay | null {
  const numberSet = library.numbers[activeNumber];
  if (!numberSet) return null;
  return numberSet.days.find((d) => d.day === cycleDay) ?? null;
}

// ---------------------------------------------------------------------------
// 7-day Practice Journey derivation (Remedies Step 6).
//
// The persisted `cycleDay` stays exactly as it always has - a single 1-21
// value addressing one of a number's 21 authored PracticeDays. There is no
// persisted "journey" concept; it is presented to the user as three
// successive 7-day journeys purely by deriving which one a given cycleDay
// falls in. Nothing here changes how cycleDay itself is stored or advanced.
// ---------------------------------------------------------------------------

export interface JourneyPosition {
  /** 1, 2, or 3 - which of the three 7-day journeys this cycleDay falls in. */
  journeyNumber: 1 | 2 | 3;
  /** 1-7 - the day within that journey. */
  journeyDay: number;
}

/**
 * Derives a 1-21 `cycleDay`'s position within the three 7-day Practice
 * Journeys (Days 1-7 -> Journey 1, 8-14 -> Journey 2, 15-21 -> Journey 3).
 * Pure and derived only - never persisted, never calculated more than once
 * per render by the caller.
 */
export function resolveJourneyPosition(cycleDay: number): JourneyPosition {
  const journeyNumber = Math.ceil(cycleDay / 7) as 1 | 2 | 3;
  const journeyDay = ((cycleDay - 1) % 7) + 1;
  return { journeyNumber, journeyDay };
}