/**
 * Display copy for numerology results. Content only - no logic. Kept out of the
 * components so it can be reviewed and localized later.
 */
import type { CoreNumber } from '@/core/types';

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
  /** "Your Personal Week Number is 7." */
  numberStatement: string;
  /** "In numerology, this number represents ... — <theme>." */
  represents: string;
  /** Where the number comes from - what it's calculated from. */
  whereFrom: string;
  /** Why it's relevant on this particular forecast screen. */
  whyRelevant: string;
  /** Optional "How is this calculated?" expansion - most useful for Week,
   *  since AstroMatrix's weekly convention isn't a familiar concept. */
  howCalculated: string;
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
  { numberLabel: string; representsTimeframe: string; whereFrom: string; whyRelevant: string; howCalculated: string }
> = {
  day: {
    numberLabel: 'Personal Day',
    representsTimeframe: 'your day today',
    whereFrom: "Your Personal Day Number is calculated from today's date together with your Personal Month Number and Personal Year Number.",
    whyRelevant: 'It sets a theme for how today may feel and what kind of activities it may suit.',
    howCalculated:
      "Your Personal Day Number is calculated from your Personal Month Number and today's date, then reduced to a single digit.",
  },
  week: {
    numberLabel: 'Personal Week',
    representsTimeframe: 'your current week',
    whereFrom:
      'This is an AstroMatrix-defined weekly cycle, not a universal numerology standard - it adds together the Personal Day number for each of the 7 days in this Sunday-Saturday week and reduces the total to a single digit.',
    whyRelevant: 'It sets a broader theme for the week as a whole, beyond any single day.',
    howCalculated:
      'Your Personal Week Number is calculated by adding the Personal Day numbers for each day of this week and reducing the total to a single digit.',
  },
  month: {
    numberLabel: 'Personal Month',
    representsTimeframe: 'your current month',
    whereFrom: 'Your Personal Month Number is calculated from your Personal Year Number together with the current calendar month.',
    whyRelevant: 'It sets a broader theme running through this month.',
    howCalculated:
      'Your Personal Month Number is calculated from your Personal Year Number and the current month, then reduced to a single digit.',
  },
  year: {
    numberLabel: 'Personal Year',
    representsTimeframe: 'your year',
    whereFrom: 'Your Personal Year Number is calculated from your date of birth together with the current calendar year.',
    whyRelevant: 'It sets a long-term theme for your year as a whole.',
    howCalculated:
      'Your Personal Year Number is calculated from your birth day, birth month, and the current year, then reduced to a single digit.',
  },
};

/**
 * Build the "what is it / where from / what does it represent / why
 * relevant" explanation for a forecast period's primary number.
 */
export function explainPersonalNumber(period: ForecastPeriod, digit: number): PeriodExplanation {
  const copy = PERIOD_EXPLANATION_COPY[period];
  const representsPrefix =
    period === 'year'
      ? 'In numerology, this number represents the broader theme associated with'
      : 'In numerology, this number represents the theme associated with';

  return {
    numberStatement: `Your ${copy.numberLabel} Number is ${digit}.`,
    represents: `${representsPrefix} ${copy.representsTimeframe} — ${themeClauseFor(digit)}.`,
    whereFrom: copy.whereFrom,
    whyRelevant: copy.whyRelevant,
    howCalculated: copy.howCalculated,
  };
}
