/**
 * Exercises `src/core/report.ts`'s two builders:
 *  - `buildBirthChartReport()` - the stable, date-free `BirthChartReport`.
 *  - `buildStructuredReport()` - that same stable data plus a specific
 *    day's forecast, assembled into a `StructuredReport`.
 *
 * These are wiring/assembly tests only: every field is cross-checked
 * against calling its own canonical source function directly, never
 * re-deriving or re-testing the underlying calculation logic itself (that
 * is already covered exhaustively in numerology.test.ts, loShu.test.ts,
 * forecast.test.ts, expressionPlanes.test.ts, and coreNumberContent's own
 * tests).
 */
import { buildBirthChartReport, buildClosingReflectionQuestion, buildStructuredReport } from '../../src/core/report';
import { buildForecast } from '../../src/core/forecast';
import { buildLoShuGrid } from '../../src/core/loShu';
import { buildNumerologyReport, calcDestiny, calcPersonality, calcSoulUrge } from '../../src/core/numerology';
import { getAllExpressionPlanePresence } from '../../src/core/expressionPlanes';
import { generateLoShuSummary, generateNumbersSummary, MISSING_GROWTH_AREAS, PLANE_STRENGTH_TEXT } from '../../src/core/summaryGenerator';
import { getCoreNumberInterpretation, getCoreNumberSummary } from '../../src/data/coreNumberContent';
import { CORE_NUMBERS } from '../../src/data/interpretations';
import { NUMBER_ESSENCE } from '../../src/data/numberEssence';
import { PLANE_PRESENTATION } from '../../src/data/expressionPlaneContent';
import type { Profile } from '../../src/core/types';

const ON_DATE = '2026-06-15';

// Same fixtures as Test 51 (numerology.test.ts's twin-profile regression
// tests) - same DOB, different names, already-verified exact numerology
// values.
const maya: Profile = {
  id: 't-maya',
  fullName: 'Maya Sharma',
  dob: '1992-05-14',
  system: 'pythagorean',
  createdAt: '2026-01-01T00:00:00Z',
};

const meera: Profile = {
  id: 't-meera',
  fullName: 'Meera Sharma',
  dob: '1992-05-14',
  system: 'pythagorean',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('buildStructuredReport - field-by-field assembly', () => {
  test('profile is trimmed to exactly id, fullName, dob, system', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    expect(report.profile).toEqual({
      id: 't-maya',
      fullName: 'Maya Sharma',
      dob: '1992-05-14',
      system: 'pythagorean',
    });
    expect(report.profile).not.toHaveProperty('createdAt');
  });

  test('numerology matches buildNumerologyReport(profile) exactly', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    expect(report.numerology).toEqual(buildNumerologyReport(maya));
  });

  test('loShu matches buildLoShuGrid(profile.dob) exactly', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    expect(report.loShu).toEqual(buildLoShuGrid(maya.dob));
  });

  test('expressionPlanes matches getAllExpressionPlanePresence(loShu.counts) exactly', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    const loShu = buildLoShuGrid(maya.dob);
    expect(report.expressionPlanes).toEqual(getAllExpressionPlanePresence(loShu.counts));
  });

  test('coreNumberSummary matches getCoreNumberSummary(numerology) exactly', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    const numerology = buildNumerologyReport(maya);
    expect(report.coreNumberSummary).toEqual(getCoreNumberSummary(numerology));
  });

  test('coreNumberSections contains all five keys, each matching getCoreNumberInterpretation(key, value) exactly', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    const numerology = buildNumerologyReport(maya);

    expect(Object.keys(report.coreNumberSections).sort()).toEqual(
      CORE_NUMBERS.map((c) => c.key).sort(),
    );
    for (const { key } of CORE_NUMBERS) {
      expect(report.coreNumberSections[key]).toEqual(
        getCoreNumberInterpretation(key, numerology[key]),
      );
    }
  });

  test('numbersSummary matches generateNumbersSummary(lifePath, soulUrge, "Soul Urge") exactly', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    const numerology = buildNumerologyReport(maya);
    expect(report.numbersSummary).toBe(
      generateNumbersSummary(numerology.lifePath, numerology.soulUrge, 'Soul Urge'),
    );
  });

  test('loShuSummary matches generateLoShuSummary(profile.dob) exactly', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    expect(report.loShuSummary).toBe(generateLoShuSummary(maya.dob));
  });

  test('forecastToday matches buildForecast(profile, onDate) exactly', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    expect(report.forecastToday).toEqual(buildForecast(maya, ON_DATE));
  });
});

describe('buildBirthChartReport - field-by-field assembly', () => {
  test('profile is trimmed to exactly id, fullName, dob, system', () => {
    const report = buildBirthChartReport(maya);
    expect(report.profile).toEqual({
      id: 't-maya',
      fullName: 'Maya Sharma',
      dob: '1992-05-14',
      system: 'pythagorean',
    });
    expect(report.profile).not.toHaveProperty('createdAt');
  });

  test('numerology matches buildNumerologyReport(profile) exactly', () => {
    const report = buildBirthChartReport(maya);
    expect(report.numerology).toEqual(buildNumerologyReport(maya));
  });

  test('loShu matches buildLoShuGrid(profile.dob) exactly', () => {
    const report = buildBirthChartReport(maya);
    expect(report.loShu).toEqual(buildLoShuGrid(maya.dob));
  });

  test('loShu.planes (golden/silver yogas) is carried through', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);
    expect(report.loShu.planes).toEqual(loShu.planes);
  });

  test('expressionPlanes matches getAllExpressionPlanePresence(loShu.counts) exactly', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);
    expect(report.expressionPlanes).toEqual(getAllExpressionPlanePresence(loShu.counts));
  });

  test('coreNumberSummary matches getCoreNumberSummary(numerology) exactly', () => {
    const report = buildBirthChartReport(maya);
    const numerology = buildNumerologyReport(maya);
    expect(report.coreNumberSummary).toEqual(getCoreNumberSummary(numerology));
  });

  test('coreNumberSections contains all five keys, each matching getCoreNumberInterpretation(key, value) exactly', () => {
    const report = buildBirthChartReport(maya);
    const numerology = buildNumerologyReport(maya);

    expect(Object.keys(report.coreNumberSections).sort()).toEqual(
      CORE_NUMBERS.map((c) => c.key).sort(),
    );
    for (const { key } of CORE_NUMBERS) {
      expect(report.coreNumberSections[key]).toEqual(
        getCoreNumberInterpretation(key, numerology[key]),
      );
    }
  });

  test('numbersSummary matches generateNumbersSummary(lifePath, soulUrge, "Soul Urge") exactly', () => {
    const report = buildBirthChartReport(maya);
    const numerology = buildNumerologyReport(maya);
    expect(report.numbersSummary).toBe(
      generateNumbersSummary(numerology.lifePath, numerology.soulUrge, 'Soul Urge'),
    );
  });

  test('loShuSummary matches generateLoShuSummary(profile.dob) exactly', () => {
    const report = buildBirthChartReport(maya);
    expect(report.loShuSummary).toBe(generateLoShuSummary(maya.dob));
  });

  test('has no forecastToday field', () => {
    const report = buildBirthChartReport(maya);
    expect(report).not.toHaveProperty('forecastToday');
    expect('forecastToday' in report).toBe(false);
  });
});

describe('buildBirthChartReport - swotReflection', () => {
  // AstroMatrix "Birth Chart PDF Wording Improvement" task: each count
  // branch now rotates through 3 variants (by position in `activeDigits`,
  // see `varyByIndex` in report.ts), so a single fixed template per branch
  // no longer holds for every digit. `expectedStrengthVariants` mirrors
  // `buildSwotReflection()`'s own templates exactly.
  function expectedStrengthVariants(digit: number, count: number, phrase: string): string[] {
    return count >= 2
      ? [
          `Number ${digit} appears ${count} times in your birth date. Numerology traditionally associates it with ${phrase} - a theme that recurs in your pattern, not a trait you definitely possess.`,
          `Your birth date shows Number ${digit} ${count} times, traditionally linked to ${phrase} - a recurring thread, not a guaranteed trait.`,
          `Number ${digit} stands out by appearing ${count} times, traditionally pointing to ${phrase} - worth noticing as a pattern, not assumed as a fact about you.`,
        ]
      : [
          `Number ${digit} appears in your birth date. Numerology traditionally associates it with ${phrase}.`,
          `Your birth date includes Number ${digit}, traditionally linked to ${phrase}.`,
          `Number ${digit} is part of your birth date, traditionally associated with ${phrase}.`,
        ];
  }

  test('strengths covers exactly the active digits (loShu.counts[d] > 0), ascending order, via NUMBER_ESSENCE[d].strengths[0], distinguishing repeated from present-once digits', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);
    const activeDigits = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).filter((d) => loShu.counts[d] > 0);

    expect(report.swotReflection.strengths.map((item) => item.digit)).toEqual(activeDigits);
    for (const item of report.swotReflection.strengths) {
      const count = loShu.counts[item.digit];
      const phrase = NUMBER_ESSENCE[item.digit].strengths[0];
      expect(expectedStrengthVariants(item.digit, count, phrase)).toContain(item.text);
      // The branch-distinguishing qualifier still survives in every variant.
      if (count >= 2) {
        expect(item.text.toLowerCase()).toMatch(/not a trait you definitely possess|not a guaranteed trait|not assumed as a fact about you/);
      }
    }
  });

  test('strengthsSynthesis combines every active digit\'s keyword into one sentence, considered together rather than per-digit', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);
    const activeDigits = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).filter((d) => loShu.counts[d] > 0);

    expect(report.swotReflection.strengthsSynthesis.length).toBeGreaterThan(0);
    expect(report.swotReflection.strengthsSynthesis).toContain(`(${activeDigits.join(', ')})`);
    for (const digit of activeDigits) {
      expect(report.swotReflection.strengthsSynthesis.toLowerCase()).toContain(NUMBER_ESSENCE[digit].keyword.toLowerCase());
    }
    // Hedged, not a claim of definite possession.
    expect(report.swotReflection.strengthsSynthesis).toContain('rather than as separate, unrelated traits');
  });

  test('strengthsSynthesis differs between twins only insofar as their active digits differ (here: identical, since Maya and Meera share a DOB)', () => {
    const mayaReport = buildBirthChartReport(maya);
    const meeraReport = buildBirthChartReport(meera);
    expect(mayaReport.swotReflection.strengthsSynthesis).toBe(meeraReport.swotReflection.strengthsSynthesis);
  });

  test('strengthsSynthesis genuinely varies with a different grid pattern (not hardcoded to Maya\'s digits)', () => {
    // '1987-06-24' (__tests__/core/loShu.test.ts) has a completely
    // different active-digit set than Maya's (1,2,4,5,9).
    const profile: Profile = {
      id: 't-different-pattern',
      fullName: 'Different Pattern',
      dob: '1987-06-24',
      system: 'pythagorean',
      createdAt: '2026-01-01T00:00:00Z',
    };
    const mayaReport = buildBirthChartReport(maya);
    const otherReport = buildBirthChartReport(profile);

    expect(otherReport.swotReflection.strengthsSynthesis).not.toBe(mayaReport.swotReflection.strengthsSynthesis);

    const loShu = buildLoShuGrid(profile.dob);
    const activeDigits = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).filter((d) => loShu.counts[d] > 0);
    expect(otherReport.swotReflection.strengthsSynthesis).toContain(`(${activeDigits.join(', ')})`);
  });

  test('areasToExplore covers exactly loShu.missing, ascending order, and names every NUMBER_ESSENCE theme for that digit', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);

    expect(report.swotReflection.areasToExplore.map((item) => item.digit)).toEqual(loShu.missing);
    for (const item of report.swotReflection.areasToExplore) {
      expect(item.text).toContain(`Number ${item.digit}`);
      for (const theme of NUMBER_ESSENCE[item.digit].themes) {
        expect(item.text).toContain(theme);
      }
    }
  });

  // AstroMatrix "Birth Chart PDF Wording Improvement" task: previously
  // every item forced the strength phrase into "a way to work with this
  // theme is consciously exploring X" (awkward for some phrases - see
  // report.ts's own doc comment above `opportunities`). Now rotates (by
  // position in `loShu.missing`) through 3 variants that place the phrase
  // as a plain noun instead.
  function expectedOpportunityVariants(digit: number, strength: string): string[] {
    return [
      `Number ${digit} — one way to work with this is to lean into ${strength}.`,
      `For Number ${digit}, ${strength} is a traditional strength worth nurturing with intention.`,
      `Number ${digit} traditionally offers ${strength} - worth returning to and developing over time.`,
    ];
  }

  test('opportunities covers the same loShu.missing digits as areasToExplore, preserving NUMBER_ESSENCE[d].strengths[0] unchanged', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);

    expect(report.swotReflection.opportunities.map((item) => item.digit)).toEqual(loShu.missing);
    expect(report.swotReflection.opportunities.map((item) => item.digit)).toEqual(
      report.swotReflection.areasToExplore.map((item) => item.digit),
    );
    for (const item of report.swotReflection.opportunities) {
      const sourcePhrase = NUMBER_ESSENCE[item.digit].strengths[0];
      expect(expectedOpportunityVariants(item.digit, sourcePhrase)).toContain(item.text);
      // The source phrase itself must appear completely unaltered.
      expect(item.text).toContain(sourcePhrase);
    }
  });

  test('opportunities wording is distinct from areasToExplore for the same digit, and avoids the awkward "consciously exploring X" verb frame', () => {
    const report = buildBirthChartReport(maya);
    for (let i = 0; i < report.swotReflection.opportunities.length; i++) {
      const opportunity = report.swotReflection.opportunities[i];
      const areaToExplore = report.swotReflection.areasToExplore[i];
      expect(opportunity.digit).toBe(areaToExplore.digit);
      expect(opportunity.text).not.toBe(areaToExplore.text);
      expect(opportunity.text).not.toContain('a way to work with this theme is consciously exploring');
    }
  });

  test('does not include a "Patterns to Notice" field - still deferred', () => {
    const report = buildBirthChartReport(maya);
    expect(report.swotReflection).not.toHaveProperty('patternsToNotice');
  });

  test('same profile produces identical swotReflection across calls (deterministic)', () => {
    expect(buildBirthChartReport(maya).swotReflection).toEqual(buildBirthChartReport(maya).swotReflection);
  });
});

describe('buildBirthChartReport - loShuInterpretation', () => {
  test('yourPattern is non-empty and names the correct active-digit count', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);
    const activeCount = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).filter((d) => loShu.counts[d] > 0).length;

    expect(report.loShuInterpretation.yourPattern.length).toBeGreaterThan(0);
    expect(report.loShuInterpretation.yourPattern).toContain(String(activeCount));
  });

  // Correction (AstroMatrix Birth Chart PDF corrections task): the sentence
  // used to say "with {loShu.repeated.length} appearing more than once" -
  // a bare COUNT of how many digits repeat, not the digits themselves. For
  // Maya (counts: 1x2, 2x1, 4x1, 5x1, 9x2 - digits 1 and 9 repeat, digit 2
  // does not) that read as "with 2 appearing more than once", which is
  // genuinely ambiguous: a reader can misparse "2" as the digit 2 (which
  // only appears once), not as "2 digits repeat". The sentence now names
  // the actual repeated digit(s) directly, and never claims a repeat when
  // there is none. These three regression cases - zero/one/many repeated
  // digits - prove the fix is driven by `loShu.repeated` itself, not a
  // hardcoded example.
  describe('repeated-digit wording - zero, one, and multiple repeated digits', () => {
    test('Maya (DOB 1992-05-14): two repeated digits (1 and 9) are both named, digit 2 is never claimed to repeat', () => {
      const report = buildBirthChartReport(maya);
      const loShu = buildLoShuGrid(maya.dob);
      expect(loShu.repeated).toEqual([1, 9]);

      expect(report.loShuInterpretation.yourPattern).toContain('with Numbers 1 and 9 appearing more than once');
      // The exact ambiguous phrasing from the bug report must never appear.
      expect(report.loShuInterpretation.yourPattern).not.toContain('with 2 appearing more than once');
    });

    test('a profile with zero repeated digits never claims any number repeats', () => {
      // '1987-06-24' already verified in __tests__/core/loShu.test.ts to
      // have repeated: [].
      const profile: Profile = {
        id: 't-no-repeats',
        fullName: 'No Repeats',
        dob: '1987-06-24',
        system: 'pythagorean',
        createdAt: '2026-01-01T00:00:00Z',
      };
      const loShu = buildLoShuGrid(profile.dob);
      expect(loShu.repeated).toEqual([]);

      const report = buildBirthChartReport(profile);
      expect(report.loShuInterpretation.yourPattern).toContain('with no number appearing more than once');
      expect(report.loShuInterpretation.yourPattern).not.toContain('appearing more than once and');
      expect(report.loShuInterpretation.yourPattern).not.toMatch(/Number \d+ appearing/);
    });

    test('a profile with exactly one repeated digit names only that digit, in singular form', () => {
      // '2011-11-11' already verified in __tests__/core/loShu.test.ts to
      // have repeated: [1] (digit 1 appears six times, nothing else repeats).
      const profile: Profile = {
        id: 't-one-repeat',
        fullName: 'One Repeat',
        dob: '2011-11-11',
        system: 'pythagorean',
        createdAt: '2026-01-01T00:00:00Z',
      };
      const loShu = buildLoShuGrid(profile.dob);
      expect(loShu.repeated).toEqual([1]);

      const report = buildBirthChartReport(profile);
      expect(report.loShuInterpretation.yourPattern).toContain('with Number 1 appearing more than once');
      expect(report.loShuInterpretation.yourPattern).not.toContain('Numbers 1 and');
    });

    test('a profile with two repeated digits (same structural case as Maya) names both via a different DOB', () => {
      // '1940-10-09' already verified in __tests__/core/loShu.test.ts to
      // have repeated: [1, 9] - same two digits as Maya, from an
      // independent DOB, proving the wording is computed, not copied from
      // Maya's specific values.
      const profile: Profile = {
        id: 't-two-repeats',
        fullName: 'Two Repeats',
        dob: '1940-10-09',
        system: 'pythagorean',
        createdAt: '2026-01-01T00:00:00Z',
      };
      const loShu = buildLoShuGrid(profile.dob);
      expect(loShu.repeated).toEqual([1, 9]);

      const report = buildBirthChartReport(profile);
      expect(report.loShuInterpretation.yourPattern).toContain('with Numbers 1 and 9 appearing more than once');
    });
  });

  test('numbersPresent covers exactly the active digits, ascending order, referencing NUMBER_ESSENCE[d].keyword', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);
    const activeDigits = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).filter((d) => loShu.counts[d] > 0);

    expect(report.loShuInterpretation.numbersPresent.map((item) => item.digit)).toEqual(activeDigits);
    for (const item of report.loShuInterpretation.numbersPresent) {
      expect(item.text).toContain(`Number ${item.digit}`);
      expect(item.text.toLowerCase()).toContain(NUMBER_ESSENCE[item.digit].keyword.toLowerCase());
    }
  });

  // AstroMatrix "Birth Chart PDF Quality Improvement": previously every
  // present-once digit used the identical sentence shape ("Number X appears
  // once in your grid..."), flagged as repetitive. Now rotates through
  // three equivalent shapes by list position (see `varyByIndex` in
  // report.ts) - this test matches against the known variant set instead
  // of one fixed substring, and separately confirms the rotation is
  // genuinely exercised (not silently collapsed back to one shape).
  test('a repeated digit (count >= 2) is textually distinguished from a present-once digit, across rotated sentence shapes', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);
    for (const item of report.loShuInterpretation.numbersPresent) {
      const count = loShu.counts[item.digit];
      expect(item.text).toContain(`Number ${item.digit}`);
      if (count >= 2) {
        expect(item.text).toContain(String(count));
        expect(item.text.toLowerCase()).toContain('traditionally');
        expect(item.text.toLowerCase()).toMatch(/recurs|repeats|recurring/);
      } else {
        expect(item.text.toLowerCase()).not.toMatch(/\d times/);
      }
    }
  });

  test('present-once digits are not all rendered with the identical sentence shape (genuine rotation, not a fixed template)', () => {
    // Maya has 5 active digits (1,2,4,5,9), enough to exercise all three
    // rotation variants for at least the present-once ones.
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);
    const presentOnceOpenings = report.loShuInterpretation.numbersPresent
      .filter((item) => loShu.counts[item.digit] < 2)
      .map((item) => item.text.split(' ').slice(0, 3).join(' '));
    expect(new Set(presentOnceOpenings).size).toBeGreaterThan(1);
  });

  // AstroMatrix "Birth Chart PDF Wording Improvement" task: previously a
  // single fixed shape for every missing digit; now rotates (by position in
  // `loShu.missing`) through 3 variants.
  test('consciousAttention covers exactly loShu.missing, ascending order, sourced from MISSING_GROWTH_AREAS (not NUMBER_ESSENCE)', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);

    expect(report.loShuInterpretation.consciousAttention.map((item) => item.digit)).toEqual(loShu.missing);
    for (const item of report.loShuInterpretation.consciousAttention) {
      const area = MISSING_GROWTH_AREAS[item.digit];
      expect([
        `Number ${item.digit} does not appear in your grid. Numerology traditionally associates it with ${area}.`,
        `Number ${item.digit} is absent from your grid, traditionally linked to ${area}.`,
        `Your grid does not include Number ${item.digit}, traditionally associated with ${area}.`,
      ]).toContain(item.text);
      expect(item.text).toContain(area);
    }
  });

  test('traditionalPatterns restates loShu.planes.goldenYogas/silverYogas exactly, factually (present vs. absent, not evaluative)', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);

    expect(report.loShuInterpretation.traditionalPatterns).toEqual([
      ...loShu.planes.goldenYogas.map((name) => `${name} — all three numbers in this line are present in your birth date.`),
      ...loShu.planes.silverYogas.map((name) => `${name} — none of the three numbers in this line are present in your birth date.`),
    ]);
  });

  test('puttingItTogether equals the existing loShuSummary field exactly - no second, divergent synthesis', () => {
    const report = buildBirthChartReport(maya);
    expect(report.loShuInterpretation.puttingItTogether).toBe(report.loShuSummary);
  });
});

describe('buildBirthChartReport - planeInterpretations', () => {
  test('contains exactly six entries, positionally matching expressionPlanes (same ids, same order)', () => {
    const report = buildBirthChartReport(maya);
    expect(report.planeInterpretations).toHaveLength(6);
    expect(report.planeInterpretations.map((p) => p.id)).toEqual(report.expressionPlanes.map((p) => p.plane.id));
  });

  test('description reuses PLANE_PRESENTATION[id].description verbatim, for every plane', () => {
    const report = buildBirthChartReport(maya);
    for (const planeInterpretation of report.planeInterpretations) {
      expect(planeInterpretation.description).toBe(PLANE_PRESENTATION[planeInterpretation.id].description);
    }
  });

  // AstroMatrix "Birth Chart PDF Wording Improvement" task: each branch now
  // rotates through 3 variants (by plane position, see `varyByIndex` in
  // report.ts), so no single fixed substring holds for every plane in a
  // given branch any more. `expectedPlaneVariants` below reconstructs the
  // exact 3 candidate strings for a given plane's presence data, mirroring
  // `buildPlaneInterpretations()`'s own templates precisely - the test then
  // asserts the actual interpretation is byte-exact-equal to one of them,
  // which is strictly stronger than a substring check (it also proves
  // nothing extra or different was generated).
  function expectedPlaneVariants(presence: { presentCount: number; presentNumbers: number[]; missingNumbers: number[]; plane: { numbers: number[]; id: string } }): string[] {
    const numberList = presence.plane.numbers.join(', ');
    const strengthText = PLANE_STRENGTH_TEXT[presence.plane.id as keyof typeof PLANE_STRENGTH_TEXT];
    if (presence.presentCount === 3) {
      return [
        `All three numbers for this pattern (${numberList}) are present in your birth date. ` +
          `Numerology traditionally associates this pattern with themes such as ${strengthText} - ` +
          `a traditional lens for reflection, not a fixed trait or a guarantee of ability.`,
        `Your birth date includes all three numbers for this pattern (${numberList}) - traditionally ` +
          `pointing to ${strengthText}. Worth holding as a reflection, not a promise of guaranteed results.`,
        `This pattern's three numbers (${numberList}) are all present in your birth date, traditionally ` +
          `linked to ${strengthText} - one lens to consider, not a fixed trait or a promise of ability.`,
      ];
    }
    if (presence.presentCount === 0) {
      return [
        `None of the three numbers for this pattern (${numberList}) are present in your birth date. ` +
          `Numerology traditionally associates this pattern with themes such as ${strengthText}, ` +
          `which may offer a prompt to reflect on rather than a sign of anything missing.`,
        `None of this pattern's three numbers (${numberList}) appear in your birth date. Traditionally, ` +
          `this pattern relates to ${strengthText} - worth exploring as a prompt, not a sign that anything is missing.`,
        `This pattern's three numbers (${numberList}) are all absent from your birth date. The pattern ` +
          `itself traditionally points to ${strengthText}, offered as an open area to consider rather than something lacking.`,
      ];
    }
    const verb = presence.presentCount === 1 ? 'is' : 'are';
    const presentJoined = presence.presentNumbers.join(', ');
    const missingJoined = presence.missingNumbers.join(', ');
    return [
      `${presence.presentCount} of the three numbers for this pattern (${numberList}) ${verb} present in your birth date ` +
        `- ${presentJoined} present, ${missingJoined} not. ` +
        `Numerology traditionally associates this pattern with themes such as ${strengthText}, ` +
        `offered here as a traditional perspective rather than a fixed description.`,
      `Your birth date includes ${presence.presentCount} of this pattern's three numbers (${numberList}) ` +
        `- ${presentJoined} present, ${missingJoined} not. This pattern traditionally ` +
        `relates to ${strengthText}, a perspective worth holding loosely rather than a fixed description.`,
      `${presence.presentCount} of the three numbers in this pattern (${numberList}) ${verb} part of your birth date ` +
        `(${presentJoined} present, ${missingJoined} not) - traditionally linked to ` +
        `${strengthText}, offered as one lens among several, not a complete picture.`,
    ];
  }

  test('interpretation references PLANE_STRENGTH_TEXT and exactly matches one of the three approved rotated variants for this profile\'s actual present count', () => {
    const report = buildBirthChartReport(maya);
    for (let i = 0; i < report.planeInterpretations.length; i++) {
      const planeInterpretation = report.planeInterpretations[i];
      const presence = report.expressionPlanes[i];
      expect(planeInterpretation.interpretation).toContain(PLANE_STRENGTH_TEXT[planeInterpretation.id]);
      expect(expectedPlaneVariants(presence)).toContain(planeInterpretation.interpretation);
    }
  });

  // Correction (AstroMatrix final PDF corrections task): "1 of the three
  // numbers ... are present" was grammatically wrong (subject-verb
  // disagreement with "1"). Covers all four possible present counts (0, 1,
  // 2, 3) via profiles/planes already verified elsewhere this session -
  // never a hardcoded assumption about which profile produces which count.
  describe('singular/plural grammar across 0, 1, 2, and 3 present numbers', () => {
    // AstroMatrix "Birth Chart PDF Wording Improvement" task: each count
    // bucket now rotates through 3 variants, so the exact fixed substring
    // these tests originally pinned no longer holds for every plane in the
    // bucket. Still asserts against `expectedPlaneVariants` (byte-exact
    // membership, so grammar correctness is verified precisely, not just
    // loosely) and additionally asserts the WRONG verb form never appears,
    // preserving each test's original singular/plural regression intent.
    test('0 present: matches one of the three approved variants, all using "are present"/"are all absent" correctly', () => {
      // '1940-10-09' (__tests__/core/loShu.test.ts) has silverYogas
      // including "Soul plane (3-5-7)" (heartIntuition) and
      // "Action plane (2-7-6)" (manifestation) - both fully absent.
      const profile: Profile = {
        id: 't-zero-present',
        fullName: 'Zero Present',
        dob: '1940-10-09',
        system: 'pythagorean',
        createdAt: '2026-01-01T00:00:00Z',
      };
      const report = buildBirthChartReport(profile);
      const zeroPresentPlanes = report.expressionPlanes.filter((p) => p.presentCount === 0);
      expect(zeroPresentPlanes.length).toBeGreaterThan(0);
      for (const presence of zeroPresentPlanes) {
        const planeInterpretation = report.planeInterpretations.find((p) => p.id === presence.plane.id)!;
        expect(expectedPlaneVariants(presence)).toContain(planeInterpretation.interpretation);
        expect(planeInterpretation.interpretation).not.toMatch(/\bis\b present|\bis\b absent/);
      }
    });

    test('1 present: every variant uses singular "is present"/"is part of", never "1 ... are present"', () => {
      // Verified by direct execution (not assumed from memory): Maya
      // (DOB 1992-05-14) has presentCount===1 for heartIntuition,
      // actionGrounding, visionPlanning, and manifestation - this test
      // checks all of them generically, using each plane's own actual
      // number list/present digit rather than a hardcoded example.
      const report = buildBirthChartReport(maya);
      const onePresentPlanes = report.expressionPlanes.filter((p) => p.presentCount === 1);
      expect(onePresentPlanes.length).toBeGreaterThan(0);

      for (const presence of onePresentPlanes) {
        const planeInterpretation = report.planeInterpretations.find((p) => p.id === presence.plane.id)!;
        const numberList = presence.plane.numbers.join(', ');
        expect(expectedPlaneVariants(presence)).toContain(planeInterpretation.interpretation);
        expect(planeInterpretation.interpretation).not.toContain(`1 of the three numbers for this pattern (${numberList}) are present`);
        expect(planeInterpretation.interpretation).not.toContain(`1 of the three numbers in this pattern (${numberList}) are part`);
      }
    });

    test('2 present: every variant uses plural "are present"/"are part of"', () => {
      // Verified by direct execution: '1940-10-09' has presentCount===2 for
      // mindLogic (4, 9 present) and drivePersistence (9, 1 present) - the
      // same profile already used above for the 0-present case.
      const profile: Profile = {
        id: 't-two-present',
        fullName: 'Two Present',
        dob: '1940-10-09',
        system: 'pythagorean',
        createdAt: '2026-01-01T00:00:00Z',
      };
      const report = buildBirthChartReport(profile);
      const twoPresentPlanes = report.expressionPlanes.filter((p) => p.presentCount === 2);
      expect(twoPresentPlanes.length).toBeGreaterThan(0);

      for (const presence of twoPresentPlanes) {
        const planeInterpretation = report.planeInterpretations.find((p) => p.id === presence.plane.id)!;
        const numberList = presence.plane.numbers.join(', ');
        expect(expectedPlaneVariants(presence)).toContain(planeInterpretation.interpretation);
        expect(planeInterpretation.interpretation).not.toContain(`2 of the three numbers for this pattern (${numberList}) is present`);
        expect(planeInterpretation.interpretation).not.toContain(`2 of the three numbers in this pattern (${numberList}) is part`);
      }
    });

    test('3 present: matches one of the three approved variants, all using "are present"/"are all present" correctly', () => {
      // '1987-06-24' (__tests__/core/loShu.test.ts) has three fully golden
      // planes: mindLogic, actionGrounding, manifestation.
      const profile: Profile = {
        id: 't-three-present',
        fullName: 'Three Present',
        dob: '1987-06-24',
        system: 'pythagorean',
        createdAt: '2026-01-01T00:00:00Z',
      };
      const report = buildBirthChartReport(profile);
      const threePresentPlanes = report.expressionPlanes.filter((p) => p.presentCount === 3);
      expect(threePresentPlanes.length).toBeGreaterThan(0);
      for (const presence of threePresentPlanes) {
        const planeInterpretation = report.planeInterpretations.find((p) => p.id === presence.plane.id)!;
        expect(expectedPlaneVariants(presence)).toContain(planeInterpretation.interpretation);
      }
    });
  });

  // Tone regression guard (AstroMatrix Birth Chart PDF corrections task):
  // a full plane must never read as proof of superior ability, and a
  // missing plane must never read as a deficiency. PLANE_STRENGTH_TEXT
  // itself is left unchanged (it also feeds the Blueprint-visible
  // generateLoShuSummary()), so these qualifying clauses - added only in
  // this function's own sentence construction - are what actually carries
  // the softened tone; this test protects them from being silently dropped.
  // AstroMatrix "Birth Chart PDF Wording Improvement" task: each branch's
  // single fixed qualifying phrase is now one of 3 rotated variants (see
  // `expectedPlaneVariants` above) - this test checks the SAME protective
  // idea survives in every variant (via a regex matching all 3 phrasings
  // per branch, not one exact string), and keeps the same negative
  // "never claims a guarantee/superiority" check unweakened.
  test('tone: a fully-present plane is framed as a reflection prompt, not a guarantee; a fully-absent one is not framed as a deficiency', () => {
    const report = buildBirthChartReport(maya);
    for (let i = 0; i < report.planeInterpretations.length; i++) {
      const planeInterpretation = report.planeInterpretations[i];
      const presence = report.expressionPlanes[i];
      expect(expectedPlaneVariants(presence)).toContain(planeInterpretation.interpretation);
      if (presence.presentCount === 3) {
        expect(planeInterpretation.interpretation).toMatch(/not a (fixed trait|promise)/);
      } else if (presence.presentCount === 0) {
        expect(planeInterpretation.interpretation.toLowerCase()).toMatch(/anything (is )?missing|something lacking/);
      } else {
        expect(planeInterpretation.interpretation).toMatch(/fixed description|complete picture/);
      }
      expect(planeInterpretation.interpretation.toLowerCase()).not.toMatch(/proves|guarantee[sd]?\s+(an?\s+)?ability|superior|definitely|always/);
    }
  });
});

describe('buildBirthChartReport - patternConnections', () => {
  test('every connection is for an actually-repeated digit, correctly naming the plane(s) that contain it', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);

    for (const connection of report.patternConnections) {
      const digitMatch = connection.text.match(/Number (\d)/);
      expect(digitMatch).not.toBeNull();
      const digit = Number(digitMatch![1]) as (typeof loShu.repeated)[number];
      expect(loShu.repeated).toContain(digit);

      const containingPlanes = report.expressionPlanes.filter((p) => p.plane.numbers.includes(digit));
      for (const presence of containingPlanes) {
        expect(connection.text).toContain(presence.plane.name);
        expect(connection.text).toContain(PLANE_STRENGTH_TEXT[presence.plane.id]);
        expect(connection.reflectionQuestion).toContain(presence.plane.name);
      }
    }
  });

  test('tone: each connection is framed as a thread "worth noticing", not a fixed description, and never infers personality/career/health/relationships/finances/destiny', () => {
    const report = buildBirthChartReport(maya);
    for (const connection of report.patternConnections) {
      expect(connection.text).toContain('not a fixed description of who you are');
      expect(connection.text.toLowerCase()).not.toMatch(
        /career|relationship|health|financ|destiny|personality type|will (succeed|fail)/,
      );
    }
  });

  test('is empty for a profile with no repeated digits', () => {
    // Meera shares Maya's DOB, so shares the same loShu.repeated - this
    // test instead uses a profile with a DOB known (from
    // __tests__/core/loShu.test.ts) to have zero repeated digits.
    const noRepeatsProfile: Profile = {
      id: 't-no-repeats',
      fullName: 'No Repeats',
      dob: '1987-06-24',
      system: 'pythagorean',
      createdAt: '2026-01-01T00:00:00Z',
    };
    const loShu = buildLoShuGrid(noRepeatsProfile.dob);
    expect(loShu.repeated).toEqual([]);

    const report = buildBirthChartReport(noRepeatsProfile);
    expect(report.patternConnections).toEqual([]);
  });
});

describe('buildBirthChartReport - determinism and purity', () => {
  test('same profile produces an identical report across calls', () => {
    expect(buildBirthChartReport(maya)).toEqual(buildBirthChartReport(maya));
  });

  test('does not mutate the input profile', () => {
    const snapshot = JSON.parse(JSON.stringify(maya));
    buildBirthChartReport(maya);
    expect(maya).toEqual(snapshot);
  });
});

describe('buildBirthChartReport - Test 51 twins (Maya Sharma vs Meera Sharma)', () => {
  const mayaChart = buildBirthChartReport(maya);
  const meeraChart = buildBirthChartReport(meera);

  test('date-derived values are identical for both profiles (same DOB)', () => {
    expect(mayaChart.numerology.lifePath).toBe(meeraChart.numerology.lifePath);
    expect(mayaChart.numerology.lifePath).toBe(4);

    expect(mayaChart.numerology.birthday).toBe(meeraChart.numerology.birthday);
    expect(mayaChart.numerology.birthday).toBe(14);

    expect(mayaChart.loShu).toEqual(meeraChart.loShu);
  });

  test('applicable name-derived values differ between the two profiles', () => {
    expect(mayaChart.numerology.destiny).toBe(1);
    expect(meeraChart.numerology.destiny).toBe(3);

    expect(mayaChart.numerology.personality).toBe(33);
    expect(meeraChart.numerology.personality).toBe(8);

    expect(mayaChart.coreNumberSections.destiny).not.toEqual(meeraChart.coreNumberSections.destiny);
    expect(mayaChart.coreNumberSections.personality).not.toEqual(meeraChart.coreNumberSections.personality);
  });

  test('swotReflection is identical for both twins, since it is derived only from the shared DOB/Lo Shu digits, never from name-based numbers', () => {
    // Deliberately not assuming twins share identical personalities or
    // name-derived numbers in general (the test above proves destiny/
    // personality genuinely differ) - this test instead confirms the one
    // specific, narrower fact that swotReflection's inputs (loShu.counts/
    // loShu.missing) are DOB-only, so same-DOB profiles must match here
    // even though their names and several other numbers differ.
    expect(mayaChart.swotReflection).toEqual(meeraChart.swotReflection);
  });
});

describe('buildStructuredReport - built from buildBirthChartReport plus forecastToday', () => {
  test('equals buildBirthChartReport(profile) spread with forecastToday from buildForecast(profile, onDate)', () => {
    const structured = buildStructuredReport(maya, ON_DATE);
    const birthChart = buildBirthChartReport(maya);
    const forecastToday = buildForecast(maya, ON_DATE);

    expect(structured).toEqual({ ...birthChart, forecastToday });
  });

  test('the stable fields of buildStructuredReport match buildBirthChartReport exactly, unaffected by this refactor', () => {
    const structured = buildStructuredReport(maya, ON_DATE);
    const birthChart = buildBirthChartReport(maya);

    expect(structured.profile).toEqual(birthChart.profile);
    expect(structured.numerology).toEqual(birthChart.numerology);
    expect(structured.loShu).toEqual(birthChart.loShu);
    expect(structured.expressionPlanes).toEqual(birthChart.expressionPlanes);
    expect(structured.coreNumberSummary).toEqual(birthChart.coreNumberSummary);
    expect(structured.coreNumberSections).toEqual(birthChart.coreNumberSections);
    expect(structured.numbersSummary).toBe(birthChart.numbersSummary);
    expect(structured.loShuSummary).toBe(birthChart.loShuSummary);
    expect(structured.swotReflection).toEqual(birthChart.swotReflection);
  });
});

describe('buildStructuredReport - determinism and purity', () => {
  test('same profile and date produce an identical report', () => {
    expect(buildStructuredReport(maya, ON_DATE)).toEqual(buildStructuredReport(maya, ON_DATE));
  });

  test('a different onDate changes forecastToday but not the name/date-of-birth-derived fields', () => {
    const reportA = buildStructuredReport(maya, '2026-06-15');
    const reportB = buildStructuredReport(maya, '2026-06-16');

    expect(reportA.numerology).toEqual(reportB.numerology);
    expect(reportA.loShu).toEqual(reportB.loShu);
    expect(reportA.forecastToday.date).not.toBe(reportB.forecastToday.date);
  });

  test('does not mutate the input profile', () => {
    const snapshot = JSON.parse(JSON.stringify(maya));
    buildStructuredReport(maya, ON_DATE);
    expect(maya).toEqual(snapshot);
  });
});

describe('buildStructuredReport - Test 51 twins (Maya Sharma vs Meera Sharma)', () => {
  const mayaReport = buildStructuredReport(maya, ON_DATE);
  const meeraReport = buildStructuredReport(meera, ON_DATE);

  test('date-derived values are identical for both profiles (same DOB)', () => {
    expect(mayaReport.numerology.lifePath).toBe(meeraReport.numerology.lifePath);
    expect(mayaReport.numerology.lifePath).toBe(4);

    expect(mayaReport.numerology.birthday).toBe(meeraReport.numerology.birthday);
    expect(mayaReport.numerology.birthday).toBe(14);

    expect(mayaReport.loShu).toEqual(meeraReport.loShu);

    // Personal Year/Month/Day are dob+date only (no name/id in the formula).
    expect(mayaReport.forecastToday.personalYear).toBe(meeraReport.forecastToday.personalYear);
    expect(mayaReport.forecastToday.personalMonth).toBe(meeraReport.forecastToday.personalMonth);
    expect(mayaReport.forecastToday.personalDay).toBe(meeraReport.forecastToday.personalDay);
  });

  test('applicable name-derived values differ between the two profiles', () => {
    expect(mayaReport.numerology.destiny).toBe(1);
    expect(meeraReport.numerology.destiny).toBe(3);
    expect(mayaReport.numerology.destiny).not.toBe(meeraReport.numerology.destiny);

    expect(mayaReport.numerology.personality).toBe(33);
    expect(meeraReport.numerology.personality).toBe(8);
    expect(mayaReport.numerology.personality).not.toBe(meeraReport.numerology.personality);

    // Interpretation text follows the differing values, so it differs too.
    expect(mayaReport.coreNumberSections.destiny).not.toEqual(meeraReport.coreNumberSections.destiny);
    expect(mayaReport.coreNumberSections.personality).not.toEqual(meeraReport.coreNumberSections.personality);
  });

  test("Maya's Soul Urge (4) matches Meera's Soul Urge (4) by coincidence of final value, not shared state", () => {
    // Both report the same final digit, but via different raw sums/chains
    // (already proven in numerology.test.ts's Test 51 suite) - re-asserted
    // here only at the report-assembly level to confirm the report doesn't
    // somehow collapse or share these two independently-built reports.
    expect(mayaReport.numerology.soulUrge).toBe(4);
    expect(meeraReport.numerology.soulUrge).toBe(4);
    expect(mayaReport.numerology.reductions.soulUrge).toEqual([4]);
    expect(meeraReport.numerology.reductions.soulUrge).toEqual([13, 4]);
  });
});

// AstroMatrix "Birth Chart PDF Redesign" Stage 1: Birth Chart reports are
// Pythagorean-only regardless of a legacy stored profile's own `system`
// value. These tests prove the override is real (the actual calculated
// values change, not just a label) and precisely scoped (only the three
// name-derived Core Numbers are affected; nothing else is; the stored
// input profile is never mutated).
describe('buildBirthChartReport - legacy chaldean profile is always calculated as Pythagorean', () => {
  const legacyChaldeanProfile: Profile = {
    id: 't-legacy-chaldean',
    fullName: 'Maya Sharma',
    dob: '1992-05-14',
    system: 'chaldean',
    createdAt: '2026-01-01T00:00:00Z',
  };

  test('Destiny, Soul Urge, and Personality are genuinely calculated via the Pythagorean map, not the profile\'s own declared Chaldean system', () => {
    // Independently compute what each system would actually produce for
    // this exact name, so this test fails if the override is ever removed
    // or silently becomes label-only.
    const pythagoreanDestiny = calcDestiny(legacyChaldeanProfile.fullName, 'pythagorean').value;
    const chaldeanDestiny = calcDestiny(legacyChaldeanProfile.fullName, 'chaldean').value;
    const pythagoreanSoulUrge = calcSoulUrge(legacyChaldeanProfile.fullName, 'pythagorean').value;
    const chaldeanSoulUrge = calcSoulUrge(legacyChaldeanProfile.fullName, 'chaldean').value;
    const pythagoreanPersonality = calcPersonality(legacyChaldeanProfile.fullName, 'pythagorean').value;
    const chaldeanPersonality = calcPersonality(legacyChaldeanProfile.fullName, 'chaldean').value;

    // Precondition: for this name, the two systems must actually disagree,
    // otherwise this test would pass without genuinely exercising the
    // override. (If this ever fails because the two systems coincidentally
    // agree for this exact name, swap in a different fixture name instead
    // of weakening the assertions below.)
    expect(
      pythagoreanDestiny !== chaldeanDestiny ||
        pythagoreanSoulUrge !== chaldeanSoulUrge ||
        pythagoreanPersonality !== chaldeanPersonality,
    ).toBe(true);

    const report = buildBirthChartReport(legacyChaldeanProfile);

    expect(report.numerology.destiny).toBe(pythagoreanDestiny);
    expect(report.numerology.soulUrge).toBe(pythagoreanSoulUrge);
    expect(report.numerology.personality).toBe(pythagoreanPersonality);
  });

  test('matches buildNumerologyReport({ ...profile, system: "pythagorean" }) exactly - not buildNumerologyReport(profile)', () => {
    const report = buildBirthChartReport(legacyChaldeanProfile);
    expect(report.numerology).toEqual(
      buildNumerologyReport({ ...legacyChaldeanProfile, system: 'pythagorean' }),
    );
    expect(report.numerology).not.toEqual(buildNumerologyReport(legacyChaldeanProfile));
  });

  test('Life Path and Birthday are identical regardless of the declared system (date-only, never routes through a letter map)', () => {
    const pythagoreanProfile: Profile = { ...legacyChaldeanProfile, system: 'pythagorean' };
    const chaldeanReport = buildBirthChartReport(legacyChaldeanProfile);
    const pythagoreanReport = buildBirthChartReport(pythagoreanProfile);

    expect(chaldeanReport.numerology.lifePath).toBe(pythagoreanReport.numerology.lifePath);
    expect(chaldeanReport.numerology.birthday).toBe(pythagoreanReport.numerology.birthday);
  });

  test('the Lo Shu Grid and Expression Planes are identical regardless of the declared system (never read `system` at all)', () => {
    const pythagoreanProfile: Profile = { ...legacyChaldeanProfile, system: 'pythagorean' };
    const chaldeanReport = buildBirthChartReport(legacyChaldeanProfile);
    const pythagoreanReport = buildBirthChartReport(pythagoreanProfile);

    expect(chaldeanReport.loShu).toEqual(pythagoreanReport.loShu);
    expect(chaldeanReport.expressionPlanes).toEqual(pythagoreanReport.expressionPlanes);
  });

  test('the returned report.profile.system and numerology.system always read "pythagorean", never the legacy stored value', () => {
    const report = buildBirthChartReport(legacyChaldeanProfile);
    expect(report.profile.system).toBe('pythagorean');
    expect(report.numerology.system).toBe('pythagorean');
  });

  test('does not mutate the input profile - the stored system value is left exactly as given', () => {
    const profileCopy: Profile = { ...legacyChaldeanProfile };
    buildBirthChartReport(legacyChaldeanProfile);
    expect(legacyChaldeanProfile).toEqual(profileCopy);
    expect(legacyChaldeanProfile.system).toBe('chaldean');
  });

  test('buildStructuredReport applies the same override (built from buildBirthChartReport, never re-deriving numerology)', () => {
    const report = buildStructuredReport(legacyChaldeanProfile, '2026-06-15');
    expect(report.numerology).toEqual(
      buildNumerologyReport({ ...legacyChaldeanProfile, system: 'pythagorean' }),
    );
    expect(report.profile.system).toBe('pythagorean');
  });
});

// AstroMatrix "Birth Chart PDF Redesign" Stage 1: the closing summary's
// own data - built from existing, already-verified report fields only.
describe('buildBirthChartReport - closingSummary', () => {
  test('keyThemes mentions every overarchingThemes phrase, frames them as complementary, and is a NEW sentence, not a repeat of coreNumberSummary.paragraph', () => {
    const report = buildBirthChartReport(maya);
    for (const theme of report.coreNumberSummary.overarchingThemes) {
      expect(report.closingSummary.keyThemes).toContain(theme);
    }
    expect(report.closingSummary.keyThemes).toContain('complementary');
    expect(report.closingSummary.keyThemes).not.toBe(report.coreNumberSummary.paragraph);
    expect(report.coreNumberSummary.paragraph).not.toContain(report.closingSummary.keyThemes);
  });

  test('keyThemes never contains hardcoded sample-profile details', () => {
    const report = buildBirthChartReport(maya);
    expect(report.closingSummary.keyThemes).not.toContain('Maya');
    expect(report.closingSummary.keyThemes).not.toContain('Sharma');
  });

  test('patternConnection states the active Lo Shu digit count, the missing digit count, and the fully-present Plane count, matching independently computed values', () => {
    const report = buildBirthChartReport(maya);
    const loShu = buildLoShuGrid(maya.dob);
    const activeCount = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).filter((d) => loShu.counts[d] > 0).length;
    const fullyPresentCount = report.expressionPlanes.filter((p) => p.presentCount === 3).length;

    expect(report.closingSummary.patternConnection).toContain(`${activeCount} of the 9`);
    expect(report.closingSummary.patternConnection).toContain(`${loShu.missing.length}`);
    expect(report.closingSummary.patternConnection).toContain(`${fullyPresentCount} of your six Planes`);
  });

  // Missing Lo Shu numbers must never be framed as a defect, weakness, or
  // proof of inability - this test is the entire point of the "not a gap
  // to correct" wording.
  test('patternConnection never frames missing Lo Shu numbers as a deficiency', () => {
    const report = buildBirthChartReport(maya);
    expect(report.closingSummary.patternConnection).toContain('not a gap to correct');
    for (const bad of [/weak(ness)?/i, /defect/i, /inability/i, /unable/i, /flaw/i]) {
      expect(report.closingSummary.patternConnection).not.toMatch(bad);
    }
  });

  test('patternConnection is a new sentence, not a repeat of loShuSummary or any single plane\'s own interpretation', () => {
    const report = buildBirthChartReport(maya);
    expect(report.closingSummary.patternConnection).not.toBe(report.loShuSummary);
    for (const plane of report.planeInterpretations) {
      expect(report.closingSummary.patternConnection).not.toBe(plane.interpretation);
    }
  });

  // AstroMatrix "Birth Chart PDF Closing Summary" task: reflectionPrompts
  // and finalQuestion were merged into reflectionQuestions - 2-3 concrete
  // questions, grounded in this profile's own data, not hardcoded.
  test('reflectionQuestions has 2-3 items, each a question grounded in this profile\'s own themes or active Lo Shu digits', () => {
    const report = buildBirthChartReport(maya);
    const { reflectionQuestions } = report.closingSummary;

    expect(reflectionQuestions.length).toBeGreaterThanOrEqual(2);
    expect(reflectionQuestions.length).toBeLessThanOrEqual(3);
    for (const question of reflectionQuestions) {
      expect(question.trim().endsWith('?')).toBe(true);
    }

    expect(reflectionQuestions[0]).toBe(buildClosingReflectionQuestion(report.coreNumberSummary.overarchingThemes));

    const loShu = buildLoShuGrid(maya.dob);
    const activeDigits = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).filter((d) => loShu.counts[d] > 0);
    expect(reflectionQuestions[1]).toBe(
      `Where could ${NUMBER_ESSENCE[activeDigits[0]].strengths[0]} help you turn an idea into meaningful progress?`,
    );

    expect(reflectionQuestions[2]).toBe(
      'What is one small, realistic step you could take this week toward something that matters to you?',
    );
  });

  test('reflectionQuestions never contains hardcoded sample-profile details', () => {
    const report = buildBirthChartReport(maya);
    for (const question of report.closingSummary.reflectionQuestions) {
      expect(question).not.toContain('Maya');
      expect(question).not.toContain('Sharma');
    }
  });

  test('same profile produces an identical closingSummary across calls (deterministic)', () => {
    const a = buildBirthChartReport(maya);
    const b = buildBirthChartReport(maya);
    expect(a.closingSummary).toEqual(b.closingSummary);
  });

  test('does not mutate the input profile', () => {
    const profileCopy: Profile = { ...maya };
    buildBirthChartReport(maya);
    expect(maya).toEqual(profileCopy);
  });
});

// `buildClosingReflectionQuestion` is tested directly (not only through
// buildBirthChartReport) because its single-theme and empty-theme branches
// are defensive - no real Profile can reach them through the public report
// builders (overarchingThemes is always non-empty in practice, per
// getCoreNumberSummary's own implementation), so hand-constructed inputs
// are the only way to verify that behavior.
//
// AstroMatrix "Birth Chart PDF Quality Improvement" task: this function no
// longer accepts a `patternConnections` parameter at all (Stage 1 originally
// had it reuse `patternConnections[0].reflectionQuestion` when available -
// that reuse path was removed outright, not just left uncalled, because the
// Summary's closing question must never repeat "How Your Patterns
// Connect"'s own question).
describe('buildClosingReflectionQuestion', () => {
  test('falls back to a two-theme question using exactly the first two themes when there are 2 or more', () => {
    expect(buildClosingReflectionQuestion(['steady focus', 'quiet leadership', 'a third theme'])).toBe(
      'As you reflect on your blueprint, which feels more present for you right now - steady focus or quiet leadership?',
    );
    expect(buildClosingReflectionQuestion(['steady focus', 'quiet leadership'])).toBe(
      'As you reflect on your blueprint, which feels more present for you right now - steady focus or quiet leadership?',
    );
  });

  test('falls back to a single-theme question when there is exactly 1 theme', () => {
    expect(buildClosingReflectionQuestion(['steady focus'])).toBe(
      'Where might steady focus be showing up in your life right now?',
    );
  });

  test('omits the question (returns an empty string) when there are no themes - the defensive empty-theme case', () => {
    expect(buildClosingReflectionQuestion([])).toBe('');
  });

  test('never introduces a theme or number not present in the input', () => {
    const result = buildClosingReflectionQuestion(['steady focus', 'quiet leadership']);
    // Only the two supplied themes and fixed connective wording - nothing
    // else is interpolated in.
    expect(result).toBe(
      `As you reflect on your blueprint, which feels more present for you right now - steady focus or quiet leadership?`,
    );
  });
});
