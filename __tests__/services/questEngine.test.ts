import {
  HEALING_PRIORITY_ORDER,
  resolveActiveNumber,
  resolveActivePracticeDay,
  resolveCurrentFocusNumber,
  resolveFocusNumber,
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

function countsAllEqual(value: number): Record<Digit, number> {
  return { 1: value, 2: value, 3: value, 4: value, 5: value, 6: value, 7: value, 8: value, 9: value };
}

describe('resolveFocusNumber', () => {
  test('a single missing number returns that number on Day 1, regardless of counts', () => {
    expect(resolveFocusNumber([7], countsAllEqual(3), 1)).toBe(7);
  });

  test('missing [7,2,9,4]: pool is numerically ascending and rotates by cycleDay, wrapping at day 5', () => {
    const missing: Digit[] = [7, 2, 9, 4];
    const counts = countsAllEqual(1);
    expect(resolveFocusNumber(missing, counts, 1)).toBe(2);
    expect(resolveFocusNumber(missing, counts, 2)).toBe(4);
    expect(resolveFocusNumber(missing, counts, 3)).toBe(7);
    expect(resolveFocusNumber(missing, counts, 4)).toBe(9);
    expect(resolveFocusNumber(missing, counts, 5)).toBe(2);
  });

  test('all nine numbers missing: pool is [1..9] in ascending order regardless of input order', () => {
    const missing: Digit[] = [9, 1, 5, 3, 7, 2, 8, 4, 6];
    const counts = countsAllEqual(0);
    expect(resolveFocusNumber(missing, counts, 1)).toBe(1);
    expect(resolveFocusNumber(missing, counts, 9)).toBe(9);
    expect(resolveFocusNumber(missing, counts, 10)).toBe(1); // wraps
  });

  test('missing numbers take priority: counts are ignored entirely while any number is missing', () => {
    // Digit 2 would be the lowest-count ("least-represented") digit if
    // counts were consulted - but with a missing number present, counts
    // must be ignored entirely in favor of the missing-number pool.
    const missing: Digit[] = [7];
    const counts: Record<Digit, number> = { 1: 4, 2: 1, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4 };
    expect(resolveFocusNumber(missing, counts, 1)).toBe(7);
  });

  describe('no missing numbers - least-represented fallback pool', () => {
    test('several digits tied for the minimum count form the pool, in ascending order, rotating by day', () => {
      // 2, 5, and 8 all share the minimum count (1); everything else is higher.
      const counts: Record<Digit, number> = { 1: 3, 2: 1, 3: 3, 4: 3, 5: 1, 6: 3, 7: 3, 8: 1, 9: 3 };
      expect(resolveFocusNumber([], counts, 1)).toBe(2);
      expect(resolveFocusNumber([], counts, 2)).toBe(5);
      expect(resolveFocusNumber([], counts, 3)).toBe(8);
      expect(resolveFocusNumber([], counts, 4)).toBe(2); // wraps
    });

    test('a single least-represented digit forms a pool of one', () => {
      const counts: Record<Digit, number> = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 0, 6: 3, 7: 3, 8: 3, 9: 3 };
      expect(resolveFocusNumber([], counts, 1)).toBe(5);
      expect(resolveFocusNumber([], counts, 2)).toBe(5);
      expect(resolveFocusNumber([], counts, 15)).toBe(5);
    });
  });

  test('a Focus Number may repeat later in the 21-day journey - no completedCycleNumbers involved', () => {
    const missing: Digit[] = [2, 4, 7];
    const counts = countsAllEqual(0);
    const day1 = resolveFocusNumber(missing, counts, 1);
    const day4 = resolveFocusNumber(missing, counts, 4);
    expect(day1).toBe(2);
    expect(day4).toBe(2);
    expect(day4).toBe(day1); // deliberate repetition, not an error
  });

  test('Day 21 uses pool[(21 - 1) % pool.length]', () => {
    const missing: Digit[] = [2, 4, 7];
    const counts = countsAllEqual(0);
    // (21 - 1) % 3 = 20 % 3 = 2 -> pool[2] = 7
    expect(resolveFocusNumber(missing, counts, 21)).toBe(7);
  });

  test('a malformed/empty counts object with no missing numbers returns null, never throws', () => {
    expect(() => resolveFocusNumber([], {} as Record<Digit, number>, 1)).not.toThrow();
    expect(resolveFocusNumber([], {} as Record<Digit, number>, 1)).toBeNull();
  });

  test('does not mutate the supplied missingNumbers array', () => {
    const missing: Digit[] = [9, 2, 5];
    const snapshot = [...missing];
    resolveFocusNumber(missing, countsAllEqual(0), 1);
    expect(missing).toEqual(snapshot);
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

describe('resolveCurrentFocusNumber', () => {
  test('a single missing number is selected regardless of day or Lo Shu position', () => {
    expect(resolveCurrentFocusNumber([7], [], countsAllEqual(3), 1)).toBe(7);
    expect(resolveCurrentFocusNumber([7], [], countsAllEqual(3), 15)).toBe(7);
  });

  test('multiple missing numbers are selected by Lo Shu order (4,9,2,3,5,7,8,1,6), not numeric order', () => {
    // Among {1, 8, 3}, Lo Shu order places 3 first (position 4), then 8
    // (position 7), then 1 (position 8) - numeric-ascending would have
    // picked 1.
    expect(resolveCurrentFocusNumber([1, 8, 3], [], countsAllEqual(0), 1)).toBe(3);
  });

  test('the same missing number is returned for every day of its 21-day cycle - no day-to-day rotation while it is still eligible', () => {
    const missing: Digit[] = [1, 8, 3];
    for (let cycleDay = 1; cycleDay <= 21; cycleDay += 1) {
      expect(resolveCurrentFocusNumber(missing, [], countsAllEqual(0), cycleDay)).toBe(3);
    }
  });

  test('a number already in completedCycleNumbers is skipped in favor of the next eligible one in Lo Shu order', () => {
    // 3 has already finished its cycle - next in Lo Shu order among {1, 8} is 8.
    expect(resolveCurrentFocusNumber([1, 8, 3], [3], countsAllEqual(0), 1)).toBe(8);
  });

  test('multiple completed numbers are all skipped', () => {
    expect(resolveCurrentFocusNumber([1, 8, 3], [3, 8], countsAllEqual(0), 1)).toBe(1);
  });

  test('agrees with Lo Shu order across every remaining missing number, in order, as each one completes', () => {
    const missing: Digit[] = [9, 5, 2, 6, 7, 1];
    const loShuOrder: Digit[] = [4, 9, 2, 3, 5, 7, 8, 1, 6];
    let completed: Digit[] = [];

    for (const expected of loShuOrder.filter((n) => missing.includes(n))) {
      expect(resolveCurrentFocusNumber(missing, completed, countsAllEqual(0), 1)).toBe(expected);
      completed = [...completed, expected];
    }
  });

  test('every missing number already completed falls back to the least-represented pool, not null', () => {
    const missing: Digit[] = [1, 8, 3];
    const counts: Record<Digit, number> = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 0, 6: 3, 7: 3, 8: 3, 9: 3 };
    expect(resolveCurrentFocusNumber(missing, [1, 8, 3], counts, 1)).toBe(5);
  });

  test('no missing numbers at all: falls back to the least-represented pool with deterministic rotation, matching resolveFocusNumber', () => {
    const counts: Record<Digit, number> = { 1: 3, 2: 1, 3: 3, 4: 3, 5: 1, 6: 3, 7: 3, 8: 1, 9: 3 };
    expect(resolveCurrentFocusNumber([], [], counts, 1)).toBe(resolveFocusNumber([], counts, 1));
    expect(resolveCurrentFocusNumber([], [], counts, 2)).toBe(resolveFocusNumber([], counts, 2));
    expect(resolveCurrentFocusNumber([], [], counts, 3)).toBe(resolveFocusNumber([], counts, 3));
    expect(resolveCurrentFocusNumber([], [], counts, 4)).toBe(resolveFocusNumber([], counts, 4)); // wraps
  });

  test('a malformed/empty counts object with no eligible missing number returns null, never throws', () => {
    expect(() => resolveCurrentFocusNumber([], [], {} as Record<Digit, number>, 1)).not.toThrow();
    expect(resolveCurrentFocusNumber([], [], {} as Record<Digit, number>, 1)).toBeNull();
  });

  test('does not mutate missingNumbers or completedCycleNumbers', () => {
    const missing: Digit[] = [1, 8, 3];
    const completed: Digit[] = [3];
    const missingSnapshot = [...missing];
    const completedSnapshot = [...completed];

    resolveCurrentFocusNumber(missing, completed, countsAllEqual(0), 1);

    expect(missing).toEqual(missingSnapshot);
    expect(completed).toEqual(completedSnapshot);
  });

  test('repeated calls with the same inputs return the same result', () => {
    const missing: Digit[] = [8, 3, 6, 9];
    const completed: Digit[] = [3];
    const first = resolveCurrentFocusNumber(missing, completed, countsAllEqual(0), 5);
    const second = resolveCurrentFocusNumber(missing, completed, countsAllEqual(0), 5);
    expect(first).toBe(second);
  });
});
