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

const FOCUS_BY_DAY: Readonly<Record<Digit, ForecastFocus>> = {
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
      headline: 'Plant the first seed',
      body: 'A 1 day rewards initiative. Start the thing you have been circling and let momentum do the rest.',
    },
    {
      headline: 'Lead from the front',
      body: 'Independence is favoured today. Make the decision yourself rather than waiting for consensus.',
    },
  ],
  2: [
    {
      headline: 'Move at the speed of trust',
      body: 'A 2 day asks for patience and partnership. Listen twice, and let a relationship carry the work.',
    },
    {
      headline: 'Small gestures land hard',
      body: 'Diplomacy beats force now. A quiet word settles more than a loud one.',
    },
  ],
  3: [
    {
      headline: 'Say it out loud',
      body: 'A 3 day lifts expression and play. Share the idea, send the message, make something for the joy of it.',
    },
    {
      headline: 'Let it be light',
      body: 'Creativity flows when you stop forcing it. Follow the fun and the work follows you.',
    },
  ],
  4: [
    {
      headline: 'Build the foundation',
      body: 'A 4 day favours structure. Tidy the plan, finish the admin, and put one brick firmly in place.',
    },
    {
      headline: 'Steady beats fast',
      body: 'Progress today is measured in details handled. Slow, deliberate effort compounds.',
    },
  ],
  5: [
    {
      headline: 'Follow the change',
      body: 'A 5 day brings movement and options. Say yes to the detour and stay loose with the schedule.',
    },
    {
      headline: 'Break one routine',
      body: 'Restlessness is information. Shake up a single fixed habit and see what opens.',
    },
  ],
  6: [
    {
      headline: 'Tend what matters',
      body: 'A 6 day centres home, care and responsibility. Show up for someone and put the house in order.',
    },
    {
      headline: 'Repair a connection',
      body: 'A small act of service mends more than it costs today.',
    },
  ],
  7: [
    {
      headline: 'Go quiet and look inward',
      body: 'A 7 day rewards reflection over hustle. Step back, read, rest, and let an answer surface.',
    },
    {
      headline: 'Trust the pause',
      body: 'Not every day is for output. Study the question instead of forcing the reply.',
    },
  ],
  8: [
    {
      headline: 'Own the outcome',
      body: 'An 8 day favours ambition and clear asks. Handle money, negotiate, and act like the person in charge.',
    },
    {
      headline: 'Aim past comfort',
      body: 'Power flows to decisive action today. Make the big call.',
    },
  ],
  9: [
    {
      headline: 'Let something end',
      body: 'A 9 day is for completion and release. Close the loop, give it away, and clear space for what is next.',
    },
    {
      headline: 'Zoom out',
      body: 'The wider view matters more than the next task. Finish, forgive, and let go.',
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
