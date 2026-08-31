/**
 * Lo Shu grid analysis. Pure TypeScript, zero dependencies.
 */
import { DIGITS, pad2, parseISODate } from './numerology';
import type { Digit, LoShuGrid, LoShuPlanes } from './types';

/** Fixed Lo Shu magic-square layout, rows top -> bottom. */
export const LO_SHU_LAYOUT: readonly (readonly Digit[])[] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

interface Line {
  name: string;
  cells: readonly Digit[];
}

/** Rows, columns and both diagonals of the grid. */
const LINES: readonly Line[] = [
  { name: 'Mind plane (4-9-2)', cells: [4, 9, 2] },
  { name: 'Soul plane (3-5-7)', cells: [3, 5, 7] },
  { name: 'Practical plane (8-1-6)', cells: [8, 1, 6] },
  { name: 'Thought plane (4-3-8)', cells: [4, 3, 8] },
  { name: 'Will plane (9-5-1)', cells: [9, 5, 1] },
  { name: 'Action plane (2-7-6)', cells: [2, 7, 6] },
  { name: 'Golden diagonal (4-5-6)', cells: [4, 5, 6] },
  { name: 'Silver diagonal (2-5-8)', cells: [2, 5, 8] },
];

function emptyCounts(): Record<Digit, number> {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
}

/**
 * Digits of the full date of birth as `DDMMYYYY`, with zeros dropped
 * (0 has no cell in the Lo Shu grid).
 */
export function loShuDigits(dob: string): Digit[] {
  const { year, month, day } = parseISODate(dob);
  const sequence = `${pad2(day)}${pad2(month)}${year}`;
  const out: Digit[] = [];
  for (const ch of sequence) {
    const value = ch.charCodeAt(0) - 48;
    if (value >= 1 && value <= 9) out.push(value as Digit);
  }
  return out;
}

export interface LoShuOptions {
  /**
   * Extra digits to fold into the grid (e.g. Life Path / Destiny "drivers").
   * Off by default - the base grid stays pure. Values outside 1-9 are ignored.
   */
  extraDigits?: readonly number[];
}

/** Build the full Lo Shu grid analysis for a date of birth. */
export function buildLoShuGrid(dob: string, options: LoShuOptions = {}): LoShuGrid {
  const counts = emptyCounts();
  for (const d of loShuDigits(dob)) counts[d] += 1;
  for (const raw of options.extraDigits ?? []) {
    const d = Math.trunc(raw);
    if (d >= 1 && d <= 9) counts[d as Digit] += 1;
  }

  const missing = DIGITS.filter((d) => counts[d] === 0);
  const repeated = DIGITS.filter((d) => counts[d] >= 2);

  const allPresent = (cells: readonly Digit[]): boolean => cells.every((d) => counts[d] > 0);
  const allAbsent = (cells: readonly Digit[]): boolean => cells.every((d) => counts[d] === 0);

  const planes: LoShuPlanes = {
    mind: allPresent([4, 9, 2]),
    soul: allPresent([3, 5, 7]),
    practical: allPresent([8, 1, 6]),
    thought: allPresent([4, 3, 8]),
    will: allPresent([9, 5, 1]),
    action: allPresent([2, 7, 6]),
    goldenYogas: LINES.filter((line) => allPresent(line.cells)).map((line) => line.name),
    silverYogas: LINES.filter((line) => allAbsent(line.cells)).map((line) => line.name),
  };

  return { counts, missing, repeated, planes };
}
