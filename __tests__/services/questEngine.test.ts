import {
  HEALING_PRIORITY_ORDER,
  resolveActiveNumber,
  resolveActivePracticeDay,
  resolveJourneyPosition,
} from '../../src/services/questEngine';
import { PRACTICE_LIBRARY } from '../../src/data/practiceLibrary';
import type { Digit } from '../../src/core/types';
import type { PracticeLibrary } from '../../src/data/practiceLibrary';

describe('resolveActiveNumber', () => {
  test('1: empty missingNumbers returns null', () => {
    expect(resolveActiveNumber([], [])).toBeNull();
  });

  test('2: a single missing number returns that number', () => {
    expect(resolveActiveNumber([5], [])).toBe(5);
  });

  test('3: multiple missing numbers are resolved by the existing HEALING_PRIORITY_ORDER', () => {
    // 8 and 3 are both missing; 3 precedes 8 in HEALING_PRIORITY_ORDER ([1,3,4,8,7,6,2,5,9]).
    expect(resolveActiveNumber([8, 3, 6], [])).toBe(3);
  });

  test('4: a completed number is skipped in favor of the next eligible one', () => {
    // 3 would normally win, but it has already completed its cycle.
    expect(resolveActiveNumber([8, 3, 6], [3])).toBe(8);
  });

  test('5: multiple completed numbers are all skipped', () => {
    expect(resolveActiveNumber([8, 3, 6], [3, 8])).toBe(6);
  });

  test('6: every missing number having completed its cycle returns null', () => {
    expect(resolveActiveNumber([8, 3, 6], [8, 3, 6])).toBeNull();
  });

  test('7: neither input array is mutated', () => {
    const missing: Digit[] = [8, 3, 6];
    const completed: Digit[] = [3];
    const missingCopy = [...missing];
    const completedCopy = [...completed];

    resolveActiveNumber(missing, completed);

    expect(missing).toEqual(missingCopy);
    expect(completed).toEqual(completedCopy);
  });

  test('8: repeated calls with the same inputs return the same result', () => {
    const missing: Digit[] = [8, 3, 6, 9];
    const completed: Digit[] = [3];

    const first = resolveActiveNumber(missing, completed);
    const second = resolveActiveNumber(missing, completed);

    expect(first).toBe(second);
    expect(first).toBe(8);
  });

  test('agrees with HEALING_PRIORITY_ORDER across every remaining missing number, in order', () => {
    const missing: Digit[] = [9, 5, 2, 6, 7, 1];
    let completed: Digit[] = [];

    for (const expected of HEALING_PRIORITY_ORDER.filter((n) => missing.includes(n as Digit))) {
      expect(resolveActiveNumber(missing, completed)).toBe(expected);
      completed = [...completed, expected as Digit];
    }

    expect(resolveActiveNumber(missing, completed)).toBeNull();
  });
});

describe('resolveActivePracticeDay', () => {
  test('9 & 10: a valid number + valid day returns the correct PracticeDay with the correct id', () => {
    const day = resolveActivePracticeDay(PRACTICE_LIBRARY, 8, 5);
    expect(day).not.toBeNull();
    expect(day?.number).toBe(8);
    expect(day?.day).toBe(5);
    expect(day?.id).toBe('n8-d5');
  });

  test('11: an invalid/non-existent number returns null', () => {
    const emptyLibrary: PracticeLibrary = { numbers: {} as PracticeLibrary['numbers'] };
    expect(resolveActivePracticeDay(emptyLibrary, 8, 5)).toBeNull();
  });

  test('12: day 0 returns null', () => {
    expect(resolveActivePracticeDay(PRACTICE_LIBRARY, 8, 0)).toBeNull();
  });

  test('12b: a negative day returns null', () => {
    expect(resolveActivePracticeDay(PRACTICE_LIBRARY, 8, -1)).toBeNull();
  });

  test('13: day 8 now legitimately exists in the 21-day library and returns the real PracticeDay', () => {
    const day = resolveActivePracticeDay(PRACTICE_LIBRARY, 8, 8);
    expect(day).not.toBeNull();
    expect(day?.number).toBe(8);
    expect(day?.day).toBe(8);
    expect(day?.id).toBe('n8-d8');
  });

  test('14: day 21 now legitimately exists in the 21-day library and returns the real PracticeDay', () => {
    const day = resolveActivePracticeDay(PRACTICE_LIBRARY, 8, 21);
    expect(day).not.toBeNull();
    expect(day?.number).toBe(8);
    expect(day?.day).toBe(21);
    expect(day?.id).toBe('n8-d21');
  });

  test('14b: day 22 - genuinely beyond the current 21-day library - returns null, not a wraparound', () => {
    expect(resolveActivePracticeDay(PRACTICE_LIBRARY, 8, 22)).toBeNull();
  });

  test('15: the returned object matches the corresponding library entry exactly', () => {
    const day = resolveActivePracticeDay(PRACTICE_LIBRARY, 3, 4);
    expect(day).toBe(PRACTICE_LIBRARY.numbers[3].days.find((d) => d.day === 4));
  });

  test('16: PRACTICE_LIBRARY is not mutated', () => {
    const snapshot = JSON.stringify(PRACTICE_LIBRARY);
    resolveActivePracticeDay(PRACTICE_LIBRARY, 8, 5);
    expect(JSON.stringify(PRACTICE_LIBRARY)).toBe(snapshot);
  });
});

describe('resolveActiveNumber + resolveActivePracticeDay used together', () => {
  test('sequential use resolves the correct current PracticeDay', () => {
    const missingNumbers: Digit[] = [8, 3, 6];
    const completedCycleNumbers: Digit[] = [3];
    const cycleDay = 5;

    const activeNumber = resolveActiveNumber(missingNumbers, completedCycleNumbers);
    expect(activeNumber).toBe(8);

    const day = activeNumber !== null ? resolveActivePracticeDay(PRACTICE_LIBRARY, activeNumber, cycleDay) : null;
    expect(day?.id).toBe('n8-d5');
    expect(day?.number).toBe(8);
    expect(day?.day).toBe(5);
  });

  test('sequential use returns null once every missing number has completed its cycle', () => {
    const missingNumbers: Digit[] = [8, 3, 6];
    const completedCycleNumbers: Digit[] = [8, 3, 6];

    const activeNumber = resolveActiveNumber(missingNumbers, completedCycleNumbers);
    expect(activeNumber).toBeNull();
  });
});

describe('resolveJourneyPosition', () => {
  test.each([
    [1, 1, 1],
    [7, 1, 7],
    [8, 2, 1],
    [14, 2, 7],
    [15, 3, 1],
    [21, 3, 7],
  ])('cycleDay %i -> journey %i, journeyDay %i', (cycleDay, journeyNumber, journeyDay) => {
    expect(resolveJourneyPosition(cycleDay)).toEqual({ journeyNumber, journeyDay });
  });
});
