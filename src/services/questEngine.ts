import { EXPANDED_REMEDIES, ElaboratedRemedy } from '../data/expandedRemedies';
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