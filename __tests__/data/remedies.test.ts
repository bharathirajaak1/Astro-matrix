import { DIGITS } from '@/core/numerology';
import type { CoreNumber } from '@/core/types';
import {
  LIFE_PATH_ALIGNMENTS,
  MISSING_NUMBER_REMEDIES,
  alignmentForLifePath,
  remedyForMissingNumber,
} from '@/data/remedies';

const HEX = /^#[0-9a-fA-F]{6}$/;
const LIFE_PATHS: CoreNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

describe('MISSING_NUMBER_REMEDIES', () => {
  test('covers every digit 1-9', () => {
    expect(Object.keys(MISSING_NUMBER_REMEDIES).map(Number).sort((a, b) => a - b)).toEqual([
      ...DIGITS,
    ]);
  });

  test.each([...DIGITS])('entry %i is complete and well-formed', (n) => {
    const entry = MISSING_NUMBER_REMEDIES[n];
    expect(entry.number).toBe(n);
    expect(entry.theme.length).toBeGreaterThan(0);
    expect(entry.meaning.length).toBeGreaterThan(20);
    expect(entry.affirmation.length).toBeGreaterThan(0);
    expect(entry.focusColor).toMatch(HEX);
    expect(entry.remedies.length).toBeGreaterThanOrEqual(3);
    for (const remedy of entry.remedies) {
      expect(remedy.title.length).toBeGreaterThan(0);
      expect(remedy.detail.length).toBeGreaterThan(10);
    }
  });

  test('remedy titles within an entry are unique (usable as React keys)', () => {
    for (const n of DIGITS) {
      const titles = MISSING_NUMBER_REMEDIES[n].remedies.map((r) => r.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });
});

describe('LIFE_PATH_ALIGNMENTS', () => {
  test('covers 1-9 plus master numbers 11, 22, 33', () => {
    expect(Object.keys(LIFE_PATH_ALIGNMENTS).map(Number).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33,
    ]);
  });

  test.each(LIFE_PATHS)('alignment %i is complete and well-formed', (lp) => {
    const entry = LIFE_PATH_ALIGNMENTS[lp];
    expect(entry.lifePath).toBe(lp);
    expect(entry.strength.length).toBeGreaterThan(10);
    expect(entry.imbalance.length).toBeGreaterThan(10);
    expect(entry.alignment.length).toBeGreaterThanOrEqual(3);
    for (const step of entry.alignment) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.detail.length).toBeGreaterThan(10);
    }
  });
});

describe('lookups', () => {
  test.each([...DIGITS])('remedyForMissingNumber(%i) returns the matching entry', (n) => {
    expect(remedyForMissingNumber(n)).toBe(MISSING_NUMBER_REMEDIES[n]);
    expect(remedyForMissingNumber(n).number).toBe(n);
  });

  test.each(LIFE_PATHS)('alignmentForLifePath(%i) returns the matching entry', (lp) => {
    expect(alignmentForLifePath(lp)).toBe(LIFE_PATH_ALIGNMENTS[lp]);
    expect(alignmentForLifePath(lp).lifePath).toBe(lp);
  });

  test('lookups throw RangeError for out-of-range input', () => {
    // @ts-expect-error - exercising the runtime guard with a bad value
    expect(() => remedyForMissingNumber(0)).toThrow(RangeError);
    // @ts-expect-error - exercising the runtime guard with a bad value
    expect(() => remedyForMissingNumber(10)).toThrow(RangeError);
    // @ts-expect-error - exercising the runtime guard with a bad value
    expect(() => alignmentForLifePath(44)).toThrow(RangeError);
  });
});
