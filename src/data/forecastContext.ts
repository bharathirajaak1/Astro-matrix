/**
 * Forecast personalization content layer.
 *
 * Final mapping:
 * - 'day'   -> Soul Urge (inner motivation/values)
 * - 'week'  -> Personality (outward impression/communication/interaction)
 * - 'month' -> Destiny (abilities/expression)
 * - 'year'  -> Life Path (broader direction/personal development)
 *
 * Pure content, no calculation: this never recalculates, reduces, or alters
 * any numerology value. It takes the already-built `NumerologyReport` (from
 * `buildNumerologyReport()` in `src/core/numerology.ts`) and reuses the exact
 * short theme phrases already established in the Personal Core Summary
 * system (`summaryThemeFor` in `./coreNumberContent`) - never a second
 * Soul Urge, Personality, Destiny, or Life Path meaning table, and never the
 * full `yourInterpretation` paragraph from any card.
 *
 * Soul Urge / Personality / Destiny / Life Path are additive context only,
 * never the primary forecast number - Personal Day/Week/Month/Year remain
 * that. This module and the Personal Day/Week/Month/Year engine in
 * `src/core/forecast.ts` are deliberately kept separate: different
 * numerology systems, never merged.
 */
import type { NumerologyReport } from '@/core/types';

import { summaryThemeFor } from './coreNumberContent';

export type ForecastContextPeriod = 'day' | 'week' | 'month' | 'year';

/**
 * A short, reflective sentence adding one relevant Blueprint Core Number as
 * a secondary, personal perspective alongside the active forecast period's
 * primary number. Deliberately written in plain, conversational language -
 * the user doesn't need to know these are two different calculations under
 * the hood; naming the Blueprint number by itself (Soul Urge/Personality/
 * Destiny/Life Path) is enough to keep the two perspectives distinct without
 * explaining the internal architecture every time.
 *
 * Returns `null` when no report is available (e.g. no profile yet) -
 * callers should simply omit the line rather than fabricate content.
 */
export function forecastBlueprintContext(
  report: NumerologyReport | null,
  period: ForecastContextPeriod,
): string | null {
  if (!report) return null;

  if (period === 'day') {
    const theme = summaryThemeFor('soulUrge', report.soulUrge);
    return (
      `Your Soul Urge adds another personal perspective for today. It highlights a pull toward ${theme}, ` +
      `which may be useful to keep in mind as the day unfolds.`
    );
  }

  if (period === 'week') {
    // Every PERSONALITY_SUMMARY_THEME entry is a predicate-adjective phrase
    // (e.g. "grounded and dependable", "intuitive and quietly striking"), so
    // "come across as <theme>" reads naturally for all of them - unlike a
    // noun-phrase connector such as "qualities such as <theme>".
    const theme = summaryThemeFor('personality', report.personality);
    return (
      `Your Personality adds another perspective for this week. It highlights how you may come across ` +
      `as ${theme}, which may be useful to keep in mind as you communicate and interact with others this week.`
    );
  }

  if (period === 'month') {
    // DESTINY_SUMMARY_THEME entries are a mix of noun phrases (e.g.
    // "self-direction and original thinking") and gerund phrases (e.g.
    // "bringing people and perspectives into alignment"), so there is no
    // single preposition ("ability to/for <theme>") that reads naturally
    // for all of them. "highlights <theme>" takes either shape directly as
    // its object, so it stays grammatical across every value; "abilities"
    // and "opportunities" are kept in the surrounding sentence instead of
    // at the insertion point.
    const theme = summaryThemeFor('destiny', report.destiny);
    return (
      `Your Destiny adds another perspective for this month. It highlights ${theme}, which may be useful ` +
      `as you think about your abilities and explore new opportunities this month.`
    );
  }

  const theme = summaryThemeFor('lifePath', report.lifePath);
  return (
    `Your Life Path adds a broader perspective for the year. It highlights ${theme}, which may be ` +
    `useful to keep in mind as you make choices and pursue your goals this year.`
  );
}
