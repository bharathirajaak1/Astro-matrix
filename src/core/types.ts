/**
 * AstroMatrix core domain types.
 *
 * Pure TypeScript: no React, no Expo, no I/O. Data only.
 */

/** A reduced single digit, 1-9. Zero never appears as a numerology result. */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Master numbers, preserved (not reduced) for the four core name/birth numbers. */
export type MasterNumber = 11 | 22 | 33;

/** Value space for Life Path / Destiny / Soul Urge / Personality. */
export type CoreNumber = Digit | MasterNumber;

export type NumerologySystem = 'pythagorean' | 'chaldean';

export interface Profile {
  id: string;
  /** Name as used at birth; drives the name-based numbers. */
  fullName: string;
  /** Date of birth as an ISO calendar date, 'YYYY-MM-DD'. */
  dob: string;
  system: NumerologySystem;
  /** ISO timestamp the profile was created. */
  createdAt: string;
}

export interface NumerologyReport {
  system: NumerologySystem;
  lifePath: CoreNumber;
  /** aka Expression. */
  destiny: CoreNumber;
  /** Vowels only. */
  soulUrge: CoreNumber;
  /** Consonants only. */
  personality: CoreNumber;
  /** Day of month, 1-31, unreduced. */
  birthday: number;
  /**
   * The "show the work" trail. Each entry is a chain of successive values,
   * e.g. `destiny: [68, 14, 5]`. `lifePathParts` holds the reduced
   * `[day, month, year]` components that were summed for the Life Path.
   */
  reductions: Record<string, number[]>;
}

export interface LoShuPlanes {
  /** Top row 4-9-2, all present. */
  mind: boolean;
  /** Middle row 3-5-7, all present. */
  soul: boolean;
  /** Bottom row 8-1-6, all present. */
  practical: boolean;
  /** Left column 4-3-8, all present. */
  thought: boolean;
  /** Middle column 9-5-1, all present. */
  will: boolean;
  /** Right column 2-7-6, all present. */
  action: boolean;
  /** Names of every line (row / column / diagonal) that is fully present. */
  goldenYogas: string[];
  /** Names of every line that is fully absent. */
  silverYogas: string[];
}

export interface LoShuGrid {
  /** How many times each digit 1-9 appears in the date of birth. */
  counts: Record<Digit, number>;
  /** Digits that do not appear at all. */
  missing: Digit[];
  /** Digits that appear two or more times. */
  repeated: Digit[];
  planes: LoShuPlanes;
}

export type ForecastFocus = 'rest' | 'action' | 'connect' | 'plan' | 'create';

export interface Forecast {
  /** ISO calendar date the forecast is for, 'YYYY-MM-DD'. */
  date: string;
  personalYear: Digit;
  personalMonth: Digit;
  personalDay: Digit;
  headline: string;
  body: string;
  luckyNumber: Digit;
  focus: ForecastFocus;
}
