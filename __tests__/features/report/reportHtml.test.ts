/**
 * Exercises `src/features/report/reportHtml.ts`'s `buildReportHtml()` -
 * pure HTML-string generation from a `BirthChartReport`. No Expo/native
 * code is imported by `reportHtml.ts`, so this runs under the project's
 * existing plain Node Jest environment.
 *
 * `buildReportHtml` is typed to accept `BirthChartReport`, not
 * `StructuredReport` - the downloadable Birth Chart PDF must never include
 * `forecastToday`. Most tests below still build via `buildStructuredReport`
 * (since that's what `exportReportAsPdf`'s real caller actually produces -
 * see `app/settings.tsx`'s DEV export row) specifically to prove the PDF
 * excludes the forecast even when a `StructuredReport` (which does carry
 * one) is what's actually passed in - see the dedicated
 * "excludes the daily forecast" describe block below.
 *
 * This file does NOT exercise `exportReport.ts` (`exportReportAsPdf` /
 * `shareReportPdf`) - see `exportReport.test.ts` for that module's own
 * (mocked-native) orchestration tests. Verifying actual PDF creation and
 * the real share sheet remains a manual smoke test in Expo Go or a dev
 * client either way - no automated test here or there exercises a real
 * native bridge.
 */
import { buildReportHtml, escapeHtml } from '../../../src/features/report/reportHtml';
import { buildBirthChartReport, buildStructuredReport } from '../../../src/core/report';
import { getCoreNumberInterpretation } from '../../../src/data/coreNumberContent';
import { LO_SHU_LAYOUT } from '../../../src/core/loShu';
import { EXPRESSION_PLANES } from '../../../src/core/expressionPlanes';
import { formatDDMonthYYYY } from '../../../src/lib/date';
import type { Profile } from '../../../src/core/types';

const ON_DATE = '2026-06-15';

// Same fixtures as Test 51 / report.test.ts - already-verified exact
// numerology values (Life Path 4, Birthday 14 for both; Destiny 1/Soul
// Urge 4/Personality 33 for Maya; Destiny 3/Soul Urge 4/Personality 8 for
// Meera).
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

describe('buildReportHtml - profile and numerology content', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report);

  test('includes the profile name, DOB (as DD-Month-YYYY), and system', () => {
    expect(html).toContain('Maya Sharma');
    expect(html).toContain(formatDDMonthYYYY('1992-05-14'));
    expect(html).toContain('14-May-1992');
    expect(html).not.toContain('1992-05-14'); // the raw ISO string is never shown to the user
    expect(html).toContain('Pythagorean');
  });

  test('includes the correct value for every core number, highlighted', () => {
    expect(html).toContain('Life Path: <span class="value-highlight">4</span>');
    expect(html).toContain('Destiny: <span class="value-highlight">1</span>');
    expect(html).toContain('Soul Urge: <span class="value-highlight">4</span>');
    expect(html).toContain('Personality: <span class="value-highlight">33</span>');
    expect(html).toContain('Birthday: <span class="value-highlight">14</span>');
  });

  test('includes the real interpretation text for each core number (not invented copy)', () => {
    // Compared in escaped form - the source content itself contains
    // apostrophes/ampersands (e.g. "It's associated..."), which the real
    // HTML correctly escapes. Using `escapeHtml` (the same function the
    // production code uses) to build the expected value keeps this a
    // genuine wiring check, not a second, independently-written escaper
    // that could quietly diverge from it.
    for (const key of ['lifePath', 'destiny', 'soulUrge', 'personality', 'birthday'] as const) {
      const section = getCoreNumberInterpretation(key, report.numerology[key]);
      expect(html).toContain(escapeHtml(section.represents));
      expect(html).toContain(escapeHtml(section.yourInterpretation));
      expect(html).toContain(escapeHtml(section.howToUse));
      for (const item of section.showsUpAs) expect(html).toContain(escapeHtml(item));
      for (const item of section.strengths) expect(html).toContain(escapeHtml(item));
      for (const item of section.mindfulOf) expect(html).toContain(escapeHtml(item));
    }
  });
});

describe('buildReportHtml - Lo Shu, expression planes, summaries', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report);

  test('includes Lo Shu missing/repeated digits and the Lo Shu summary text', () => {
    for (const digit of report.loShu.missing) expect(html).toContain(String(digit));
    for (const digit of report.loShu.repeated) expect(html).toContain(String(digit));
    expect(html).toContain(escapeHtml(report.loShuSummary));
  });

  test('includes every expression plane name', () => {
    for (const presence of report.expressionPlanes) {
      expect(html).toContain(escapeHtml(presence.plane.name));
    }
  });

  test('includes the core number summary paragraph', () => {
    expect(html).toContain(escapeHtml(report.coreNumberSummary.paragraph));
  });

  // Stage 3 ("Birth Chart PDF Redesign"): the standalone "Numbers Summary"
  // section was removed because its content substantially overlapped "Your
  // Combined Core Profile"'s own paragraph (both cover Life Path + Soul
  // Urge). `numbersSummary`/`generateNumbersSummary()` themselves are
  // UNCHANGED - Blueprint still reads both directly - only this renderer
  // stopped displaying the field.
  test('does not render the standalone "Numbers Summary" section (removed - see "Your Combined Core Profile")', () => {
    expect(html).not.toContain('<h2>Numbers Summary</h2>');
    expect(html).not.toContain(escapeHtml(report.numbersSummary));
  });
});

describe('buildReportHtml - excludes the daily forecast (Birth Chart PDF boundary)', () => {
  test('a StructuredReport (which does carry forecastToday) still renders no forecast section or forecast-specific content', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    const html = buildReportHtml(report);

    expect(html).not.toContain("Today's Forecast");
    expect(html).not.toContain(report.forecastToday.headline);
    expect(html).not.toContain(report.forecastToday.body);
    expect(html).not.toContain(`Lucky Number: ${report.forecastToday.luckyNumber}`);
    expect(html).not.toContain('Personal Year');
    expect(html).not.toContain('Personal Month');
    expect(html).not.toContain('Personal Day');
  });

  test('a BirthChartReport (no forecastToday field at all) produces byte-identical HTML to the StructuredReport built from the same profile', () => {
    const birthChart = buildBirthChartReport(maya);
    const structured = buildStructuredReport(maya, ON_DATE);

    expect(buildReportHtml(birthChart)).toBe(buildReportHtml(structured));
  });

  test('buildStructuredReport(profile, onDate) still returns a real forecastToday - only the PDF stopped rendering it, the data/behavior is unaffected', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    expect(report.forecastToday).toBeDefined();
    expect(report.forecastToday.date).toBe(ON_DATE);
    expect(typeof report.forecastToday.headline).toBe('string');
    expect(report.forecastToday.headline.length).toBeGreaterThan(0);
  });
});

describe('buildReportHtml - Traditional Grid Patterns (golden/silver yoga lines)', () => {
  // Reuses the exact DOBs already verified in __tests__/core/loShu.test.ts's
  // own `buildLoShuGrid` tests - not re-deriving or inventing Lo Shu values
  // here. '1987-06-24' has three golden yogas and no silver yogas;
  // '1940-10-09' has three silver yogas (including a line literally named
  // "Silver diagonal") and no golden yogas - together they exercise both
  // the populated and the empty branch for this subsection.
  //
  // This describe block supersedes the prior "Fully present lines"/"Fully
  // absent lines" bare-line rendering (approved in an earlier task) - this
  // task's "Traditional Grid Patterns" Lo Shu interpretation subsection
  // carries the exact same underlying golden/silver yoga data, just with a
  // proper heading and one sentence of factual framing per line instead of
  // an unlabeled comma-joined list.
  const goldenOnlyProfile: Profile = {
    id: 't-golden-only',
    fullName: 'Golden Only',
    dob: '1987-06-24',
    system: 'pythagorean',
    createdAt: '2026-01-01T00:00:00Z',
  };
  const silverOnlyProfile: Profile = {
    id: 't-silver-only',
    fullName: 'Silver Only',
    dob: '1940-10-09',
    system: 'pythagorean',
    createdAt: '2026-01-01T00:00:00Z',
  };

  const goldenReport = buildStructuredReport(goldenOnlyProfile, ON_DATE);
  const goldenHtml = buildReportHtml(goldenReport);
  const silverReport = buildStructuredReport(silverOnlyProfile, ON_DATE);
  const silverHtml = buildReportHtml(silverReport);

  test('renders the "Traditional Grid Patterns" heading and every golden/silver yoga line, escaped', () => {
    expect(goldenReport.loShu.planes.goldenYogas.length).toBeGreaterThan(0);
    expect(goldenHtml).toContain('<h3>Traditional Grid Patterns</h3>');
    for (const item of goldenReport.loShuInterpretation.traditionalPatterns) {
      expect(goldenHtml).toContain(escapeHtml(item));
    }

    expect(silverReport.loShu.planes.silverYogas.length).toBeGreaterThan(0);
    expect(silverHtml).toContain('<h3>Traditional Grid Patterns</h3>');
    for (const item of silverReport.loShuInterpretation.traditionalPatterns) {
      expect(silverHtml).toContain(escapeHtml(item));
    }
  });

  test("golden yoga lines are framed as fully present, silver as fully absent - not evaluated as better or worse", () => {
    for (const item of goldenReport.loShuInterpretation.traditionalPatterns) {
      expect(item).toContain('all three numbers in this line are present');
    }
    for (const item of silverReport.loShuInterpretation.traditionalPatterns) {
      expect(item).toContain('none of the three numbers in this line are present');
    }
  });

  test('omits "Traditional Grid Patterns" entirely when traditionalPatterns is empty', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    const html = buildReportHtml({
      ...report,
      loShuInterpretation: { ...report.loShuInterpretation, traditionalPatterns: [] },
    });
    expect(html).not.toContain('<h3>Traditional Grid Patterns</h3>');
  });
});

describe('buildReportHtml - Your Personal Pattern Review (renamed from "Personal SWOT Reflection")', () => {
  // Maya's active digits (1,2,4,5,9) plus missing digits (3,6,7,8) together
  // cover every digit 1-9, so this one fixture exercises every
  // NUMBER_ESSENCE[d].strengths[0]/themes value used by the section.
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report);

  test('renders the approved section heading and no longer renders the old "Personal SWOT Reflection" heading', () => {
    expect(html).toContain('<h2>Your Personal Pattern Review</h2>');
    expect(html).not.toContain('Personal SWOT Reflection');
    expect(html).not.toContain('>SWOT<');
  });

  test('includes the section disclaimer (reworded to the approved name), escaped', () => {
    expect(html).toContain(
      escapeHtml(
        "Your Personal Pattern Review draws on traditional numerology associations with the numbers present and absent in your birth date. It's offered as a prompt for self-reflection — not a scientific assessment, a fixed trait, or a prediction.",
      ),
    );
  });

  test('includes all four subsection headings, their exact approved subtitles, and the three data-driven intros', () => {
    expect(html).toContain('<h3>Strengths</h3>');
    expect(html).toContain(escapeHtml('Qualities You May Draw On'));
    expect(html).toContain(
      escapeHtml('These numbers appear in your birth date. Numerology traditionally associates each with a strength:'),
    );

    expect(html).toContain('<h3>Areas to Explore</h3>');
    expect(html).toContain(escapeHtml('Numbers to Reflect On'));
    expect(html).toContain(
      escapeHtml(
        'These numbers are not represented in your birth date — which is expected, since every Lo Shu pattern leaves several numbers unrepresented, not a sign of inability. Numerology traditionally associates each with themes that may be worth exploring as optional self-reflection (see also Numbers for Conscious Attention, earlier in this report, for a complementary traditional angle):',
      ),
    );

    expect(html).toContain('<h3>Opportunities</h3>');
    expect(html).toContain(escapeHtml('Ways to Develop'));
    expect(html).toContain(
      escapeHtml(
        'For these same numbers, here are traditional themes you might consciously work with over time — offered as possible starting points for reflection, not as practices with a guaranteed result:',
      ),
    );

    expect(html).toContain('<h3>Patterns to Notice</h3>');
    expect(html).toContain(escapeHtml('What May Be Easy to Overlook'));
  });

  // The four subtitles are reused verbatim from app/onboarding/swot-audit.tsx
  // (not new copy) - this test pins the exact strings so a future wording
  // drift between the onboarding screen and the PDF would be caught.
  test('subtitles match app/onboarding/swot-audit.tsx exactly: "Qualities You May Draw On", "Numbers to Reflect On", "Ways to Develop", "What May Be Easy to Overlook"', () => {
    for (const subtitle of [
      'Qualities You May Draw On',
      'Numbers to Reflect On',
      'Ways to Develop',
      'What May Be Easy to Overlook',
    ]) {
      expect(html).toContain(`<p class="subtitle">${escapeHtml(subtitle)}</p>`);
    }
  });

  test('renders every strengths, areasToExplore, and opportunities item, escaped', () => {
    for (const item of report.swotReflection.strengths) expect(html).toContain(escapeHtml(item.text));
    for (const item of report.swotReflection.areasToExplore) expect(html).toContain(escapeHtml(item.text));
    for (const item of report.swotReflection.opportunities) expect(html).toContain(escapeHtml(item.text));
  });

  // SWOT improvement (an earlier task in this arc): the Strengths
  // subsection also renders a combined-digits synthesis sentence, inside
  // the same break-inside:avoid lead block as the heading/intro - not just
  // a per-digit list.
  test('Strengths renders the strengthsSynthesis sentence, inside the swot-lead block, not for Areas to Explore/Opportunities', () => {
    expect(report.swotReflection.strengthsSynthesis.length).toBeGreaterThan(0);
    expect(html).toContain(`<p class="swot-synthesis">${escapeHtml(report.swotReflection.strengthsSynthesis)}</p>`);

    const strengthsHeadingIndex = html.indexOf('<h3>Strengths</h3>');
    const leadStart = html.lastIndexOf('<div class="swot-lead">', strengthsHeadingIndex);
    const leadEnd = html.indexOf('</div>', strengthsHeadingIndex);
    const synthesisIndex = html.indexOf('class="swot-synthesis"');
    expect(synthesisIndex).toBeGreaterThan(leadStart);
    expect(synthesisIndex).toBeLessThan(leadEnd);

    // Only ever rendered once (for Strengths), never duplicated elsewhere.
    expect(html.match(/class="swot-synthesis"/g)).toHaveLength(1);
  });

  // Patterns to Notice: now rendered (previously deferred). Its content is
  // the existing, already-approved onboarding text reused verbatim
  // (app/onboarding/swot-audit.tsx:269-273) - NOT derived from this
  // profile's digits, unlike the three sections above. These tests confirm
  // both that it renders, and that it's explicitly framed as general/
  // non-personalized rather than silently looking like the other three.
  describe('Patterns to Notice', () => {
    test('renders the exact existing onboarding text verbatim, escaped', () => {
      expect(html).toContain(
        escapeHtml(
          'You may bring strong vision and intuitive spark to new ideas, while finding that consistency and routine require more conscious attention.',
        ),
      );
      expect(html).toContain(
        escapeHtml("This isn't a personal flaw. It is simply another part of your pattern worth noticing."),
      );
    });

    test('is explicitly framed as a general, non-personalized prompt - not implied to be derived from this profile\'s numbers', () => {
      expect(html).toContain(
        escapeHtml(
          'Unlike the sections above, this reflection is offered as a general prompt for self-reflection - it is not personalized to your specific numbers.',
        ),
      );
    });

    test('is identical between two different profiles (same DOB, different name) - proving it is not personalized, unlike the other three sections', () => {
      const meeraHtml = buildReportHtml(buildStructuredReport(meera, ON_DATE));
      const extractPatternsToNotice = (source: string): string => {
        const start = source.indexOf('<h3>Patterns to Notice</h3>');
        const end = source.indexOf('</div>', start);
        return source.slice(start, end);
      };
      expect(extractPatternsToNotice(html)).toBe(extractPatternsToNotice(meeraHtml));
    });

    test('is wrapped in a break-inside:avoid block, consistent with the other subsections', () => {
      const headingIndex = html.indexOf('<h3>Patterns to Notice</h3>');
      const leadStart = html.lastIndexOf('<div class="swot-lead">', headingIndex);
      expect(leadStart).toBeGreaterThan(-1);
    });
  });

  test('omits a subsection heading and intro entirely when its list is empty, without affecting the others', () => {
    const noAreasOrOpportunities = buildReportHtml({
      ...report,
      swotReflection: { ...report.swotReflection, areasToExplore: [], opportunities: [] },
    });

    expect(noAreasOrOpportunities).toContain('<h3>Strengths</h3>');
    expect(noAreasOrOpportunities).not.toContain('<h3>Areas to Explore</h3>');
    expect(noAreasOrOpportunities).not.toContain('<h3>Opportunities</h3>');
    expect(noAreasOrOpportunities).not.toContain('These numbers are not represented in your birth date');
    expect(noAreasOrOpportunities).not.toContain('traditional themes you might consciously work with over time');
    // Patterns to Notice is static, not tied to any digit list, so it's
    // unaffected by areasToExplore/opportunities being empty.
    expect(noAreasOrOpportunities).toContain('<h3>Patterns to Notice</h3>');
    // The disclaimer itself is section-level, not tied to any one list, so
    // it still appears even when every list happens to be empty.
    expect(noAreasOrOpportunities).toContain('Your Personal Pattern Review draws on traditional numerology');

    const noStrengths = buildReportHtml({
      ...report,
      swotReflection: { ...report.swotReflection, strengths: [] },
    });
    expect(noStrengths).not.toContain('<h3>Strengths</h3>');
    expect(noStrengths).toContain('<h3>Areas to Explore</h3>');
    expect(noStrengths).toContain('<h3>Opportunities</h3>');
    expect(noStrengths).toContain('<h3>Patterns to Notice</h3>');
  });
});

describe('buildReportHtml - full Lo Shu Grid rendering', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report);

  test('renders all nine grid cells, each digit following LO_SHU_LAYOUT, with its actual count', () => {
    const flatDigits = LO_SHU_LAYOUT.flat();
    expect(flatDigits.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const digit of flatDigits) {
      const count = report.loShu.counts[digit];
      const cls = count === 0 ? 'missing' : count >= 2 ? 'repeated' : 'present';
      const countLabel = count === 0 ? 'Missing' : `&times;${count}`;
      expect(html).toContain(
        `<td class="grid-cell ${cls}"><span class="digit">${digit}</span><span class="count">${countLabel}</span></td>`,
      );
    }
  });

  test('includes a legend with present, missing, and repeated swatches', () => {
    expect(html).toContain('legend-swatch present');
    expect(html).toContain('legend-swatch missing');
    expect(html).toContain('legend-swatch repeated');
  });
});

describe('buildReportHtml - Lo Shu interpretation subsections', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report);

  test('"Your Lo Shu Pattern" is always present, reflecting active/repeated counts from loShu', () => {
    expect(html).toContain('<h3>Your Lo Shu Pattern</h3>');
    expect(html).toContain(escapeHtml(report.loShuInterpretation.yourPattern));
  });

  test('"Numbers Present and Repeated" renders one entry per active digit, matching loShu.counts', () => {
    expect(html).toContain('<h3>Numbers Present and Repeated</h3>');
    for (const item of report.loShuInterpretation.numbersPresent) {
      expect(html).toContain(escapeHtml(item.text));
    }
    expect(report.loShuInterpretation.numbersPresent.map((i) => i.digit)).toEqual(
      ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).filter((d) => report.loShu.counts[d] > 0),
    );
  });

  test('"Numbers for Conscious Attention" renders one entry per missing digit, matching loShu.missing', () => {
    expect(html).toContain('<h3>Numbers for Conscious Attention</h3>');
    for (const item of report.loShuInterpretation.consciousAttention) {
      expect(html).toContain(escapeHtml(item.text));
    }
    expect(report.loShuInterpretation.consciousAttention.map((i) => i.digit)).toEqual(report.loShu.missing);
  });

  test('"Putting the Pattern Together" reuses the existing loShuSummary text unchanged', () => {
    expect(html).toContain('<h3>Putting the Pattern Together</h3>');
    expect(html).toContain(escapeHtml(report.loShuSummary));
  });

  // Issue 1 correction (final PDF corrections task): a PDF-only qualifier
  // now follows the reused `loShuSummary` text, narrowly scoped to
  // reportHtml.ts - never a change to `generateLoShuSummary()`/
  // `loShuSummary` itself (confirmed by the test above still passing
  // unchanged), since that text is also displayed verbatim on the
  // Blueprint screen.
  test('a PDF-only qualifier follows "Putting the Pattern Together", without altering loShuSummary itself', () => {
    const qualifier =
      'This reflects one traditional numerology interpretation of your Lo Shu pattern - offered as an optional prompt for self-reflection, not as proof of ability, superiority, a fixed destiny, or a guaranteed outcome.';
    expect(html).toContain(escapeHtml(qualifier));

    // The qualifier appears strictly after the reused loShuSummary text,
    // i.e. it's an addition, not a replacement.
    const summaryIndex = html.indexOf(escapeHtml(report.loShuSummary));
    const qualifierIndex = html.indexOf(escapeHtml(qualifier));
    expect(qualifierIndex).toBeGreaterThan(summaryIndex);
  });

  // Issue 4 correction (final PDF corrections task): the qualifier now sits
  // in the SAME paragraph as loShuSummary (directly attached to the claim
  // it softens), not a separate, visually-disconnected footnote paragraph -
  // a small, PDF-specific adjustment; `loShuSummary` itself is unchanged
  // (confirmed by the unmodified test above still passing).
  test('the qualifier is in the same paragraph as loShuSummary, not a separate disconnected paragraph', () => {
    const qualifier =
      'This reflects one traditional numerology interpretation of your Lo Shu pattern - offered as an optional prompt for self-reflection, not as proof of ability, superiority, a fixed destiny, or a guaranteed outcome.';
    expect(html).toContain(`<p>${escapeHtml(report.loShuSummary)} ${escapeHtml(qualifier)}</p>`);
  });
});

describe('buildReportHtml - six Planes of Expression (mini-grids, interpretation, canonical order)', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report);

  test('renders all six planes in the exact canonical EXPRESSION_PLANES order, with their canonical names', () => {
    const headingIndexes = EXPRESSION_PLANES.map((plane) => html.indexOf(`<h3>${escapeHtml(plane.name)}</h3>`));
    for (const index of headingIndexes) expect(index).toBeGreaterThan(-1);
    // Strictly ascending -> the headings appear in exactly this order.
    for (let i = 1; i < headingIndexes.length; i++) {
      expect(headingIndexes[i]).toBeGreaterThan(headingIndexes[i - 1]);
    }
  });

  // AstroMatrix "Birth Chart PDF Quality Improvement": mini-cells now carry
  // a nested <span class="mini-digit"> plus, for the plane's own three
  // cells, a <span class="mini-mark"> text label (present/missing) -
  // presence is no longer colour-only. This replaces the previous bare-text
  // `<td>` assertion with the new structure.
  test('each mini-grid highlights exactly its own three canonical cells, distinguishing present from missing within them by both colour and a text mark', () => {
    for (const presence of report.expressionPlanes) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const digit = LO_SHU_LAYOUT[row][col];
          const belongsToPlane = presence.plane.cells.some((c) => c.row === row && c.col === col);
          const isPresent = belongsToPlane && presence.presentNumbers.includes(digit);
          const cls = !belongsToPlane ? 'outside' : isPresent ? 'present' : 'missing-in-plane';
          const mark = belongsToPlane ? `<span class="mini-mark">${isPresent ? 'present' : 'missing'}</span>` : '';
          expect(html).toContain(`<td class="mini-cell ${cls}"><span class="mini-digit">${digit}</span>${mark}</td>`);
        }
      }
    }
  });

  test('every cell belonging to a plane carries a text mark across all six mini-grids, not relying on colour alone', () => {
    // Every plane has exactly 3 own-cells x 6 planes = 18 marked cells total.
    const presentMarks = (html.match(/<td class="mini-cell present"><span class="mini-digit">\d<\/span><span class="mini-mark">present<\/span><\/td>/g) ?? []).length;
    const missingMarks = (html.match(/<td class="mini-cell missing-in-plane"><span class="mini-digit">\d<\/span><span class="mini-mark">missing<\/span><\/td>/g) ?? []).length;
    expect(presentMarks + missingMarks).toBe(18);
  });

  test('reuses each plane\'s existing description verbatim and includes a pattern-specific interpretation referencing PLANE_STRENGTH_TEXT-style wording', () => {
    for (const planeInterpretation of report.planeInterpretations) {
      expect(html).toContain(escapeHtml(planeInterpretation.description));
      expect(html).toContain(escapeHtml(planeInterpretation.interpretation));
    }
  });

  test('present/missing numbers per plane match ExpressionPlanePresence exactly', () => {
    for (const presence of report.expressionPlanes) {
      const presentText = presence.presentNumbers.join(', ') || 'None';
      const missingText = presence.missingNumbers.join(', ') || 'None';
      expect(html).toContain(`Present: ${presentText} &middot; Missing: ${missingText}`);
    }
  });

  // AstroMatrix "Birth Chart PDF Wording Improvement" task: the full-plane
  // branch now rotates through 3 variants (see report.test.ts's
  // `expectedPlaneVariants`); two of the three use the word "guarantee" in
  // an approved negated qualifier ("not a fixed trait or a guarantee of
  // ability" / "not a promise of guaranteed results"), the third doesn't
  // use the word at all. Whichever appears, it must be via one of those two
  // approved negated phrasings - an unqualified claim of guarantee would
  // still be caught here.
  test('tone: no plane interpretation claims a full plane proves superior ability or a missing one proves deficiency', () => {
    for (const planeInterpretation of report.planeInterpretations) {
      expect(planeInterpretation.interpretation.toLowerCase()).not.toMatch(/\b(superior|deficient|proves)\b/);
      if (/guarantee/i.test(planeInterpretation.interpretation)) {
        expect(
          planeInterpretation.interpretation.includes('not a fixed trait or a guarantee of ability') ||
            planeInterpretation.interpretation.includes('not a promise of guaranteed results'),
        ).toBe(true);
      }
    }
  });

  test('tone: softened qualifying language is present for every plane, matched to its present-count branch', () => {
    for (let i = 0; i < report.planeInterpretations.length; i++) {
      const planeInterpretation = report.planeInterpretations[i];
      const presence = report.expressionPlanes[i];
      if (presence.presentCount === 3) {
        expect(html).toContain(escapeHtml('not a fixed trait or a guarantee of ability'));
      } else if (presence.presentCount === 0) {
        expect(html).toContain(escapeHtml('not a sign of anything missing'));
      } else {
        expect(html).toContain(escapeHtml('rather than a fixed description'));
      }
      expect(planeInterpretation.interpretation).toBeTruthy();
    }
  });
});

describe('buildReportHtml - How Your Patterns Connect', () => {
  test('renders a grounded connection and reflection question for a repeated digit that sits in two planes', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    const html = buildReportHtml(report);

    expect(report.patternConnections.length).toBeGreaterThan(0);
    expect(html).toContain('<h2>How Your Patterns Connect</h2>');
    for (const connection of report.patternConnections) {
      expect(html).toContain(escapeHtml(connection.text));
      expect(html).toContain(escapeHtml(connection.reflectionQuestion));
    }
  });

  test('omits the section entirely when there are no repeated digits (no connections to report)', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    const html = buildReportHtml({ ...report, patternConnections: [] });
    expect(html).not.toContain('How Your Patterns Connect');
  });

  // AstroMatrix "Birth Chart PDF Wording Improvement" task: `text` now
  // rotates through 3 variants (by position in `loShu.repeated`, see
  // report.ts's `buildPatternConnections()`) - "traditionally associates" /
  // "traditionally linked to" / "traditionally pointing to" are the three
  // connective phrasings; the "not a fixed description of who you are"
  // qualifier is unchanged in all three.
  test('each connection names the traditional theme of every plane it touches, not just a generic familiarity question', () => {
    const report = buildStructuredReport(maya, ON_DATE);
    const html = buildReportHtml(report);
    for (const connection of report.patternConnections) {
      expect(connection.text).toMatch(/traditionally (associates|linked to|pointing to)/);
      expect(connection.text).toContain('not a fixed description of who you are');
      expect(html).toContain(escapeHtml(connection.text));
    }
  });
});

describe('buildReportHtml - print pagination CSS (Issue 2 corrections)', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report);

  test('headings never break immediately after themselves', () => {
    expect(html).toContain('h2, h3, h4 { break-after: avoid; page-break-after: avoid; }');
  });

  test('the Lo Shu grid and its legend are wrapped in a break-inside:avoid block together', () => {
    expect(html).toContain('.loshu-grid-block { break-inside: avoid; page-break-inside: avoid; }');
    const blockStart = html.indexOf('<div class="loshu-grid-block">');
    const blockEnd = html.indexOf('</div>', blockStart);
    expect(blockStart).toBeGreaterThan(-1);
    expect(html.indexOf('<table class="loshu-grid">')).toBeGreaterThan(blockStart);
    expect(html.indexOf('<table class="loshu-grid">')).toBeLessThan(blockEnd);
    expect(html.indexOf('class="legend"')).toBeGreaterThan(blockStart);
    expect(html.indexOf('class="legend"')).toBeLessThan(blockEnd);
  });

  test('every plane card (heading + mini-grid + description + interpretation) is a single break-inside:avoid block, for all six planes including Manifestation', () => {
    expect(html).toContain('break-inside: avoid; page-break-inside: avoid;');
    // The .plane-card rule itself (now with card-treatment background/border
    // properties too, AstroMatrix "Birth Chart PDF Quality Improvement") -
    // matched loosely by its distinguishing declarations rather than the
    // full exact rule text, so unrelated styling tweaks don't make this
    // pagination-focused test brittle.
    expect(html).toMatch(/\.plane-card\s*\{[^}]*break-inside:\s*avoid;[^}]*page-break-inside:\s*avoid;[^}]*\}/);
    const cardMatches = html.match(/<div class="plane-card">/g);
    expect(cardMatches).toHaveLength(6);
    expect(html).toContain('Manifestation');
  });

  test('each SWOT subsection\'s heading, intro, and first item are wrapped in a break-inside:avoid "lead" block', () => {
    expect(html).toContain('.swot-lead { break-inside: avoid; page-break-inside: avoid; }');
    for (const title of ['Strengths', 'Areas to Explore', 'Opportunities']) {
      const headingIndex = html.indexOf(`<h3>${title}</h3>`);
      expect(headingIndex).toBeGreaterThan(-1);
      const leadStart = html.lastIndexOf('<div class="swot-lead">', headingIndex);
      expect(leadStart).toBeGreaterThan(-1);
      const leadEnd = html.indexOf('</div>', headingIndex);
      // At least one <li> (the first item) is inside the lead block.
      expect(html.indexOf('<li>', headingIndex)).toBeLessThan(leadEnd);
    }
  });

  test('each pattern connection is its own break-inside:avoid block', () => {
    expect(html).toContain('.connection-block { margin-bottom: 12px; break-inside: avoid; page-break-inside: avoid; }');
    if (report.patternConnections.length > 0) {
      expect(html.match(/<div class="connection-block">/g)?.length).toBe(report.patternConnections.length);
    }
  });

  // Issue 3 correction (final PDF corrections task): "Planes of
  // Expression"'s heading now wraps with its first plane card in a
  // break-inside:avoid block (`.planes-lead`), the same pattern already
  // used for "How Your Patterns Connect" and each SWOT subsection - so the
  // section heading can never be separated from all six cards by a page
  // break. The remaining five cards each keep their own independent
  // `.plane-card` (unchanged, already break-inside:avoid) and are free to
  // start a new page - not forced onto one page, and no single card is
  // forced onto its own page either.
  test('"Your Planes of Expression" wraps its heading with the first plane card in a break-inside:avoid "lead" block; the other five cards are independent', () => {
    expect(html).toContain('.planes-lead { page-break-before: always; break-inside: avoid; page-break-inside: avoid; }');

    const headingIndex = html.indexOf('<h2>Your Planes of Expression</h2>');
    expect(headingIndex).toBeGreaterThan(-1);

    const leadStart = html.lastIndexOf('<div class="planes-lead">', headingIndex);
    expect(leadStart).toBeGreaterThan(-1);
    const leadEnd = html.indexOf('</div>', headingIndex);

    const firstCardIndex = html.indexOf('<div class="plane-card">', headingIndex);
    expect(firstCardIndex).toBeGreaterThan(headingIndex);
    expect(firstCardIndex).toBeLessThan(leadEnd);

    // All six plane-card divs still exist; the other five sit after the
    // lead block closes, each independently breakable.
    expect(html.match(/<div class="plane-card">/g)).toHaveLength(6);
    const secondCardIndex = html.indexOf('<div class="plane-card">', leadEnd);
    expect(secondCardIndex).toBeGreaterThan(leadEnd);
  });

  // Issue 2 correction (final PDF corrections task): "How Your Patterns
  // Connect"'s heading is now wrapped together with its FIRST connection in
  // one break-inside:avoid block (the same pattern already used for each
  // SWOT subsection's heading+intro+first item), so the heading can never
  // be separated from all of its content. Any additional connections after
  // the first remain individually break-inside:avoid (unchanged from
  // before) but are free to start on a new page.
  //
  // IMPORTANT LIMITATION, stated explicitly per this task's own
  // instruction: these are HTML-string assertions only. They prove the
  // intended CSS/DOM structure is present and correctly ordered - they
  // cannot prove how expo-print's real PDF rendering engine actually paginates
  // that structure across physical pages. Real pagination requires
  // generating and visually inspecting an actual PDF (see the final
  // checkpoint - this remains a pending manual step).
  // Correction (final pagination polish task): a real generated PDF showed
  // a second connection splitting mid-content across a page boundary even
  // though its own `.connection-block` already had `break-inside: avoid` -
  // so the whole "How Your Patterns Connect" section (heading + EVERY
  // connection, not just the first) is now grouped into one
  // `.connections-lead` break-inside:avoid unit. Safe to do unconditionally:
  // `loShu.repeated` can hold at most 4 distinct digits for any real date of
  // birth (an 8-digit DDMMYYYY sequence can pair into at most 4 repeats),
  // so this section is always small and bounded.
  test('"How Your Patterns Connect" groups its heading and every connection into one break-inside:avoid "lead" block (not just the first)', () => {
    expect(report.patternConnections.length).toBeGreaterThan(1); // Maya has 2 - exercises the "more than one connection" case.
    expect(html).toContain('.connections-lead { break-inside: avoid; page-break-inside: avoid; }');

    // Exactly one wrapper - connections are no longer split between a
    // "lead" group and free-standing blocks.
    expect(html.match(/<div class="connections-lead">/g)).toHaveLength(1);

    const headingIndex = html.indexOf('<h2>How Your Patterns Connect</h2>');
    expect(headingIndex).toBeGreaterThan(-1);
    const leadStart = html.lastIndexOf('<div class="connections-lead">', headingIndex);
    expect(leadStart).toBeGreaterThan(-1);

    // The true close of the wrapper is found by locating the next top-level
    // <h2> (the following section, "Your Personal Pattern Review") rather
    // than a naive indexOf('</div>'), which would only find the nearest
    // connection-block's own closing tag, not the wrapper's.
    const nextSectionIndex = html.indexOf('<h2>', headingIndex + 1);
    expect(nextSectionIndex).toBeGreaterThan(headingIndex);

    // Every connection's .connection-block appears between the heading and
    // the next section - i.e. inside the same wrapper, including the
    // second (and any later) connection, not just the first.
    const connectionBlockIndexes: number[] = [];
    let searchFrom = headingIndex;
    for (let i = 0; i < report.patternConnections.length; i++) {
      const index = html.indexOf('<div class="connection-block">', searchFrom);
      expect(index).toBeGreaterThan(-1);
      expect(index).toBeLessThan(nextSectionIndex);
      connectionBlockIndexes.push(index);
      searchFrom = index + 1;
    }
    expect(connectionBlockIndexes).toHaveLength(report.patternConnections.length);
  });
});

// AstroMatrix "Birth Chart PDF Layout Polish" task - four targeted visual
// refinements based on inspecting an actual rendered 14-page PDF.
describe('buildReportHtml - layout polish', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report, null);

  // Item 1: introduction cards must flow naturally - no fixed height/width,
  // line-clamping, or forced line breaks that would prevent cards of
  // different text lengths from rendering at different heights.
  describe('introduction cards flow naturally', () => {
    test('.intro-card has no fixed height, width, line-clamp, or overflow/white-space restriction', () => {
      const ruleMatch = html.match(/\.intro-card\s*\{[^}]*\}/);
      expect(ruleMatch).not.toBeNull();
      const rule = ruleMatch![0];
      expect(rule).not.toMatch(/(?<!border-radius: *)\bheight\s*:/);
      expect(rule).not.toMatch(/\bmax-height\s*:/);
      expect(rule).not.toMatch(/\bwidth\s*:/);
      expect(rule).not.toMatch(/line-clamp/);
      expect(rule).not.toMatch(/overflow\s*:/);
      expect(rule).not.toMatch(/white-space\s*:/);
    });

    test('the four approved introduction card headings still render, unchanged', () => {
      expect(html).toContain('<h3>The Meaning Behind the Numbers</h3>');
      expect(html).toContain('<h3>How AstroMatrix Builds Your Birth Chart</h3>');
      expect(html).toContain('<h3>The Purpose of Your Personal Birth Chart</h3>');
      expect(html).toContain('<h3>A Helpful Way to Read This Report</h3>');
    });

    test('no <br> tags or other forced line breaks are injected inside the introduction page', () => {
      const introStart = html.indexOf('<div class="intro-page">');
      const introEnd = html.indexOf('<p class="meta">');
      const introSection = html.slice(introStart, introEnd);
      expect(introSection).not.toMatch(/<br\s*\/?>/);
    });
  });

  // Item 2: the actual cause of the reported gaps between Life Path,
  // Destiny, and Soul Urge was .core-number's own whole-card
  // break-inside:avoid - a card this size (heading + two prose paragraphs +
  // three short lists) could be pushed onto a fresh page as one atomic
  // ~400px block, leaving most of the previous page blank. Protection is
  // now scoped to just the two prose paragraphs and each short list.
  describe('Core Number spacing and pagination', () => {
    test('.core-number itself no longer carries a whole-card break-inside:avoid', () => {
      const ruleMatch = html.match(/\.core-number\s*\{[^}]*\}/);
      expect(ruleMatch).not.toBeNull();
      expect(ruleMatch![0]).not.toMatch(/break-inside/);
    });

    test('protection is instead scoped to each prose paragraph and each short list within a card', () => {
      expect(html).toContain(
        '.core-number p.represents, .core-number p.your-interpretation { break-inside: avoid; page-break-inside: avoid; }',
      );
      expect(html).toContain('.core-number ul { break-inside: avoid; page-break-inside: avoid; }');
    });

    test('the card still redraws its own background/border in full if it does split across a page', () => {
      expect(html).toContain('box-decoration-break: clone');
      expect(html).toContain('-webkit-box-decoration-break: clone');
    });

    test('no Core Number card, and no plane card, carries its own forced page break - nothing forces any one of them onto a separate page', () => {
      expect(html).not.toContain('.core-number { page-break-before');
      expect(html).not.toContain('.core-number { break-before');
      expect(html).not.toContain('.plane-card { page-break-before');
      expect(html).not.toContain('.plane-card { break-before');
    });

    test('the five Core Numbers still render in the approved order, and Combined Core Profile still follows all five', () => {
      const titles = ['Life Path', 'Destiny', 'Soul Urge', 'Personality', 'Birthday'];
      const indices = titles.map((title) => html.indexOf(`<h3>${title}: `));
      for (let i = 1; i < indices.length; i++) {
        expect(indices[i]).toBeGreaterThan(indices[i - 1]);
      }
      const lastCardIndex = html.lastIndexOf('<div class="core-number">');
      const combinedIndex = html.indexOf('<h2>Your Combined Core Profile</h2>');
      expect(combinedIndex).toBeGreaterThan(lastCardIndex);
    });
  });

  // Item 3: the name/DOB/system line should read as a subtle
  // report-identification line, not a section heading.
  describe('report metadata styling', () => {
    test('.meta itself keeps a smaller font size and explicit regular weight, as the base/fallback style for the separators', () => {
      const ruleMatch = html.match(/\.meta\s*\{[^}]*\}/);
      expect(ruleMatch).not.toBeNull();
      const rule = ruleMatch![0];
      expect(rule).toMatch(/font-size:\s*11px/);
      expect(rule).toMatch(/font-weight:\s*400/);
      expect(rule).toContain('color: #57534E');
    });

    test('still renders the unchanged name, date of birth, and system information, now split into three distinctly styled spans', () => {
      expect(html).toContain(
        `<p class="meta"><span class="meta-name">${escapeHtml(maya.fullName)}</span> &middot; <span class="meta-dob">Date of Birth: ${escapeHtml(formatDDMonthYYYY(maya.dob))}</span> &middot; <span class="meta-system">Pythagorean numerology</span></p>`,
      );
    });

    // AstroMatrix "Birth Chart PDF Metadata Styling" task.
    test('the name is bold AstroMatrix blue, slightly larger than the rest of the metadata', () => {
      const ruleMatch = html.match(/\.meta-name\s*\{[^}]*\}/);
      expect(ruleMatch).not.toBeNull();
      const rule = ruleMatch![0];
      expect(rule).toMatch(/font-weight:\s*700/);
      expect(rule).toContain('color: #263A70');
      const sizeMatch = rule.match(/font-size:\s*(\d+)px/);
      expect(sizeMatch).not.toBeNull();
      expect(Number(sizeMatch![1])).toBeGreaterThan(11);
    });

    test('the date of birth stays regular-weight, muted charcoal/grey - no bold or colour emphasis', () => {
      const ruleMatch = html.match(/\.meta-dob\s*\{[^}]*\}/);
      expect(ruleMatch).not.toBeNull();
      const rule = ruleMatch![0];
      expect(rule).toMatch(/font-weight:\s*400/);
      expect(rule).toContain('color: #57534E');
      expect(rule).not.toMatch(/font-weight:\s*700/);
    });

    test('the numerology system label is smaller than the date of birth and visually subtle (italic, muted)', () => {
      const dobRule = html.match(/\.meta-dob\s*\{[^}]*\}/)![0];
      const systemRule = html.match(/\.meta-system\s*\{[^}]*\}/)?.[0];
      expect(systemRule).toBeDefined();
      const dobSize = Number(dobRule.match(/font-size:\s*(\d+)px/)![1]);
      const systemSize = Number(systemRule!.match(/font-size:\s*(\d+)px/)![1]);
      expect(systemSize).toBeLessThan(dobSize);
      expect(systemRule).toMatch(/font-style:\s*italic/);
      expect(systemRule).toContain('color: #57534E');
    });

    test('the AstroMatrix blue used for the name is the same deep indigo already used for every major heading - no new colour introduced', () => {
      expect(html).toContain('h2 { font-size: 20px; margin-top: 32px; border-bottom: 2px solid #DCE5F5; padding-bottom: 6px; color: #263A70;');
      expect(html).toContain('.meta-name { font-size: 13px; font-weight: 700; color: #263A70; }');
    });

    test('.meta keeps the same zeroed top margin and spacing, unaffected by the span restructuring', () => {
      expect(html).toContain('.meta { font-size: 11px; font-weight: 400; color: #57534E; margin: 0 0 20px; }');
    });
  });

  // Item 4: pages that start on a forced page break (the introduction page,
  // "Your Lo Shu Grid", "Your Planes of Expression", and "Summary") must
  // have the same top spacing as every other page - their first heading's
  // own margin-top is zeroed so it never stacks on top of the page break.
  describe('consistent top spacing on every forced page break', () => {
    test('each forced-page-start heading has its margin-top zeroed', () => {
      expect(html).toContain('.intro-page > h2:first-child,');
      expect(html).toMatch(/\.loshu-lead > h2:first-child,[\s\S]{0,40}\.planes-lead > h2:first-child,[\s\S]{0,40}\.closing-page > h2:first-child\s*\{\s*margin-top:\s*0;\s*\}/);
    });

    test('the global h2 margin-top rule is otherwise unchanged, for every heading that is not a forced page start', () => {
      expect(html).toContain('h2 { font-size: 20px; margin-top: 32px;');
    });
  });
});

// AstroMatrix "Birth Chart PDF Natural-Flow Introduction Cards" task - the
// four introduction cards previously read as unnaturally uniform because
// all four paragraphs had independently been condensed to a very similar
// character count (not because of any fixed height/width/line-clamp - see
// the "layout polish" describe block above, unaffected by this task).
describe('buildReportHtml - natural-flow introduction cards', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report, null);

  const extractCardText = (heading: string): string => {
    const headingIndex = html.indexOf(`<h3>${heading}</h3>`);
    expect(headingIndex).toBeGreaterThan(-1);
    const cardEnd = html.indexOf('</div>', headingIndex);
    return html.slice(headingIndex, cardEnd).replace(/<[^>]+>/g, '');
  };

  test('the four cards no longer have near-identical text lengths - each was expanded with a different amount of restored content', () => {
    const lengths = [
      'The Meaning Behind the Numbers',
      'How AstroMatrix Builds Your Birth Chart',
      'The Purpose of Your Personal Birth Chart',
      'A Helpful Way to Read This Report',
    ].map((heading) => extractCardText(heading).length);

    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    // Previously all four were within a few characters of each other at
    // ~400-480 chars; the restored content should now create a genuine,
    // not-marginal spread.
    expect(longest - shortest).toBeGreaterThan(80);
  });

  test('"How AstroMatrix Builds Your Birth Chart" restores its closing synthesis sentence from the approved source document', () => {
    expect(html).toContain('Together, these elements form a structured interpretation of your numerology profile');
  });

  test('"The Meaning Behind the Numbers" restores its "several numerical perspectives together" sentence as a full sentence, not a trailing clause', () => {
    expect(html).toContain('this approach brings several numerical perspectives together');
  });

  test('"The Purpose of Your Personal Birth Chart" restores an example-questions sentence, without introducing a bulleted list', () => {
    expect(html).toContain('You might use it to ask which qualities you already draw on');
    const cardText = extractCardText('The Purpose of Your Personal Birth Chart');
    expect(cardText).not.toContain('<ul>');
    expect(cardText).not.toContain('<li>');
  });

  test('"A Helpful Way to Read This Report" still renders the approved disclaimer, now followed by a restored closing encouragement sentence', () => {
    expect(html).toContain(
      escapeHtml(
        'Numerology is a traditional interpretive practice, not a scientifically established method for determining personality, predicting events, or guaranteeing outcomes. Your numbers do not define your abilities or limit your possibilities - your choices, experiences, and actions remain what matters most.',
      ),
    );
    const disclaimerIndex = html.indexOf('scientifically established method');
    const closingIndex = html.indexOf('Use this blueprint as a companion for reflection');
    expect(disclaimerIndex).toBeGreaterThan(-1);
    expect(closingIndex).toBeGreaterThan(disclaimerIndex);
  });

  test('none of the restored content introduces a numerology system other than Pythagorean, a deterministic claim, or a new outcome promise', () => {
    const introStart = html.indexOf('<div class="intro-page">');
    const introEnd = html.indexOf('<p class="meta">');
    const introSection = html.slice(introStart, introEnd).toLowerCase();
    expect(introSection).not.toContain('chaldean');
    expect(introSection).not.toMatch(/scientifically (proven|validated)/);
    expect(introSection).not.toMatch(/guarantee(d)? (to|that)/);
    expect(introSection).not.toMatch(/will (always|definitely|certainly)/);
  });

  test('all four cards still render inside a single .intro-page wrapper, with no forced break of its own between cards', () => {
    expect(html.match(/<div class="intro-page">/g)).toHaveLength(1);
    const introStart = html.indexOf('<div class="intro-page">');
    const introEnd = html.indexOf('<p class="meta">');
    const introSection = html.slice(introStart, introEnd);
    expect(introSection).not.toContain('page-break-before');
    expect(introSection).not.toContain('page-break-after');
  });

  test('every page gets its margin from a single @page rule instead of a body margin that would not repeat on continuation pages', () => {
    expect(html).toContain('@page { margin: 32px; }');
    expect(html).toMatch(/body\s*\{[^}]*margin:\s*0;/);
  });
});

describe('buildReportHtml - distinct output per profile', () => {
  test('two different profiles (same DOB) produce different HTML', () => {
    const mayaHtml = buildReportHtml(buildStructuredReport(maya, ON_DATE));
    const meeraHtml = buildReportHtml(buildStructuredReport(meera, ON_DATE));

    expect(mayaHtml).not.toBe(meeraHtml);
    expect(mayaHtml).toContain('Maya Sharma');
    expect(mayaHtml).not.toContain('Meera Sharma');
    expect(meeraHtml).toContain('Meera Sharma');
    expect(meeraHtml).not.toContain('Maya Sharma');

    // Differing name-derived values land in each profile's own HTML only.
    expect(mayaHtml).toContain('Destiny: <span class="value-highlight">1</span>');
    expect(mayaHtml).toContain('Personality: <span class="value-highlight">33</span>');
    expect(meeraHtml).toContain('Destiny: <span class="value-highlight">3</span>');
    expect(meeraHtml).toContain('Personality: <span class="value-highlight">8</span>');
  });
});

describe('buildReportHtml - HTML escaping', () => {
  const dangerousProfile: Profile = {
    id: 't-dangerous',
    fullName: `Maya <script>&"'Sharma</script>`,
    dob: '1992-05-14',
    system: 'pythagorean',
    createdAt: '2026-01-01T00:00:00Z',
  };
  const html = buildReportHtml(buildStructuredReport(dangerousProfile, ON_DATE));

  test('escapes <, >, &, ", and \' from dynamic text - the raw tag never appears', () => {
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('</script>');
  });

  test('the escaped entities are present instead', () => {
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;/script&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;');
    expect(html).toContain('&#39;');
  });

  test('the document is still well-formed enough to contain exactly one <html> root', () => {
    expect(html.match(/<html>/g)).toHaveLength(1);
    expect(html.match(/<\/html>/g)).toHaveLength(1);
  });
});

// AstroMatrix "Birth Chart PDF Redesign" Stage 3: cover page.
describe('buildReportHtml - cover page', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const FAKE_LOGO_DATA_URI = 'data:image/png;base64,ZmFrZS1sb2dv';

  test('renders the logo <img> when a logoDataUri is supplied', () => {
    const html = buildReportHtml(report, FAKE_LOGO_DATA_URI);
    expect(html).toContain(`<img class="cover-logo" src="${FAKE_LOGO_DATA_URI}" alt="AstroMatrix" />`);
  });

  // AstroMatrix "Birth Chart PDF Improvements" Step 2: `.cover-motif` (a
  // purely decorative CSS circle pair, unrelated to the logo artwork) used
  // to render unconditionally, so a real logo - which already has two
  // concentric circles baked into assets/icon.png's own approved artwork -
  // appeared alongside a second, separate pair of circles. This regression
  // test locks in that `.cover-motif` no longer renders when a real logo is
  // shown, while the logo image itself still renders correctly.
  test('does not render .cover-motif when a logoDataUri is supplied - only the logo\'s own artwork shows, no duplicated circles', () => {
    const html = buildReportHtml(report, FAKE_LOGO_DATA_URI);
    // Checks the actual markup element is absent, not just that the string
    // "cover-motif" never appears anywhere - the CSS rule itself
    // (`.cover-motif { ... }`) is always present in <style> (preserved for
    // the no-logo fallback case, per requirement 3), so a plain substring
    // check would incorrectly fail here.
    expect(html).not.toContain('<div class="cover-motif"');
    expect(html).toContain(`<img class="cover-logo" src="${FAKE_LOGO_DATA_URI}" alt="AstroMatrix" />`);
    expect(html).toContain('cover-logo-frame');
    // The CSS rule itself is still present (preserved for the fallback case).
    expect(html).toContain('.cover-motif {');
  });

  test('renders no <img> tag at all when logoDataUri is null - the cover motif and text still render, so the page is not empty', () => {
    const html = buildReportHtml(report, null);
    expect(html).not.toContain('<img');
    expect(html).toContain('cover-motif');
    expect(html).toContain('AstroMatrix');
    expect(html).toContain('Your Personal Birth Chart');
  });

  test('renders no <img> tag when logoDataUri is omitted entirely (backward compatible with pre-Stage-2 callers)', () => {
    const html = buildReportHtml(report);
    expect(html).not.toContain('<img');
    expect(html).toContain('cover-motif');
  });

  test('includes the wordmark, title, name, and date of birth', () => {
    const html = buildReportHtml(report, null);
    expect(html).toContain('<p class="cover-wordmark">AstroMatrix</p>');
    expect(html).toContain('Your Personal Birth Chart');
    expect(html).toContain('Maya Sharma');
    expect(html).toContain(formatDDMonthYYYY('1992-05-14'));
  });

  test('includes a personalized theme grounded in coreNumberSummary.overarchingThemes', () => {
    const html = buildReportHtml(report, null);
    for (const theme of report.coreNumberSummary.overarchingThemes) {
      expect(html).toContain(escapeHtml(theme));
    }
  });

  test('is wrapped in a page-break-after:always block, placed before the introduction page', () => {
    const html = buildReportHtml(report, null);
    expect(html).toContain('.cover-page { page-break-after: always;');
    const coverIndex = html.indexOf('<div class="cover-page">');
    const introIndex = html.indexOf('<div class="intro-page">');
    expect(coverIndex).toBeGreaterThan(-1);
    expect(introIndex).toBeGreaterThan(coverIndex);
  });
});

// AstroMatrix "Birth Chart PDF Content and Page Flow" task: introduction
// page condensed to fit one A4 page, using the approved source document
// "Astro Matrix - Understanding Your Numerology Blueprint.docx" as its
// content, under the document's own four main-idea headings.
describe('buildReportHtml - introduction page ("Understanding Your Numerology Blueprint")', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report, null);

  test('renders the approved title and all four of the source document\'s main ideas, in order', () => {
    expect(html).toContain('<h2>Understanding Your Numerology Blueprint</h2>');
    const titleIndex = html.indexOf('<h2>Understanding Your Numerology Blueprint</h2>');
    const headings = [
      'The Meaning Behind the Numbers',
      'How AstroMatrix Builds Your Birth Chart',
      'The Purpose of Your Personal Birth Chart',
      'A Helpful Way to Read This Report',
    ];
    let previousIndex = titleIndex;
    for (const heading of headings) {
      const headingIndex = html.indexOf(`<h3>${heading}</h3>`);
      expect(headingIndex).toBeGreaterThan(previousIndex);
      previousIndex = headingIndex;
    }
  });

  // Only one `.intro-card` per main idea - exactly four, matching the four
  // headings above, so nothing was split into extra cards that would cost
  // more vertical space than necessary while condensing to one page.
  test('renders exactly four intro cards', () => {
    expect(html.match(/<div class="intro-card">/g)).toHaveLength(4);
  });

  test('retains the explanation of Pythagorean numerology, the separate Lo Shu Grid, and the Planes of Expression', () => {
    expect(html).toContain('Pythagorean numerology system');
    expect(html).toContain('Lo Shu Grid');
    expect(html).toContain('six Planes of Expression');
  });

  test('retains the report\'s self-reflection purpose', () => {
    expect(html.toLowerCase()).toContain('self-understanding');
  });

  test('never names or implies any numerology system other than Pythagorean', () => {
    expect(html.toLowerCase()).not.toContain('chaldean');
  });

  test('never claims scientific validity or promises an outcome', () => {
    const introStart = html.indexOf('<div class="intro-page">');
    const introEnd = html.indexOf('</div>', html.lastIndexOf('A Helpful Way to Read This Report'));
    const introSection = html.slice(introStart, introEnd);
    expect(introSection.toLowerCase()).not.toMatch(/scientifically (proven|validated)/);
    expect(introSection.toLowerCase()).not.toMatch(/guarantee(d)? (to|that)/);
  });

  // Retains the approved document's own disclaimer sentence (near
  // verbatim), now the one general-purpose disclaimer on this page -
  // replacing the previous, narrower "Personal Pattern Review"-specific
  // SWOT_DISCLAIMER that stood in for it here. SWOT_DISCLAIMER itself is
  // unchanged and still renders, correctly, before "Your Personal Pattern
  // Review" (see that section's own describe block).
  test('includes the approved document\'s disclaimer: not a scientifically established method for determining personality or predicting outcomes', () => {
    expect(html).toContain(
      escapeHtml(
        'Numerology is a traditional interpretive practice, not a scientifically established method for determining personality, predicting events, or guaranteeing outcomes. Your numbers do not define your abilities or limit your possibilities - your choices, experiences, and actions remain what matters most.',
      ),
    );
  });

  test('is wrapped in a page-break-after:always block, starting right after the cover', () => {
    expect(html).toContain('.intro-page { page-break-after: always; }');
    const coverIndex = html.indexOf('<div class="cover-page">');
    const introIndex = html.indexOf('<div class="intro-page">');
    expect(introIndex).toBeGreaterThan(coverIndex);
  });
});

// AstroMatrix "Birth Chart PDF Content and Page Flow" task, Step 3: short
// introductions beneath "Your Five Core Numbers", "Your Lo Shu Grid", and
// "Your Planes of Expression" - each concise, and never repeating the
// detailed interpretation that follows.
describe('buildReportHtml - new section introductions (Step 3)', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report, null);

  test('"Your Five Core Numbers" is immediately followed by its new introduction, before the first Core Number card', () => {
    const headingIndex = html.indexOf('<h2>Your Five Core Numbers</h2>');
    const introIndex = html.indexOf(
      'Your five Core Numbers each offer a different traditional perspective',
      headingIndex,
    );
    const firstCardIndex = html.indexOf('<div class="core-number">', headingIndex);
    expect(headingIndex).toBeGreaterThan(-1);
    expect(introIndex).toBeGreaterThan(headingIndex);
    expect(introIndex).toBeLessThan(firstCardIndex);
  });

  test('"Your Lo Shu Grid" is immediately followed by its new introduction, before the counts/missing/repeated summary', () => {
    const headingIndex = html.indexOf('<h2>Your Lo Shu Grid</h2>');
    const introIndex = html.indexOf('Your Lo Shu Grid is a separate traditional framework', headingIndex);
    const countsIndex = html.indexOf('Counts:', headingIndex);
    expect(headingIndex).toBeGreaterThan(-1);
    expect(introIndex).toBeGreaterThan(headingIndex);
    expect(introIndex).toBeLessThan(countsIndex);
  });

  test('"Your Planes of Expression" is immediately followed by its new introduction, before the first plane card', () => {
    const headingIndex = html.indexOf('<h2>Your Planes of Expression</h2>');
    const introIndex = html.indexOf('The six Planes of Expression group specific positions', headingIndex);
    const firstCardIndex = html.indexOf('<div class="plane-card">', headingIndex);
    expect(headingIndex).toBeGreaterThan(-1);
    expect(introIndex).toBeGreaterThan(headingIndex);
    expect(introIndex).toBeLessThan(firstCardIndex);
  });

  test('none of the three new introductions duplicate the detailed interpretation text that follows them', () => {
    const { coreNumberSections, loShuInterpretation, planeInterpretations } = report;
    expect(coreNumberSections.lifePath.represents).not.toContain(
      'Your five Core Numbers each offer a different traditional perspective',
    );
    expect(loShuInterpretation.yourPattern).not.toContain('Your Lo Shu Grid is a separate traditional framework');
    for (const plane of planeInterpretations) {
      expect(plane.interpretation).not.toContain('The six Planes of Expression group specific positions');
    }
  });
});

// AstroMatrix "Birth Chart PDF Content and Page Flow" task, Step 4: the
// report's section-level page-flow rules.
describe('buildReportHtml - section grouping and page flow (Step 4)', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report, null);

  test('"Your Five Core Numbers" effectively starts on a new page (right after the intro page\'s own page-break-after:always)', () => {
    const introIndex = html.indexOf('<div class="intro-page">');
    const coreNumbersIndex = html.indexOf('<h2>Your Five Core Numbers</h2>');
    expect(coreNumbersIndex).toBeGreaterThan(introIndex);
    // Nothing with its own forced page break sits between them other than
    // .intro-page's own break-after - confirmed structurally: only the
    // "meta" line sits in between, which carries no page-break of its own.
    expect(html.indexOf('.intro-page { page-break-after: always; }')).toBeGreaterThan(-1);
  });

  test('the five Core Numbers render in the approved order: Life Path, Destiny, Soul Urge, Personality, Birthday', () => {
    const titles = ['Life Path', 'Destiny', 'Soul Urge', 'Personality', 'Birthday'];
    const indices = titles.map((title) => html.indexOf(`<h3>${title}: `));
    for (const index of indices) {
      expect(index).toBeGreaterThan(-1);
    }
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  test('no Core Number card carries its own forced page break - nothing forces every number onto a separate page', () => {
    expect(html).not.toContain('.core-number { page-break-before');
    expect(html).not.toContain('.core-number { break-before');
  });

  test('"Your Combined Core Profile" appears after all five Core Number cards', () => {
    const lastCardIndex = html.lastIndexOf('<div class="core-number">');
    const combinedIndex = html.indexOf('<h2>Your Combined Core Profile</h2>');
    expect(lastCardIndex).toBeGreaterThan(-1);
    expect(combinedIndex).toBeGreaterThan(lastCardIndex);
  });

  test('"Your Lo Shu Grid" starts on a new page, after "Your Combined Core Profile"', () => {
    expect(html).toContain('.loshu-lead { page-break-before: always; break-inside: avoid; page-break-inside: avoid; }');
    const combinedIndex = html.indexOf('<h2>Your Combined Core Profile</h2>');
    const loShuLeadIndex = html.indexOf('<div class="loshu-lead">');
    const loShuHeadingIndex = html.indexOf('<h2>Your Lo Shu Grid</h2>', loShuLeadIndex);
    expect(loShuLeadIndex).toBeGreaterThan(combinedIndex);
    expect(loShuHeadingIndex).toBeGreaterThan(loShuLeadIndex);
  });

  test('the Lo Shu introduction, grid, number counts, and interpretation follow in a logical sequence', () => {
    const headingIndex = html.indexOf('<h2>Your Lo Shu Grid</h2>');
    const introIndex = html.indexOf('Your Lo Shu Grid is a separate traditional framework', headingIndex);
    const countsIndex = html.indexOf('Counts:', headingIndex);
    const gridIndex = html.indexOf('<div class="loshu-grid-block">', headingIndex);
    const patternIndex = html.indexOf('<h3>Your Lo Shu Pattern</h3>', headingIndex);
    expect(introIndex).toBeGreaterThan(headingIndex);
    expect(countsIndex).toBeGreaterThan(introIndex);
    expect(gridIndex).toBeGreaterThan(countsIndex);
    expect(patternIndex).toBeGreaterThan(gridIndex);
  });

  test('"Your Planes of Expression" starts on a new page, after the Lo Shu section', () => {
    const loShuHeadingIndex = html.indexOf('<h2>Your Lo Shu Grid</h2>');
    const planesHeadingIndex = html.indexOf('<h2>Your Planes of Expression</h2>');
    expect(planesHeadingIndex).toBeGreaterThan(loShuHeadingIndex);
    expect(html).toContain('.planes-lead { page-break-before: always; break-inside: avoid; page-break-inside: avoid; }');
  });

  test('not every plane is forced onto its own page - only the section-start "lead" block carries a forced break', () => {
    expect(html).not.toContain('.plane-card { page-break-before');
    expect(html).not.toContain('.plane-card { break-before');
  });

  test('major sections remain in their existing approved order after the Planes of Expression', () => {
    const order = [
      '<h2>Your Planes of Expression</h2>',
      '<h2>How Your Patterns Connect</h2>',
      '<h2>Your Personal Pattern Review</h2>',
      '<h2>Applying Your Blueprint to Life</h2>',
      '<h2>Practical Action Plan</h2>',
      '<h2>Summary</h2>',
    ];
    const indices = order.map((marker) => html.indexOf(marker));
    for (const index of indices) {
      expect(index).toBeGreaterThan(-1);
    }
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  test('"Summary" remains the last section, still wrapped in its own page-break-before:always block', () => {
    expect(html).toContain('.closing-page { page-break-before: always; }');
    const closingHeadingIndex = html.indexOf('<h2>Summary</h2>');
    expect(html.indexOf('<h2>', closingHeadingIndex + 1)).toBe(-1);
  });
});

// AstroMatrix "Birth Chart PDF Redesign" Stage 3: renamed section headings.
describe('buildReportHtml - approved section heading renames', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report, null);

  test('renders "Your Five Core Numbers", "Your Combined Core Profile", and "Your Lo Shu Grid"', () => {
    expect(html).toContain('<h2>Your Five Core Numbers</h2>');
    expect(html).toContain('<h2>Your Combined Core Profile</h2>');
    expect(html).toContain('<h2>Your Lo Shu Grid</h2>');
  });

  test('no longer renders the old "Core Numbers", "Your Personal Core Summary", or "Lo Shu Grid" headings', () => {
    expect(html).not.toContain('<h2>Core Numbers</h2>');
    expect(html).not.toContain('<h2>Your Personal Core Summary</h2>');
    expect(html).not.toContain('<h2>Lo Shu Grid</h2>');
  });
});

// AstroMatrix "Birth Chart PDF Redesign" Stage 3: relocated (not
// duplicated) content.
describe('buildReportHtml - "Applying Your Blueprint to Life" (relocated howToUse, not duplicated)', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report, null);

  test('renders the approved section heading and every Core Number\'s howToUse text, once each, under this section', () => {
    expect(html).toContain('<h2>Applying Your Blueprint to Life</h2>');
    for (const key of ['lifePath', 'destiny', 'soulUrge', 'personality', 'birthday'] as const) {
      const howToUse = report.coreNumberSections[key].howToUse;
      expect(html).toContain(escapeHtml(howToUse));
      // Exactly one occurrence anywhere in the document - proves it was
      // relocated, not duplicated (still present inline AND here).
      const escaped = escapeHtml(howToUse).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(html.match(new RegExp(escaped, 'g'))).toHaveLength(1);
    }
  });

  test('no core-number card still contains a howToUse paragraph', () => {
    // Every core-number card block, isolated, must not contain any of the
    // five howToUse strings.
    const cardBlocks = html.match(/<div class="core-number">[\s\S]*?<\/div>/g) ?? [];
    expect(cardBlocks.length).toBe(5);
    for (const card of cardBlocks) {
      for (const key of ['lifePath', 'destiny', 'soulUrge', 'personality', 'birthday'] as const) {
        expect(card).not.toContain(escapeHtml(report.coreNumberSections[key].howToUse));
      }
    }
  });

  test('is wrapped in a break-inside:avoid lead block, and each relocated item is its own break-inside:avoid block', () => {
    expect(html).toContain('.apply-lead { break-inside: avoid; page-break-inside: avoid; }');
    expect(html).toContain('.apply-item {');
    expect(html.match(/<div class="apply-item">/g)).toHaveLength(5);
  });

  // AstroMatrix "Final Birth Chart PDF Layout Fix" task: the heading and
  // intro alone (without any item) were previously wrapped in
  // break-inside:avoid, so they could still be stranded at the bottom of a
  // page with the first Core Number card pushed to the next page. Fixed by
  // bringing that first card inside the same break-inside:avoid block, the
  // same pattern already used for "Your Planes of Expression"
  // (`.planes-lead`) and each SWOT subsection (`.swot-lead`).
  test('the heading, intro, and first Core Number card (Life Path) are all inside the same break-inside:avoid "lead" block', () => {
    const headingIndex = html.indexOf('<h2>Applying Your Blueprint to Life</h2>');
    expect(headingIndex).toBeGreaterThan(-1);

    const leadStart = html.lastIndexOf('<div class="apply-lead">', headingIndex);
    expect(leadStart).toBeGreaterThan(-1);
    const leadEnd = html.indexOf('</div>', headingIndex);

    const introIndex = html.indexOf('class="general-note"', headingIndex);
    expect(introIndex).toBeGreaterThan(headingIndex);
    expect(introIndex).toBeLessThan(leadEnd);

    const firstItemIndex = html.indexOf('<div class="apply-item">', headingIndex);
    expect(firstItemIndex).toBeGreaterThan(introIndex);
    expect(firstItemIndex).toBeLessThan(leadEnd);
    expect(html.indexOf('<h3>Life Path</h3>', firstItemIndex)).toBeGreaterThan(firstItemIndex);
    expect(html.indexOf('<h3>Life Path</h3>', firstItemIndex)).toBeLessThan(leadEnd);
  });

  test('the remaining four Core Number cards sit after the lead block closes, each independently breakable and free to flow across pages', () => {
    const leadStart = html.indexOf('<div class="apply-lead">');
    const leadEnd = html.indexOf('</div>', html.indexOf('<h2>Applying Your Blueprint to Life</h2>'));

    const remainingTitles = ['Destiny', 'Soul Urge', 'Personality', 'Birthday'];
    let searchFrom = leadEnd;
    for (const title of remainingTitles) {
      const itemIndex = html.indexOf('<div class="apply-item">', searchFrom);
      expect(itemIndex).toBeGreaterThan(leadEnd);
      expect(html.indexOf(`<h3>${title}</h3>`, itemIndex)).toBeGreaterThan(itemIndex);
      searchFrom = itemIndex + 1;
    }
    // All five items still exist in total (one inside the lead block, four
    // after it) - none dropped, none duplicated.
    expect(html.match(/<div class="apply-item">/g)).toHaveLength(5);
    // No forced page-break-before was introduced anywhere in this section.
    const sectionStart = leadStart;
    const sectionEnd = html.indexOf('<div class="action-plan-page">');
    expect(html.slice(sectionStart, sectionEnd)).not.toContain('page-break-before');
  });
});

describe('buildReportHtml - "Practical Action Plan" (relocated Opportunities, not duplicated)', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report, null);

  test('renders the approved section heading, with Opportunities/"Ways to Develop" content once, under this section', () => {
    expect(html).toContain('<h2>Practical Action Plan</h2>');
    expect(html).toContain('<h3>Opportunities</h3>');
    for (const item of report.swotReflection.opportunities) {
      expect(html).toContain(escapeHtml(item.text));
      expect(html.match(new RegExp(escapeHtml(item.text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))).toHaveLength(1);
    }
  });

  test('"Your Personal Pattern Review" no longer contains an Opportunities subsection', () => {
    const reviewStart = html.indexOf('<h2>Your Personal Pattern Review</h2>');
    const reviewEnd = html.indexOf('<h2>Applying Your Blueprint to Life</h2>');
    const reviewSection = html.slice(reviewStart, reviewEnd);
    expect(reviewSection).not.toContain('<h3>Opportunities</h3>');
    expect(reviewSection).not.toContain('Ways to Develop');
    expect(reviewSection).toContain('<h3>Strengths</h3>');
    expect(reviewSection).toContain('<h3>Areas to Explore</h3>');
    expect(reviewSection).toContain('<h3>Patterns to Notice</h3>');
  });

  test('"Practical Action Plan" appears after "Applying Your Blueprint to Life", before the final Summary', () => {
    const applyIndex = html.indexOf('<h2>Applying Your Blueprint to Life</h2>');
    const actionIndex = html.indexOf('<h2>Practical Action Plan</h2>');
    const summaryIndex = html.indexOf('<h2>Summary</h2>');
    expect(applyIndex).toBeGreaterThan(-1);
    expect(actionIndex).toBeGreaterThan(applyIndex);
    expect(summaryIndex).toBeGreaterThan(actionIndex);
  });

  test('is visually distinct from the final Summary (its own card background)', () => {
    expect(html).toContain('<div class="action-plan-page">');
    expect(html).toContain('.action-plan-page {');
  });

  test('omits the section entirely when opportunities is empty (no missing Lo Shu digits)', () => {
    const noOpportunities = buildReportHtml(
      { ...report, swotReflection: { ...report.swotReflection, opportunities: [] } },
      null,
    );
    expect(noOpportunities).not.toContain('<h2>Practical Action Plan</h2>');
  });
});

// The final closing page, using `closingSummary` data exactly as produced
// by report.ts - nothing here recalculates or rephrases any of it.
//
// AstroMatrix "Birth Chart PDF Closing Summary" task: added the "Taking
// this blueprint forward" subheading and a static encouraging paragraph,
// and merged `reflectionPrompts`/`finalQuestion` into a single
// `reflectionQuestions` list (both changes live in report.ts's
// `buildClosingSummary()` - this describe block only verifies the renderer
// picks up the new values correctly, not the generation logic itself,
// which report.test.ts already covers).
// The exact text of the static closing encouragement paragraph
// (`CLOSING_ENCOURAGEMENT_TEXT` in reportHtml.ts, not exported - duplicated
// here the same way "Patterns to Notice"'s own static text is duplicated
// above, since it is not derived from this profile's own data).
const CLOSING_ENCOURAGEMENT_TEXT =
  "This chart is best treated as a starting point for reflection, not a fixed definition of who you are. Keep whatever feels true to you, and feel free to set aside anything that doesn't - you know your own life better than any chart can. Your choices, experiences, relationships, and effort matter far more than any number. If something here resonates, a small, realistic step taken this week is often enough to turn a reflection into real progress.";

describe('buildReportHtml - "Summary" (final section)', () => {
  const report = buildStructuredReport(maya, ON_DATE);
  const html = buildReportHtml(report, null);
  const closingSection = html.slice(html.indexOf('<div class="closing-page">'));

  test('renders the approved title "Summary"', () => {
    expect(html).toContain('<h2>Summary</h2>');
    expect(html).not.toContain('Bringing It Together');
  });

  test('renders the "Taking this blueprint forward" subheading right after the title', () => {
    expect(closingSection).toContain('<h2>Summary</h2>\n      <h3>Taking this blueprint forward</h3>');
  });

  test('renders the encouraging closing paragraph', () => {
    expect(closingSection).toContain(escapeHtml(CLOSING_ENCOURAGEMENT_TEXT));
  });

  test('the encouraging paragraph reminds the reader the chart is a starting point, that they can keep or question what resonates, that their own choices/effort matter, and that small steps help', () => {
    expect(CLOSING_ENCOURAGEMENT_TEXT).toContain('starting point for reflection');
    expect(CLOSING_ENCOURAGEMENT_TEXT).toContain('not a fixed definition');
    expect(CLOSING_ENCOURAGEMENT_TEXT).toMatch(/keep whatever feels true/i);
    expect(CLOSING_ENCOURAGEMENT_TEXT).toMatch(/set aside anything/i);
    expect(CLOSING_ENCOURAGEMENT_TEXT).toMatch(/choices, experiences, relationships, and effort matter/i);
    expect(CLOSING_ENCOURAGEMENT_TEXT).toMatch(/small, realistic step/i);
  });

  test('the encouraging paragraph makes no deterministic or guaranteed-outcome claim', () => {
    for (const bad of [/\bwill\s+(happen|become|succeed|guarantee)/i, /guarantee[sd]?/i, /always will/i, /definitely/i]) {
      expect(CLOSING_ENCOURAGEMENT_TEXT).not.toMatch(bad);
    }
  });

  test('its first reflectionQuestion never equals "How Your Patterns Connect"\'s own reflection question', () => {
    expect(report.patternConnections.length).toBeGreaterThan(0);
    for (const connection of report.patternConnections) {
      expect(report.closingSummary.reflectionQuestions[0]).not.toBe(connection.reflectionQuestion);
    }
    // The connection's own question still appears once, in its own section
    // - just never repeated in the Summary.
    expect(html).toContain(escapeHtml(report.patternConnections[0].reflectionQuestion));
  });

  test('its reflectionQuestions do not reuse the Practical Action Plan\'s opportunities text', () => {
    for (const question of report.closingSummary.reflectionQuestions) {
      for (const item of report.swotReflection.opportunities) {
        expect(question).not.toBe(item.text);
      }
    }
  });

  test('renders closingSummary.keyThemes and closingSummary.patternConnection exactly as produced by report.ts, unmodified', () => {
    expect(html).toContain(escapeHtml(report.closingSummary.keyThemes));
    expect(html).toContain(escapeHtml(report.closingSummary.patternConnection));
  });

  test('renders 2-3 reflectionQuestions under a "Questions to Sit With" heading, exactly as produced by report.ts', () => {
    expect(report.closingSummary.reflectionQuestions.length).toBeGreaterThanOrEqual(2);
    expect(report.closingSummary.reflectionQuestions.length).toBeLessThanOrEqual(3);
    expect(closingSection).toContain('<h4>Questions to Sit With</h4>');
    for (const question of report.closingSummary.reflectionQuestions) {
      expect(html).toContain(escapeHtml(question));
    }
  });

  test('omits the "Questions to Sit With" block when reflectionQuestions is empty, without affecting the rest of the page', () => {
    const noQuestions = buildReportHtml({ ...report, closingSummary: { ...report.closingSummary, reflectionQuestions: [] } }, null);
    const noQuestionsClosingSection = noQuestions.slice(noQuestions.indexOf('<div class="closing-page">'));
    expect(noQuestionsClosingSection).not.toContain('Questions to Sit With');
    expect(noQuestionsClosingSection).toContain(escapeHtml(report.closingSummary.keyThemes));
    expect(noQuestionsClosingSection).toContain(escapeHtml(report.closingSummary.patternConnection));
    expect(noQuestionsClosingSection).toContain(escapeHtml(CLOSING_ENCOURAGEMENT_TEXT));
  });

  test('is the last section in the document, wrapped in a page-break-before:always block', () => {
    expect(html).toContain('.closing-page { page-break-before: always; }');
    const closingHeadingIndex = html.indexOf('<h2>Summary</h2>');
    expect(closingHeadingIndex).toBeGreaterThan(-1);
    // Nothing else opens a new top-level <h2> section after the closing
    // page's own heading.
    expect(html.indexOf('<h2>', closingHeadingIndex + 1)).toBe(-1);
  });

  test('does not repeat an earlier section\'s full paragraph verbatim as its own content (synthesis, not repetition)', () => {
    expect(report.closingSummary.patternConnection).not.toBe(report.loShuSummary);
    for (const plane of report.planeInterpretations) {
      expect(report.closingSummary.patternConnection).not.toBe(plane.interpretation);
    }
    expect(report.closingSummary.keyThemes).not.toBe(report.coreNumberSummary.paragraph);
  });

  test('the closing page never hardcodes this sample profile\'s own name', () => {
    expect(closingSection).not.toContain('Maya');
    expect(closingSection).not.toContain('Sharma');
  });
});

// AstroMatrix "Birth Chart PDF Redesign" Stage 3: the system label is
// always literally "Pythagorean numerology", never looked up from
// profile.system - closes the latent risk flagged in the Stage 1 audit (a
// legacy `system: 'chaldean'` profile could otherwise have caused this PDF
// to print "Chaldean").
describe('buildReportHtml - system label is always Pythagorean, regardless of profile.system', () => {
  test('a profile whose own system field is not "pythagorean" still never renders "Chaldean" anywhere in the PDF', () => {
    // Stage 1's buildBirthChartReport() already forces report.profile.system
    // to 'pythagorean' unconditionally, so this constructs the (otherwise
    // unreachable through the public builders) case directly, to prove the
    // renderer itself has no residual dependency on the field's value.
    const report = buildStructuredReport(maya, ON_DATE);
    const htmlWithTamperedSystem = buildReportHtml(
      { ...report, profile: { ...report.profile, system: 'chaldean' } },
      null,
    );
    expect(htmlWithTamperedSystem.toLowerCase()).not.toContain('chaldean');
    expect(htmlWithTamperedSystem).toContain('Pythagorean numerology');
  });
});
