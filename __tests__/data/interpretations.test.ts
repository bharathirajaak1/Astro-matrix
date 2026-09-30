import {
  explainDayCalculation,
  explainMonthCalculation,
  explainPersonalNumber,
  explainWeekCalculation,
  explainYearCalculation,
  meaningFor,
} from '../../src/data/interpretations';
import {
  personalDay,
  personalDayBreakdown,
  personalMonth,
  personalMonthBreakdown,
  personalWeek,
  personalWeekBreakdown,
  personalYear,
  personalYearBreakdown,
} from '../../src/core/forecast';

describe('explainPersonalNumber', () => {
  test('day: states the number and reuses meaningFor() as the theme clause', () => {
    const e = explainPersonalNumber('day', 3);
    expect(e.numberStatement).toBe('Your Personal Day Number is 3.');
    expect(e.represents).toBe(
      'In numerology, this number represents the theme associated with your day today — expression, creativity, and social spark.',
    );
    expect(e.whereFrom.length).toBeGreaterThan(0);
    expect(e.whyRelevant.length).toBeGreaterThan(0);
  });

  test('week: explanation makes clear this is an AstroMatrix-defined convention, not a universal standard', () => {
    const e = explainPersonalNumber('week', 7);
    expect(e.numberStatement).toBe('Your Personal Week Number is 7.');
    expect(e.whereFrom.toLowerCase()).toContain('astromatrix-defined');
    expect(e.whereFrom.toLowerCase()).not.toContain('universal numerology standard.');
  });

  test('month', () => {
    const e = explainPersonalNumber('month', 1);
    expect(e.numberStatement).toBe('Your Personal Month Number is 1.');
    expect(e.represents).toContain('your current month');
  });

  test('year: uses the "broader theme" phrasing', () => {
    const e = explainPersonalNumber('year', 1);
    expect(e.numberStatement).toBe('Your Personal Year Number is 1.');
    expect(e.represents).toBe(
      `In numerology, this number represents the broader theme associated with your year — ${meaningFor(1)
        .replace(/\.$/, '')
        .toLowerCase()}.`,
    );
  });

  test('the theme clause always matches meaningFor(digit), reworded (no separate digit-meaning dictionary)', () => {
    for (let d = 1; d <= 9; d += 1) {
      for (const period of ['day', 'week', 'month', 'year'] as const) {
        const e = explainPersonalNumber(period, d);
        const expectedClause = meaningFor(d).replace(/\.$/, '');
        const lowered = expectedClause.charAt(0).toLowerCase() + expectedClause.slice(1);
        expect(e.represents.endsWith(`${lowered}.`)).toBe(true);
      }
    }
  });

  test('is deterministic', () => {
    expect(explainPersonalNumber('day', 5)).toEqual(explainPersonalNumber('day', 5));
  });
});

describe('dynamic "how is this calculated?" explanations', () => {
  const dob = '2000-02-25';
  const onDate = '2026-09-30';

  test('year: shows the actual reduced birth day/month/year and agrees with personalYear()', () => {
    const breakdown = personalYearBreakdown(dob, onDate);
    expect(breakdown).toEqual({
      reducedBirthDay: 7,
      reducedBirthMonth: 2,
      reducedTargetYear: 1,
      sum: 10,
      personalYear: 1,
    });
    expect(breakdown.personalYear).toBe(personalYear(dob, onDate));
    expect(explainYearCalculation(breakdown)).toBe(
      'Your Personal Year Number is calculated from your reduced birth day, birth month, and the current year. For you, that is 7 + 2 + 1 = 10 → 1.',
    );
  });

  test('month: shows Personal Year + calendar month and agrees with personalMonth()', () => {
    const breakdown = personalMonthBreakdown(dob, onDate);
    expect(breakdown).toEqual({
      personalYear: 1,
      month: 9,
      sum: 10,
      personalMonth: 1,
    });
    expect(breakdown.personalMonth).toBe(personalMonth(dob, onDate));
    expect(explainMonthCalculation(breakdown)).toBe(
      'Your Personal Month Number is calculated by adding your Personal Year Number and the calendar month. For September, that is 1 + 9 = 10 → 1.',
    );
  });

  test('day: shows Personal Month + day of month and agrees with personalDay()', () => {
    const breakdown = personalDayBreakdown(dob, onDate);
    expect(breakdown).toEqual({
      personalMonth: 1,
      day: 30,
      sum: 31,
      personalDay: 4,
    });
    expect(breakdown.personalDay).toBe(personalDay(dob, onDate));
    expect(explainDayCalculation(breakdown)).toBe(
      'Your Personal Day Number is calculated by adding your Personal Month Number and the day of the month. For today, that is 1 + 30 = 31 → 4.',
    );
  });

  test('week: shows the 7 correct Personal Day values for the correct week and agrees with personalWeek()', () => {
    const weekDob = '1990-01-15';
    const weekDate = '2026-09-29';
    const breakdown = personalWeekBreakdown(weekDob, weekDate);
    expect(breakdown).toEqual({
      personalDays: [8, 9, 1, 2, 1, 2, 3],
      sum: 26,
      personalWeek: 8,
    });
    expect(breakdown.personalWeek).toBe(personalWeek(weekDob, weekDate));
    expect(explainWeekCalculation(breakdown)).toBe(
      'Your Personal Week Number is calculated from the Personal Day numbers for each day of this week: 8 + 9 + 1 + 2 + 1 + 2 + 3 = 26 → 8.',
    );
  });

  test('a different forecast date produces different, correctly-updated calculation text', () => {
    const laterYearText = explainYearCalculation(personalYearBreakdown(dob, '2027-09-30'));
    const originalYearText = explainYearCalculation(personalYearBreakdown(dob, onDate));
    expect(laterYearText).not.toEqual(originalYearText);

    const laterDayText = explainDayCalculation(personalDayBreakdown(dob, '2026-10-01'));
    const originalDayText = explainDayCalculation(personalDayBreakdown(dob, onDate));
    expect(laterDayText).not.toEqual(originalDayText);
  });
});
