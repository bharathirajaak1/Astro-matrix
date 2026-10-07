/**
 * Display copy for numerology results. Content only - no logic. Kept out of the
 * components so it can be reviewed and localized later.
 */
import type { CoreNumber } from '@/core/types';
import type {
  PersonalDayBreakdown,
  PersonalMonthBreakdown,
  PersonalWeekBreakdown,
  PersonalYearBreakdown,
} from '@/core/forecast';
import { MONTH_NAMES } from '@/lib/date';

/** One-line meaning for each reduced / master number. */
export const NUMBER_MEANING: Record<number, string> = {
  1: 'Drive, independence, and the will to begin.',
  2: 'Partnership, sensitivity, and quiet diplomacy.',
  3: 'Expression, creativity, and social spark.',
  4: 'Structure, discipline, and steady building.',
  5: 'Freedom, change, and restless curiosity.',
  6: 'Care, responsibility, and devotion to home.',
  7: 'Analysis, introspection, and the search for truth.',
  8: 'Ambition, authority, and material mastery.',
  9: 'Compassion, closure, and the wider view.',
  11: 'A master number: intuition and inspiration turned up high.',
  22: 'A master number: the master builder who makes visions real.',
  33: 'A master number: the master teacher devoted to service.',
};

export function meaningFor(n: CoreNumber | number): string {
  return NUMBER_MEANING[n] ?? 'A number outside the usual range.';
}

export const CORE_NUMBERS: {
  key: 'lifePath' | 'destiny' | 'soulUrge' | 'personality' | 'birthday';
  title: string;
  blurb: string;
}[] = [
  {
    key: 'lifePath',
    title: 'Life Path',
    blurb: 'The main road of this lifetime, from the full date of birth.',
  },
  {
    key: 'destiny',
    title: 'Destiny',
    blurb: 'Also called Expression - the potential in the full birth name.',
  },
  {
    key: 'soulUrge',
    title: 'Soul Urge',
    blurb: 'The inner motivation, drawn from the vowels of the name.',
  },
  {
    key: 'personality',
    title: 'Personality',
    blurb: 'The outward impression, drawn from the consonants of the name.',
  },
  {
    key: 'birthday',
    title: 'Birthday',
    blurb: 'A supporting talent, taken from the day of the month, unreduced.',
  },
];

/** Copy for the forecast "focus" tag. */
export const FOCUS_COPY: Record<string, { label: string; hint: string }> = {
  rest: { label: 'Rest', hint: 'Slow down and let things settle.' },
  action: {
    label: 'Action',
    hint: 'Choose one meaningful goal and turn it into clear next steps. Use this time to move from planning into action, while giving yourself room to adjust as you go.',
  },
  connect: { label: 'Connect', hint: 'Reach out; relationships carry the day.' },
  plan: {
    label: 'Plan',
    hint: 'Choose one important area that needs more structure. Break it into practical steps, organise what you need, and make steady progress rather than trying to complete everything at once.',
  },
  create: {
    label: 'Create',
    hint: "Choose one idea you've been thinking about, spend some time developing it, and share it with someone or turn it into something useful.",
  },
};

// ---------------------------------------------------------------------------
// Forecast period explanations - "what is it / where from / what does it
// represent / why relevant here", applied to Personal Day/Week/Month/Year.
// Reuses `meaningFor()` as the single canonical source for what a digit
// represents - no separate digit-meaning dictionary is introduced here.
// ---------------------------------------------------------------------------

export type ForecastPeriod = 'day' | 'week' | 'month' | 'year';

export interface PeriodExplanation {
  /** "Your Personal Week is 7." */
  numberStatement: string;
  /** "In traditional numerology, <digit> is associated with <theme>." */
  represents: string;
  /** Where the number comes from - what it's calculated from. */
  whereFrom: string;
  /** Why it's relevant on this particular forecast screen. */
  whyRelevant: string;
}

function lowerFirst(text: string): string {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

/** `meaningFor(digit)` reworded as a lowercase mid-sentence clause, e.g.
 *  "Expression, creativity, and social spark." -> "expression, creativity, and social spark". */
export function themeClauseFor(digit: number): string {
  const raw = meaningFor(digit).trim();
  const withoutPeriod = raw.endsWith('.') ? raw.slice(0, -1) : raw;
  return lowerFirst(withoutPeriod);
}

const PERIOD_EXPLANATION_COPY: Record<
  ForecastPeriod,
  { numberLabel: string; whereFrom: string; whyRelevant: string }
> = {
  day: {
    numberLabel: 'Personal Day',
    whereFrom: "Your Personal Day Number is calculated from today's date together with your Personal Month Number and Personal Year Number.",
    whyRelevant: 'This gives you a theme to keep in mind as you move through today.',
  },
  week: {
    numberLabel: 'Personal Week',
    whereFrom:
      'This is an AstroMatrix-defined weekly cycle, not a universal numerology standard - it adds together the Personal Day number for each of the 7 days in this Sunday-Saturday week and reduces the total to a single digit.',
    whyRelevant: 'This gives you a broader theme to keep in mind throughout the week.',
  },
  month: {
    numberLabel: 'Personal Month',
    whereFrom: 'Your Personal Month Number is calculated from your Personal Year Number together with the current calendar month.',
    whyRelevant: 'This gives you a theme to keep in mind throughout the month.',
  },
  year: {
    numberLabel: 'Personal Year',
    whereFrom: 'Your Personal Year Number is calculated from your date of birth together with the current calendar year.',
    whyRelevant: 'This gives you a broader theme to carry with you throughout the year.',
  },
};

/**
 * Build the "what is it / where from / what does it represent / why
 * relevant" explanation for a forecast period's primary number. `represents`
 * uses a single, simple "In traditional numerology, <digit> is associated
 * with <theme>" sentence for every period, rather than naming the specific
 * timeframe inline - the surrounding UI already makes clear which period
 * this is for.
 */
export function explainPersonalNumber(period: ForecastPeriod, digit: number): PeriodExplanation {
  const copy = PERIOD_EXPLANATION_COPY[period];

  return {
    numberStatement: `Your ${copy.numberLabel} is ${digit}.`,
    represents: `In traditional numerology, ${digit} is associated with ${themeClauseFor(digit)}.`,
    whereFrom: copy.whereFrom,
    whyRelevant: copy.whyRelevant,
  };
}

// ---------------------------------------------------------------------------
// "How is this calculated?" - built from the real breakdown values for the
// active profile/date (see `src/core/forecast.ts`'s `*Breakdown` functions),
// so the explanation always shows the actual numbers behind the card instead
// of a generic description.
// ---------------------------------------------------------------------------

export function explainYearCalculation(breakdown: PersonalYearBreakdown): string {
  const { reducedBirthDay, reducedBirthMonth, reducedTargetYear, sum, personalYear } = breakdown;
  return (
    'Your Personal Year Number is calculated from your reduced birth day, birth month, and the current year. ' +
    `For you, that is ${reducedBirthDay} + ${reducedBirthMonth} + ${reducedTargetYear} = ${sum} → ${personalYear}.`
  );
}

export function explainMonthCalculation(breakdown: PersonalMonthBreakdown): string {
  const { personalYear, month, sum, personalMonth } = breakdown;
  const monthName = MONTH_NAMES[month - 1];
  return (
    'Your Personal Month Number is calculated by adding your Personal Year Number and the calendar month. ' +
    `For ${monthName}, that is ${personalYear} + ${month} = ${sum} → ${personalMonth}.`
  );
}

export function explainDayCalculation(breakdown: PersonalDayBreakdown): string {
  const { personalMonth, day, sum, personalDay } = breakdown;
  return (
    'Your Personal Day Number is calculated by adding your Personal Month Number and the day of the month. ' +
    `For today, that is ${personalMonth} + ${day} = ${sum} → ${personalDay}.`
  );
}

export function explainWeekCalculation(breakdown: PersonalWeekBreakdown): string {
  const { personalDays, sum, personalWeek } = breakdown;
  return (
    'Your Personal Week Number is calculated from the Personal Day numbers for each day of this week: ' +
    `${personalDays.join(' + ')} = ${sum} → ${personalWeek}.`
  );
}
