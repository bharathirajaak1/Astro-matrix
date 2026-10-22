import {
  formatDateRange,
  formatDDMonthYYYY,
  formatMonthYear,
  formatUSDate,
  formatYearOnly,
} from '../../src/lib/date';

// AstroMatrix "Birth Chart PDF Quality Improvement": the Birth Chart PDF's
// own date format (DD-Month-YYYY, zero-padded day, full English month name,
// never locale-dependent).
describe('formatDDMonthYYYY', () => {
  test.each<[string, string]>([
    ['1979-08-03', '03-August-1979'], // single-digit day, zero-padded
    ['2026-09-29', '29-September-2026'], // double-digit day
    ['2026-01-01', '01-January-2026'], // single-digit day and month, first month
    ['2026-12-31', '31-December-2026'], // last day of the year
    ['2000-02-29', '29-February-2000'], // leap-year boundary
    ['1999-12-31', '31-December-1999'], // year boundary (just before a new year)
    ['2000-01-01', '01-January-2000'], // year boundary (just after - also a century boundary)
    ['2026-05-14', '14-May-2026'], // an ordinary double-digit day, mid-year month
  ])('formatDDMonthYYYY(%s) === %s', (iso, expected) => {
    expect(formatDDMonthYYYY(iso)).toBe(expected);
  });

  test('day is always zero-padded to two digits, even for day 1-9', () => {
    for (let day = 1; day <= 9; day++) {
      const iso = `2026-06-0${day}`;
      expect(formatDDMonthYYYY(iso)).toMatch(/^0\d-June-2026$/);
    }
  });

  test('uses the full English month name, never a locale-dependent format', () => {
    // Every month, spot-checked - confirms the fixed MONTH_NAMES array is
    // used, not Intl/toLocaleDateString (which could vary by environment).
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    months.forEach((name, index) => {
      const iso = `2026-${String(index + 1).padStart(2, '0')}-15`;
      expect(formatDDMonthYYYY(iso)).toBe(`15-${name}-2026`);
    });
  });
});

describe('formatUSDate', () => {
  test.each<[string, string]>([
    ['2026-09-29', 'September 29, 2026'],
    ['2000-02-25', 'February 25, 2000'],
    ['2026-01-01', 'January 1, 2026'],
    ['2026-12-31', 'December 31, 2026'],
  ])('formatUSDate(%s) === %s', (iso, expected) => {
    expect(formatUSDate(iso)).toBe(expected);
  });
});

describe('formatMonthYear', () => {
  test.each<[string, string]>([
    ['2026-09-29', 'September 2026'],
    ['2026-01-05', 'January 2026'],
    ['2026-12-01', 'December 2026'],
  ])('formatMonthYear(%s) === %s', (iso, expected) => {
    expect(formatMonthYear(iso)).toBe(expected);
  });
});

describe('formatYearOnly', () => {
  test.each<[string, string]>([
    ['2026-09-29', '2026'],
    ['2000-02-25', '2000'],
  ])('formatYearOnly(%s) === %s', (iso, expected) => {
    expect(formatYearOnly(iso)).toBe(expected);
  });
});

describe('formatDateRange', () => {
  test('same month: drops the repeated month', () => {
    expect(formatDateRange('2026-09-06', '2026-09-12')).toBe('September 6 – 12, 2026');
  });

  test('crosses a month boundary within the same year', () => {
    expect(formatDateRange('2026-09-27', '2026-10-03')).toBe('September 27 – October 3, 2026');
  });

  test('crosses a year boundary: states the year on both ends', () => {
    expect(formatDateRange('2026-12-27', '2027-01-02')).toBe(
      'December 27, 2026 – January 2, 2027',
    );
  });

  test('is pure/deterministic', () => {
    expect(formatDateRange('2026-09-27', '2026-10-03')).toBe(
      formatDateRange('2026-09-27', '2026-10-03'),
    );
  });
});
