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

/** Short gloss for each Lo Shu plane / arrow. */
export const PLANE_MEANING: Record<string, string> = {
  mind: 'Mental plane (4-9-2): planning and imagination.',
  soul: 'Soul plane (3-5-7): feeling and freedom.',
  practical: 'Practical plane (8-1-6): action in the material world.',
  thought: 'Thought plane (4-3-8): ideas and memory.',
  will: 'Will plane (9-5-1): determination and drive.',
  action: 'Action plane (2-7-6): activity and expression.',
};

/** Copy for the forecast "focus" tag. */
export const FOCUS_COPY: Record<string, { label: string; hint: string }> = {
  rest: { label: 'Rest', hint: 'Slow down and let things settle.' },
  action: { label: 'Action', hint: 'Push forward - momentum is with you.' },
  connect: { label: 'Connect', hint: 'Reach out; relationships carry the day.' },
  plan: { label: 'Plan', hint: 'Organise and lay foundations.' },
  create: { label: 'Create', hint: 'Make something and share it.' },
};
