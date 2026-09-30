import {
  formatDateRange,
  formatMonthYear,
  formatUSDate,
  formatYearOnly,
} from '../../src/lib/date';

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
