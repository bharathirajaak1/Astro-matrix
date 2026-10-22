/**
 * Renders a `BirthChartReport` (src/core/types.ts) into a readable,
 * print-friendly HTML string - no Expo/React/native import here, so this
 * stays plain Node/Jest-testable. Every value comes directly from the
 * supplied report; nothing is recalculated and no new interpretation text
 * is written here - `CORE_NUMBERS` (ordering/labels) is the only existing
 * display-label source reused, already authored content, not new copy.
 * `LO_SHU_LAYOUT` is imported only for its fixed 3x3 *shape* (which cell
 * sits where), never to recompute digit counts/presence - those always
 * come from the supplied report.
 *
 * Deliberately typed to `BirthChartReport`, not `StructuredReport` -
 * the downloadable Birth Chart PDF is the stable document and must never
 * include `forecastToday` (a `StructuredReport`-only field). Since
 * `StructuredReport extends BirthChartReport` (src/core/types.ts), every
 * existing caller that already builds a `StructuredReport` (e.g.
 * `exportReportAsPdf`) keeps compiling and working unchanged - passing a
 * `StructuredReport` here is valid, this function simply never reads its
 * extra `forecastToday` field.
 *
 * None of `BirthChartReport`'s fields are optional or nullable (checked
 * against its actual declaration in `src/core/types.ts`) - every section
 * below is rendered unconditionally except where a section's own list may
 * legitimately be empty (e.g. `loShuInterpretation.traditionalPatterns`,
 * `patternConnections`), each guarded with its own `.length` check so nothing
 * renders an empty heading.
 *
 * AstroMatrix "Birth Chart PDF Redesign" Stage 3 (visual/content redesign):
 *  - Added a cover page, an introduction page, and a closing summary page
 *    (using Stage 1's `closingSummary` data unchanged, not recalculated).
 *  - Renamed four section headings to match the approved content list
 *    ("Core Numbers" -> "Your Five Core Numbers", "Your Personal Core
 *    Summary" -> "Your Combined Core Profile", "Lo Shu Grid" -> "Your Lo Shu
 *    Grid", "Planes of Expression" -> "Your Planes of Expression") - no
 *    underlying data changed, only the rendered heading text.
 *  - Removed the standalone "Numbers Summary" section (its content
 *    substantially overlapped "Your Combined Core Profile"'s own paragraph -
 *    see the audit this task is based on). `numbersSummary` itself, and
 *    `generateNumbersSummary()`, are UNCHANGED - Blueprint still reads both
 *    directly; only this renderer stopped displaying it.
 *  - Relocated (not duplicated) two pieces of content that used to render
 *    inline: each Core Number's `howToUse` paragraph now renders once,
 *    together, under a new "Applying Your Blueprint to Life" section instead
 *    of inside every core-number card; `swotReflection.opportunities` (the
 *    same "Ways to Develop" content, same wording, same
 *    `swotSectionHtml()`) now renders once, under a new "Practical Action
 *    Plan" section, instead of inside "Your Personal Pattern Review" - which
 *    keeps its approved heading, disclaimer, and its other three
 *    subsections (Strengths/Areas to Explore/Patterns to Notice) exactly as
 *    before.
 *  - The system label is now always the literal string "Pythagorean
 *    numerology", never looked up from `profile.system` - closes a latent
 *    risk flagged in the Stage 1 audit (a legacy `system: 'chaldean'`
 *    profile could otherwise have caused this PDF to print "Chaldean",
 *    directly contradicting the Pythagorean-only product decision; Stage 1
 *    already guarantees `report.profile.system` is always `'pythagorean'`,
 *    this removes the now-pointless lookup table entirely rather than
 *    leaving dead code that could be miswired later).
 *  - Page numbers / running headers/footers were investigated and
 *    deliberately NOT added: `expo-print`'s own type declarations
 *    (node_modules/expo-print/build/Print.types.d.ts) expose no native
 *    header/footer/page-number option, and CSS Paged Media page-number
 *    generation (`@page { @bottom-center { content: counter(page) } }`) is
 *    not reliably supported by WebView-based HTML-to-PDF rendering (the
 *    mechanism `Print.printToFileAsync` uses under the hood on both
 *    platforms) - a well-documented, cross-platform limitation, not
 *    something specific to this app. Adding markup that silently fails to
 *    render would be worse than omitting it.
 *
 * AstroMatrix "Birth Chart PDF Quality Improvement" task (follow-up to
 * Stage 3 above):
 *  - Every displayed date now renders via `formatDDMonthYYYY()`
 *    (src/lib/date.ts) - "03-August-1979" - instead of the raw ISO string;
 *    the underlying `profile.dob` value is never touched, this is display
 *    formatting only.
 *  - Applied a consistent colour palette throughout (deep indigo section
 *    headings, violet Core Number values, soft-blue card backgrounds, warm
 *    cream page background) and gave Core Number cards, plane cards, and
 *    "Applying Your Blueprint to Life" items consistent card treatment.
 *  - Enlarged the six Plane of Expression mini-grids substantially (22px
 *    cells -> 44px) and added a text mark (PRESENT/missing) to each
 *    highlighted cell, so presence is never colour-only.
 *  - Enlarged and added a contrasting card frame behind the cover logo
 *    (96px -> 150px image in a 176px white card) for visibility.
 *  - Fixed a specific reported pagination bug (a Core Number interpretation
 *    splitting mid-sentence across a page boundary) by adding
 *    `break-inside: avoid` to `.core-number` cards - previously the only
 *    major content block in this file without that protection.
 *  - Renamed the closing section from "Your Personal Blueprint - Bringing
 *    It Together" to "Summary", and revised two of its fields (see
 *    `buildClosingSummary()`'s own doc comment in src/core/report.ts) so it
 *    no longer overlaps "Practical Action Plan" or repeats "How Your
 *    Patterns Connect"'s own reflection question.
 *  - Replaced Birthday's generic, template-generated content
 *    (`showsUpAs`/`strengths`/`mindfulOf`/`howToUse` - see
 *    `src/data/coreNumberContent.ts`'s own doc comment) with bespoke prose,
 *    and introduced rotating sentence shapes for the Lo Shu Grid's
 *    present-digit list (see `varyByIndex()` in src/core/report.ts) - both
 *    pure content changes upstream of this file; nothing here needed to
 *    change to pick them up.
 *
 * AstroMatrix "Birth Chart PDF Improvements" Step 2 (cover logo fix):
 *  - `.cover-motif` (a purely decorative CSS circle pair, unrelated to the
 *    logo) now renders only when `logoDataUri` is absent. Previously it
 *    rendered unconditionally, so when a real logo WAS supplied, the
 *    logo's own two concentric circles (already baked into
 *    assets/icon.png's own approved artwork) and `.cover-motif`'s two
 *    circles appeared together, reading as duplicated/extra circles around
 *    the logo. The fallback behavior itself (the cover still looks
 *    intentional and balanced when there's no logo to show) is unchanged.
 *
 * AstroMatrix "Birth Chart PDF Layout Polish" task (based on inspecting an
 * actual rendered 14-page PDF):
 *  - Introduction cards (`.intro-card`) were inspected for fixed heights/
 *    widths, line-clamping, or forced line breaks that could prevent them
 *    from flowing naturally - none were found; they were already unsized
 *    and left unchanged. The four cards happening to look similar in
 *    length is a property of the (unchanged) approved copy, not a layout
 *    constraint.
 *  - Found and fixed the actual cause of the reported gaps between Life
 *    Path, Destiny, and Soul Urge: `.core-number`'s own whole-card
 *    `break-inside: avoid` (see its own doc comment below).
 *  - The report-identification line (name/DOB/system) is now deliberately
 *    subtle (smaller, explicitly regular-weight, zeroed top margin)
 *    instead of reading like a section heading.
 *  - Every page that starts on a forced page break now has its first
 *    heading's margin-top zeroed, so it relies on exactly the same top
 *    margin as every other page instead of stacking an extra, inconsistent
 *    margin on top of the page break itself.
 *
 * AstroMatrix "Birth Chart PDF Natural-Flow Introduction Cards" task
 * (follow-up - the previous task's "the four cards happening to look
 * similar in length is a property of the approved copy" note, above, was
 * the actual cause, not a dead end):
 *  - Each of the four introduction cards' text now restores one genuine
 *    sentence the original one-page condensing pass had cut, all sourced
 *    from the same approved document (see each INTRO_* constant's own doc
 *    comment) - producing naturally varied card lengths instead of four
 *    independently-condensed paragraphs that happened to land at a very
 *    similar character count (and therefore line count) at this card
 *    width.
 *  - `body`'s own `margin: 32px` only reliably positions the FIRST
 *    printed page - margin on an in-flow box is not repeated at every
 *    page fragment the way a page-box margin is, so pages that continue
 *    content from a previous page (not just the forced-break section
 *    starts the previous task already fixed) could still start hard
 *    against the physical page edge. Moved the 32px margin to `@page`
 *    (the CSS Paged Media page-box margin, applied once per physical
 *    page regardless of what starts it) and zeroed `body`'s own margin,
 *    so every page - section start or mid-section continuation - gets
 *    the same top margin from the same single source.
 */
import type { BirthChartReport, LoShuGrid, SwotReflectionItem } from '@/core/types';
import { LO_SHU_LAYOUT } from '@/core/loShu';
import type { ExpressionPlanePresence } from '@/core/expressionPlanes';
import { CORE_NUMBERS } from '@/data/interpretations';
import { formatDDMonthYYYY } from '@/lib/date';

/** Escapes the five HTML/XML-sensitive characters - safe for both text
 *  content and quoted attribute values (single or double quoted). `&` is
 *  replaced first so the entities introduced by the other replacements are
 *  never themselves re-escaped. Exported so tests can build the exact
 *  expected (escaped) form of known-dynamic content - e.g. interpretation
 *  text that itself contains an apostrophe - rather than re-implementing a
 *  second copy of this logic in the test file. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Joins 1+ short phrases into one readable sentence fragment: "a", "a and
 *  b", or "a, b, and c". Pure formatting, no interpretive content of its
 *  own. A small local copy of the identical helper in `src/core/report.ts`
 *  (kept private there) - `reportHtml.ts` deliberately never imports from
 *  `report.ts` (the renderer stays a one-way consumer of `BirthChartReport`,
 *  not coupled to how it's assembled), and this is pure grammar/formatting,
 *  not a second copy of any interpretive rule. */
function joinReadable(phrases: readonly string[]): string {
  if (phrases.length === 0) return '';
  if (phrases.length === 1) return phrases[0];
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(', ')}, and ${phrases[phrases.length - 1]}`;
}

function renderList(items: readonly string[]): string {
  if (items.length === 0) return '';
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

/** A heading + bullet list built from `SwotReflectionItem[]` (digit + text
 *  pairs) - omits itself entirely when `items` is empty, so an unsupported
 *  Lo Shu interpretation subsection never renders an empty heading. */
function labeledItemListHtml(heading: string, items: readonly SwotReflectionItem[]): string {
  if (items.length === 0) return '';
  return `
    <h3>${escapeHtml(heading)}</h3>
    <ul>${items.map((item) => `<li>${escapeHtml(item.text)}</li>`).join('')}</ul>
  `;
}

/** Same as `labeledItemListHtml`, for a plain string list (e.g. golden/
 *  silver yoga line descriptions). */
function labeledTextListHtml(heading: string, items: readonly string[]): string {
  if (items.length === 0) return '';
  return `
    <h3>${escapeHtml(heading)}</h3>
    <ul>${items.map((text) => `<li>${escapeHtml(text)}</li>`).join('')}</ul>
  `;
}

/** The full 3x3 Lo Shu Grid as an HTML table, laid out from the fixed
 *  `LO_SHU_LAYOUT` shape with each cell's digit/count read from `loShu`.
 *  Visually distinguishes missing (count 0), present-once (count 1), and
 *  repeated (count >= 2) cells via CSS classes only - no interpretation. */
function fullGridHtml(loShu: LoShuGrid): string {
  const rows = LO_SHU_LAYOUT.map((row) => {
    const cells = row
      .map((digit) => {
        const count = loShu.counts[digit];
        const cls = count === 0 ? 'missing' : count >= 2 ? 'repeated' : 'present';
        const countLabel = count === 0 ? 'Missing' : `&times;${count}`;
        return `<td class="grid-cell ${cls}"><span class="digit">${digit}</span><span class="count">${countLabel}</span></td>`;
      })
      .join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<table class="loshu-grid">${rows}</table>`;
}

/** A 3x3 mini-grid for one Expression Plane, highlighting exactly that
 *  plane's three canonical cells (`presence.plane.cells`) and
 *  distinguishing present vs. missing within those three - every other cell
 *  renders as a neutral "outside this plane" cell. Mirrors `PlaneMiniGrid`
 *  in app/(tabs)/blueprint.tsx's own algorithm (iterate the fixed grid
 *  shape, check cell membership, then presence) as plain HTML, not a copy
 *  of that React Native component.
 *
 *  AstroMatrix "Birth Chart PDF Quality Improvement" task: enlarged
 *  substantially (cells were 22px, now 44px, for print/mobile readability -
 *  the explicit complaint was that these were "too small and difficult to
 *  read"), and each of the plane's own three cells now also carries a
 *  short text mark (`PRESENT`/`missing` as a `<span class="mini-mark">`)
 *  in addition to its background colour - present/missing within the
 *  highlighted plane is never conveyed by colour alone. */
function miniGridHtml(presence: ExpressionPlanePresence): string {
  const rows = LO_SHU_LAYOUT.map((row, rowIndex) => {
    const cells = row
      .map((digit, colIndex) => {
        const belongsToPlane = presence.plane.cells.some((cell) => cell.row === rowIndex && cell.col === colIndex);
        const isPresent = belongsToPlane && presence.presentNumbers.includes(digit);
        const cls = !belongsToPlane ? 'outside' : isPresent ? 'present' : 'missing-in-plane';
        const mark = belongsToPlane ? `<span class="mini-mark">${isPresent ? 'present' : 'missing'}</span>` : '';
        return `<td class="mini-cell ${cls}"><span class="mini-digit">${digit}</span>${mark}</td>`;
      })
      .join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<table class="mini-grid">${rows}</table>`;
}

// "Your Personal Pattern Review" - static section copy (disclaimer, four
// subsection intros/subtitles). The user-facing section name and its three
// data-driven subsections (Strengths/Areas to Explore/Opportunities) were
// previously labeled "Personal SWOT Reflection"; renamed here (AstroMatrix
// "Final Birth Chart PDF Corrections" task) to match the approved name.
// Internal identifiers (the `SwotReflection` type, `swotReflection` field,
// the `SWOT_*` constant names below) are deliberately left unrenamed - only
// the rendered, user-facing text changed.
//
// Areas to Explore and Opportunities intros were reworded in an earlier
// task to: (a) frame unrepresented numbers as expected/normal rather than
// a deficiency, (b) cross-reference "Numbers for Conscious Attention"
// (earlier in this report) instead of silently repeating its explanation,
// and (c) make Opportunities' practical, forward-looking framing explicit,
// with an explicit no-guarantee disclaimer stated once here rather than
// per item.
//
// The four subtitles below are reused verbatim from the existing,
// already-approved onboarding screen (app/onboarding/swot-audit.tsx) -
// not new copy.
const SWOT_DISCLAIMER =
  "Your Personal Pattern Review draws on traditional numerology associations with the numbers present and absent in your birth date. It's offered as a prompt for self-reflection — not a scientific assessment, a fixed trait, or a prediction.";
const SWOT_STRENGTHS_SUBTITLE = 'Qualities You May Draw On';
const SWOT_STRENGTHS_INTRO =
  'These numbers appear in your birth date. Numerology traditionally associates each with a strength:';
const SWOT_AREAS_TO_EXPLORE_SUBTITLE = 'Numbers to Reflect On';
const SWOT_AREAS_TO_EXPLORE_INTRO =
  'These numbers are not represented in your birth date — which is expected, since every Lo Shu pattern leaves several numbers unrepresented, not a sign of inability. Numerology traditionally associates each with themes that may be worth exploring as optional self-reflection (see also Numbers for Conscious Attention, earlier in this report, for a complementary traditional angle):';
const SWOT_OPPORTUNITIES_SUBTITLE = 'Ways to Develop';
const SWOT_OPPORTUNITIES_INTRO =
  'For these same numbers, here are traditional themes you might consciously work with over time — offered as possible starting points for reflection, not as practices with a guaranteed result:';

// "Patterns to Notice" - unlike the three sections above, this is NOT
// derived from this profile's digits. It reuses the existing, already-
// approved onboarding text verbatim (app/onboarding/swot-audit.tsx:269-273,
// the "Blind Spot" accordion) - which is itself static/non-personalized
// there, identical for every user. `PATTERNS_TO_NOTICE_FRAMING` makes that
// explicit to the reader, rather than implying this one subsection is
// derived from the user's numbers the way the other three are.
const SWOT_PATTERNS_TO_NOTICE_SUBTITLE = 'What May Be Easy to Overlook';
const PATTERNS_TO_NOTICE_FRAMING =
  "Unlike the sections above, this reflection is offered as a general prompt for self-reflection - it is not personalized to your specific numbers.";
const PATTERNS_TO_NOTICE_TEXT =
  'You may bring strong vision and intuitive spark to new ideas, while finding that consistency and routine require more conscious attention.';
const PATTERNS_TO_NOTICE_NOTE =
  "This isn't a personal flaw. It is simply another part of your pattern worth noticing.";

// PDF-only qualifier appended after "Putting the Pattern Together"'s
// synthesis (which reuses the existing `loShuSummary` verbatim - see
// buildReportHtml below). `loShuSummary` itself (generateLoShuSummary() in
// summaryGenerator.ts) is deliberately never edited here or anywhere else,
// because it also feeds the Blueprint screen's own visible output; this
// constant exists so the PDF can still qualify that synthesis as one
// traditional interpretation and a reflection prompt - never proof of
// ability, superiority, destiny, or a guaranteed outcome - without
// changing the shared sentence itself.
const LOSHU_SYNTHESIS_QUALIFIER =
  'This reflects one traditional numerology interpretation of your Lo Shu pattern - offered as an optional prompt for self-reflection, not as proof of ability, superiority, a fixed destiny, or a guaranteed outcome.';

// Introduction page ("Understanding Your Numerology Blueprint") - static
// copy condensed from the approved source document "Astro Matrix -
// Understanding Your Numerology Blueprint.docx" (AstroMatrix "Birth Chart
// PDF Content and Page Flow" task) to fit one A4 page, while preserving its
// four main ideas (card headings below match the document's own four
// section titles) and its explanation of Pythagorean numerology, the
// separate Lo Shu Grid, the Planes of Expression, and the report's
// self-reflection purpose. Never names or implies any other numerology
// system, never claims scientific validity, and never promises an outcome -
// consistent with the non-negotiable product decision and the tone already
// used everywhere else in this report (SWOT_DISCLAIMER,
// LOSHU_SYNTHESIS_QUALIFIER above). INTRO_DISCLAIMER_TEXT preserves the
// source document's own disclaimer sentence near verbatim, and - since it
// now covers the general case - replaces the narrower, Personal-Pattern-
// Review-specific SWOT_DISCLAIMER that previously stood in for it on this
// page (SWOT_DISCLAIMER itself is unchanged, and still renders in its own,
// correct place before "Your Personal Pattern Review").
//
// AstroMatrix "Birth Chart PDF Natural-Flow Introduction Cards" task: the
// four cards previously read as unnaturally uniform not because of any
// fixed height, line-clamp, or forced line break (none existed - see the
// "layout polish" task above, and the regression test covering this in
// reportHtml.test.ts) but because all four paragraphs had independently
// been condensed down to a very similar character count when this page
// was first fit onto one sheet - at this card width, near-equal character
// counts produce near-equal line counts, which reads as an artificially
// uniform block regardless of the CSS. Each card below now restores one
// genuine sentence the original condensing pass had cut (always sourced
// from the same approved document, never new claims), so the four cards
// vary naturally in length the way the source document's own four
// sections already do - "How AstroMatrix Builds Your Birth Chart" covers
// three distinct systems and is genuinely the longest, for instance.
const INTRO_MEANING_TEXT =
  'Numerology is a traditional system of interpretation that explores the symbolic meanings associated with numbers and their relationship to a name and date of birth. AstroMatrix uses the Pythagorean numerology system, rooted in the ancient Greek tradition, which assigns a value to each letter and uses it to calculate numbers from your name and birth date. Rather than looking at a single number in isolation, this approach brings several numerical perspectives together, so different numbers can be read alongside one another to form a broader picture for reflection.';
const INTRO_BUILD_TEXT =
  'Your birth chart begins with calculations from your date of birth and name, producing your five Core Numbers - Life Path, Destiny, Soul Urge, Personality, and Birthday - each a different traditional perspective. Your date of birth also builds the Lo Shu Grid, a traditional 3x3 arrangement showing which numbers are present, repeated, or absent, and from it, six Planes of Expression group positions into themes such as thinking, feeling, action, planning, persistence, and turning intentions into results. Together, these elements form a structured interpretation of your numerology profile - the calculations provide the framework, and the explanations that follow help you explore the traditional meanings behind them.';
const INTRO_PURPOSE_TEXT =
  'Your AstroMatrix Birth Chart is designed to help you pause, reflect, and look at yourself from several traditional perspectives - qualities you may draw on, areas you may wish to develop, patterns worth noticing, and practical ways to turn reflection into action. The aim is not to label you or predict a fixed future, but to offer a framework for self-understanding - you remain free to decide which interpretations resonate with your own experience. You might use it to ask which qualities you already draw on, which habits you would like to understand more fully, or how to turn an intention into a small, practical step.';
const INTRO_HOW_TO_READ_TEXT =
  'Read this report with curiosity rather than as a set of rules - notice the connections between sections, reflect on your own experience, and choose practical actions that make sense for your circumstances.';
const INTRO_DISCLAIMER_TEXT =
  'Numerology is a traditional interpretive practice, not a scientifically established method for determining personality, predicting events, or guaranteeing outcomes. Your numbers do not define your abilities or limit your possibilities - your choices, experiences, and actions remain what matters most.';
const INTRO_CLOSING_TEXT =
  'Use this blueprint as a companion for reflection - a way to explore possibilities, build on qualities you value, and approach areas for growth with greater awareness.';

// Short, concise section introductions (AstroMatrix "Birth Chart PDF
// Content and Page Flow" task, Step 3) - one per major section heading,
// deliberately brief and never duplicating the detailed interpretation
// that follows each one.
const CORE_NUMBERS_SECTION_INTRO =
  'Your five Core Numbers each offer a different traditional perspective - on your life direction, natural abilities, inner motivations, outward expression, and the qualities tied to your particular day of birth.';
const LOSHU_SECTION_INTRO =
  'Your Lo Shu Grid is a separate traditional framework based on your date of birth. It places every digit of your birth date onto a fixed grid and looks at which numbers are present, repeated, or absent.';
const PLANES_SECTION_INTRO =
  'The six Planes of Expression group specific positions on your Lo Shu Grid into broader themes - thinking, feelings, action, planning, persistence, and turning intentions into results.';

// "Applying Your Blueprint to Life" - new section (Stage 3) that relocates
// (not duplicates) each Core Number's existing `howToUse` text, previously
// rendered inline inside every core-number card. No new interpretation: the
// paragraphs themselves are unchanged, only where they render.
const APPLYING_BLUEPRINT_INTRO =
  'A few ways you might carry each of your Core Numbers into daily life - offered as optional starting points, not instructions.';

// Static closing encouragement, "Summary" page (AstroMatrix "Birth Chart
// PDF Closing Summary" task) - deliberately not data-driven, the same way
// PATTERNS_TO_NOTICE_TEXT is a general, non-personalized reflection rather
// than one built from this profile's own numbers.
const CLOSING_ENCOURAGEMENT_TEXT =
  "This chart is best treated as a starting point for reflection, not a fixed definition of who you are. Keep whatever feels true to you, and feel free to set aside anything that doesn't - you know your own life better than any chart can. Your choices, experiences, relationships, and effort matter far more than any number. If something here resonates, a small, realistic step taken this week is often enough to turn a reflection into real progress.";

/**
 * Builds the full report HTML. Pure and deterministic - the same `report`
 * (and `logoDataUri`) always produces the same HTML.
 *
 * `logoDataUri` - the AstroMatrix logo as a `data:image/...;base64,...`
 * string, or `null`/`undefined` if it couldn't be loaded (see
 * `src/features/report/exportReport.ts`'s `resolveLogoDataUri()`) - is
 * accepted as a plain string so this module never touches
 * `expo-asset`/`expo-image-manipulator` itself. Rendered on the cover page
 * when present; the cover's own motif/typography carry the page on their
 * own when it is not, so a missing logo never leaves the cover looking
 * broken or empty (Stage 3 requirement).
 */
export function buildReportHtml(report: BirthChartReport, logoDataUri?: string | null): string {
  const {
    profile,
    numerology,
    loShu,
    expressionPlanes,
    coreNumberSummary,
    coreNumberSections,
    loShuSummary,
    swotReflection,
    loShuInterpretation,
    planeInterpretations,
    patternConnections,
    closingSummary,
  } = report;

  // --- Cover page ---
  const coverTheme = coreNumberSummary.overarchingThemes.length
    ? `A reflection on ${joinReadable(coreNumberSummary.overarchingThemes)}.`
    : '';
  // The approved logo (assets/icon.png) already has two concentric circles
  // baked into its own artwork - rendering `.cover-motif` (a separate,
  // purely decorative CSS circle pair) at the same time produced visibly
  // duplicated circles around the logo. `.cover-motif` now renders only as
  // a fallback when there is no logo image to show, so the cover never
  // looks empty/unbalanced without one (unchanged from before); when the
  // real logo is present, only the logo's own artwork renders.
  const coverHtml = `
    <div class="cover-page">
      ${!logoDataUri ? `<div class="cover-motif" aria-hidden="true"></div>` : ''}
      ${logoDataUri ? `<div class="cover-logo-frame"><img class="cover-logo" src="${logoDataUri}" alt="AstroMatrix" /></div>` : ''}
      <p class="cover-wordmark">AstroMatrix</p>
      <h1 class="cover-title">Your Personal Birth Chart</h1>
      <p class="cover-name">${escapeHtml(profile.fullName)}</p>
      <p class="cover-dob">Born ${escapeHtml(formatDDMonthYYYY(profile.dob))}</p>
      ${coverTheme ? `<p class="cover-theme">${escapeHtml(coverTheme)}</p>` : ''}
    </div>
  `;

  // --- Introduction page ---
  // Condensed to fit one A4 page (see INTRO_* constants' own doc comment
  // above) - four cards, matching the approved source document's own four
  // main ideas in the same order.
  const introHtml = `
    <div class="intro-page">
      <h2>Understanding Your Numerology Blueprint</h2>
      <div class="intro-card">
        <h3>The Meaning Behind the Numbers</h3>
        <p>${escapeHtml(INTRO_MEANING_TEXT)}</p>
      </div>
      <div class="intro-card">
        <h3>How AstroMatrix Builds Your Birth Chart</h3>
        <p>${escapeHtml(INTRO_BUILD_TEXT)}</p>
      </div>
      <div class="intro-card">
        <h3>The Purpose of Your Personal Birth Chart</h3>
        <p>${escapeHtml(INTRO_PURPOSE_TEXT)}</p>
      </div>
      <div class="intro-card">
        <h3>A Helpful Way to Read This Report</h3>
        <p>${escapeHtml(INTRO_HOW_TO_READ_TEXT)}</p>
        <p class="general-note">${escapeHtml(INTRO_DISCLAIMER_TEXT)}</p>
        <p>${escapeHtml(INTRO_CLOSING_TEXT)}</p>
      </div>
    </div>
  `;

  // Core-number cards no longer render `howToUse` inline (Stage 3 - see
  // "Applying Your Blueprint to Life" below, where it renders once instead).
  const coreNumberSectionsHtml = CORE_NUMBERS.map(({ key, title }) => {
    const value = numerology[key];
    const section = coreNumberSections[key];
    return `
      <div class="core-number">
        <h3>${escapeHtml(title)}: <span class="value-highlight">${escapeHtml(String(value))}</span></h3>
        <p class="represents">${escapeHtml(section.represents)}</p>
        <p class="your-interpretation">${escapeHtml(section.yourInterpretation)}</p>
        ${section.showsUpAs.length ? `<h4>How It May Show Up</h4>${renderList(section.showsUpAs)}` : ''}
        ${section.strengths.length ? `<h4>Natural Strengths</h4>${renderList(section.strengths)}` : ''}
        ${section.mindfulOf.length ? `<h4>Things to Be Mindful Of</h4>${renderList(section.mindfulOf)}` : ''}
      </div>
    `;
  }).join('');

  // "Applying Your Blueprint to Life" (Stage 3, new) - every Core Number's
  // `howToUse` text, relocated here (not duplicated - removed from the card
  // above) and grouped together under one heading.
  const applyItemHtml = ({ key, title }: (typeof CORE_NUMBERS)[number]): string => `
      <div class="apply-item">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(coreNumberSections[key].howToUse)}</p>
      </div>
    `;

  // AstroMatrix "Final Birth Chart PDF Layout Fix" task: the first Core
  // Number's card now joins the heading and intro inside `.apply-lead`,
  // the same pattern already used for "Your Planes of Expression"
  // (`.planes-lead`) and each SWOT subsection (`.swot-lead`) - so this
  // section can never leave its heading and intro stranded at the bottom
  // of a page with no related content; a page break before this point now
  // prefers to carry the whole heading+intro+first-card block to the next
  // page instead. `.apply-lead`'s own break-inside:avoid already handles
  // this (no new page-break-before needed - see its own doc comment
  // below). The remaining four cards keep their own independent
  // `.apply-item` (unchanged, already break-inside:avoid) and are free to
  // flow across pages - personalized `howToUse` text can be longer or
  // shorter for any user without changing this behavior.
  const applyingBlueprintHtml = `
    <div class="apply-lead">
      <h2>Applying Your Blueprint to Life</h2>
      <p class="general-note">${escapeHtml(APPLYING_BLUEPRINT_INTRO)}</p>
      ${applyItemHtml(CORE_NUMBERS[0])}
    </div>
    ${CORE_NUMBERS.slice(1).map(applyItemHtml).join('')}
  `;

  // Each of the six planes, in the same canonical order as `expressionPlanes`
  // (and therefore `planeInterpretations`, built from the same list in
  // report.ts) - a plane card: name, mini-grid, existing description
  // (reused verbatim), pattern-specific interpretation, and present/missing
  // numbers. `planeInterpretations[index]` is positionally matched to
  // `expressionPlanes[index]`; both always have exactly six entries, in the
  // same canonical order, built from the same source list in report.ts.
  const planeCardHtml = (presence: ExpressionPlanePresence, index: number): string => {
    const planeInterpretation = planeInterpretations[index];
    return `
      <div class="plane-card">
        <h3>${escapeHtml(presence.plane.name)}</h3>
        ${miniGridHtml(presence)}
        <p class="plane-description">${escapeHtml(planeInterpretation.description)}</p>
        <p class="plane-interpretation">${escapeHtml(planeInterpretation.interpretation)}</p>
        <p class="plane-presence">Present: ${presence.presentNumbers.join(', ') || 'None'} &middot; Missing: ${presence.missingNumbers.join(', ') || 'None'}</p>
      </div>
    `;
  };

  // The "Your Planes of Expression" heading and the first plane card are
  // wrapped together in one break-inside:avoid block (`.planes-lead`), the
  // same pattern already used for "How Your Patterns Connect" and each SWOT
  // subsection, so the section heading can never be separated from all of
  // its content by a page break. Each of the remaining five cards keeps its
  // own independent `.plane-card` (break-inside:avoid, so no single card is
  // ever split mid-content) but is otherwise free to start on a new page -
  // all six are never forced onto one page, and none is forced onto its own.
  const planesSectionHtml = `
    <div class="planes-lead">
      <h2>Your Planes of Expression</h2>
      <p>${escapeHtml(PLANES_SECTION_INTRO)}</p>
      ${planeCardHtml(expressionPlanes[0], 0)}
    </div>
    ${expressionPlanes.slice(1).map((presence, i) => planeCardHtml(presence, i + 1)).join('')}
  `;

  const connectionBlockHtml = (connection: (typeof patternConnections)[number]): string => `
    <div class="connection-block">
      <p>${escapeHtml(connection.text)}</p>
      <p class="reflection">${escapeHtml(connection.reflectionQuestion)}</p>
    </div>
  `;

  // Correction (final pagination polish task): previously only the heading
  // + first connection were grouped (`.connections-lead`), with any later
  // connection left as an independently-breakable `.connection-block`. A
  // real generated PDF showed that second-connection block itself split
  // mid-content across a page boundary despite its own `break-inside:
  // avoid` - so the whole section (heading + every connection) is now
  // grouped into one `break-inside:avoid` unit instead. This is safe to do
  // unconditionally, not just for small cases: `loShu.repeated` can hold at
  // most 4 distinct digits for any real date of birth (an 8-digit DDMMYYYY
  // sequence can pair into at most 4 repeated digits), so this section is
  // always a small, bounded block - "keep the whole section together" was
  // practical here, not a risk of excessive whitespace. Each
  // `.connection-block` keeps its own `break-inside:avoid` too (harmless,
  // redundant with the wrapper, and documents the same intent at the
  // per-connection level).
  const patternConnectionsSectionHtml = patternConnections.length
    ? `
      <div class="connections-lead">
        <h2>How Your Patterns Connect</h2>
        ${patternConnections.map(connectionBlockHtml).join('')}
      </div>
    `
    : '';

  // The heading, intro, and first item are wrapped together in one
  // break-inside:avoid block (`.swot-lead`) so the heading can never be
  // orphaned from its content; any remaining items render in a normal,
  // freely-breaking list after it - a long list is still allowed to flow
  // and break across a page boundary rather than being forced as a whole
  // onto one page.
  // `synthesis` (only ever passed for Strengths) renders as an additional
  // paragraph right after the intro, inside the same break-inside:avoid
  // lead block - it's what makes Strengths read as an integrated reflection
  // on the whole active-digit pattern, not just a list of isolated digits.
  const swotSectionHtml = (
    title: string,
    subtitle: string,
    intro: string,
    items: typeof swotReflection.strengths,
    synthesis?: string,
  ): string => {
    if (items.length === 0) return '';
    const [firstItem, ...restItems] = items;
    const restHtml = restItems.length
      ? `<ul>${restItems.map((item) => `<li>${escapeHtml(item.text)}</li>`).join('')}</ul>`
      : '';
    const synthesisHtml = synthesis ? `<p class="swot-synthesis">${escapeHtml(synthesis)}</p>` : '';
    return `
      <div class="swot-lead">
        <h3>${escapeHtml(title)}</h3>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
        <p>${escapeHtml(intro)}</p>
        ${synthesisHtml}
        <ul><li>${escapeHtml(firstItem.text)}</li></ul>
      </div>
      ${restHtml}
    `;
  };

  // "Patterns to Notice" is deliberately not built from `swotSectionHtml`
  // (which expects a digit-keyed item list) - its content is fixed, static
  // text (see PATTERNS_TO_NOTICE_TEXT's own doc comment above), so it gets
  // its own small render block instead, still wrapped in the same
  // break-inside:avoid `.swot-lead` pattern for pagination consistency.
  const patternsToNoticeHtml = `
    <div class="swot-lead">
      <h3>Patterns to Notice</h3>
      <p class="subtitle">${escapeHtml(SWOT_PATTERNS_TO_NOTICE_SUBTITLE)}</p>
      <p class="general-note">${escapeHtml(PATTERNS_TO_NOTICE_FRAMING)}</p>
      <p>${escapeHtml(PATTERNS_TO_NOTICE_TEXT)}</p>
      <p class="reflection">${escapeHtml(PATTERNS_TO_NOTICE_NOTE)}</p>
    </div>
  `;

  // "Your Personal Pattern Review" keeps its approved heading, disclaimer,
  // and three of its four original subsections. Opportunities (Stage 3) no
  // longer renders here - see "Practical Action Plan" below, where the same
  // swotSectionHtml() call (same heading, same subtitle, same intro, same
  // items) renders once instead of being duplicated in both places.
  const swotReflectionHtml = [
    swotSectionHtml('Strengths', SWOT_STRENGTHS_SUBTITLE, SWOT_STRENGTHS_INTRO, swotReflection.strengths, swotReflection.strengthsSynthesis),
    swotSectionHtml('Areas to Explore', SWOT_AREAS_TO_EXPLORE_SUBTITLE, SWOT_AREAS_TO_EXPLORE_INTRO, swotReflection.areasToExplore),
    patternsToNoticeHtml,
  ].join('');

  // "Practical Action Plan" (Stage 3, new) - Opportunities, relocated here
  // from "Your Personal Pattern Review" (not duplicated - removed from
  // there above). Omits itself (like the subsection always has) when
  // `opportunities` is empty.
  const actionPlanHtml = swotSectionHtml(
    'Opportunities',
    SWOT_OPPORTUNITIES_SUBTITLE,
    SWOT_OPPORTUNITIES_INTRO,
    swotReflection.opportunities,
  );
  const actionPlanSectionHtml = actionPlanHtml
    ? `
      <div class="action-plan-page">
        <h2>Practical Action Plan</h2>
        ${actionPlanHtml}
      </div>
    `
    : '';

  // "Summary" (renamed from "Your Personal Blueprint - Bringing It
  // Together" - AstroMatrix "Birth Chart PDF Quality Improvement" task, so
  // its distinct purpose from "Practical Action Plan" is unambiguous at a
  // glance) - the final section. Renders `closingSummary` fields exactly as
  // produced by `buildClosingSummary()` (src/core/report.ts); nothing here
  // recalculates or rephrases any of it. "Taking this blueprint forward"
  // subheading and the static `CLOSING_ENCOURAGEMENT_TEXT` paragraph are new
  // (AstroMatrix "Birth Chart PDF Closing Summary" task) - the encouragement
  // reuses the existing `.general-note` style (already used for SWOT_DISCLAIMER
  // and other framing notes) purely for visual separation from the two
  // paragraphs above it, not a new style.
  const closingHtml = `
    <div class="closing-page">
      <h2>Summary</h2>
      <h3>Taking this blueprint forward</h3>
      ${closingSummary.keyThemes ? `<p>${escapeHtml(closingSummary.keyThemes)}</p>` : ''}
      <p>${escapeHtml(closingSummary.patternConnection)}</p>
      <p class="general-note">${escapeHtml(CLOSING_ENCOURAGEMENT_TEXT)}</p>
      ${
        closingSummary.reflectionQuestions.length
          ? `<h4>Questions to Sit With</h4><ul>${closingSummary.reflectionQuestions.map((question) => `<li class="reflection">${escapeHtml(question)}</li>`).join('')}</ul>`
          : ''
      }
    </div>
  `;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(profile.fullName)} - AstroMatrix Report</title>
<style>
  /* AstroMatrix "Birth Chart PDF Quality Improvement" palette - deep indigo
     for major headings, AstroMatrix violet for Core Number values and
     selected highlights, soft blue for card backgrounds/accents, warm
     cream for page backgrounds, dark high-contrast body text. Chosen to
     extend (not replace) the app's own existing violet (#5A459D, already
     used for mini-grid highlights/subtitles below, which this palette's
     violet closely matches) rather than introduce a clashing second
     identity. Restrained deliberately: only headings, values, and card
     backgrounds carry colour - ordinary body text stays dark/neutral for
     comfortable reading on both a phone screen and a printed page. */
  /* AstroMatrix "Birth Chart PDF Natural-Flow Introduction Cards" task: the
     page's top/bottom/left/right margin now comes from the @page rule (the
     CSS Paged Media page-box margin) instead of body's own margin. A
     margin on an in-flow box like body is only guaranteed at that box's
     own edges, not repeated at every page fragment when the box's content
     spans multiple printed pages - @page margin is applied once per
     physical page regardless of what starts it, which is what every page
     of this multi-page report actually needs. */
  @page { margin: 32px; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1C1917; background: #F6F5F2; margin: 0; line-height: 1.6; font-size: 13px; }
  h1 { font-size: 24px; margin-bottom: 4px; color: #263A70; }
  h2 { font-size: 20px; margin-top: 32px; border-bottom: 2px solid #DCE5F5; padding-bottom: 6px; color: #263A70; font-weight: 700; }
  h3 { font-size: 16px; margin-bottom: 2px; color: #263A70; }
  h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px; color: #57534E; margin: 10px 0 2px; }
  p { margin: 4px 0; }
  ul { margin: 2px 0 8px; padding-left: 20px; }
  /* Report-identification line (name, date of birth, system) - AstroMatrix
     "Birth Chart PDF Layout Polish" task: previously inherited the body's
     13px/normal-weight text with only a 16px bottom margin, which read too
     much like a section heading sitting right above "Your Five Core
     Numbers". Now a deliberately subtle, smaller, explicitly regular-weight
     line, with its own top margin zeroed so it sits flush with the page's
     top margin instead of the extra, inconsistent gap a heading's own
     margin-top would otherwise add (see also the page-start headings
     below).
     AstroMatrix "Birth Chart PDF Metadata Styling" task: within that one
     line, the name/DOB/system now carry their own distinct emphasis instead
     of rendering as one uniform run of text - the name in bold AstroMatrix
     blue (the same deep indigo already used for every major heading, so no
     new colour is introduced), the date of birth unchanged (regular
     weight, muted charcoal/grey - .meta's own base style), and the
     system label smaller still and italic, matching the subtle,
     already-established .general-note treatment used elsewhere in this
     report. .meta itself keeps its base style as the fallback for the
     plain "&middot;" separators between them. */
  .meta { font-size: 11px; font-weight: 400; color: #57534E; margin: 0 0 20px; }
  .meta-name { font-size: 13px; font-weight: 700; color: #263A70; }
  .meta-dob { font-size: 11px; font-weight: 400; color: #57534E; }
  .meta-system { font-size: 10px; font-weight: 400; font-style: italic; color: #57534E; }
  .value-highlight { color: #7250C8; font-weight: 700; }
  /* Core Number cards: consistent card treatment (soft-blue-bordered,
     white, rounded) matching the intro/apply cards below.
     AstroMatrix "Birth Chart PDF Layout Polish" task: the whole-card
     break-inside:avoid previously here (added to fix a reported bug
     where a core-number interpretation split mid-sentence) was the actual
     cause of the excessive gaps reported between Life Path, Destiny, and
     Soul Urge - a card this size (heading, two prose paragraphs, three
     short lists) is often close to half a page, so whenever one didn't
     fit in the space remaining on the current page, treating it as one
     atomic ~400px block pushed the ENTIRE card onto a fresh page, leaving
     most of the previous page blank. Protection is now scoped to just the
     two prose paragraphs (.represents/.your-interpretation - where the
     original mid-sentence split actually happened) and each short list,
     so a card can still split BETWEEN those pieces without ever splitting
     WITHIN one. box-decoration-break:clone makes the card's own
     background/border redraw in full on both sides of such a split,
     instead of looking like an unclosed box. */
  .core-number { background: #FFFFFF; border: 1px solid #DCE5F5; border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  .core-number p.represents, .core-number p.your-interpretation { break-inside: avoid; page-break-inside: avoid; }
  .core-number ul { break-inside: avoid; page-break-inside: avoid; }
  /* Pagination: never leave a heading as the last line on a page - pairs
     with the specific break-inside:avoid blocks below (grid+legend, each
     core-number prose block and list, each plane card, each SWOT
     subsection's lead, each pattern connection) to keep a heading with at
     least its first line of content. Deliberately not applied to every
     section wholesale - a long list (e.g. many present/missing numbers) is
     still allowed to flow and break normally across a page boundary, so a
     large section is never forced entirely onto one page or pushed as a
     whole onto a fresh one. */
  h2, h3, h4 { break-after: avoid; page-break-after: avoid; }

  /* Cover page: a restrained motif (two concentric circles, echoing the
     existing AstroMatrix logo/grid identity) always renders, whether or
     not the logo image itself loaded, so the cover never looks empty or
     unbalanced when logoDataUri is null. Logo enlarged substantially
     (96px -> 160px) and given a white card behind it for contrast against
     the cream page background, per the explicit "not sufficiently
     visible" complaint - sized well under the title so it reads as a
     mark above the title, not a competing focal point. */
  .cover-page { page-break-after: always; text-align: center; padding: 120px 40px 40px; position: relative; min-height: 500px; }
  .cover-motif { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 320px; height: 320px; border-radius: 50%; border: 2px solid #DCE5F5; z-index: 0; }
  .cover-motif::after { content: ''; position: absolute; top: 48px; left: 48px; right: 48px; bottom: 48px; border-radius: 50%; border: 2px solid #DCE5F5; }
  .cover-logo-frame { position: relative; width: 176px; height: 176px; margin: 0 auto 14px; border-radius: 24px; background: #FFFFFF; border: 1px solid #DCE5F5; box-shadow: 0 2px 10px rgba(38, 58, 112, 0.12); display: flex; align-items: center; justify-content: center; z-index: 1; }
  .cover-logo { width: 150px; height: 150px; }
  .cover-wordmark { position: relative; font-size: 14px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #7250C8; z-index: 1; margin-top: 10px; }
  .cover-title { position: relative; font-size: 30px; margin: 8px 0 24px; color: #263A70; z-index: 1; }
  .cover-name { position: relative; font-size: 18px; font-weight: 600; margin: 4px 0; color: #1C1917; z-index: 1; }
  .cover-dob { position: relative; color: #57534E; margin-bottom: 20px; z-index: 1; }
  .cover-theme { position: relative; font-style: italic; color: #44403A; max-width: 420px; margin: 0 auto; z-index: 1; }

  /* Introduction page - condensed to fit one A4 page (AstroMatrix "Birth
     Chart PDF Content and Page Flow" task), so card margins are slightly
     tighter than other card types below. */
  .intro-page { page-break-after: always; }
  .intro-card { background: #FFFFFF; border: 1px solid #DCE5F5; border-radius: 10px; padding: 12px 16px; margin: 8px 0; break-inside: avoid; page-break-inside: avoid; }

  /* "Your Five Core Numbers": starts on a new page already (it follows
     .intro-page's own page-break-after:always), so this only keeps the
     heading and its new short introduction together - no page-break-before
     of its own needed. */
  .core-numbers-lead { break-inside: avoid; page-break-inside: avoid; }

  /* "Your Lo Shu Grid": AstroMatrix "Birth Chart PDF Content and Page Flow"
     task - previously had no section-level break, so it could start
     mid-page right after "Your Combined Core Profile". Groups the heading,
     its new short introduction, the counts/missing/repeated summary, and
     the grid itself (a small, bounded block - safe to keep whole) into one
     unit that always starts its own page. */
  .loshu-lead { page-break-before: always; break-inside: avoid; page-break-inside: avoid; }
  .loshu-grid-block { break-inside: avoid; page-break-inside: avoid; }
  table.loshu-grid { border-collapse: collapse; margin: 10px 0; }
  table.loshu-grid td { width: 56px; height: 56px; text-align: center; vertical-align: middle; border: 1px solid #D6D3CE; }
  table.loshu-grid .digit { display: block; font-size: 18px; font-weight: 700; }
  table.loshu-grid .count { display: block; font-size: 10px; color: #57534E; }
  table.loshu-grid td.missing { background: #F5F3EF; color: #A8A29E; }
  table.loshu-grid td.present { background: #DCE5F5; }
  table.loshu-grid td.repeated { background: #D6C6F2; }
  .legend { font-size: 12px; color: #57534E; }
  .legend-swatch { display: inline-block; width: 10px; height: 10px; margin: 0 4px 0 10px; border-radius: 2px; vertical-align: middle; }
  .legend-swatch.present { background: #DCE5F5; border: 1px solid #7250C8; }
  .legend-swatch.missing { background: #F5F3EF; border: 1px solid #D6D3CE; }
  .legend-swatch.repeated { background: #D6C6F2; border: 1px solid #7250C8; }

  /* Plane mini-grids: substantially enlarged (22px cells -> 44px) for
     print/mobile readability, per the explicit "too small and difficult to
     read" complaint. Each of the plane's own three cells also carries a
     small text mark (PRESENT/missing), not just a background colour - see
     miniGridHtml()'s own doc comment - so presence is never colour-only. */
  table.mini-grid { border-collapse: collapse; margin: 10px 0; }
  table.mini-grid td { width: 44px; height: 44px; text-align: center; vertical-align: middle; border: 1px solid #EDEBE6; }
  table.mini-grid .mini-digit { display: block; font-size: 16px; font-weight: 700; }
  table.mini-grid .mini-mark { display: block; font-size: 7px; text-transform: uppercase; letter-spacing: 0.3px; }
  table.mini-grid td.outside { background: #F5F3EF; color: #C2BDB5; }
  table.mini-grid td.present { background: #D6C6F2; color: #263A70; border-color: #7250C8; border-width: 2px; }
  table.mini-grid td.present .mini-mark { color: #7250C8; font-weight: 700; }
  table.mini-grid td.missing-in-plane { background: #FFFFFF; color: #57534E; border-color: #7250C8; border-width: 2px; }
  table.mini-grid td.missing-in-plane .mini-mark { color: #8C8378; }
  /* Plane cards: consistent card treatment with the other card types above,
     and - "ensure each plane's title, description, present/missing
     numbers, and interpretation remain visually connected" - everything
     for one plane now sits inside one visually bounded card instead of
     plain, unbounded flow. */
  .plane-card { background: #FFFFFF; border: 1px solid #DCE5F5; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px; break-inside: avoid; page-break-inside: avoid; }
  /* AstroMatrix "Birth Chart PDF Content and Page Flow" task: added
     page-break-before so "Your Planes of Expression" always starts its own
     page, like "Your Lo Shu Grid" above, instead of starting mid-page
     right after "Putting the Pattern Together". */
  .planes-lead { page-break-before: always; break-inside: avoid; page-break-inside: avoid; }
  .reflection { font-style: italic; color: #57534E; }
  .connection-block { margin-bottom: 12px; break-inside: avoid; page-break-inside: avoid; }
  .connections-lead { break-inside: avoid; page-break-inside: avoid; }
  .swot-lead { break-inside: avoid; page-break-inside: avoid; }
  .swot-synthesis { font-weight: 600; }
  .subtitle { font-size: 12px; font-weight: 600; color: #7250C8; text-transform: uppercase; letter-spacing: 0.3px; margin: 0 0 4px; }
  .general-note { font-size: 12px; font-style: italic; color: #57534E; }

  /* "Applying Your Blueprint to Life". AstroMatrix "Final Birth Chart PDF
     Layout Fix" task: .apply-lead now wraps the heading, intro, and first
     Core Number's card together (previously just the heading and intro),
     so the heading and intro can no longer be stranded at the bottom of a
     page with none of their related content - a page break before this
     point now carries the whole block to the next page instead. */
  .apply-lead { break-inside: avoid; page-break-inside: avoid; }
  .apply-item { background: #FFFFFF; border: 1px solid #DCE5F5; border-radius: 10px; padding: 12px 16px; margin: 10px 0; break-inside: avoid; page-break-inside: avoid; }

  /* "Practical Action Plan" - a visually distinct card background (soft
     blue) from "Summary" below, reinforcing that the two sections serve
     different purposes even though both appear near the end of the
     report. */
  .action-plan-page { background: #DCE5F5; border-radius: 12px; padding: 4px 18px 18px; margin-top: 24px; }
  .action-plan-page h2 { border-bottom-color: #263A70; }

  /* Summary page (renamed from "Your Personal Blueprint - Bringing It
     Together"): a clearly separate, dedicated final page. */
  .closing-page { page-break-before: always; }

  /* Consistent top spacing (AstroMatrix "Birth Chart PDF Layout Polish"
     task): every one of these blocks is the first thing on a freshly
     started page (.intro-page follows .cover-page's own page-break-after;
     the other three each carry their own page-break-before). Their first
     heading would otherwise still carry the global h2 rule's own
     margin-top: 32px, stacking inconsistently on top of whatever margin
     the page break itself produces - the reported cause of pages starting
     too close to the top. Zeroing it here means every one of these pages
     relies on exactly the same, single top margin as every other page. */
  .intro-page > h2:first-child,
  .loshu-lead > h2:first-child,
  .planes-lead > h2:first-child,
  .closing-page > h2:first-child {
    margin-top: 0;
  }
</style>
</head>
<body>
  ${coverHtml}
  ${introHtml}

  <p class="meta"><span class="meta-name">${escapeHtml(profile.fullName)}</span> &middot; <span class="meta-dob">Date of Birth: ${escapeHtml(formatDDMonthYYYY(profile.dob))}</span> &middot; <span class="meta-system">Pythagorean numerology</span></p>

  <div class="core-numbers-lead">
    <h2>Your Five Core Numbers</h2>
    <p>${escapeHtml(CORE_NUMBERS_SECTION_INTRO)}</p>
  </div>
  ${coreNumberSectionsHtml}

  <h2>Your Combined Core Profile</h2>
  <p>${escapeHtml(coreNumberSummary.paragraph)}</p>
  ${renderList(coreNumberSummary.overarchingThemes)}

  <div class="loshu-lead">
    <h2>Your Lo Shu Grid</h2>
    <p>${escapeHtml(LOSHU_SECTION_INTRO)}</p>
    <p>Counts: ${Object.entries(loShu.counts).map(([digit, count]) => `${digit}&times;${count}`).join(', ')}</p>
    <p>Missing: ${loShu.missing.join(', ') || 'None'}</p>
    <p>Repeated: ${loShu.repeated.join(', ') || 'None'}</p>
    <div class="loshu-grid-block">
      ${fullGridHtml(loShu)}
      <p class="legend">Legend:
        <span class="legend-swatch present"></span>Present
        <span class="legend-swatch repeated"></span>Repeated
        <span class="legend-swatch missing"></span>Missing
      </p>
    </div>
  </div>

  <h3>Your Lo Shu Pattern</h3>
  <p>${escapeHtml(loShuInterpretation.yourPattern)}</p>

  ${labeledItemListHtml('Numbers Present and Repeated', loShuInterpretation.numbersPresent)}
  ${labeledItemListHtml('Numbers for Conscious Attention', loShuInterpretation.consciousAttention)}
  ${labeledTextListHtml('Traditional Grid Patterns', loShuInterpretation.traditionalPatterns)}

  <h3>Putting the Pattern Together</h3>
  <p>${escapeHtml(loShuSummary)} ${escapeHtml(LOSHU_SYNTHESIS_QUALIFIER)}</p>

  ${planesSectionHtml}

  ${patternConnectionsSectionHtml}

  <h2>Your Personal Pattern Review</h2>
  <p>${escapeHtml(SWOT_DISCLAIMER)}</p>
  ${swotReflectionHtml}

  ${applyingBlueprintHtml}

  ${actionPlanSectionHtml}

  ${closingHtml}
</body>
</html>`;
}
