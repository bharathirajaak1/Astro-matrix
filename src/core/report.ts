/**
 * Assembles the central report shapes (see `src/core/types.ts`) for a
 * profile. Reuses every existing canonical calculation/content function
 * exactly as-is - no numerology math, Lo Shu logic, Expression Plane
 * derivation, or interpretation text is duplicated or reinvented here.
 *
 * `buildBirthChartReport(profile)` builds the stable `BirthChartReport` -
 * everything that depends only on the profile, never on "today's date".
 * `buildStructuredReport(profile, onDate)` builds that same stable data
 * (by calling `buildBirthChartReport` directly, never re-deriving any of
 * it) plus that date's forecast. Both are pure and deterministic: the same
 * inputs always produce the same output, and `onDate` is never read from
 * the current date internally - the caller fully controls which day's
 * forecast is included.
 */
import { buildForecast } from './forecast';
import { buildLoShuGrid } from './loShu';
import { buildNumerologyReport, DIGITS } from './numerology';
import { getAllExpressionPlanePresence, type ExpressionPlanePresence } from './expressionPlanes';
import { generateLoShuSummary, generateNumbersSummary, MISSING_GROWTH_AREAS, PLANE_STRENGTH_TEXT } from './summaryGenerator';
import type {
  BirthChartReport,
  ClosingSummary,
  Digit,
  LoShuGrid,
  LoShuInterpretation,
  PatternConnection,
  PlaneInterpretation,
  Profile,
  StructuredReport,
  SwotReflection,
  SwotReflectionItem,
} from './types';
import { getCoreNumberInterpretation, getCoreNumberSummary, type CoreNumberKey, type CoreNumberSection, type CoreNumberSummary } from '@/data/coreNumberContent';
import { CORE_NUMBERS } from '@/data/interpretations';
import { NUMBER_ESSENCE } from '@/data/numberEssence';
import { PLANE_PRESENTATION } from '@/data/expressionPlaneContent';

/**
 * Joins 1+ short phrases into one readable sentence fragment: "a", "a and
 * b", or "a, b, and c". Pure formatting, no interpretive content of its
 * own - every phrase it joins comes from `NUMBER_ESSENCE` unchanged.
 */
/**
 * Picks one of several equivalent sentence templates by position in a list
 * (never randomly - the same report always renders the same text for the
 * same profile), so a list of several similarly-shaped items (e.g. one
 * sentence per Lo Shu digit) doesn't read as a single template with only
 * the final word changing. AstroMatrix "Birth Chart PDF Quality
 * Improvement" task.
 */
function varyByIndex<T>(index: number, templates: readonly T[]): T {
  return templates[index % templates.length];
}

function joinReadable(phrases: readonly string[]): string {
  if (phrases.length === 0) return '';
  if (phrases.length === 1) return phrases[0];
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(', ')}, and ${phrases[phrases.length - 1]}`;
}

/**
 * Builds the approved Personal SWOT Reflection from `loShu` alone - no new
 * numerology calculation and no new interpretive content. Every sentence's
 * substance still comes verbatim from `NUMBER_ESSENCE[d].strengths[0]`,
 * `NUMBER_ESSENCE[d].keyword`, or `NUMBER_ESSENCE[d].themes`; only the
 * surrounding connective/structural wording is new, and asserts nothing
 * about any number on its own. "Patterns to Notice" is deliberately not
 * built here - still deferred.
 *
 * Reworked (AstroMatrix "Final Birth Chart PDF Corrections and SWOT
 * Improvement" task) so the Birth Chart's SWOT reads as an integrated
 * reflection on this profile's actual pattern, not a flat per-digit list
 * resembling the original onboarding SWOT screen:
 *  - `strengths` items now distinguish a repeated digit (`loShu.counts[d]
 *    >= 2`) from a present-once one, and explicitly separate the
 *    observation ("Number X appears...") from the interpretation
 *    ("Numerology traditionally associates it with...").
 *  - `strengthsSynthesis` is new: one sentence combining every active
 *    digit's `keyword` together, so multiple represented numbers are
 *    considered as a combined pattern rather than only as isolated traits.
 *  - `opportunities` items are reworded from "an opportunity to develop X"
 *    to "a way to work with X", distinguishing them from `areasToExplore`
 *    (themes to reflect on) as practical, forward-looking framing - the
 *    underlying source field (`strengths[0]`) is unchanged.
 *
 * `strengths` covers every digit present in the Lo Shu grid
 * (`loShu.counts[d] > 0`); `areasToExplore` and `opportunities` both cover
 * the same `loShu.missing` digit set, via two different `NUMBER_ESSENCE`
 * fields, so the two sections read as genuinely distinct rather than
 * duplicates of each other. All three item lists are in ascending digit
 * order (the same order `DIGITS`/`loShu.missing` already use); any list may
 * be empty.
 */
function buildSwotReflection(loShu: LoShuGrid): SwotReflection {
  const activeDigits = DIGITS.filter((d) => loShu.counts[d] > 0);

  // AstroMatrix "Birth Chart PDF Wording Improvement" task: each branch
  // previously had exactly one fixed sentence shape, so every active digit
  // read as the same template with only the digit/phrase changing. Rotated
  // (by position in `activeDigits`, never random) through natural variants
  // that keep the same qualifying idea - "not a trait you definitely
  // possess" / an equivalent softening - in every repeated-digit variant.
  const strengths: SwotReflectionItem[] = activeDigits.map((digit: Digit, index) => {
    const count = loShu.counts[digit];
    const strengthPhrase = NUMBER_ESSENCE[digit].strengths[0];
    const text =
      count >= 2
        ? varyByIndex(index, [
            `Number ${digit} appears ${count} times in your birth date. Numerology traditionally associates it with ${strengthPhrase} - a theme that recurs in your pattern, not a trait you definitely possess.`,
            `Your birth date shows Number ${digit} ${count} times, traditionally linked to ${strengthPhrase} - a recurring thread, not a guaranteed trait.`,
            `Number ${digit} stands out by appearing ${count} times, traditionally pointing to ${strengthPhrase} - worth noticing as a pattern, not assumed as a fact about you.`,
          ])
        : varyByIndex(index, [
            `Number ${digit} appears in your birth date. Numerology traditionally associates it with ${strengthPhrase}.`,
            `Your birth date includes Number ${digit}, traditionally linked to ${strengthPhrase}.`,
            `Number ${digit} is part of your birth date, traditionally associated with ${strengthPhrase}.`,
          ]);
    return { digit, text };
  });

  // Combines every active digit's keyword into one sentence, so the
  // section reads as a considered-together pattern rather than only a list
  // of isolated per-digit entries. Every keyword is reused verbatim from
  // NUMBER_ESSENCE; only the surrounding sentence is new.
  const strengthsSynthesis = activeDigits.length
    ? `Together, your active numbers (${activeDigits.join(', ')}) traditionally point to ` +
      `${joinReadable(activeDigits.map((d) => NUMBER_ESSENCE[d].keyword.toLowerCase()))} - ` +
      `themes that may be worth considering as a combined pattern, alongside each number on its own, ` +
      `rather than as separate, unrelated traits.`
    : '';

  // AstroMatrix "Birth Chart PDF Wording Improvement" task: previously a
  // single fixed shape ("Number X — themes.") for every missing digit.
  const areasToExplore: SwotReflectionItem[] = loShu.missing.map((digit: Digit, index) => {
    const themes = joinReadable(NUMBER_ESSENCE[digit].themes);
    const text = varyByIndex(index, [
      `Number ${digit} — ${themes}.`,
      `Number ${digit} traditionally points to ${themes}.`,
      `For Number ${digit}, numerology traditionally highlights ${themes}.`,
    ]);
    return { digit, text };
  });

  // AstroMatrix "Birth Chart PDF Wording Improvement" task: previously
  // every item forced the strength phrase into "a way to work with this
  // theme is consciously exploring X" - grammatical but awkward for some
  // phrases (e.g. "consciously exploring natural ease putting ideas into
  // words"). The three variants below instead place the strength phrase as
  // a plain noun (subject or object of "offers"/"is"), which reads
  // naturally for every NUMBER_ESSENCE strength phrase regardless of its
  // internal grammar, not just the ones that happened to fit the old verb
  // frame.
  const opportunities: SwotReflectionItem[] = loShu.missing.map((digit: Digit, index) => {
    const strength = NUMBER_ESSENCE[digit].strengths[0];
    const text = varyByIndex(index, [
      `Number ${digit} — one way to work with this is to lean into ${strength}.`,
      `For Number ${digit}, ${strength} is a traditional strength worth nurturing with intention.`,
      `Number ${digit} traditionally offers ${strength} - worth returning to and developing over time.`,
    ]);
    return { digit, text };
  });

  return { strengths, strengthsSynthesis, areasToExplore, opportunities };
}

/**
 * Builds Birth Chart-only Lo Shu interpretation content, beyond the raw
 * grid - distinguishes the comprehensive Birth Chart from the concise
 * Blueprint screen. No new numerology calculation: `yourPattern` is purely
 * derived from `loShu.counts`/`loShu.repeated`; `numbersPresent` reuses
 * `NUMBER_ESSENCE[d].keyword` (already approved content); `consciousAttention`
 * reuses `MISSING_GROWTH_AREAS` (already approved, and deliberately a
 * different source than `swotReflection`'s `NUMBER_ESSENCE.themes`/
 * `.strengths`, so this section doesn't just repeat the SWOT section's
 * wording); `traditionalPatterns` restates the already-computed
 * `loShu.planes.goldenYogas`/`silverYogas`; `puttingItTogether` is the
 * already-approved `loShuSummary` (passed in, not recomputed), repositioned
 * as this section's closing synthesis.
 */
function buildLoShuInterpretation(loShu: LoShuGrid, loShuSummary: string): LoShuInterpretation {
  const activeDigits = DIGITS.filter((d) => loShu.counts[d] > 0);

  // Names the actual repeated digit(s) rather than stating a bare count -
  // "with 2 appearing more than once" was ambiguous (misreadable as "the
  // digit 2 appears more than once", which may not even be true for this
  // profile). Naming the digits directly removes that ambiguity and can
  // never be wrong about which number(s) repeat. Three distinct phrasings
  // (none/one/many) rather than one generic template, so a profile with no
  // repeats never implies one does.
  const repeatedPhrase =
    loShu.repeated.length === 0
      ? 'with no number appearing more than once'
      : loShu.repeated.length === 1
        ? `with Number ${loShu.repeated[0]} appearing more than once`
        : `with Numbers ${joinReadable(loShu.repeated.map(String))} appearing more than once`;

  const yourPattern = `Your birth date activates ${activeDigits.length} of the 9 Lo Shu numbers, ${repeatedPhrase}.`;

  // AstroMatrix "Birth Chart PDF Quality Improvement" / "Wording
  // Improvement" tasks: previously every present-once digit read the
  // identical shape ("Number X appears once in your grid. Numerology
  // traditionally associates it with Y.") - the exact pattern flagged as
  // repetitive. Rotates through four equivalent sentence shapes by the
  // digit's position in `activeDigits` (never random - the same report
  // always renders the same text), so a list of up to nine digits doesn't
  // read as one template with only the keyword changing. The repeated-digit
  // branch keeps its own distinct "recurs in your pattern" wording, also
  // rotated the same way. (Widened from three to four variants in the
  // Wording Improvement follow-up, since a profile with many active digits
  // could still land on the same variant twice with only three.)
  const numbersPresent: SwotReflectionItem[] = activeDigits.map((digit: Digit, index) => {
    const count = loShu.counts[digit];
    const keyword = NUMBER_ESSENCE[digit].keyword.toLowerCase();
    const text =
      count >= 2
        ? varyByIndex(index, [
            `Number ${digit} appears ${count} times in your grid. Numerology traditionally associates it with ${keyword} — a theme that recurs in your pattern.`,
            `Your grid shows Number ${digit} ${count} times, traditionally linked to ${keyword} - a thread that repeats through your pattern.`,
            `Number ${digit} stands out by appearing ${count} times, traditionally associated with ${keyword}, a recurring presence in your chart.`,
            `With ${count} appearances, Number ${digit} traditionally points to ${keyword} - a pattern that shows up more than once in your chart.`,
          ])
        : varyByIndex(index, [
            `Number ${digit} appears once in your grid. Numerology traditionally associates it with ${keyword}.`,
            `Your grid includes Number ${digit}, traditionally associated with ${keyword}.`,
            `Number ${digit} shows up once in your birth date - numerology traditionally reads this as ${keyword}.`,
            `Number ${digit} is present in your grid, traditionally linked to ${keyword}.`,
          ]);
    return { digit, text };
  });

  // AstroMatrix "Birth Chart PDF Wording Improvement" task: previously a
  // single fixed shape for every missing digit.
  const consciousAttention: SwotReflectionItem[] = loShu.missing.map((digit: Digit, index) => {
    const area = MISSING_GROWTH_AREAS[digit];
    const text = varyByIndex(index, [
      `Number ${digit} does not appear in your grid. Numerology traditionally associates it with ${area}.`,
      `Number ${digit} is absent from your grid, traditionally linked to ${area}.`,
      `Your grid does not include Number ${digit}, traditionally associated with ${area}.`,
    ]);
    return { digit, text };
  });

  const traditionalPatterns: string[] = [
    ...loShu.planes.goldenYogas.map(
      (name) => `${name} — all three numbers in this line are present in your birth date.`,
    ),
    ...loShu.planes.silverYogas.map(
      (name) => `${name} — none of the three numbers in this line are present in your birth date.`,
    ),
  ];

  return {
    yourPattern,
    numbersPresent,
    consciousAttention,
    traditionalPatterns,
    puttingItTogether: loShuSummary,
  };
}

/**
 * Builds Birth Chart-only interpretation for each of the six Expression
 * Planes, in the same canonical order as `expressionPlanes`. `description`
 * is the existing, already-approved text from
 * `src/data/expressionPlaneContent.ts`'s `PLANE_PRESENTATION`, reused
 * verbatim. `interpretation` combines the existing, already-approved
 * `PLANE_STRENGTH_TEXT` phrase (src/core/summaryGenerator.ts) with this
 * profile's actual present/missing count for that plane - no new
 * interpretive substance, only a connective sentence around already
 * approved content plus already-computed presence data.
 *
 * `PLANE_STRENGTH_TEXT` itself is deliberately left unedited (here and
 * everywhere - see summaryGenerator.ts) because it also feeds
 * `generateLoShuSummary()`, which the Blueprint screen displays verbatim;
 * changing that shared constant would change Blueprint's visible output,
 * out of scope for this module. What IS fully within this function's own
 * control is the sentence built around that phrase - each branch below
 * adds an explicit qualifying clause so a full plane never reads as proof
 * of superior ability and a missing one never reads as a deficiency.
 *
 * AstroMatrix "Birth Chart PDF Wording Improvement" task: each of the three
 * branches previously had exactly one fixed sentence shape, so every plane
 * landing in the same branch (commonly 2-4 of the six do, for a typical
 * profile) read as an identical template with only the number list/theme
 * phrase swapped in. Each branch now rotates (by the plane's position in
 * `expressionPlanes` - the same fixed canonical order used throughout this
 * report, never random) through natural variants. Every variant in a
 * branch preserves the exact same qualifying idea the original single
 * sentence carried (full plane: "not a fixed trait, not a guarantee of
 * ability"; empty plane: "not a sign of anything missing"; partial plane:
 * "not a fixed description") - only the surrounding phrasing varies, never
 * the safety substance. `PLANE_STRENGTH_TEXT` (the plane-specific theme)
 * and the plane's own canonical number list already differ per plane, so
 * each plane's output remains meaningfully specific to it even where two
 * planes share the same rotated connective shape.
 */
function buildPlaneInterpretations(expressionPlanes: ExpressionPlanePresence[]): PlaneInterpretation[] {
  return expressionPlanes.map((presence, index) => {
    const { plane, presentCount, presentNumbers, missingNumbers } = presence;
    const description = PLANE_PRESENTATION[plane.id].description;
    const strengthText = PLANE_STRENGTH_TEXT[plane.id];
    const numberList = plane.numbers.join(', ');

    let interpretation: string;
    if (presentCount === 3) {
      interpretation = varyByIndex(index, [
        `All three numbers for this pattern (${numberList}) are present in your birth date. ` +
          `Numerology traditionally associates this pattern with themes such as ${strengthText} - ` +
          `a traditional lens for reflection, not a fixed trait or a guarantee of ability.`,
        `Your birth date includes all three numbers for this pattern (${numberList}) - traditionally ` +
          `pointing to ${strengthText}. Worth holding as a reflection, not a promise of guaranteed results.`,
        `This pattern's three numbers (${numberList}) are all present in your birth date, traditionally ` +
          `linked to ${strengthText} - one lens to consider, not a fixed trait or a promise of ability.`,
      ]);
    } else if (presentCount === 0) {
      interpretation = varyByIndex(index, [
        `None of the three numbers for this pattern (${numberList}) are present in your birth date. ` +
          `Numerology traditionally associates this pattern with themes such as ${strengthText}, ` +
          `which may offer a prompt to reflect on rather than a sign of anything missing.`,
        `None of this pattern's three numbers (${numberList}) appear in your birth date. Traditionally, ` +
          `this pattern relates to ${strengthText} - worth exploring as a prompt, not a sign that anything is missing.`,
        `This pattern's three numbers (${numberList}) are all absent from your birth date. The pattern ` +
          `itself traditionally points to ${strengthText}, offered as an open area to consider rather than something lacking.`,
      ]);
    } else {
      // Subject-verb agreement: "1 ... is present" vs "2 ... are present" -
      // only this branch needs it (presentCount is 1 or 2 here; the 0 and 3
      // branches above already read correctly as "None ... are present" /
      // "All three ... are present").
      const verb = presentCount === 1 ? 'is' : 'are';
      interpretation = varyByIndex(index, [
        `${presentCount} of the three numbers for this pattern (${numberList}) ${verb} present in your birth date ` +
          `- ${presentNumbers.join(', ')} present, ${missingNumbers.join(', ')} not. ` +
          `Numerology traditionally associates this pattern with themes such as ${strengthText}, ` +
          `offered here as a traditional perspective rather than a fixed description.`,
        `Your birth date includes ${presentCount} of this pattern's three numbers (${numberList}) ` +
          `- ${presentNumbers.join(', ')} present, ${missingNumbers.join(', ')} not. This pattern traditionally ` +
          `relates to ${strengthText}, a perspective worth holding loosely rather than a fixed description.`,
        `${presentCount} of the three numbers in this pattern (${numberList}) ${verb} part of your birth date ` +
          `(${presentNumbers.join(', ')} present, ${missingNumbers.join(', ')} not) - traditionally linked to ` +
          `${strengthText}, offered as one lens among several, not a complete picture.`,
      ]);
    }

    return { id: plane.id, description, interpretation };
  });
}

/**
 * Builds factual cross-references between the main Lo Shu grid and the
 * Expression Planes: for every digit that repeats in the grid
 * (`loShu.repeated`), finds the plane(s) whose three canonical numbers
 * include it (every digit belongs to exactly one row-type and one
 * column-type plane) and states that structural fact - plus, unlike the
 * individual Plane cards above (which each state their own theme in
 * isolation), names the specific traditional theme (`PLANE_STRENGTH_TEXT`)
 * of each plane this one digit touches, in a single sentence - a more
 * precise, data-supported connection than restating "this digit repeats"
 * and "this plane has a theme" as two separate, disconnected facts.
 *
 * There is no existing approved content for a general-purpose reflection
 * question bank, so every question here is grounded in this specific,
 * already-displayed digit/plane fact rather than invented from scratch.
 * Returns an empty array for a profile with no repeated digits - a
 * renderer should omit the whole section rather than show it empty. This
 * is the only connection type the existing approved content supports well:
 * a broader cross-plane synthesis (e.g. relating two planes that share no
 * repeated digit) would have no comparable factual anchor and was
 * deliberately not attempted, rather than inventing one.
 *
 * AstroMatrix "Birth Chart PDF Wording Improvement" task: `text` and
 * `reflectionQuestion` previously had exactly one fixed sentence shape each
 * (`loShu.repeated` holds at most 4 digits for any real date of birth, but
 * even a 2-4 item list reads as templated when every item shares the same
 * opening). Both now rotate (by the digit's position in `loShu.repeated`,
 * never random) through natural variants, each preserving the same "not a
 * fixed description of who you are" qualifier `text` always carried.
 */
function buildPatternConnections(
  loShu: LoShuGrid,
  expressionPlanes: ExpressionPlanePresence[],
): PatternConnection[] {
  const connections: PatternConnection[] = [];
  let index = 0;

  for (const digit of loShu.repeated) {
    const containingPlanes = expressionPlanes.filter((presence) => presence.plane.numbers.includes(digit));
    if (containingPlanes.length === 0) continue;

    const count = loShu.counts[digit];
    const planeNames = joinReadable(containingPlanes.map((presence) => presence.plane.name));
    const planeWord = containingPlanes.length > 1 ? 'patterns' : 'pattern';
    const themeClauses = joinReadable(
      containingPlanes.map((presence) => `${presence.plane.name} with themes such as ${PLANE_STRENGTH_TEXT[presence.plane.id]}`),
    );

    const text = varyByIndex(index, [
      `Number ${digit} repeats in your grid (appearing ${count} times) and is part of your ${planeNames} ${planeWord} above. ` +
        `Numerology traditionally associates ${themeClauses} - a recurring thread worth noticing, not a fixed description of who you are.`,
      `Appearing ${count} times, Number ${digit} also sits within your ${planeNames} ${planeWord} above, traditionally linked to ` +
        `${themeClauses} - a thread that shows up more than once, not a fixed description of who you are.`,
      `Number ${digit}'s ${count} appearances in your grid connect to your ${planeNames} ${planeWord} above, traditionally pointing ` +
        `to ${themeClauses} - a recurring thread worth noticing, not a fixed description of who you are.`,
    ]);
    const reflectionQuestion = varyByIndex(index, [
      `Does Number ${digit}'s presence in your ${planeNames} ${planeWord} feel familiar in how you tend to approach things?`,
      `How does Number ${digit} showing up in your ${planeNames} ${planeWord} resonate with how you usually operate?`,
      `In what ways might Number ${digit}'s place in your ${planeNames} ${planeWord} reflect how you naturally approach things?`,
    ]);

    connections.push({ text, reflectionQuestion });
    index += 1;
  }

  return connections;
}

/**
 * Builds the Birth Chart PDF's closing "Summary" page - see
 * `ClosingSummary`'s own doc comment (src/core/types.ts) for what each
 * field is for. Every sentence here is NEW, built around already-computed
 * report data or already-approved content (`NUMBER_ESSENCE`,
 * `coreNumberSummary.overarchingThemes`) - no new numerology rule, and
 * never a verbatim repeat of an earlier section's own paragraph
 * (`loShuSummary`, a plane's own `interpretation`, or a `swotReflection`
 * item's own sentence).
 *
 * AstroMatrix "Birth Chart PDF Closing Summary" task: `reflectionPrompts`
 * and `finalQuestion` were merged into a single `reflectionQuestions` list
 * (2-3 items, phrased as questions rather than statements) so the Summary
 * ends on a small set of concrete, everyday-life prompts instead of a
 * mix of a statement list and one separate question. The first question
 * reuses `buildClosingReflectionQuestion` unchanged (Core Number themes);
 * the second draws on an active Lo Shu digit's strength - the same
 * complementary angle the old `reflectionPrompts` offered (building on
 * what's already present, distinct from "Practical Action Plan"'s
 * missing-digit focus) - and the third is a general small, realistic-step
 * question that needs no per-profile data.
 */
function buildClosingSummary(
  loShu: LoShuGrid,
  expressionPlanes: ExpressionPlanePresence[],
  coreNumberSummary: CoreNumberSummary,
): ClosingSummary {
  const activeDigits = DIGITS.filter((d) => loShu.counts[d] > 0);
  const fullyPresentPlanes = expressionPlanes.filter((presence) => presence.presentCount === 3);

  // "The main themes from the five Core Numbers" - a new sentence wrapped
  // around the existing, already-deduplicated overarchingThemes list (never
  // coreNumberSummary's own `paragraph`, which already exists as its own
  // section). Explicitly frames the themes as complementary rather than a
  // bare re-listing.
  const keyThemes = coreNumberSummary.overarchingThemes.length
    ? `Across your Core Numbers, a few themes stand out: ${joinReadable(coreNumberSummary.overarchingThemes)}. ` +
      `Traditionally, themes like these are read as complementary rather than competing - different angles on the same underlying pattern, not separate boxes to fit yourself into.`
    : '';

  // A short Lo Shu perspective - active digits, missing digits, and
  // fully-present Planes, all from already-computed counts. `loShu.missing`
  // is mentioned explicitly but only ever as "not represented", never as a
  // weakness or something to correct - never a repeat of loShuSummary or
  // any single plane's own interpretation sentence.
  const missingCount = loShu.missing.length;
  const patternConnection =
    `Your Lo Shu Grid activates ${activeDigits.length} of the 9 traditional numbers` +
    (missingCount > 0
      ? `, and ${missingCount} ${missingCount === 1 ? 'is' : 'are'} not represented - which is simply how most birth dates read, not a gap to correct. `
      : '. ') +
    `${fullyPresentPlanes.length} of your six Planes of Expression ${fullyPresentPlanes.length === 1 ? 'is' : 'are'} fully present in your birth date, ` +
    `offering a picture of where your traditional pattern is concentrated, and where it stays more open for you to explore.`;

  // 2-3 concrete reflection questions connecting the chart to everyday
  // life. Capped at 3; each is independently guarded so the list degrades
  // gracefully rather than assuming every source is non-empty.
  const reflectionQuestions: string[] = [];

  const themeQuestion = buildClosingReflectionQuestion(coreNumberSummary.overarchingThemes);
  if (themeQuestion) {
    reflectionQuestions.push(themeQuestion);
  }

  if (activeDigits.length > 0) {
    const essence = NUMBER_ESSENCE[activeDigits[0]];
    reflectionQuestions.push(`Where could ${essence.strengths[0]} help you turn an idea into meaningful progress?`);
  }

  reflectionQuestions.push('What is one small, realistic step you could take this week toward something that matters to you?');

  return { keyThemes, patternConnection, reflectionQuestions: reflectionQuestions.slice(0, 3) };
}

/**
 * The Summary page's closing reflection question - grounded only in the
 * already-approved `overarchingThemes` phrases, no new interpretation.
 * Returns `''` (omit) only if no theme is available.
 *
 * AstroMatrix "Birth Chart PDF Quality Improvement" task: no longer takes a
 * `patternConnections` parameter at all - this question must never repeat
 * "How Your Patterns Connect"'s own `reflectionQuestion`, so that reuse
 * path was removed outright rather than merely left uncalled, to prevent
 * it from being accidentally reintroduced later.
 *
 * Exported, unlike this file's other private builder functions, because its
 * fallback/omit branches are defensive: `overarchingThemes` is always
 * non-empty in practice (see `getCoreNumberSummary`'s own implementation -
 * sliced from a list that always has at least one entry for any profile
 * with computed Core Numbers), so no real `Profile` can exercise the
 * single-theme or empty-theme branches through `buildBirthChartReport`
 * alone. Exporting this one small, pure piece lets tests verify that
 * defensive behavior directly, the same way `escapeHtml` is exported from
 * reportHtml.ts for the same reason - without inventing a real profile
 * fixture for a mathematically rare (or impossible) digit coincidence.
 */
export function buildClosingReflectionQuestion(overarchingThemes: readonly string[]): string {
  if (overarchingThemes.length >= 2) {
    return `As you reflect on your blueprint, which feels more present for you right now - ${overarchingThemes[0]} or ${overarchingThemes[1]}?`;
  }
  if (overarchingThemes.length === 1) {
    return `Where might ${overarchingThemes[0]} be showing up in your life right now?`;
  }
  return '';
}

/**
 * Builds the stable `BirthChartReport` for `profile` - no date involved,
 * and so no forecast field. See `buildStructuredReport` below for the
 * version that adds a specific day's forecast on top of this same data.
 *
 * Birth Chart reports are Pythagorean-only (non-negotiable product
 * decision, AstroMatrix "Birth Chart PDF Redesign" Stage 1): every Birth
 * Chart's Core Numbers are calculated via the Pythagorean letter map,
 * regardless of what `system` a legacy stored profile carries. This never
 * mutates or migrates the stored `profile` - a new object is passed to
 * `buildNumerologyReport`, `profile` itself is untouched - and never
 * touches the calculation engine (`numerology.ts`/`letterValues.ts` still
 * fully support both systems, unchanged elsewhere); only this one call
 * site is pinned. Scoped precisely to what actually diverges by system:
 * Destiny/Soul Urge/Personality are the only fields affected (they alone
 * route through `letterValue()`, which switches letter maps by system) -
 * Life Path and Birthday are date-only, and the Lo Shu Grid/Expression
 * Planes never read `system` at all, so none of those would have differed
 * either way. The returned `profile.system` (and `numerology.system`)
 * always reads `'pythagorean'` too, so nothing downstream can read a stale
 * legacy value from this report - this is scoped to the Birth Chart PDF
 * only; it does not change the stored `Profile`, and does not affect any
 * other screen that reads `profile.system` directly (e.g. Blueprint).
 */
export function buildBirthChartReport(profile: Profile): BirthChartReport {
  const pythagoreanProfile: Profile = { ...profile, system: 'pythagorean' };
  const numerology = buildNumerologyReport(pythagoreanProfile);
  const loShu = buildLoShuGrid(profile.dob);
  const expressionPlanes = getAllExpressionPlanePresence(loShu.counts);
  const coreNumberSummary = getCoreNumberSummary(numerology);

  const coreNumberSections = {} as Record<CoreNumberKey, CoreNumberSection>;
  for (const { key } of CORE_NUMBERS) {
    coreNumberSections[key] = getCoreNumberInterpretation(key, numerology[key]);
  }

  const numbersSummary = generateNumbersSummary(numerology.lifePath, numerology.soulUrge, 'Soul Urge');
  const loShuSummary = generateLoShuSummary(profile.dob);
  const swotReflection = buildSwotReflection(loShu);
  const loShuInterpretation = buildLoShuInterpretation(loShu, loShuSummary);
  const planeInterpretations = buildPlaneInterpretations(expressionPlanes);
  const patternConnections = buildPatternConnections(loShu, expressionPlanes);
  const closingSummary = buildClosingSummary(loShu, expressionPlanes, coreNumberSummary);

  return {
    profile: {
      id: profile.id,
      fullName: profile.fullName,
      dob: profile.dob,
      system: 'pythagorean',
    },
    numerology,
    loShu,
    expressionPlanes,
    coreNumberSummary,
    coreNumberSections,
    numbersSummary,
    loShuSummary,
    swotReflection,
    loShuInterpretation,
    planeInterpretations,
    patternConnections,
    closingSummary,
  };
}

/**
 * Builds the full `StructuredReport` for `profile` as of `onDate`
 * ('YYYY-MM-DD'). `onDate` is required, not defaulted - see module doc.
 * The stable fields are identical to `buildBirthChartReport(profile)`'s own
 * output (reused directly, never re-derived) - only `forecastToday` is
 * added on top.
 */
export function buildStructuredReport(profile: Profile, onDate: string): StructuredReport {
  const birthChart = buildBirthChartReport(profile);
  const forecastToday = buildForecast(profile, onDate);

  return {
    ...birthChart,
    forecastToday,
  };
}
