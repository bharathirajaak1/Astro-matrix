import {
  EXPRESSION_PLANES,
  getAllExpressionPlanePresence,
  getExpressionPlanePresence,
  type ExpressionPlaneId,
} from '../../src/core/expressionPlanes';
import type { Digit } from '../../src/core/types';

function countsFrom(present: readonly Digit[]): Record<Digit, number> {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } as Record<Digit, number>;
  for (const d of present) counts[d] += 1;
  return counts;
}

describe('EXPRESSION_PLANES', () => {
  test('has exactly the six expected Plane ids, in order', () => {
    const ids = EXPRESSION_PLANES.map((p) => p.id);
    expect(ids).toEqual<ExpressionPlaneId[]>([
      'mindLogic',
      'heartIntuition',
      'actionGrounding',
      'visionPlanning',
      'drivePersistence',
      'manifestation',
    ]);
  });

  test.each<[ExpressionPlaneId, string, Digit[]]>([
    ['mindLogic', 'Mind & Logic', [4, 9, 2]],
    ['heartIntuition', 'Heart & Intuition', [3, 5, 7]],
    ['actionGrounding', 'Action & Grounding', [8, 1, 6]],
    ['visionPlanning', 'Vision & Planning', [4, 3, 8]],
    ['drivePersistence', 'Drive & Persistence', [9, 5, 1]],
    ['manifestation', 'Manifestation', [2, 7, 6]],
  ])('%s has name %s and numbers %p', (id, name, numbers) => {
    const plane = EXPRESSION_PLANES.find((p) => p.id === id);
    expect(plane?.name).toBe(name);
    expect(plane?.numbers).toEqual(numbers);
  });

  test('every Plane has exactly 3 numbers and 3 cells', () => {
    for (const plane of EXPRESSION_PLANES) {
      expect(plane.numbers).toHaveLength(3);
      expect(plane.cells).toHaveLength(3);
    }
  });

  test('numbers and cells stay 1:1 in grid-reading order', () => {
    for (const plane of EXPRESSION_PLANES) {
      expect(plane.cells.map((c) => c.digit)).toEqual(plane.numbers);
    }
  });

  test.each<[ExpressionPlaneId, 'row' | 'column']>([
    ['mindLogic', 'row'],
    ['heartIntuition', 'row'],
    ['actionGrounding', 'row'],
    ['visionPlanning', 'column'],
    ['drivePersistence', 'column'],
    ['manifestation', 'column'],
  ])('%s is a %s', (id, type) => {
    const plane = EXPRESSION_PLANES.find((p) => p.id === id);
    expect(plane?.type).toBe(type);
  });

  test('row Planes share the same row index across all 3 cells; column Planes share the same column index', () => {
    const rowPlanes = EXPRESSION_PLANES.filter((p) => p.type === 'row');
    for (const plane of rowPlanes) {
      const rows = plane.cells.map((c) => c.row);
      expect(new Set(rows).size).toBe(1);
    }

    const columnPlanes = EXPRESSION_PLANES.filter((p) => p.type === 'column');
    for (const plane of columnPlanes) {
      const cols = plane.cells.map((c) => c.col);
      expect(new Set(cols).size).toBe(1);
    }
  });

  test('mindLogic occupies row 0 at columns 0, 1, 2', () => {
    const plane = EXPRESSION_PLANES.find((p) => p.id === 'mindLogic');
    expect(plane?.cells).toEqual([
      { row: 0, col: 0, digit: 4 },
      { row: 0, col: 1, digit: 9 },
      { row: 0, col: 2, digit: 2 },
    ]);
  });

  test('heartIntuition occupies row 1 at columns 0, 1, 2', () => {
    const plane = EXPRESSION_PLANES.find((p) => p.id === 'heartIntuition');
    expect(plane?.cells).toEqual([
      { row: 1, col: 0, digit: 3 },
      { row: 1, col: 1, digit: 5 },
      { row: 1, col: 2, digit: 7 },
    ]);
  });

  test('actionGrounding occupies row 2 at columns 0, 1, 2', () => {
    const plane = EXPRESSION_PLANES.find((p) => p.id === 'actionGrounding');
    expect(plane?.cells).toEqual([
      { row: 2, col: 0, digit: 8 },
      { row: 2, col: 1, digit: 1 },
      { row: 2, col: 2, digit: 6 },
    ]);
  });

  test('visionPlanning occupies column 0 at rows 0, 1, 2', () => {
    const plane = EXPRESSION_PLANES.find((p) => p.id === 'visionPlanning');
    expect(plane?.cells).toEqual([
      { row: 0, col: 0, digit: 4 },
      { row: 1, col: 0, digit: 3 },
      { row: 2, col: 0, digit: 8 },
    ]);
  });

  test('drivePersistence occupies column 1 at rows 0, 1, 2', () => {
    const plane = EXPRESSION_PLANES.find((p) => p.id === 'drivePersistence');
    expect(plane?.cells).toEqual([
      { row: 0, col: 1, digit: 9 },
      { row: 1, col: 1, digit: 5 },
      { row: 2, col: 1, digit: 1 },
    ]);
  });

  test('manifestation occupies column 2 at rows 0, 1, 2', () => {
    const plane = EXPRESSION_PLANES.find((p) => p.id === 'manifestation');
    expect(plane?.cells).toEqual([
      { row: 0, col: 2, digit: 2 },
      { row: 1, col: 2, digit: 7 },
      { row: 2, col: 2, digit: 6 },
    ]);
  });
});

describe('getExpressionPlanePresence', () => {
  const mindLogic = EXPRESSION_PLANES.find((p) => p.id === 'mindLogic')!;

  test('presentCount 0 when none of the Plane numbers are present', () => {
    const counts = countsFrom([1, 3, 5, 6, 7, 8]);
    const presence = getExpressionPlanePresence(mindLogic, counts);
    expect(presence.presentCount).toBe(0);
    expect(presence.presentNumbers).toEqual([]);
    expect(presence.missingNumbers).toEqual([4, 9, 2]);
  });

  test('presentCount 1 when exactly one of the Plane numbers is present', () => {
    const counts = countsFrom([4, 1, 3]);
    const presence = getExpressionPlanePresence(mindLogic, counts);
    expect(presence.presentCount).toBe(1);
    expect(presence.presentNumbers).toEqual([4]);
    expect(presence.missingNumbers).toEqual([9, 2]);
  });

  test('presentCount 2 when exactly two of the Plane numbers are present', () => {
    const counts = countsFrom([4, 9, 1]);
    const presence = getExpressionPlanePresence(mindLogic, counts);
    expect(presence.presentCount).toBe(2);
    expect(presence.presentNumbers).toEqual([4, 9]);
    expect(presence.missingNumbers).toEqual([2]);
  });

  test('presentCount 3 when all three Plane numbers are present', () => {
    const counts = countsFrom([4, 9, 2, 2, 9]);
    const presence = getExpressionPlanePresence(mindLogic, counts);
    expect(presence.presentCount).toBe(3);
    expect(presence.presentNumbers).toEqual([4, 9, 2]);
    expect(presence.missingNumbers).toEqual([]);
  });

  test('does not mutate the supplied counts', () => {
    const counts = countsFrom([4, 9]);
    const before = { ...counts };
    getExpressionPlanePresence(mindLogic, counts);
    expect(counts).toEqual(before);
  });

  test('returns the Plane itself in the result, unmodified', () => {
    const counts = countsFrom([]);
    const presence = getExpressionPlanePresence(mindLogic, counts);
    expect(presence.plane).toBe(mindLogic);
  });
});

describe('getAllExpressionPlanePresence', () => {
  test('returns one presence entry per Plane, in the same order as EXPRESSION_PLANES', () => {
    const counts = countsFrom([4, 9, 2]);
    const all = getAllExpressionPlanePresence(counts);
    expect(all).toHaveLength(6);
    expect(all.map((p) => p.plane.id)).toEqual(EXPRESSION_PLANES.map((p) => p.id));
  });

  test('a DOB with every digit present yields presentCount 3 for every Plane', () => {
    const counts = countsFrom([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const all = getAllExpressionPlanePresence(counts);
    for (const presence of all) {
      expect(presence.presentCount).toBe(3);
      expect(presence.missingNumbers).toEqual([]);
    }
  });

  test('a DOB with no digits present yields presentCount 0 for every Plane', () => {
    const counts = countsFrom([]);
    const all = getAllExpressionPlanePresence(counts);
    for (const presence of all) {
      expect(presence.presentCount).toBe(0);
      expect(presence.presentNumbers).toEqual([]);
    }
  });
});
