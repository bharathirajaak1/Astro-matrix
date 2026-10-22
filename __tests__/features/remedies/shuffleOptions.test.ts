import { shuffleOptions } from '../../../src/features/remedies/shuffleOptions';
import type { CognitiveTaskOption } from '../../../src/data/dailyActivations';
import { LOGIC_TASKS, SPATIAL_TASKS, MEMORY_TASKS, LANGUAGE_TASKS, OBSERVATION_TASKS } from '../../../src/data/dailyActivations';

const options: CognitiveTaskOption[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
  { id: 'd', label: 'Delta' },
];

describe('shuffleOptions', () => {
  test('returns the same set of options as the input, just reordered', () => {
    const shuffled = shuffleOptions(options, 'seed-1');
    expect(shuffled).toHaveLength(options.length);
    expect(shuffled.map((o) => o.id).sort()).toEqual(options.map((o) => o.id).sort());
  });

  test('does not mutate the input array or its elements', () => {
    const original = options.map((o) => ({ ...o }));
    shuffleOptions(options, 'seed-1');
    expect(options).toEqual(original);
  });

  test('returns a new array (not the same reference)', () => {
    expect(shuffleOptions(options, 'seed-1')).not.toBe(options);
  });

  test('is deterministic for the same seed', () => {
    const first = shuffleOptions(options, 'logic-d1');
    const second = shuffleOptions(options, 'logic-d1');
    expect(first.map((o) => o.id)).toEqual(second.map((o) => o.id));
  });

  test('different seeds can produce different orders', () => {
    const seeds = Array.from({ length: 20 }, (_, i) => `seed-${i}`);
    const orders = new Set(seeds.map((seed) => shuffleOptions(options, seed).map((o) => o.id).join(',')));
    expect(orders.size).toBeGreaterThan(1);
  });

  test('does not consistently place the correct option first across same-day tasks in all five categories', () => {
    const banks = [LOGIC_TASKS, SPATIAL_TASKS, MEMORY_TASKS, LANGUAGE_TASKS, OBSERVATION_TASKS];
    const allCategoriesAreCorrectFirstOnDay = (day: number) =>
      banks.every((bank) => {
        const task = bank.find((t) => t.day === day);
        if (!task) return false;
        const shuffled = shuffleOptions(task.options, task.id);
        return shuffled[0]?.id === task.correctOptionId;
      });

    const days = Array.from({ length: 21 }, (_, i) => i + 1);
    expect(days.some(allCategoriesAreCorrectFirstOnDay)).toBe(false);
  });
});
