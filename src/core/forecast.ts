/**
 * Daily forecast engine: personal year / month / day cycles plus deterministic
 * message selection. Pure TypeScript, zero dependencies.
 */
import { formatISODate, parseISODate, reduceNumber } from './numerology';
import type { CalendarDate } from './numerology';
import type { Digit, Forecast, ForecastFocus, Profile } from './types';

// ---------------------------------------------------------------------------
// Personal cycles
// ---------------------------------------------------------------------------

export interface PersonalNumbers {
  personalYear: Digit;
  personalMonth: Digit;
  personalDay: Digit;
}

const reduceToDigit = (n: number): Digit => reduceNumber(n, false).value as Digit;

/**
 * Personal Year  = reduce(birthDay) + reduce(birthMonth) + reduce(targetYear)
 * Personal Month = reduce(personalYear + targetMonth)
 * Personal Day   = reduce(personalMonth + targetDay)
 *
 * Master numbers are always reduced for forecast math.
 */
export function personalNumbers(dob: string, onDate: string): PersonalNumbers {
  const birth = parseISODate(dob);
  const target = parseISODate(onDate);
  const personalYear = reduceToDigit(
    reduceNumber(birth.day, false).value +
      reduceNumber(birth.month, false).value +
      reduceNumber(target.year, false).value,
  );
  const personalMonth = reduceToDigit(personalYear + target.month);
  const personalDay = reduceToDigit(personalMonth + target.day);
  return { personalYear, personalMonth, personalDay };
}

export const personalYear = (dob: string, onDate: string): Digit =>
  personalNumbers(dob, onDate).personalYear;
export const personalMonth = (dob: string, onDate: string): Digit =>
  personalNumbers(dob, onDate).personalMonth;
export const personalDay = (dob: string, onDate: string): Digit =>
  personalNumbers(dob, onDate).personalDay;

// ---------------------------------------------------------------------------
// Deterministic selection (stable hash -> index)
// ---------------------------------------------------------------------------

/** FNV-1a over the string, then modulo. Same seed + size -> same index, always. */
export function stableIndex(seed: string, size: number): number {
  if (size <= 1) return 0;
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % size;
}

// ---------------------------------------------------------------------------
// Message pools (default content; the UI can pass richer pools from src/data)
// ---------------------------------------------------------------------------

export interface MessageEntry {
  headline: string;
  body: string;
}

export type MessagePools = Readonly<Record<number, readonly MessageEntry[]>>;

/**
 * Digit -> focus category. Despite the name (kept for compatibility with the
 * existing `buildForecast` Day path), this is purely a digit lookup - it is
 * reused unchanged for Personal Week/Month/Year's own primary digit below.
 */
export const FOCUS_BY_DAY: Readonly<Record<Digit, ForecastFocus>> = {
  1: 'action',
  2: 'connect',
  3: 'create',
  4: 'plan',
  5: 'action',
  6: 'connect',
  7: 'rest',
  8: 'action',
  9: 'rest',
};

export const DEFAULT_MESSAGE_POOLS: MessagePools = {
  1: [
    {
      headline: 'Plant The First Seed',
      body: 'Today may be a good time to start something you have been circling. Take the first step and let momentum carry the rest.',
    },
    {
      headline: 'Lead From The Front',
      body: 'You may find it easier than usual to make a decision yourself today, rather than waiting for consensus.',
    },
  ],
  2: [
    {
      headline: 'Move At The Speed Of Trust',
      body: 'Today may ask for patience and partnership. Try listening twice before responding, and let a relationship carry some of the work.',
    },
    {
      headline: 'Small Gestures Land Hard',
      body: 'Diplomacy may work better than force today. A quiet word can settle more than a loud one.',
    },
  ],
  3: [
    {
      headline: 'Say It Out Loud',
      body: 'Today may be a good time to communicate an idea, have an open conversation, or spend time on something creative. Choose one thing you want to express and give it some attention.',
    },
    {
      headline: 'Let It Stay Light',
      body: 'Notice if you are forcing an idea instead of letting it develop naturally. Creative energy tends to flow best today when you stay relaxed rather than pushing too hard.',
    },
  ],
  4: [
    {
      headline: 'Build The Foundation',
      body: 'Today may favour structure. You might find it useful to tidy up a plan, finish some admin, or put one piece firmly in place.',
    },
    {
      headline: 'Steady Beats Fast',
      body: 'Progress today may come from handling details well. Slow, deliberate effort tends to compound over time.',
    },
  ],
  5: [
    {
      headline: 'Follow The Change',
      body: 'Today may bring some movement or unexpected options. Staying open to a detour could work in your favour.',
    },
    {
      headline: 'Break One Routine',
      body: 'Notice any restlessness today - it may be useful information. A small change to a fixed habit could open something new.',
    },
  ],
  6: [
    {
      headline: 'Tend What Matters',
      body: "Today may draw your attention toward home, care, and responsibility. Showing up for someone and putting things in order could feel especially worthwhile.",
    },
    {
      headline: 'Repair A Connection',
      body: "A small act of service today may mend more than it costs. Notice if there's a connection worth tending to.",
    },
  ],
  7: [
    {
      headline: 'Go Quiet And Look Inward',
      body: 'Today may reward reflection over hustle. You might find it useful to step back, read, rest, or simply let an answer surface in its own time.',
    },
    {
      headline: 'Trust The Pause',
      body: 'Not every day calls for output. Today may be better suited to studying a question than forcing a reply.',
    },
  ],
  8: [
    {
      headline: 'Own The Outcome',
      body: 'Today may favour ambition and clear decisions. You might find it a good day to handle money, negotiate, or take charge of something that matters.',
    },
    {
      headline: 'Aim Past Comfort',
      body: 'Decisive action may serve you well today. Consider making the call you have been putting off.',
    },
  ],
  9: [
    {
      headline: 'Let Something End',
      body: 'Today may be well suited to completion and release. You might find it useful to close a loop, let something go, or clear space for what comes next.',
    },
    {
      headline: 'Zoom Out',
      body: 'The wider view may matter more than any single task today. Consider what you can finish, forgive, or release.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Forecast assembly
// ---------------------------------------------------------------------------

export interface ForecastOptions {
  /** Override the default message pools (e.g. localized copy from src/data). */
  pools?: MessagePools;
}

function poolFor(pools: MessagePools, day: Digit): readonly MessageEntry[] {
  const custom = pools[day];
  if (custom && custom.length > 0) return custom;
  const fallback = DEFAULT_MESSAGE_POOLS[day];
  return fallback && fallback.length > 0 ? fallback : [{ headline: '', body: '' }];
}

/**
 * Build the forecast for `profile` on the ISO date `onDate`.
 * Fully deterministic: the same profile + date always yields the same result.
 */
export function buildForecast(
  profile: Profile,
  onDate: string,
  options: ForecastOptions = {},
): Forecast {
  const iso = formatISODate(parseISODate(onDate));
  const { personalYear: py, personalMonth: pm, personalDay: pd } = personalNumbers(profile.dob, iso);

  const pool = poolFor(options.pools ?? DEFAULT_MESSAGE_POOLS, pd);
  const entry = pool[stableIndex(`${iso}#${profile.id}#${pd}`, pool.length)] ?? pool[0]!;
  const luckyNumber = ((stableIndex(`${iso}~lucky~${pd}`, 9) + 1) as Digit);

  return {
    date: iso,
    personalYear: py,
    personalMonth: pm,
    personalDay: pd,
    headline: entry.headline,
    body: entry.body,
    luckyNumber,
    focus: FOCUS_BY_DAY[pd],
  };
}

// ---------------------------------------------------------------------------
// Multi-day helpers (7-day strip, history)
// ---------------------------------------------------------------------------

// Civil <-> serial-day conversions (Howard Hinnant's algorithm): pure integer
// math, so date stepping never touches the host timezone.
function daysFromCivil(y: number, m: number, d: number): number {
  const yy = y - (m <= 2 ? 1 : 0);
  const era = Math.floor((yy >= 0 ? yy : yy - 399) / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m > 2 ? m - 3 : m + 9) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function civilFromDays(z: number): CalendarDate {
  const zz = z + 719468;
  const era = Math.floor((zz >= 0 ? zz : zz - 146096) / 146097);
  const doe = zz - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return { year: m <= 2 ? y + 1 : y, month: m, day: d };
}

/** Add `delta` calendar days to an ISO date, returning a new ISO date. */
export function addDays(onDate: string, delta: number): string {
  const { year, month, day } = parseISODate(onDate);
  return formatISODate(civilFromDays(daysFromCivil(year, month, day) + Math.trunc(delta)));
}

/** Day of the week for `onDate`, Sunday = 0 ... Saturday = 6. Same pure
 *  civil-calendar math as `addDays` - never touches the host timezone. */
function weekdayOf(onDate: string): number {
  const { year, month, day } = parseISODate(onDate);
  const z = daysFromCivil(year, month, day);
  return ((z + 4) % 7 + 7) % 7;
}

export interface WeekBounds {
  /** The Sunday at or before `onDate`. */
  weekStart: string;
  /** The Saturday closing that same week, always 6 days after `weekStart`. */
  weekEnd: string;
}

/**
 * The Sunday-to-Saturday calendar week containing `onDate`. Built entirely on
 * `addDays`, so month and year boundaries are handled correctly for free.
 */
export function weekBounds(onDate: string): WeekBounds {
  const iso = formatISODate(parseISODate(onDate));
  const weekStart = addDays(iso, -weekdayOf(iso));
  const weekEnd = addDays(weekStart, 6);
  return { weekStart, weekEnd };
}

/**
 * AstroMatrix's own weekly numerology convention - there is no single
 * standardized "Personal Week" formula in numerology, so this is a
 * project-defined choice, not an established one.
 *
 * Personal Week = reduce(sum of the Personal Day number for each of the 7
 * days in the Sunday-Saturday week containing `onDate`). Reuses `weekBounds`,
 * `addDays` and `personalDay` rather than re-deriving any of their formulas,
 * and reduces with the same forecast-math rule the rest of this file uses
 * (master numbers always reduced) - so this never feeds back into
 * `personalDay`/`personalMonth`/`personalYear`, only consumes them.
 */
export function personalWeek(dob: string, onDate: string): Digit {
  const { weekStart } = weekBounds(onDate);
  let sum = 0;
  for (let i = 0; i < 7; i += 1) {
    sum += personalDay(dob, addDays(weekStart, i));
  }
  return reduceToDigit(sum);
}

// ---------------------------------------------------------------------------
// Weekly / Monthly / Annual forecast content
//
// Additive only - none of this is used by (or changes the behaviour of)
// `buildForecast`, so the existing Day golden-value tests are unaffected.
// Each pool follows the exact same shape as `DEFAULT_MESSAGE_POOLS`
// (`Record<Digit, MessageEntry[]>`, at least 2 entries per digit) so the
// existing deterministic selection pattern can be reused rather than
// inventing a new one.
// ---------------------------------------------------------------------------

export const WEEKLY_MESSAGE_POOLS: MessagePools = {
  1: [
    { headline: 'A Week to Plant Something New', body: 'This week may favor starting something you have been circling. Small first steps now can build real momentum by the weekend.' },
    { headline: 'Lead This Week', body: 'You may find it easier than usual to take initiative this week - trust your own judgment rather than waiting for others.' },
  ],
  2: [
    { headline: 'A Week for Partnership', body: 'This week may ask for patience and collaboration. Relationships and quiet listening could carry more weight than pushing ahead alone.' },
    { headline: 'Small Gestures, Real Impact', body: 'You might notice that diplomacy works better than force this week. A calm word can go further than a forceful one.' },
  ],
  3: [
    { headline: 'A Week to Speak Up', body: 'This week may lift your sense of expression and connection. Sharing an idea or reaching out to someone could feel especially rewarding.' },
    { headline: 'Let the Week Stay Light', body: 'You may find creativity flows more easily when you stop forcing it. Follow what feels enjoyable this week.' },
  ],
  4: [
    { headline: 'A Week to Build Steadily', body: 'This week may favor structure and follow-through. Tidying up loose ends or organizing a plan could pay off.' },
    { headline: 'Steady Wins This Week', body: 'You might notice that consistent, unglamorous effort compounds well this week.' },
  ],
  5: [
    { headline: 'A Week Open to Change', body: 'This week may bring some movement or unexpected options. Staying flexible with your plans could work in your favor.' },
    { headline: 'Shake Up a Routine', body: 'You may find restlessness is useful information this week - a small change of pace could open something new.' },
  ],
  6: [
    { headline: 'A Week Centered on Care', body: 'This week may draw your attention toward home, relationships, and responsibility. Showing up for someone could matter more than usual.' },
    { headline: 'Mend a Connection', body: 'You might find a small act of care goes a long way this week.' },
  ],
  7: [
    { headline: 'A Week for Reflection', body: 'This week may reward stepping back rather than pushing forward. Rest, reading, or quiet thinking could serve you well.' },
    { headline: 'Trust the Pause', body: "You may find this isn't a week for forcing answers - let things settle and see what surfaces." },
  ],
  8: [
    { headline: 'A Week to Take Ownership', body: 'This week may favor clear decisions and practical matters like money or negotiation. You might feel ready to take charge.' },
    { headline: 'Aim a Little Further', body: 'You may find decisive action serves you well this week.' },
  ],
  9: [
    { headline: 'A Week to Complete and Release', body: 'This week may be well suited to closing a loop or letting something go, making room for what comes next.' },
    { headline: 'Take the Wider View', body: 'You might notice the bigger picture matters more than any single task this week.' },
  ],
};

export const MONTHLY_MESSAGE_POOLS: MessagePools = {
  1: [
    { headline: 'A Month of New Beginnings', body: 'This month may center on initiative and independence. It can be a good window to start something you have been planning.' },
    { headline: 'A Month to Lead', body: 'You may find this month favors standing on your own judgment and setting a fresh direction.' },
  ],
  2: [
    { headline: 'A Month of Partnership', body: 'This month may highlight collaboration and patience. Relationships and shared projects could take center stage.' },
    { headline: 'A Month for Harmony', body: 'You might notice a pull toward diplomacy and balance this month.' },
  ],
  3: [
    { headline: 'A Month of Expression', body: 'This month may favor creativity, communication, and social connection. Sharing your ideas could open doors.' },
    { headline: 'A Month to Create', body: 'You may find inspiration comes more easily this month - a good window for creative projects.' },
  ],
  4: [
    { headline: 'A Month to Build', body: 'This month may favor structure, discipline, and steady progress on practical matters.' },
    { headline: 'A Month of Groundwork', body: 'You might find slow, deliberate effort pays off particularly well this month.' },
  ],
  5: [
    { headline: 'A Month of Change', body: 'This month may bring variety and unexpected turns. Staying adaptable could serve you better than rigid plans.' },
    { headline: 'A Month to Explore', body: 'You may feel drawn toward new experiences or a change of routine this month.' },
  ],
  6: [
    { headline: 'A Month of Care and Responsibility', body: 'This month may center on home, family, and commitments to others.' },
    { headline: 'A Month to Nurture', body: 'You might find yourself focused on supporting the people close to you this month.' },
  ],
  7: [
    { headline: 'A Month of Reflection', body: 'This month may favor introspection over external activity - a good window to study, rest, or reassess.' },
    { headline: 'A Month to Go Inward', body: 'You may find quieter, more contemplative pursuits especially rewarding this month.' },
  ],
  8: [
    { headline: 'A Month of Ambition', body: 'This month may favor practical achievement, financial matters, and taking charge.' },
    { headline: 'A Month to Build Authority', body: 'You might notice more confidence around decisions of consequence this month.' },
  ],
  9: [
    { headline: 'A Month of Completion', body: 'This month may be a natural point to close chapters and release what no longer serves you.' },
    { headline: 'A Month for the Wider View', body: 'You may find compassion and perspective more available to you this month.' },
  ],
};

export const ANNUAL_MESSAGE_POOLS: MessagePools = {
  1: [
    { headline: 'A Year of New Beginnings', body: 'This year may mark a fresh start - a season for personal direction and taking initiative on what matters to you.' },
    { headline: 'A Year to Lead Your Own Path', body: 'You may find this year rewards independence and the courage to begin something new.' },
  ],
  2: [
    { headline: 'A Year of Partnership and Patience', body: 'This year may highlight relationships, cooperation, and learning to move at the speed of trust.' },
    { headline: 'A Year to Build Harmony', body: 'You might notice a long-term pull toward balance and diplomacy this year.' },
  ],
  3: [
    { headline: 'A Year of Expression', body: 'This year may favor creativity, communication, and putting yourself forward. It can be a good season to be seen and heard.' },
    { headline: 'A Year to Create Freely', body: 'You may find this year opens space for self-expression and joy.' },
  ],
  4: [
    { headline: 'A Year of Foundations', body: 'This year may favor discipline, structure, and long-term groundwork - a season for building something durable.' },
    { headline: 'A Year of Steady Progress', body: 'You might find consistent effort compounds meaningfully across this year.' },
  ],
  5: [
    { headline: 'A Year of Change', body: 'This year may bring significant movement or transition. Staying open to new directions could serve you well.' },
    { headline: 'A Year to Embrace Freedom', body: 'You may find this year invites more variety and adaptability than usual.' },
  ],
  6: [
    { headline: 'A Year of Responsibility and Care', body: 'This year may center on home, family, and the people who depend on you.' },
    { headline: 'A Year to Nurture What Matters', body: 'You might find this year deepens your sense of commitment and care.' },
  ],
  7: [
    { headline: 'A Year of Reflection', body: 'This year may favor introspection, study, and inner growth over external achievement.' },
    { headline: 'A Year to Seek Understanding', body: 'You may find this year rewards patience and a search for deeper meaning.' },
  ],
  8: [
    { headline: 'A Year of Ambition', body: 'This year may favor practical achievement, authority, and material progress - a season to step into responsibility.' },
    { headline: 'A Year to Build Lasting Success', body: 'You might notice this year supports long-term goals around work and resources.' },
  ],
  9: [
    { headline: 'A Year of Completion', body: "This year may mark the close of a cycle - a season for release, forgiveness, and clearing space for what's next." },
    { headline: 'A Year for the Wider View', body: 'You may find this year draws you toward compassion and a broader perspective on your life.' },
  ],
};

export interface PeriodForecast {
  primaryNumber: Digit;
  /** "Your Week/Month/Year Ahead" narrative. */
  headline: string;
  body: string;
  /** "Key Themes This Week/Month/Year" - a second, distinct entry from the
   *  same pool, never the same one as `headline`/`body` when the pool has
   *  more than one entry for that digit. */
  themeHeadline: string;
  themeBody: string;
  focus: ForecastFocus;
}

/**
 * Deterministically pick two *different* entries (when available) from
 * `pool` for `seedNamespace`/`digit`/`profileId` - the primary ("Ahead")
 * entry and a distinct secondary ("Key Themes" / "What to Watch For") entry,
 * so the two sections never say the same thing twice. Falls back to the same
 * entry for both only if the pool has a single entry for that digit.
 */
function buildPeriodForecast(
  pool: readonly MessageEntry[],
  digit: Digit,
  seedNamespace: string,
  profileId: string,
): PeriodForecast {
  const safePool = pool.length > 0 ? pool : [{ headline: '', body: '' }];
  const primaryIndex = stableIndex(`${seedNamespace}#${profileId}#${digit}`, safePool.length);
  const primary = safePool[primaryIndex]!;

  const rest = safePool.filter((_, i) => i !== primaryIndex);
  const secondaryPool = rest.length > 0 ? rest : safePool;
  const secondary = secondaryPool[stableIndex(`${seedNamespace}~secondary~${profileId}#${digit}`, secondaryPool.length)]!;

  return {
    primaryNumber: digit,
    headline: primary.headline,
    body: primary.body,
    themeHeadline: secondary.headline,
    themeBody: secondary.body,
    focus: FOCUS_BY_DAY[digit],
  };
}

/** Build the Weekly Forecast for `profile`'s current Sunday-Saturday week
 *  containing `onDate`. Reuses `personalWeek`/`weekBounds` - never re-derives
 *  the Personal Week formula. */
export function buildWeeklyForecast(profile: Profile, onDate: string): PeriodForecast {
  const digit = personalWeek(profile.dob, onDate);
  const { weekStart } = weekBounds(onDate);
  const pool = WEEKLY_MESSAGE_POOLS[digit] ?? [];
  return buildPeriodForecast(pool, digit, `week:${weekStart}`, profile.id);
}

/** Build the Monthly Forecast for `profile` on `onDate`'s calendar month.
 *  Reuses `personalMonth` - never re-derives the Personal Month formula. */
export function buildMonthlyForecast(profile: Profile, onDate: string): PeriodForecast {
  const iso = formatISODate(parseISODate(onDate));
  const digit = personalMonth(profile.dob, iso);
  const monthKey = iso.slice(0, 7); // 'YYYY-MM'
  const pool = MONTHLY_MESSAGE_POOLS[digit] ?? [];
  return buildPeriodForecast(pool, digit, `month:${monthKey}`, profile.id);
}

/** Build the Annual Forecast for `profile` on `onDate`'s calendar year.
 *  Reuses `personalYear` - never re-derives the Personal Year formula. */
export function buildAnnualForecast(profile: Profile, onDate: string): PeriodForecast {
  const iso = formatISODate(parseISODate(onDate));
  const digit = personalYear(profile.dob, iso);
  const yearKey = iso.slice(0, 4); // 'YYYY'
  const pool = ANNUAL_MESSAGE_POOLS[digit] ?? [];
  return buildPeriodForecast(pool, digit, `year:${yearKey}`, profile.id);
}

/**
 * "What to Watch For" for Today - a second, distinct entry from
 * `DEFAULT_MESSAGE_POOLS` for the same Personal Day, using the identical
 * primary-selection formula `buildForecast` uses internally so the two never
 * disagree about which entry is the "Ahead" one. Deliberately does not
 * change `buildForecast`/`Forecast` so existing Day behaviour and its golden
 * -value tests are completely unaffected.
 */
export function dayWatchFor(profile: Profile, onDate: string): MessageEntry {
  const iso = formatISODate(parseISODate(onDate));
  const digit = personalDay(profile.dob, iso);
  const pool = DEFAULT_MESSAGE_POOLS[digit];
  const primaryIndex = stableIndex(`${iso}#${profile.id}#${digit}`, pool.length);
  const rest = pool.filter((_, i) => i !== primaryIndex);
  const secondaryPool = rest.length > 0 ? rest : pool;
  return secondaryPool[stableIndex(`${iso}~watch~${profile.id}#${digit}`, secondaryPool.length)]!;
}

/**
 * A run of forecasts starting at `startDate`. `days` may be negative to walk
 * backwards; the returned list is always in chronological order.
 */
export function buildForecastRange(
  profile: Profile,
  startDate: string,
  days: number,
  options: ForecastOptions = {},
): Forecast[] {
  const count = Math.abs(Math.trunc(days));
  const step = days < 0 ? -1 : 1;
  const dates: string[] = [];
  for (let i = 0; i < count; i += 1) dates.push(addDays(startDate, i * step));
  if (step < 0) dates.reverse();
  return dates.map((date) => buildForecast(profile, date, options));
}
