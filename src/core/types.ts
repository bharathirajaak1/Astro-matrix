/**
 * AstroMatrix core domain types.
 *
 * Pure TypeScript: no React, no Expo, no I/O. Data only.
 *
 * `StructuredReport` (bottom of this file) is the one exception to this
 * file's own historical zero-import rule: it references two content types
 * declared in `src/data/coreNumberContent.ts`. Both that import and
 * `coreNumberContent.ts`'s own import of `NumerologyReport`/`CoreNumber`
 * from here are `import type` only - fully erased at compile time, so this
 * is a type-level reference graph only, never a runtime circular
 * dependency. `expressionPlanes.ts` is referenced the same way and for the
 * same reason.
 */
import type { ExpressionPlaneId, ExpressionPlanePresence } from './expressionPlanes';
import type { CoreNumberKey, CoreNumberSection, CoreNumberSummary } from '@/data/coreNumberContent';

/** A reduced single digit, 1-9. Zero never appears as a numerology result. */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Master numbers, preserved (not reduced) for the four core name/birth numbers. */
export type MasterNumber = 11 | 22 | 33;

/** Value space for Life Path / Destiny / Soul Urge / Personality. */
export type CoreNumber = Digit | MasterNumber;

export type NumerologySystem = 'pythagorean' | 'chaldean';

export interface Profile {
  id: string;
  /** Name as used at birth; drives the name-based numbers. */
  fullName: string;
  /** Date of birth as an ISO calendar date, 'YYYY-MM-DD'. */
  dob: string;
  system: NumerologySystem;
  /** ISO timestamp the profile was created. */
  createdAt: string;
}

export interface NumerologyReport {
  system: NumerologySystem;
  lifePath: CoreNumber;
  /** aka Expression. */
  destiny: CoreNumber;
  /** Vowels only. */
  soulUrge: CoreNumber;
  /** Consonants only. */
  personality: CoreNumber;
  /** Day of month, 1-31, unreduced. */
  birthday: number;
  /**
   * The "show the work" trail. Each entry is a chain of successive values,
   * e.g. `destiny: [68, 14, 5]`. `lifePathParts` holds the reduced
   * `[day, month, year]` components that were summed for the Life Path.
   */
  reductions: Record<string, number[]>;
}

export interface LoShuPlanes {
  /** Top row 4-9-2, all present. */
  mind: boolean;
  /** Middle row 3-5-7, all present. */
  soul: boolean;
  /** Bottom row 8-1-6, all present. */
  practical: boolean;
  /** Left column 4-3-8, all present. */
  thought: boolean;
  /** Middle column 9-5-1, all present. */
  will: boolean;
  /** Right column 2-7-6, all present. */
  action: boolean;
  /** Names of every line (row / column / diagonal) that is fully present. */
  goldenYogas: string[];
  /** Names of every line that is fully absent. */
  silverYogas: string[];
}

export interface LoShuGrid {
  /** How many times each digit 1-9 appears in the date of birth. */
  counts: Record<Digit, number>;
  /** Digits that do not appear at all. */
  missing: Digit[];
  /** Digits that appear two or more times. */
  repeated: Digit[];
  planes: LoShuPlanes;
}

export type ForecastFocus = 'rest' | 'action' | 'connect' | 'plan' | 'create';

export interface Forecast {
  /** ISO calendar date the forecast is for, 'YYYY-MM-DD'. */
  date: string;
  personalYear: Digit;
  personalMonth: Digit;
  personalDay: Digit;
  headline: string;
  body: string;
  luckyNumber: Digit;
  focus: ForecastFocus;
}

/**
 * One digit-keyed entry in a `SwotReflection` list - a single, fully
 * composed, ready-to-display sentence for one Lo Shu digit, plus the digit
 * itself (so callers/tests can verify mapping without re-parsing `text`).
 */
export interface SwotReflectionItem {
  digit: Digit;
  text: string;
}

/**
 * Personal SWOT Reflection: traditional numerology associations with the
 * digits present and absent in a profile's Lo Shu grid, framed as
 * self-reflection prompts - never as fact, deficiency, or prediction. See
 * `src/core/report.ts`'s `buildBirthChartReport()` for how this is built
 * from `src/data/numberEssence.ts`'s `NUMBER_ESSENCE`. "Patterns to Notice"
 * is deliberately not included here - still deferred.
 *
 * `strengths` is derived from active digits (`loShu.counts[d] > 0`) - each
 * item now also distinguishes a repeated digit (`loShu.counts[d] >= 2`)
 * from a present-once one, rather than treating every active digit
 * identically. `strengthsSynthesis` is a separate sentence combining every
 * active digit's theme together (so the Birth Chart reads as an integrated
 * reflection on the actual pattern, not a flat per-digit list like the
 * original onboarding SWOT screen) - empty only if there are no active
 * digits (not reachable from a real DOB).
 *
 * `areasToExplore` and `opportunities` are both derived from the same
 * `loShu.missing` digit set, through two different `NUMBER_ESSENCE` fields,
 * so the two sections read as genuinely distinct rather than duplicates of
 * each other; `opportunities` is additionally framed as ways to work with a
 * theme, distinct from `areasToExplore`'s framing as themes to reflect on.
 * Any of the three item arrays may be empty (e.g. `areasToExplore`/
 * `opportunities` for a profile with no missing digits) - a renderer should
 * omit that section entirely rather than show an empty list.
 */
export interface SwotReflection {
  strengths: SwotReflectionItem[];
  /** A sentence combining every active digit's traditional theme together -
   *  "numbers considered together" rather than isolated per-digit entries. */
  strengthsSynthesis: string;
  areasToExplore: SwotReflectionItem[];
  opportunities: SwotReflectionItem[];
}

/**
 * Birth Chart-only interpretive content for the Lo Shu Grid, beyond the
 * raw `LoShuGrid` data - distinguishes the comprehensive Birth Chart from
 * the concise Blueprint screen (see `src/core/report.ts`'s
 * `buildLoShuInterpretation()`). Framed as traditional self-reflection
 * content throughout, never as fact, deficiency, or prediction.
 *
 * `numbersPresent`/`consciousAttention` may each legitimately be empty for
 * an unusual profile; `traditionalPatterns` is very commonly empty (most
 * profiles have no fully-present or fully-absent line); `yourPattern` and
 * `puttingItTogether` are always non-empty. A renderer should omit any
 * empty subsection entirely.
 */
export interface LoShuInterpretation {
  /** "Your Lo Shu Pattern" - a short, personalized, purely factual
   *  overview (how many of the 9 numbers are active/repeat). */
  yourPattern: string;
  /** "Numbers Present and Repeated" - one entry per digit with
   *  `loShu.counts[d] > 0`, ascending order. */
  numbersPresent: SwotReflectionItem[];
  /** "Numbers for Conscious Attention" - one entry per `loShu.missing`
   *  digit, ascending order. Sourced from `MISSING_GROWTH_AREAS`
   *  (src/core/summaryGenerator.ts) - deliberately a different
   *  `NUMBER_ESSENCE`-independent source than `swotReflection`, so the two
   *  sections read as genuinely distinct rather than a repeat of each
   *  other within the same document. */
  consciousAttention: SwotReflectionItem[];
  /** "Traditional Grid Patterns" - one line per `loShu.planes.goldenYogas`/
   *  `silverYogas` entry, restating what "fully present"/"fully absent"
   *  means for that line. Purely factual, no new interpretation. */
  traditionalPatterns: string[];
  /** "Putting the Pattern Together" - the existing, already-approved
   *  `generateLoShuSummary()` text (identical to `loShuSummary` above),
   *  repositioned as this section's closing synthesis rather than an
   *  unlabeled trailing paragraph. */
  puttingItTogether: string;
}

/**
 * Birth Chart-only interpretive content for one Expression Plane, beyond
 * the raw `ExpressionPlanePresence` data. See
 * `src/core/report.ts`'s `buildPlaneInterpretations()`.
 */
export interface PlaneInterpretation {
  id: ExpressionPlaneId;
  /** The existing, already-approved plane description from
   *  `src/data/expressionPlaneContent.ts`, reused verbatim/unchanged. */
  description: string;
  /** A pattern-specific sentence combining the existing, already-approved
   *  `PLANE_STRENGTH_TEXT` phrase (src/core/summaryGenerator.ts) with this
   *  profile's actual present/missing count for this plane - differs per
   *  plane and per profile, never a generic template with nothing
   *  plugged in. */
  interpretation: string;
}

/**
 * One factual cross-reference between the main Lo Shu grid and a specific
 * Expression Plane, plus a concrete (non-generic) reflection question tied
 * to that same fact. See `src/core/report.ts`'s `buildPatternConnections()`
 * for exactly which facts qualify - there is no existing approved content
 * for a general-purpose reflection-question bank, so every question here is
 * grounded in a specific, already-displayed digit/plane fact rather than
 * invented from scratch.
 */
export interface PatternConnection {
  text: string;
  reflectionQuestion: string;
}

/**
 * The Birth Chart PDF's closing synthesis ("Your Personal Blueprint -
 * Bringing It Together"). See `src/core/report.ts`'s `buildClosingSummary()`
 * for exactly how each field is built - every one is a NEW sentence
 * synthesized around already-computed report data/already-approved content,
 * never a verbatim repeat of an earlier section's paragraph and never a new
 * numerology rule.
 */
export interface ClosingSummary {
  /** 2-3 key themes, synthesized (not copy-pasted) from
   *  `coreNumberSummary.overarchingThemes`, framed as complementary angles
   *  on the same pattern rather than a bare re-listing. */
  keyThemes: string;
  /** A short Lo Shu perspective: how many of the 9 traditional numbers are
   *  active, how many are missing, and how many Planes of Expression are
   *  fully present - built from already-computed counts (active Lo Shu
   *  digits, `loShu.missing`, fully-present planes), never a repeat of
   *  `loShuSummary` or any single plane's own `interpretation`. Missing
   *  numbers are always framed as simply unrepresented, never as a
   *  deficiency. */
  patternConnection: string;
  /** 2-3 concise reflection questions connecting the chart to everyday
   *  life - replaces the old `reflectionPrompts`/`finalQuestion` pair.
   *  Grounded in `coreNumberSummary.overarchingThemes` (via
   *  `buildClosingReflectionQuestion`) and in an active Lo Shu digit's
   *  `NUMBER_ESSENCE` strength, plus one general small-step question that
   *  needs no per-profile data. Never empty in practice; a renderer should
   *  still treat it as optional. */
  reflectionQuestions: string[];
}

/**
 * The stable Birth Chart data for a profile - everything that depends only
 * on the profile itself (name/DOB/system), never on "today's date". See
 * `src/core/report.ts`'s `buildBirthChartReport()` for how this is built.
 * Every field is sourced from an existing canonical calculation/content
 * function; nothing here recalculates or reinterprets anything - this is
 * purely an assembly shape.
 *
 * Deliberately excludes any forecast - `StructuredReport` below adds that
 * as the one date-dependent field, by extending this interface rather than
 * redeclaring its fields a second time, so the two can never silently
 * drift apart.
 */
export interface BirthChartReport {
  /** Only the identity fields a report needs - never the full `Profile`
   *  (e.g. `createdAt` is irrelevant to a report's content). */
  profile: Pick<Profile, 'id' | 'fullName' | 'dob' | 'system'>;
  numerology: NumerologyReport;
  loShu: LoShuGrid;
  expressionPlanes: ExpressionPlanePresence[];
  /** "Your Personal Core Summary" - synthesis across all five Core Numbers. */
  coreNumberSummary: CoreNumberSummary;
  /** Full structured interpretation for each of the five Core Numbers. */
  coreNumberSections: Record<CoreNumberKey, CoreNumberSection>;
  /** Plain-text summary combining Life Path + Soul Urge. */
  numbersSummary: string;
  /** Plain-text summary of the Lo Shu grid. */
  loShuSummary: string;
  /** Personal SWOT Reflection (Strengths / Areas to Explore / Opportunities
   *  - "Patterns to Notice" is still deferred). */
  swotReflection: SwotReflection;
  /** Birth Chart-only Lo Shu interpretation, beyond the raw grid. */
  loShuInterpretation: LoShuInterpretation;
  /** Birth Chart-only interpretation for each of the six Expression
   *  Planes, in the same canonical order as `expressionPlanes`. */
  planeInterpretations: PlaneInterpretation[];
  /** Factual cross-references between the Lo Shu grid and the Expression
   *  Planes (e.g. a repeated digit that sits in two specific planes), each
   *  with a grounded reflection question. May be empty for a profile with
   *  no repeated digits - a renderer should omit the whole section rather
   *  than show it empty. */
  patternConnections: PatternConnection[];
  /** The closing page's synthesis - see `ClosingSummary`'s own doc comment. */
  closingSummary: ClosingSummary;
}

/**
 * The one central, assembled report for a profile ON A SPECIFIC DATE - the
 * stable `BirthChartReport` fields plus that date's forecast. See
 * `src/core/report.ts`'s `buildStructuredReport()` for how this is built.
 */
export interface StructuredReport extends BirthChartReport {
  /** The forecast for the explicit `onDate` the report was built for. */
  forecastToday: Forecast;
}
