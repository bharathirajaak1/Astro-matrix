import { explainPersonalNumber, meaningFor } from '../../src/data/interpretations';

describe('explainPersonalNumber', () => {
  test('day: states the number and reuses meaningFor() as the theme clause', () => {
    const e = explainPersonalNumber('day', 3);
    expect(e.numberStatement).toBe('Your Personal Day Number is 3.');
    expect(e.represents).toBe(
      'In numerology, this number represents the theme associated with your day today — expression, creativity, and social spark.',
    );
    expect(e.whereFrom.length).toBeGreaterThan(0);
    expect(e.whyRelevant.length).toBeGreaterThan(0);
    expect(e.howCalculated.length).toBeGreaterThan(0);
  });

  test('week: explanation makes clear this is an AstroMatrix-defined convention, not a universal standard', () => {
    const e = explainPersonalNumber('week', 7);
    expect(e.numberStatement).toBe('Your Personal Week Number is 7.');
    expect(e.whereFrom.toLowerCase()).toContain('astromatrix-defined');
    expect(e.whereFrom.toLowerCase()).not.toContain('universal numerology standard.');
    expect(e.howCalculated.toLowerCase()).toContain('personal day numbers');
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
