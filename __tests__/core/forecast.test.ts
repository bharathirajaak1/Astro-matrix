import {
  DEFAULT_MESSAGE_POOLS,
  addDays,
  buildForecast,
  buildForecastRange,
  personalDay,
  personalMonth,
  personalNumbers,
  personalYear,
  stableIndex,
} from '../../src/core/forecast';
import type { ForecastFocus, Profile } from '../../src/core/types';

const FOCUS_BY_DAY: Record<number, ForecastFocus> = {
  1: 'action',
  2: 'connect',
  3: 'create',
  4: 'plan',
  5: 'action',
  6: 'connect',
  7: 'rest',
  8: 'action',
  9: 'rest',
};

const profile = (over: Partial<Profile> = {}): Profile => ({
  id: 'u1',
  fullName: 'Ada Lovelace',
  dob: '1990-01-15',
  system: 'pythagorean',
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
});

describe('personalNumbers', () => {
  test.each<[string, string, { personalYear: number; personalMonth: number; personalDay: number }]>([
    ['1990-01-15', '2026-09-01', { personalYear: 8, personalMonth: 8, personalDay: 9 }],
    ['1940-10-09', '2026-09-01', { personalYear: 2, personalMonth: 2, personalDay: 3 }],
    ['2000-01-01', '2000-01-01', { personalYear: 4, personalMonth: 5, personalDay: 6 }],
    ['1990-06-15', '2024-12-31', { personalYear: 2, personalMonth: 5, personalDay: 9 }],
  ])('personalNumbers(%s, %s)', (dob, onDate, expected) => {
    expect(personalNumbers(dob, onDate)).toEqual(expected);
  });

  test('all three cycle numbers are single digits 1-9 across a whole month', () => {
    for (let d = 1; d <= 28; d += 1) {
      const iso = `2026-03-${String(d).padStart(2, '0')}`;
      for (const v of Object.values(personalNumbers('1987-11-23', iso))) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(9);
      }
    }
  });

  test('convenience accessors agree with personalNumbers', () => {
    const pn = personalNumbers('1990-01-15', '2026-09-01');
    expect(personalYear('1990-01-15', '2026-09-01')).toBe(pn.personalYear);
    expect(personalMonth('1990-01-15', '2026-09-01')).toBe(pn.personalMonth);
    expect(personalDay('1990-01-15', '2026-09-01')).toBe(pn.personalDay);
  });

  test('personal year depends only on birthday + target year', () => {
    expect(personalYear('1990-01-15', '2026-09-01')).toBe(personalYear('1990-01-15', '2026-02-28'));
  });

  test('invalid dates throw RangeError', () => {
    expect(() => personalNumbers('bad', '2026-09-01')).toThrow(RangeError);
    expect(() => personalNumbers('1990-01-15', '2026-13-01')).toThrow(RangeError);
  });
});

describe('stableIndex', () => {
  test.each<[string, number, number]>([
    ['x', 9, 0],
    ['abc', 5, 1],
    ['', 7, 2],
  ])('stableIndex(%p, %i) === %i (regression lock)', (seed, size, expected) => {
    expect(stableIndex(seed, size)).toBe(expected);
  });

  test('size <= 1 always returns 0', () => {
    expect(stableIndex('whatever', 0)).toBe(0);
    expect(stableIndex('whatever', 1)).toBe(0);
    expect(stableIndex('', 0)).toBe(0);
  });

  test('result is always an integer in [0, size)', () => {
    for (let i = 0; i < 500; i += 1) {
      const r = stableIndex(`seed-${i}`, 9);
      expect(Number.isInteger(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(9);
    }
  });

  test('deterministic for a given seed + size', () => {
    expect(stableIndex('astro/2026-09-01', 13)).toBe(stableIndex('astro/2026-09-01', 13));
  });

  test('is not a constant function', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i += 1) seen.add(stableIndex(`d-${i}`, 9));
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });
});

describe('buildForecast', () => {
  test('golden forecast: Ada @ 2026-09-01', () => {
    expect(buildForecast(profile(), '2026-09-01')).toEqual({
      date: '2026-09-01',
      personalYear: 8,
      personalMonth: 8,
      personalDay: 9,
      headline: 'Let something end',
      body: 'A 9 day is for completion and release. Close the loop, give it away, and clear space for what is next.',
      luckyNumber: 4,
      focus: 'rest',
    });
  });

  test('golden forecast: John Lennon @ 2026-09-01', () => {
    expect(
      buildForecast(profile({ fullName: 'John Lennon', dob: '1940-10-09' }), '2026-09-01'),
    ).toEqual({
      date: '2026-09-01',
      personalYear: 2,
      personalMonth: 2,
      personalDay: 3,
      headline: 'Say it out loud',
      body: 'A 3 day lifts expression and play. Share the idea, send the message, make something for the joy of it.',
      luckyNumber: 1,
      focus: 'create',
    });
  });

  test('normalizes the date and rejects unpadded input', () => {
    expect(buildForecast(profile(), '  2026-09-01  ').date).toBe('2026-09-01');
    expect(() => buildForecast(profile(), '2026-9-1')).toThrow(RangeError);
  });

  test('cycle numbers match personalNumbers', () => {
    for (const iso of ['2026-01-05', '2026-06-18', '2026-11-30']) {
      const f = buildForecast(profile({ dob: '1977-03-22' }), iso);
      expect({
        personalYear: f.personalYear,
        personalMonth: f.personalMonth,
        personalDay: f.personalDay,
      }).toEqual(personalNumbers('1977-03-22', iso));
    }
  });

  test('headline/body come from the pool for that personal day; focus + lucky number are consistent', () => {
    const p = profile({ dob: '1977-03-22' });
    for (let i = 0; i < 75; i += 1) {
      const f = buildForecast(p, addDays('2026-01-01', i));
      const pool = DEFAULT_MESSAGE_POOLS[f.personalDay];
      expect(pool.some((e) => e.headline === f.headline && e.body === f.body)).toBe(true);
      expect(f.focus).toBe(FOCUS_BY_DAY[f.personalDay]);
      expect(f.luckyNumber).toBeGreaterThanOrEqual(1);
      expect(f.luckyNumber).toBeLessThanOrEqual(9);
    }
  });

  test('is deterministic', () => {
    const p = profile();
    expect(buildForecast(p, '2026-09-01')).toEqual(buildForecast(p, '2026-09-01'));
  });

  test('custom pools override the default for the matching personal day', () => {
    const pools = { 3: [{ headline: 'CUSTOM', body: 'custom body' }] };
    const f = buildForecast(profile({ dob: '1940-10-09' }), '2026-09-01', { pools });
    expect(f.personalDay).toBe(3);
    expect(f.headline).toBe('CUSTOM');
    expect(f.body).toBe('custom body');
  });

  test('an empty custom pool falls back to the default pool', () => {
    const f = buildForecast(profile({ dob: '1940-10-09' }), '2026-09-01', { pools: { 3: [] } });
    expect(DEFAULT_MESSAGE_POOLS[3].some((e) => e.headline === f.headline)).toBe(true);
  });

  test('a custom pool for a non-matching day is ignored', () => {
    const control = buildForecast(profile({ dob: '1940-10-09' }), '2026-09-01');
    const withUnrelated = buildForecast(profile({ dob: '1940-10-09' }), '2026-09-01', {
      pools: { 7: [{ headline: 'X', body: 'Y' }] },
    });
    expect(withUnrelated.headline).toBe(control.headline);
  });

  test('profile id feeds the selection but every result stays a valid pool entry', () => {
    for (const d of ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04']) {
      for (const id of ['aaa', 'zzz', 'user-42']) {
        const f = buildForecast(profile({ id }), d);
        expect(DEFAULT_MESSAGE_POOLS[f.personalDay].some((e) => e.headline === f.headline)).toBe(true);
      }
    }
  });
});

describe('DEFAULT_MESSAGE_POOLS', () => {
  test('has a non-empty, well-formed pool for every personal day 1-9', () => {
    for (let d = 1; d <= 9; d += 1) {
      const pool = DEFAULT_MESSAGE_POOLS[d];
      expect(Array.isArray(pool)).toBe(true);
      expect(pool.length).toBeGreaterThan(0);
      for (const entry of pool) {
        expect(typeof entry.headline).toBe('string');
        expect(entry.headline.length).toBeGreaterThan(0);
        expect(typeof entry.body).toBe('string');
        expect(entry.body.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('addDays', () => {
  test.each<[string, number, string]>([
    ['2026-09-01', 0, '2026-09-01'],
    ['2026-02-28', 1, '2026-03-01'],
    ['2024-02-28', 1, '2024-02-29'],
    ['2024-03-01', -1, '2024-02-29'],
    ['2025-01-01', -1, '2024-12-31'],
    ['2019-12-31', 1, '2020-01-01'],
    ['2026-09-01', 30, '2026-10-01'],
    ['2026-01-31', 1, '2026-02-01'],
    ['2000-01-01', 365, '2000-12-31'],
    ['2001-01-01', 365, '2002-01-01'],
  ])('addDays(%s, %i) === %s', (date, delta, expected) => {
    expect(addDays(date, delta)).toBe(expected);
  });

  test('matches a UTC Date oracle across a wide range of offsets', () => {
    const base = Date.UTC(1995, 6, 13);
    for (let delta = -1000; delta <= 1000; delta += 7) {
      const oracle = new Date(base + delta * 86_400_000).toISOString().slice(0, 10);
      expect(addDays('1995-07-13', delta)).toBe(oracle);
    }
  });

  test('round-trips', () => {
    for (const d of ['2026-09-01', '2000-02-29', '1970-01-01', '2099-12-31']) {
      expect(addDays(addDays(d, 137), -137)).toBe(d);
      expect(addDays(addDays(d, -365), 365)).toBe(d);
    }
  });

  test('truncates fractional deltas', () => {
    expect(addDays('2026-09-01', 1.9)).toBe('2026-09-02');
  });

  test('invalid date throws RangeError', () => {
    expect(() => addDays('nope', 1)).toThrow(RangeError);
  });
});

describe('buildForecastRange', () => {
  test('produces N consecutive ascending days', () => {
    const r = buildForecastRange(profile(), '2026-09-01', 7);
    expect(r.map((f) => f.date)).toEqual([
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
      '2026-09-07',
    ]);
  });

  test('negative count walks backwards but returns chronological order', () => {
    const r = buildForecastRange(profile(), '2026-09-01', -3);
    expect(r.map((f) => f.date)).toEqual(['2026-08-30', '2026-08-31', '2026-09-01']);
  });

  test.each<[number, number]>([
    [0, 0],
    [1, 1],
    [-1, 1],
  ])('count %i -> length %i', (days, len) => {
    expect(buildForecastRange(profile(), '2026-09-01', days)).toHaveLength(len);
  });

  test('each entry equals buildForecast for that date', () => {
    const p = profile({ dob: '1965-08-19' });
    for (const f of buildForecastRange(p, '2026-09-01', 5)) {
      expect(f).toEqual(buildForecast(p, f.date));
    }
  });

  test('passes custom pools through to every day', () => {
    const pools = { 3: [{ headline: 'RANGE-CUSTOM', body: 'b' }] };
    const r = buildForecastRange(profile({ dob: '1940-10-09' }), '2026-09-01', 1, { pools });
    expect(r[0].personalDay).toBe(3);
    expect(r[0].headline).toBe('RANGE-CUSTOM');
  });

  test('is deterministic', () => {
    const p = profile();
    expect(buildForecastRange(p, '2026-09-01', 10)).toEqual(buildForecastRange(p, '2026-09-01', 10));
  });

  test('truncates a fractional count', () => {
    expect(buildForecastRange(profile(), '2026-09-01', 3.9)).toHaveLength(3);
  });
});
