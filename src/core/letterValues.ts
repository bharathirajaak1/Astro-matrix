/**
 * Letter-to-number maps and vowel classification for name-based numerology.
 * Pure TypeScript, zero dependencies.
 */
import type { NumerologySystem } from './types';

/** True vowels. `Y` is handled contextually by {@link isVowelAt}. */
export const VOWEL_LETTERS: ReadonlySet<string> = new Set(['A', 'E', 'I', 'O', 'U']);

/** Pythagorean map: A=1..I=9, J=1..R=9, S=1..Z=8. */
const PYTHAGOREAN_ROWS: Readonly<Record<number, string>> = {
  1: 'AJS',
  2: 'BKT',
  3: 'CLU',
  4: 'DMV',
  5: 'ENW',
  6: 'FOX',
  7: 'GPY',
  8: 'HQZ',
  9: 'IR',
};

/**
 * Chaldean map: values 1-8 only (9 is treated as sacred and never assigned to
 * a letter). Compound-number handling is out of scope for the M1 engine.
 */
const CHALDEAN_ROWS: Readonly<Record<number, string>> = {
  1: 'AIJQY',
  2: 'BKR',
  3: 'CGLS',
  4: 'DMT',
  5: 'EHNX',
  6: 'UVW',
  7: 'OZ',
  8: 'FP',
};

function buildMap(rows: Readonly<Record<number, string>>): Readonly<Record<string, number>> {
  const map: Record<string, number> = {};
  for (const key of Object.keys(rows)) {
    const value = Number(key);
    for (const letter of rows[value] ?? '') {
      map[letter] = value;
    }
  }
  return map;
}

export const PYTHAGOREAN_MAP = buildMap(PYTHAGOREAN_ROWS);
export const CHALDEAN_MAP = buildMap(CHALDEAN_ROWS);

/** Numeric value of a single A-Z letter; 0 for anything unmapped. */
export function letterValue(char: string, system: NumerologySystem): number {
  if (!char) return 0;
  const map = system === 'chaldean' ? CHALDEAN_MAP : PYTHAGOREAN_MAP;
  return map[char.toUpperCase()] ?? 0;
}

/**
 * Whether the character at `index` in `word` counts as a vowel.
 *
 * Rule: A/E/I/O/U are always vowels. `Y` is a vowel only when it is NOT
 * directly adjacent (within the same word) to a true vowel - so "Larry" and
 * "Kyla" treat Y as a vowel, while "Yoga" and "Maya" treat it as a consonant.
 * `word` is expected to be uppercase A-Z only (see `tokenizeName`).
 */
export function isVowelAt(word: string, index: number): boolean {
  const c = word.charAt(index);
  if (!c) return false;
  if (VOWEL_LETTERS.has(c)) return true;
  if (c !== 'Y') return false;
  const prev = word.charAt(index - 1);
  const next = word.charAt(index + 1);
  const prevIsVowel = prev !== '' && VOWEL_LETTERS.has(prev);
  const nextIsVowel = next !== '' && VOWEL_LETTERS.has(next);
  return !prevIsVowel && !nextIsVowel;
}
