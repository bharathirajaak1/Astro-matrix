/**
 * Numerology engine plus the shared numeric / ISO-date helpers used across the
 * core module. Pure TypeScript, zero dependencies.
 */
import { isVowelAt, letterValue } from './letterValues';
import type {
  CoreNumber,
  Digit,
  NumerologyReport,
  NumerologySystem,
  Profile,
} from './types';

export const DIGITS: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ---------------------------------------------------------------------------
// Shared numeric helpers (also consumed by loShu.ts and forecast.ts)
// ---------------------------------------------------------------------------

export const pad2 = (n: number): string => String(Math.trunc(Math.abs(n))).padStart(2, '0');
export const pad4 = (n: number): string => String(Math.trunc(Math.abs(n))).padStart(4, '0');

export function isMasterNumber(n: number): n is 11 | 22 | 33 {
  return n === 11 || n === 22 || n === 33;
}

/** Sum of the decimal digits of `|n|`. */
export function sumDigits(n: number): number {
  let x = Math.trunc(Math.abs(n));
  let sum = 0;
  while (x > 0) {
    sum += x % 10;
    x = Math.floor(x / 10);
  }
  return sum;
}

/** Decimal digits of `|n|`, most significant first. `0` -> `[0]`. */
export function digitsOf(n: number): number[] {
  let x = Math.trunc(Math.abs(n));
  if (x === 0) return [0];
  const out: number[] = [];
  while (x > 0) {
    out.unshift(x % 10);
    x = Math.floor(x / 10);
  }
  return out;
}

export interface Reduction {
  /** Final value after reduction. */
  value: number;
  /** `[start, step1, ..., value]`; length 1 when `start` is already terminal. */
  chain: number[];
}

/**
 * Repeatedly sum digits until a single digit is reached. When `keepMasters` is
 * true (default) the process stops early on 11 / 22 / 33.
 */
export function reduceNumber(n: number, keepMasters = true): Reduction {
  if (!Number.isFinite(n) || n < 0) {
    throw new RangeError(`reduceNumber: expected a non-negative finite number, got ${n}`);
  }
  let current = Math.trunc(n);
  const chain: number[] = [current];
  while (current > 9 && !(keepMasters && isMasterNumber(current))) {
    current = sumDigits(current);
    chain.push(current);
  }
  return { value: current, chain };
}

// ---------------------------------------------------------------------------
// ISO calendar dates ('YYYY-MM-DD'), parsed without `Date` to stay timezone-safe
// ---------------------------------------------------------------------------

export interface CalendarDate {
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  const table = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return table[month - 1] ?? 0;
}

export function parseISODate(iso: string): CalendarDate {
  const match = ISO_DATE_RE.exec(iso.trim());
  if (!match) {
    throw new RangeError(`parseISODate: expected 'YYYY-MM-DD', got '${iso}'`);
  }
  const [, yStr, mStr, dStr] = match;
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new RangeError(`parseISODate: non-numeric field in '${iso}'`);
  }
  if (month < 1 || month > 12) {
    throw new RangeError(`parseISODate: month out of range in '${iso}'`);
  }
  if (day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`parseISODate: day out of range in '${iso}'`);
  }
  return { year, month, day };
}

export function formatISODate(date: CalendarDate): string {
  return `${pad4(date.year)}-${pad2(date.month)}-${pad2(date.day)}`;
}

// ---------------------------------------------------------------------------
// Name numbers
// ---------------------------------------------------------------------------

/**
 * Split a name into words of uppercase A-Z letters. Accents are folded
 * (`e` acute -> `E`) via Unicode NFD normalization, then combining marks in the
 * U+0300..U+036F block are stripped; every other character is a separator.
 * Built-in string methods only.
 */
export function tokenizeName(name: string): string[] {
  const folded = Array.from(name.normalize('NFD'))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f;
    })
    .join('');
  return folded
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter((word) => word.length > 0);
}

type LetterFilter = 'all' | 'vowels' | 'consonants';

function nameSum(name: string, system: NumerologySystem, filter: LetterFilter): number {
  let total = 0;
  for (const word of tokenizeName(name)) {
    for (let i = 0; i < word.length; i += 1) {
      const vowel = isVowelAt(word, i);
      if (filter === 'vowels' && !vowel) continue;
      if (filter === 'consonants' && vowel) continue;
      total += letterValue(word.charAt(i), system);
    }
  }
  return total;
}

/** Destiny / Expression: every letter of the name. */
export function calcDestiny(name: string, system: NumerologySystem): Reduction {
  return reduceNumber(nameSum(name, system, 'all'));
}

/** Soul Urge: vowels only (contextual `Y` included). */
export function calcSoulUrge(name: string, system: NumerologySystem): Reduction {
  return reduceNumber(nameSum(name, system, 'vowels'));
}

/** Personality: consonants only (contextual `Y` included). */
export function calcPersonality(name: string, system: NumerologySystem): Reduction {
  return reduceNumber(nameSum(name, system, 'consonants'));
}

export interface LifePathResult extends Reduction {
  /** Reduced `[day, month, year]` components that were summed. */
  parts: [number, number, number];
}

/**
 * Life Path = reduce(day) + reduce(month) + reduce(year), then reduce the sum.
 * Master numbers are preserved in the final value.
 */
export function calcLifePath(dob: string): LifePathResult {
  const { year, month, day } = parseISODate(dob);
  const dayR = reduceNumber(day).value;
  const monthR = reduceNumber(month).value;
  const yearR = reduceNumber(year).value;
  const reduction = reduceNumber(dayR + monthR + yearR);
  return { ...reduction, parts: [dayR, monthR, yearR] };
}

/** Full numerology report for a profile, including the reduction trail. */
export function buildNumerologyReport(profile: Profile): NumerologyReport {
  const { fullName, dob, system } = profile;
  const lifePath = calcLifePath(dob);
  const destiny = calcDestiny(fullName, system);
  const soulUrge = calcSoulUrge(fullName, system);
  const personality = calcPersonality(fullName, system);
  const { day } = parseISODate(dob);

  return {
    system,
    lifePath: lifePath.value as CoreNumber,
    destiny: destiny.value as CoreNumber,
    soulUrge: soulUrge.value as CoreNumber,
    personality: personality.value as CoreNumber,
    birthday: day,
    reductions: {
      lifePathParts: lifePath.parts,
      lifePath: lifePath.chain,
      destiny: destiny.chain,
      soulUrge: soulUrge.chain,
      personality: personality.chain,
      birthday: [day],
    },
  };
}
