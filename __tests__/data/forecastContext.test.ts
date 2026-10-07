import { forecastBlueprintContext } from '../../src/data/forecastContext';
import type { NumerologyReport } from '../../src/core/types';

function fakeReport(overrides: Partial<NumerologyReport> = {}): NumerologyReport {
  return {
    system: 'pythagorean',
    lifePath: 1,
    destiny: 2,
    soulUrge: 3,
    personality: 4,
    birthday: 17,
    reductions: {},
    ...overrides,
  };
}

/** Deterministic/mystical/unsupported-outcome language that must never appear. */
const BANNED_PHRASES = [
  'you will',
  'you will definitely',
  'you must',
  'you cannot',
  'you always',
  'you never',
  'your soul yearns',
  'your soul craves',
  'your mission is',
  'your fate is',
  'this will happen',
  'destined',
  'guaranteed',
  'financial',
  'money',
  'wealth',
  'healing',
  'cure',
  'transformation',
];

/** Internal/implementation-sounding phrases the readability pass removed. */
const TECHNICAL_PHRASES = ['personal lens', 'cycle', 'theme associated with', 'lens for your priorities'];

const ALL_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

describe('forecastBlueprintContext', () => {
  describe('"day" period - Soul Urge context', () => {
    test('1. a valid report produces non-empty output', () => {
      const context = forecastBlueprintContext(fakeReport(), 'day');
      expect(context).not.toBeNull();
      expect((context ?? '').length).toBeGreaterThan(0);
    });

    test('2. is deterministic - same report produces the same output', () => {
      const report = fakeReport({ soulUrge: 7 });
      expect(forecastBlueprintContext(report, 'day')).toBe(forecastBlueprintContext(report, 'day'));
    });

    test('3. different Soul Urge values produce appropriately different context', () => {
      const outputs = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].map((soulUrge) => forecastBlueprintContext(fakeReport({ soulUrge }), 'day')));
      expect(outputs.size).toBe(9);
    });

    test('4. master number Soul Urge values (11, 22, 33) remain distinct and are not silently reduced', () => {
      const reduced: Record<number, number> = { 11: 2, 22: 4, 33: 6 };
      for (const [master, digit] of Object.entries(reduced)) {
        const masterContext = forecastBlueprintContext(fakeReport({ soulUrge: Number(master) }), 'day');
        const digitContext = forecastBlueprintContext(fakeReport({ soulUrge: digit }), 'day');
        expect(masterContext).not.toBeNull();
        expect(masterContext).not.toBe(digitContext);
      }
    });

    test('5. does not contain banned deterministic/mystical/unsupported-claim wording', () => {
      for (const soulUrge of ALL_VALUES) {
        const context = (forecastBlueprintContext(fakeReport({ soulUrge }), 'day') ?? '').toLowerCase();
        for (const phrase of BANNED_PHRASES) {
          expect(context).not.toContain(phrase);
        }
      }
    });

    test('6. clearly relates to inner motivation/values rather than outward impression, ability, or life direction', () => {
      const context = (forecastBlueprintContext(fakeReport({ soulUrge: 6 }), 'day') ?? '').toLowerCase();
      expect(context).toMatch(/soul urge/);
      expect(context).not.toMatch(/outward impression|comes across|coming across/);
      expect(context).not.toMatch(/\bdestiny\b|\babilities\b/);
      expect(context).not.toMatch(/\blife path\b|overall direction of your life/);
    });

    test('7. names Soul Urge by itself, distinguishing it from the Personal Day number without explaining the internal architecture', () => {
      const context = forecastBlueprintContext(fakeReport(), 'day') ?? '';
      expect(context.toLowerCase()).toMatch(/soul urge/);
      expect(context.toLowerCase()).toMatch(/another personal perspective|another perspective/);
    });

    test('8. does not use leftover technical/internal phrasing', () => {
      for (const soulUrge of ALL_VALUES) {
        const context = (forecastBlueprintContext(fakeReport({ soulUrge }), 'day') ?? '').toLowerCase();
        for (const phrase of TECHNICAL_PHRASES) {
          expect(context).not.toContain(phrase);
        }
      }
    });

    test('exact approved wording for the default fake report (regression check)', () => {
      const context = forecastBlueprintContext(fakeReport(), 'day') ?? '';
      expect(context).toBe(
        'Your Soul Urge adds another personal perspective for today. It highlights a pull toward creativity and shared joy, ' +
          'which may be useful to keep in mind as the day unfolds.',
      );
    });
  });

  describe('"week" period - Personality context', () => {
    test('1. a valid report produces non-empty output', () => {
      const context = forecastBlueprintContext(fakeReport(), 'week');
      expect(context).not.toBeNull();
      expect((context ?? '').length).toBeGreaterThan(0);
    });

    test('2. is deterministic - same report produces the same output', () => {
      const report = fakeReport({ personality: 7 });
      expect(forecastBlueprintContext(report, 'week')).toBe(forecastBlueprintContext(report, 'week'));
    });

    test('3. uses Personality rather than Soul Urge', () => {
      const report = fakeReport({ soulUrge: 3, personality: 8 });
      const dayContext = forecastBlueprintContext(report, 'day') ?? '';
      const weekContext = forecastBlueprintContext(report, 'week') ?? '';
      expect(weekContext).not.toBe(dayContext);
      expect(weekContext.toLowerCase()).toMatch(/personality/);
      expect(weekContext.toLowerCase()).not.toMatch(/soul urge/);
    });

    test('4. is specifically outward/social/communication-oriented, not inner-motivation, ability, or life-direction language', () => {
      const context = (forecastBlueprintContext(fakeReport({ personality: 6 }), 'week') ?? '').toLowerCase();
      expect(context).toMatch(/communicate|interact with others|coming across/);
      expect(context).not.toMatch(/inner pull|inner motivation/);
      expect(context).not.toMatch(/\bdestiny\b|\babilities\b/);
      expect(context).not.toMatch(/\blife path\b|overall direction of your life/);
    });

    test('5. Personality master numbers (11, 22, 33) remain distinct and are not silently reduced', () => {
      const reduced: Record<number, number> = { 11: 2, 22: 4, 33: 6 };
      for (const [master, digit] of Object.entries(reduced)) {
        const masterContext = forecastBlueprintContext(fakeReport({ personality: Number(master) }), 'week');
        const digitContext = forecastBlueprintContext(fakeReport({ personality: digit }), 'week');
        expect(masterContext).not.toBeNull();
        expect(masterContext).not.toBe(digitContext);
      }
    });

    test('6. does not contain banned deterministic/mystical wording', () => {
      for (const personality of ALL_VALUES) {
        const context = (forecastBlueprintContext(fakeReport({ personality }), 'week') ?? '').toLowerCase();
        for (const phrase of BANNED_PHRASES) {
          expect(context).not.toContain(phrase);
        }
      }
    });

    test('7. introduces no financial, relationship-guarantee, healing, or transformation claims', () => {
      for (const personality of ALL_VALUES) {
        const context = (forecastBlueprintContext(fakeReport({ personality }), 'week') ?? '').toLowerCase();
        expect(context).not.toMatch(/financial|money|wealth|healing|cure|transformation|guaranteed/);
      }
    });

    test('8. does not use leftover technical/internal phrasing', () => {
      for (const personality of ALL_VALUES) {
        const context = (forecastBlueprintContext(fakeReport({ personality }), 'week') ?? '').toLowerCase();
        for (const phrase of TECHNICAL_PHRASES) {
          expect(context).not.toContain(phrase);
        }
      }
    });

    test('names Personality by itself, distinguishing it from the Personal Week number without explaining the internal architecture', () => {
      const context = forecastBlueprintContext(fakeReport(), 'week') ?? '';
      expect(context.toLowerCase()).toMatch(/personality/);
      expect(context.toLowerCase()).toMatch(/another perspective/);
    });

    test('exact approved wording for the default fake report (regression check)', () => {
      const context = forecastBlueprintContext(fakeReport(), 'week') ?? '';
      expect(context).toBe(
        'Your Personality adds another perspective for this week. It highlights how you may come across as ' +
          'grounded and dependable, which may be useful to keep in mind as you communicate and interact with ' +
          'others this week.',
      );
    });

    test('grammar: "come across as <theme>" reads naturally for every Personality theme value (all are predicate-adjective phrases)', () => {
      const allValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
      for (const personality of allValues) {
        const context = forecastBlueprintContext(fakeReport({ personality }), 'week') ?? '';
        expect(context).toMatch(/It highlights how you may come across as .+, which may be useful/);
        // The awkward noun-phrase connector from the previous pass must not return.
        expect(context.toLowerCase()).not.toContain('qualities such as');
      }
    });
  });

  describe('"month" period - Destiny context', () => {
    test('1. a valid report produces non-empty output', () => {
      const context = forecastBlueprintContext(fakeReport(), 'month');
      expect(context).not.toBeNull();
      expect((context ?? '').length).toBeGreaterThan(0);
    });

    test('2. is deterministic - same report produces the same output', () => {
      const report = fakeReport({ destiny: 7 });
      expect(forecastBlueprintContext(report, 'month')).toBe(forecastBlueprintContext(report, 'month'));
    });

    test('3. uses Destiny rather than Soul Urge or Personality', () => {
      const report = fakeReport({ soulUrge: 3, personality: 4, destiny: 8 });
      const dayContext = forecastBlueprintContext(report, 'day') ?? '';
      const weekContext = forecastBlueprintContext(report, 'week') ?? '';
      const monthContext = forecastBlueprintContext(report, 'month') ?? '';
      expect(monthContext).not.toBe(dayContext);
      expect(monthContext).not.toBe(weekContext);
      expect(monthContext.toLowerCase()).toMatch(/destiny/);
      expect(monthContext.toLowerCase()).not.toMatch(/soul urge/);
      expect(monthContext.toLowerCase()).not.toMatch(/personality/);
    });

    test('4. is specifically about abilities/expression/opportunities rather than inner motivation or outward impression', () => {
      const context = (forecastBlueprintContext(fakeReport({ destiny: 6 }), 'month') ?? '').toLowerCase();
      expect(context).toMatch(/abilities|opportunities/);
      expect(context).not.toMatch(/inner pull|inner motivation/);
      expect(context).not.toMatch(/coming across|outward impression/);
      expect(context).not.toMatch(/\blife path\b|overall direction of your life/);
    });

    test('5. Destiny master numbers (11, 22, 33) remain distinct and are not silently reduced', () => {
      const reduced: Record<number, number> = { 11: 2, 22: 4, 33: 6 };
      for (const [master, digit] of Object.entries(reduced)) {
        const masterContext = forecastBlueprintContext(fakeReport({ destiny: Number(master) }), 'month');
        const digitContext = forecastBlueprintContext(fakeReport({ destiny: digit }), 'month');
        expect(masterContext).not.toBeNull();
        expect(masterContext).not.toBe(digitContext);
      }
    });

    test('a Destiny master number (e.g. 22) is never confused with the reduced Personal Month digit it would otherwise collapse to (4)', () => {
      const context22 = forecastBlueprintContext(fakeReport({ destiny: 22 }), 'month') ?? '';
      const context4 = forecastBlueprintContext(fakeReport({ destiny: 4 }), 'month') ?? '';
      expect(context22).not.toBe(context4);
    });

    test('6. does not contain banned deterministic/mystical wording', () => {
      for (const destiny of ALL_VALUES) {
        const context = (forecastBlueprintContext(fakeReport({ destiny }), 'month') ?? '').toLowerCase();
        for (const phrase of BANNED_PHRASES) {
          expect(context).not.toContain(phrase);
        }
      }
    });

    test('7. introduces no financial, relationship-guarantee, healing, or transformation claims', () => {
      for (const destiny of ALL_VALUES) {
        const context = (forecastBlueprintContext(fakeReport({ destiny }), 'month') ?? '').toLowerCase();
        expect(context).not.toMatch(/financial|money|wealth|healing|cure|transformation|guaranteed/);
      }
    });

    test('8. does not use leftover technical/internal phrasing', () => {
      for (const destiny of ALL_VALUES) {
        const context = (forecastBlueprintContext(fakeReport({ destiny }), 'month') ?? '').toLowerCase();
        for (const phrase of TECHNICAL_PHRASES) {
          expect(context).not.toContain(phrase);
        }
      }
    });

    test('names Destiny by itself, distinguishing it from the Personal Month number without explaining the internal architecture', () => {
      const context = forecastBlueprintContext(fakeReport(), 'month') ?? '';
      expect(context.toLowerCase()).toMatch(/destiny/);
      expect(context.toLowerCase()).toMatch(/another perspective/);
    });

    test('does not present Destiny as a fixed life mission or guaranteed outcome for the month', () => {
      const context = (forecastBlueprintContext(fakeReport(), 'month') ?? '').toLowerCase();
      expect(context).not.toContain('your mission is');
      expect(context).not.toContain('this will happen');
      expect(context).not.toContain('destined');
    });

    test('exact approved wording for the default fake report (regression check)', () => {
      const context = forecastBlueprintContext(fakeReport(), 'month') ?? '';
      expect(context).toBe(
        'Your Destiny adds another perspective for this month. It highlights bringing people and perspectives into ' +
          'alignment, which may be useful as you think about your abilities and explore new opportunities this month.',
      );
    });

    test('grammar: "highlights <theme>" reads naturally for every Destiny theme value, whether a noun phrase or a gerund phrase', () => {
      const allValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
      for (const destiny of allValues) {
        const context = forecastBlueprintContext(fakeReport({ destiny }), 'month') ?? '';
        expect(context).toMatch(/It highlights .+, which may be useful/);
        // The unnatural preposition-bridge construction from the previous pass must not return.
        expect(context.toLowerCase()).not.toContain('ability for');
        expect(context.toLowerCase()).not.toContain('ability to');
      }
    });
  });

  describe('"year" period - Life Path context', () => {
    test('1. a valid report produces non-empty output', () => {
      const context = forecastBlueprintContext(fakeReport(), 'year');
      expect(context).not.toBeNull();
      expect((context ?? '').length).toBeGreaterThan(0);
    });

    test('2. is deterministic - same report produces the same output', () => {
      const report = fakeReport({ lifePath: 7 });
      expect(forecastBlueprintContext(report, 'year')).toBe(forecastBlueprintContext(report, 'year'));
    });

    test('3. uses Life Path rather than Soul Urge, Personality, or Destiny', () => {
      const report = fakeReport({ soulUrge: 3, personality: 4, destiny: 2, lifePath: 9 });
      const dayContext = forecastBlueprintContext(report, 'day') ?? '';
      const weekContext = forecastBlueprintContext(report, 'week') ?? '';
      const monthContext = forecastBlueprintContext(report, 'month') ?? '';
      const yearContext = forecastBlueprintContext(report, 'year') ?? '';
      expect(yearContext).not.toBe(dayContext);
      expect(yearContext).not.toBe(weekContext);
      expect(yearContext).not.toBe(monthContext);
      expect(yearContext.toLowerCase()).toMatch(/life path/);
      expect(yearContext.toLowerCase()).not.toMatch(/soul urge/);
      expect(yearContext.toLowerCase()).not.toMatch(/personality/);
      expect(yearContext.toLowerCase()).not.toMatch(/\bdestiny\b/);
    });

    test('4. is specifically about broader direction/personal development rather than inner motivation, outward impression, or abilities/expression', () => {
      const context = (forecastBlueprintContext(fakeReport({ lifePath: 6 }), 'year') ?? '').toLowerCase();
      expect(context).toMatch(/broader perspective|make choices|pursue your goals/);
      expect(context).not.toMatch(/inner pull|inner motivation/);
      expect(context).not.toMatch(/coming across|outward impression/);
      expect(context).not.toMatch(/\babilities\b|express your abilities/);
    });

    test('5. Life Path master numbers (11, 22, 33) remain distinct and are not silently reduced', () => {
      const reduced: Record<number, number> = { 11: 2, 22: 4, 33: 6 };
      for (const [master, digit] of Object.entries(reduced)) {
        const masterContext = forecastBlueprintContext(fakeReport({ lifePath: Number(master) }), 'year');
        const digitContext = forecastBlueprintContext(fakeReport({ lifePath: digit }), 'year');
        expect(masterContext).not.toBeNull();
        expect(masterContext).not.toBe(digitContext);
      }
    });

    test('a Life Path master number (22) is never confused with the reduced Personal Year digit it would otherwise collapse to (4)', () => {
      const context22 = forecastBlueprintContext(fakeReport({ lifePath: 22 }), 'year') ?? '';
      const context4 = forecastBlueprintContext(fakeReport({ lifePath: 4 }), 'year') ?? '';
      expect(context22).not.toBe(context4);
    });

    test('6. does not contain banned deterministic/mystical wording', () => {
      for (const lifePath of ALL_VALUES) {
        const context = (forecastBlueprintContext(fakeReport({ lifePath }), 'year') ?? '').toLowerCase();
        for (const phrase of BANNED_PHRASES) {
          expect(context).not.toContain(phrase);
        }
      }
    });

    test('7. introduces no financial, relationship-guarantee, healing, or transformation claims', () => {
      for (const lifePath of ALL_VALUES) {
        const context = (forecastBlueprintContext(fakeReport({ lifePath }), 'year') ?? '').toLowerCase();
        expect(context).not.toMatch(/financial|money|wealth|healing|cure|transformation|guaranteed/);
      }
    });

    test('8. does not use leftover technical/internal phrasing', () => {
      for (const lifePath of ALL_VALUES) {
        const context = (forecastBlueprintContext(fakeReport({ lifePath }), 'year') ?? '').toLowerCase();
        for (const phrase of TECHNICAL_PHRASES) {
          expect(context).not.toContain(phrase);
        }
      }
    });

    test('names Life Path by itself, distinguishing it from the Personal Year number without explaining the internal architecture', () => {
      const context = forecastBlueprintContext(fakeReport(), 'year') ?? '';
      expect(context.toLowerCase()).toMatch(/life path/);
      expect(context.toLowerCase()).toMatch(/broader perspective/);
    });

    test('does not present Life Path as a fixed destiny or guaranteed outcome for the year', () => {
      const context = (forecastBlueprintContext(fakeReport(), 'year') ?? '').toLowerCase();
      expect(context).not.toContain('your fate is');
      expect(context).not.toContain('your mission is');
      expect(context).not.toContain('this will happen');
      expect(context).not.toContain('destined');
    });

    test('exact approved wording for the default fake report (regression check)', () => {
      const context = forecastBlueprintContext(fakeReport(), 'year') ?? '';
      expect(context).toBe(
        'Your Life Path adds a broader perspective for the year. It highlights independence and taking the lead, ' +
          'which may be useful to keep in mind as you make choices and pursue your goals this year.',
      );
    });
  });

  test('all four period contexts exist and return non-null for a valid report', () => {
    const report = fakeReport();
    expect(forecastBlueprintContext(report, 'day')).not.toBeNull();
    expect(forecastBlueprintContext(report, 'week')).not.toBeNull();
    expect(forecastBlueprintContext(report, 'month')).not.toBeNull();
    expect(forecastBlueprintContext(report, 'year')).not.toBeNull();
  });

  test('each period uses the correct Blueprint number and none of the four outputs collide', () => {
    // Deliberately give every category a different value so each period's
    // output is forced to be unique if (and only if) it reads from the
    // correct field.
    const report = fakeReport({ soulUrge: 1, personality: 2, destiny: 3, lifePath: 4 });
    const outputs = [
      forecastBlueprintContext(report, 'day'),
      forecastBlueprintContext(report, 'week'),
      forecastBlueprintContext(report, 'month'),
      forecastBlueprintContext(report, 'year'),
    ];
    expect(new Set(outputs).size).toBe(4);
  });

  test('a null report returns null for every period', () => {
    expect(forecastBlueprintContext(null, 'day')).toBeNull();
    expect(forecastBlueprintContext(null, 'week')).toBeNull();
    expect(forecastBlueprintContext(null, 'month')).toBeNull();
    expect(forecastBlueprintContext(null, 'year')).toBeNull();
  });
});
