import {
  ANNUAL_MESSAGE_POOLS,
  DEFAULT_MESSAGE_POOLS,
  FOCUS_BY_DAY,
  MONTHLY_MESSAGE_POOLS,
  WEEKLY_MESSAGE_POOLS,
  addDays,
  buildAnnualForecast,
  buildForecast,
  buildForecastRange,
  buildMonthlyForecast,
  buildWeeklyForecast,
  dayWatchFor,
  personalDay,
  personalMonth,
  personalNumbers,
  personalWeek,
  personalYear,
  stableIndex,
  weekBounds,
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
      headline: 'Let Something End',
      body: 'Today may be well suited to completion and release. You might find it useful to close a loop, let something go, or clear space for what comes next.',
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
      headline: 'Say It Out Loud',
      body: 'Today may be a good time to communicate an idea, have an open conversation, or spend time on something creative. Choose one thing you want to express and give it some attention.',
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

describe('weekBounds', () => {
  test('normal week: 2026-09-29 (Tue) -> Sun 2026-09-27 through Sat 2026-10-03', () => {
    expect(weekBounds('2026-09-29')).toEqual({
      weekStart: '2026-09-27',
      weekEnd: '2026-10-03',
    });
  });

  test('a Sunday returns itself as weekStart', () => {
    expect(weekBounds('2026-09-27')).toEqual({
      weekStart: '2026-09-27',
      weekEnd: '2026-10-03',
    });
  });

  test('a Saturday returns the preceding Sunday and itself as weekEnd', () => {
    expect(weekBounds('2026-10-03')).toEqual({
      weekStart: '2026-09-27',
      weekEnd: '2026-10-03',
    });
  });

  test('month boundary: week of 2026-08-31 spans August into September', () => {
    expect(weekBounds('2026-08-31')).toEqual({
      weekStart: '2026-08-30',
      weekEnd: '2026-09-05',
    });
  });

  test('year boundary: week of 2026-12-30 spans 2026 into 2027', () => {
    expect(weekBounds('2026-12-30')).toEqual({
      weekStart: '2026-12-27',
      weekEnd: '2027-01-02',
    });
  });

  test('invariant: weekStart is always a Sunday, weekEnd always a Saturday, 6 days apart', () => {
    for (let i = 0; i < 30; i += 1) {
      const iso = addDays('2026-01-01', i * 11);
      const { weekStart, weekEnd } = weekBounds(iso);
      expect(weekBounds(weekStart).weekStart).toBe(weekStart);
      expect(weekBounds(weekEnd).weekEnd).toBe(weekEnd);
      expect(addDays(weekStart, 6)).toBe(weekEnd);
    }
  });

  test('is deterministic', () => {
    expect(weekBounds('2026-09-29')).toEqual(weekBounds('2026-09-29'));
  });

  test('invalid date throws RangeError', () => {
    expect(() => weekBounds('nope')).toThrow(RangeError);
  });
});

describe('personalWeek', () => {
  const dob = '1990-01-15';

  test('agreed example: DOB 1990-01-15, week 2026-09-27..2026-10-03 -> sum 26 -> Personal Week 8', () => {
    const { weekStart } = weekBounds('2026-09-29');
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    expect(days.map((d) => personalDay(dob, d))).toEqual([8, 9, 1, 2, 1, 2, 3]);
    expect(days.reduce((sum, d) => sum + personalDay(dob, d), 0)).toBe(26);
    expect(personalWeek(dob, '2026-09-29')).toBe(8);
  });

  test('month boundary: week of 2026-08-31 spans August into September', () => {
    // days: 2026-08-30..2026-09-05, personalDay values [1,2,9,1,2,3,4], sum 22 -> 4
    expect(personalWeek(dob, '2026-08-31')).toBe(4);
  });

  test('year boundary: week of 2026-12-30 spans 2026 into 2027', () => {
    // days: 2026-12-27..2027-01-02, personalDay values [2,3,4,5,6,2,3], sum 25 -> 7
    expect(personalWeek(dob, '2026-12-30')).toBe(7);
  });

  test('every date within the same Sunday-Saturday week returns the same Personal Week number', () => {
    const { weekStart } = weekBounds('2026-09-29');
    const results = Array.from({ length: 7 }, (_, i) => personalWeek(dob, addDays(weekStart, i)));
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe(8);
  });

  test('is deterministic for the same DOB and week', () => {
    expect(personalWeek(dob, '2026-09-29')).toBe(personalWeek(dob, '2026-09-29'));
  });

  test('result is always a single digit 1-9', () => {
    for (let i = 0; i < 60; i += 1) {
      const w = personalWeek(dob, addDays('2026-01-01', i * 6));
      expect(w).toBeGreaterThanOrEqual(1);
      expect(w).toBeLessThanOrEqual(9);
    }
  });

  test('invalid date throws RangeError, matching existing forecast/date validation', () => {
    expect(() => personalWeek(dob, 'nope')).toThrow(RangeError);
    expect(() => personalWeek('bad', '2026-09-29')).toThrow(RangeError);
  });
});

describe('period message pools (Weekly/Monthly/Annual)', () => {
  test.each<[string, typeof WEEKLY_MESSAGE_POOLS]>([
    ['WEEKLY_MESSAGE_POOLS', WEEKLY_MESSAGE_POOLS],
    ['MONTHLY_MESSAGE_POOLS', MONTHLY_MESSAGE_POOLS],
    ['ANNUAL_MESSAGE_POOLS', ANNUAL_MESSAGE_POOLS],
  ])('%s has at least 2 well-formed entries for every digit 1-9', (_name, pool) => {
    for (let d = 1; d <= 9; d += 1) {
      const entries = pool[d];
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThanOrEqual(2);
      for (const entry of entries) {
        expect(typeof entry.headline).toBe('string');
        expect(entry.headline.length).toBeGreaterThan(0);
        expect(typeof entry.body).toBe('string');
        expect(entry.body.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('buildWeeklyForecast', () => {
  const p = profile({ dob: '1990-01-15' });

  test('primaryNumber matches personalWeek; content comes from WEEKLY_MESSAGE_POOLS', () => {
    const f = buildWeeklyForecast(p, '2026-09-29');
    expect(f.primaryNumber).toBe(personalWeek(p.dob, '2026-09-29'));
    expect(f.primaryNumber).toBe(8);
    const pool = WEEKLY_MESSAGE_POOLS[f.primaryNumber];
    expect(pool.some((e) => e.headline === f.headline && e.body === f.body)).toBe(true);
    expect(pool.some((e) => e.headline === f.themeHeadline && e.body === f.themeBody)).toBe(true);
  });

  test('headline/body and themeHeadline/themeBody are distinct entries', () => {
    for (const iso of ['2026-01-05', '2026-06-18', '2026-11-30']) {
      const f = buildWeeklyForecast(p, iso);
      expect(f.themeHeadline).not.toBe(f.headline);
    }
  });

  test('focus is derived from FOCUS_BY_DAY for the Personal Week digit', () => {
    const f = buildWeeklyForecast(p, '2026-09-29');
    expect(f.focus).toBe(FOCUS_BY_DAY[f.primaryNumber]);
  });

  test('every date within the same Sunday-Saturday week yields identical content', () => {
    const { weekStart } = weekBounds('2026-09-29');
    const results = Array.from({ length: 7 }, (_, i) => buildWeeklyForecast(p, addDays(weekStart, i)));
    expect(new Set(results.map((r) => JSON.stringify(r))).size).toBe(1);
  });

  test('month boundary: week of 2026-08-31 spans August into September', () => {
    const f = buildWeeklyForecast(p, '2026-08-31');
    expect(f.primaryNumber).toBe(4);
  });

  test('year boundary: week of 2026-12-30 spans 2026 into 2027', () => {
    const f = buildWeeklyForecast(p, '2026-12-30');
    expect(f.primaryNumber).toBe(7);
  });

  test('is deterministic', () => {
    expect(buildWeeklyForecast(p, '2026-09-29')).toEqual(buildWeeklyForecast(p, '2026-09-29'));
  });
});

describe('buildMonthlyForecast', () => {
  const p = profile({ dob: '1990-01-15' });

  test('primaryNumber matches personalMonth; content comes from MONTHLY_MESSAGE_POOLS', () => {
    const f = buildMonthlyForecast(p, '2026-09-29');
    expect(f.primaryNumber).toBe(personalMonth(p.dob, '2026-09-29'));
    const pool = MONTHLY_MESSAGE_POOLS[f.primaryNumber];
    expect(pool.some((e) => e.headline === f.headline && e.body === f.body)).toBe(true);
    expect(f.themeHeadline).not.toBe(f.headline);
  });

  test('every date within the same calendar month yields identical content', () => {
    const results = ['2026-09-01', '2026-09-15', '2026-09-30'].map((d) => buildMonthlyForecast(p, d));
    expect(new Set(results.map((r) => JSON.stringify(r))).size).toBe(1);
  });

  test('is deterministic', () => {
    expect(buildMonthlyForecast(p, '2026-09-29')).toEqual(buildMonthlyForecast(p, '2026-09-29'));
  });
});

describe('buildAnnualForecast', () => {
  const p = profile({ dob: '1990-01-15' });

  test('primaryNumber matches personalYear; content comes from ANNUAL_MESSAGE_POOLS', () => {
    const f = buildAnnualForecast(p, '2026-09-29');
    expect(f.primaryNumber).toBe(personalYear(p.dob, '2026-09-29'));
    const pool = ANNUAL_MESSAGE_POOLS[f.primaryNumber];
    expect(pool.some((e) => e.headline === f.headline && e.body === f.body)).toBe(true);
    expect(f.themeHeadline).not.toBe(f.headline);
  });

  test('every date within the same calendar year yields identical content', () => {
    const results = ['2026-01-01', '2026-06-15', '2026-12-31'].map((d) => buildAnnualForecast(p, d));
    expect(new Set(results.map((r) => JSON.stringify(r))).size).toBe(1);
  });

  test('is deterministic', () => {
    expect(buildAnnualForecast(p, '2026-09-29')).toEqual(buildAnnualForecast(p, '2026-09-29'));
  });
});

describe('dayWatchFor', () => {
  const p = profile({ dob: '1990-01-15' });

  test('returns a distinct entry from the same personal day pool used by buildForecast', () => {
    const iso = '2026-09-01';
    const forecast = buildForecast(p, iso);
    const watch = dayWatchFor(p, iso);
    const pool = DEFAULT_MESSAGE_POOLS[forecast.personalDay];
    expect(pool.some((e) => e.headline === watch.headline && e.body === watch.body)).toBe(true);
    expect(watch.headline).not.toBe(forecast.headline);
  });

  test('is deterministic', () => {
    expect(dayWatchFor(p, '2026-09-01')).toEqual(dayWatchFor(p, '2026-09-01'));
  });

  test('stays distinct from the primary entry across a range of dates', () => {
    for (let i = 0; i < 30; i += 1) {
      const iso = addDays('2026-01-01', i);
      const forecast = buildForecast(p, iso);
      const watch = dayWatchFor(p, iso);
      expect(watch.headline).not.toBe(forecast.headline);
    }
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
