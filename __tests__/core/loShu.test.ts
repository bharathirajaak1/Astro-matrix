import { LO_SHU_LAYOUT, buildLoShuGrid, loShuDigits } from '../../src/core/loShu';

describe('LO_SHU_LAYOUT', () => {
  test('is the fixed magic square', () => {
    expect(LO_SHU_LAYOUT).toEqual([
      [4, 9, 2],
      [3, 5, 7],
      [8, 1, 6],
    ]);
  });

  test('every row and column sums to 15', () => {
    for (let i = 0; i < 3; i += 1) {
      const row = LO_SHU_LAYOUT[i];
      expect(row[0] + row[1] + row[2]).toBe(15);
      expect(LO_SHU_LAYOUT[0][i] + LO_SHU_LAYOUT[1][i] + LO_SHU_LAYOUT[2][i]).toBe(15);
    }
  });
});

describe('loShuDigits', () => {
  test.each<[string, number[]]>([
    ['1940-10-09', [9, 1, 1, 9, 4]],
    ['2000-01-01', [1, 1, 2]],
    ['2000-02-29', [2, 9, 2, 2]],
    ['1987-06-24', [2, 4, 6, 1, 9, 8, 7]],
    ['2011-11-11', [1, 1, 1, 1, 2, 1, 1]],
    ['2000-10-20', [2, 1, 2]],
  ])('loShuDigits(%s)', (dob, expected) => {
    expect(loShuDigits(dob)).toEqual(expected);
  });

  test('never yields 0', () => {
    for (const dob of ['2000-10-20', '2020-01-01', '1900-10-10', '2000-02-29']) {
      expect(loShuDigits(dob)).not.toContain(0);
    }
  });

  test('invalid dob throws RangeError', () => {
    expect(() => loShuDigits('2026-13-01')).toThrow(RangeError);
    expect(() => loShuDigits('nope')).toThrow(RangeError);
  });
});

describe('buildLoShuGrid', () => {
  test('1987-06-24: missing 3 and 5, three golden planes, no silver', () => {
    const g = buildLoShuGrid('1987-06-24');
    expect(g.counts).toEqual({ 1: 1, 2: 1, 3: 0, 4: 1, 5: 0, 6: 1, 7: 1, 8: 1, 9: 1 });
    expect(g.missing).toEqual([3, 5]);
    expect(g.repeated).toEqual([]);
    expect(g.planes).toEqual({
      mind: true,
      soul: false,
      practical: true,
      thought: false,
      will: false,
      action: true,
      goldenYogas: [
        'Mind plane (4-9-2)',
        'Practical plane (8-1-6)',
        'Action plane (2-7-6)',
      ],
      silverYogas: [],
    });
  });

  test('1940-10-09: repeated 1 and 9, three silver yogas, no golden, no full plane', () => {
    const g = buildLoShuGrid('1940-10-09');
    expect(g.counts).toEqual({ 1: 2, 2: 0, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 2 });
    expect(g.missing).toEqual([2, 3, 5, 6, 7, 8]);
    expect(g.repeated).toEqual([1, 9]);
    expect(g.planes.goldenYogas).toEqual([]);
    expect(g.planes.silverYogas).toEqual([
      'Soul plane (3-5-7)',
      'Action plane (2-7-6)',
      'Silver diagonal (2-5-8)',
    ]);
    expect([g.planes.mind, g.planes.soul, g.planes.practical, g.planes.thought, g.planes.will, g.planes.action])
      .toEqual([false, false, false, false, false, false]);
  });

  test('2011-11-11: 1 repeated six times, three silver yogas', () => {
    const g = buildLoShuGrid('2011-11-11');
    expect(g.counts[1]).toBe(6);
    expect(g.counts[2]).toBe(1);
    expect(g.repeated).toEqual([1]);
    expect(g.missing).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect(g.planes.goldenYogas).toEqual([]);
    expect(g.planes.silverYogas).toEqual([
      'Soul plane (3-5-7)',
      'Thought plane (4-3-8)',
      'Golden diagonal (4-5-6)',
    ]);
  });

  test('counts always carries all nine keys; totals match the non-zero DOB digits', () => {
    for (const dob of ['1940-10-09', '2000-01-01', '1987-06-24', '2011-11-11', '1999-09-19']) {
      const { counts } = buildLoShuGrid(dob);
      expect(
        Object.keys(counts)
          .map(Number)
          .sort((a, b) => a - b),
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const n of Object.values(counts)) {
        expect(typeof n).toBe('number');
        expect(n).toBeGreaterThanOrEqual(0);
      }
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      expect(total).toBe(loShuDigits(dob).length);
    }
  });

  test('missing and repeated are disjoint and consistent with counts', () => {
    for (const dob of ['1940-10-09', '1987-06-24', '2011-11-11', '2000-12-25']) {
      const { counts, missing, repeated } = buildLoShuGrid(dob);
      for (const d of missing) expect(counts[d]).toBe(0);
      for (const d of repeated) expect(counts[d]).toBeGreaterThanOrEqual(2);
      expect(missing.filter((d) => repeated.includes(d))).toEqual([]);
    }
  });

  test('extraDigits fold drivers into the grid; out-of-range values are ignored', () => {
    const base = buildLoShuGrid('2000-01-01');
    expect(base.counts[5]).toBe(0);

    const withDrivers = buildLoShuGrid('2000-01-01', { extraDigits: [5, 5, 0, 10, -3] });
    expect(withDrivers.counts[5]).toBe(2);
    expect(withDrivers.counts[1]).toBe(base.counts[1]);

    const baseTotal = Object.values(base.counts).reduce((a, b) => a + b, 0);
    const driverTotal = Object.values(withDrivers.counts).reduce((a, b) => a + b, 0);
    expect(driverTotal).toBe(baseTotal + 2);
  });

  test('extraDigits truncates fractional values', () => {
    const g = buildLoShuGrid('2000-01-01', { extraDigits: [5.9, 7.1] });
    expect(g.counts[5]).toBe(1);
    expect(g.counts[7]).toBe(1);
  });

  test('a grid with all nine digits marks every plane and lists all eight golden yogas', () => {
    const g = buildLoShuGrid('1987-06-24', { extraDigits: [3, 5] });
    expect(g.missing).toEqual([]);
    expect(
      g.planes.mind &&
        g.planes.soul &&
        g.planes.practical &&
        g.planes.thought &&
        g.planes.will &&
        g.planes.action,
    ).toBe(true);
    expect(g.planes.goldenYogas).toEqual([
      'Mind plane (4-9-2)',
      'Soul plane (3-5-7)',
      'Practical plane (8-1-6)',
      'Thought plane (4-3-8)',
      'Will plane (9-5-1)',
      'Action plane (2-7-6)',
      'Golden diagonal (4-5-6)',
      'Silver diagonal (2-5-8)',
    ]);
    expect(g.planes.silverYogas).toEqual([]);
  });

  test('is deterministic and does not mutate the options object', () => {
    const opts = { extraDigits: [3, 5] };
    const a = buildLoShuGrid('1987-06-24', opts);
    const b = buildLoShuGrid('1987-06-24', { extraDigits: [3, 5] });
    expect(a).toEqual(b);
    expect(opts.extraDigits).toEqual([3, 5]);
  });

  test('invalid dob throws RangeError', () => {
    expect(() => buildLoShuGrid('nope')).toThrow(RangeError);
    expect(() => buildLoShuGrid('2026-02-30')).toThrow(RangeError);
  });
});
