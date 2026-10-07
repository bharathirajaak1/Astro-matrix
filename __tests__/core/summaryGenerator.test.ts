import {
  generateNumbersSummary,
  generateLoShuSummary,
  getTimeOfDayGreeting,
} from '../../src/core/summaryGenerator';

/**
 * Characterization tests: these pin the CURRENT output of summaryGenerator.ts
 * (including its known Lo Shu digit-tally duplication and plane-naming
 * discrepancies vs. src/core/loShu.ts) so a future consolidation can be
 * verified to preserve behavior. They intentionally do not judge or "correct"
 * wording, plane names, or the underlying calculation approach.
 */

describe('generateNumbersSummary', () => {
  test('different life path and second number, explicit Destiny label', () => {
    expect(generateNumbersSummary(1, 6, 'Destiny')).toBe(
      'You lead with courage and vision (Life Path 1) and nurture with devotion and responsibility (Destiny 6).'
    );
  });

  test('life path equal to second number uses the aligned-path template', () => {
    expect(generateNumbersSummary(5, 5)).toBe(
      'Your path is deeply aligned: you adapt with fearless adaptability through both your Life Path (5) and Soul Urge (5).'
    );
  });

  test('master numbers (11 and 22) resolve to their master-number traits', () => {
    expect(generateNumbersSummary(11, 22)).toBe(
      'You illuminate with master spiritual vision (Life Path 11) and manifest with grand architectural mastery (Soul Urge 22).'
    );
  });

  test('secondLabel defaults to "Soul Urge" when omitted', () => {
    expect(generateNumbersSummary(3, 8)).toBe(
      'You create with expressive optimism (Life Path 3) and execute with resilient ambition (Soul Urge 8).'
    );
  });
});

describe('generateLoShuSummary', () => {
  test('1940-10-09: partially active plane uses the "traditionally associated with... developing" template', () => {
    expect(generateLoShuSummary('1940-10-09')).toBe(
      'In numerology, your birth-date pattern is traditionally associated with exceptional willpower. It may be worth developing confident creative self-expression as a complementary area of growth.'
    );
  });

  test('1987-06-24: fully active plane uses the "one of your strongest patterns... balancing" template', () => {
    expect(generateLoShuSummary('1987-06-24')).toBe(
      'In numerology, your birth-date pattern is traditionally associated with razor-sharp intellect and strategy — one of your strongest patterns. It may also be worth balancing that with confident creative self-expression.'
    );
  });

  test('empty string does not throw and falls back to an all-missing summary', () => {
    expect(() => generateLoShuSummary('')).not.toThrow();
    expect(generateLoShuSummary('')).toBe(
      'In numerology, your birth-date pattern is traditionally associated with exceptional willpower. It may be worth developing financial order and systematic discipline as a complementary area of growth.'
    );
  });

  test('2011-11-11: repeated digits do not change presence-based plane matching', () => {
    expect(generateLoShuSummary('2011-11-11')).toBe(
      'In numerology, your birth-date pattern is traditionally associated with exceptional willpower. It may be worth developing financial order and systematic discipline as a complementary area of growth.'
    );
  });

  // Migration guard: src/core/expressionPlanes.ts's `actionGrounding`
  // ([8,1,6]) and `manifestation` ([2,7,6]) must stay wired to the correct
  // strength text after the move to the canonical Plane model - these two
  // DOBs are each a full match for exactly one of the pair, so a swapped
  // mapping would surface here as the wrong strengthText.
  test('1968-01-16: full match on actionGrounding [8,1,6] uses "dynamic physical execution"', () => {
    expect(generateLoShuSummary('1968-01-16')).toBe(
      'In numerology, your birth-date pattern is traditionally associated with dynamic physical execution — one of your strongest patterns. It may also be worth balancing that with financial order and systematic discipline.'
    );
  });

  test('1972-07-26: full match on manifestation [2,7,6] uses "tangible grounding and manifestation"', () => {
    expect(generateLoShuSummary('1972-07-26')).toBe(
      'In numerology, your birth-date pattern is traditionally associated with tangible grounding and manifestation — one of your strongest patterns. It may also be worth balancing that with financial order and systematic discipline.'
    );
  });
});

describe('getTimeOfDayGreeting', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test.each<[string, string]>([
    ['2024-01-01T06:00:00', 'Good Morning, Priya ☀️'],
    ['2024-01-01T13:00:00', 'Good Afternoon, Priya 🌤️'],
    ['2024-01-01T18:00:00', 'Good Evening, Priya 🌇'],
    ['2024-01-01T23:00:00', 'Good Night, Priya 🌙'],
  ])('at %s local time', (isoTime, expected) => {
    jest.useFakeTimers().setSystemTime(new Date(isoTime));
    expect(getTimeOfDayGreeting('Priya Sharma')).toBe(expected);
  });

  test('defaults to "there" when no name is given', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T06:00:00'));
    expect(getTimeOfDayGreeting()).toBe('Good Morning, there ☀️');
  });
});
