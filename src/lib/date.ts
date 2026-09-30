/**
 * Local-time date helpers for the UI layer. The core engine speaks ISO
 * 'YYYY-MM-DD' strings; these convert to/from the device's local calendar day
 * without ever going through UTC (which would shift the date near midnight).
 */

/** The device's current local calendar day as an ISO 'YYYY-MM-DD' string. */
export function todayISO(now: Date = new Date()): string {
  return toLocalISO(now);
}

/** A `Date` (interpreted in local time) as an ISO 'YYYY-MM-DD' string. */
export function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** A friendly label like "Mon 1 Sep" for an ISO date. */
export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const month = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ][date.getMonth()];
  return `${weekday} ${date.getDate()} ${month}`;
}

/** A long label like "1 September 2026" for an ISO date. */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const month = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][(m ?? 1) - 1];
  return `${d} ${month} ${y}`;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** A US-style label like "September 29, 2026" for an ISO date. */
export function formatUSDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTH_NAMES[(m ?? 1) - 1]} ${d}, ${y}`;
}

/** "September 2026" for the calendar month containing an ISO date. */
export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTH_NAMES[(m ?? 1) - 1]} ${y}`;
}

/** "2026" for the calendar year containing an ISO date. */
export function formatYearOnly(iso: string): string {
  return String(iso.split('-')[0] ?? iso);
}

/**
 * A friendly range like "September 27 – October 3, 2026" for a week's
 * start/end ISO dates. Drops the repeated month when both ends fall in the
 * same month, and states the year on both ends when the week crosses a year
 * boundary (e.g. "December 27, 2026 – January 2, 2027").
 */
export function formatDateRange(startIso: string, endIso: string): string {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);
  const startMonth = MONTH_NAMES[(sm ?? 1) - 1];
  const endMonth = MONTH_NAMES[(em ?? 1) - 1];

  if (sy !== ey) {
    return `${startMonth} ${sd}, ${sy} – ${endMonth} ${ed}, ${ey}`;
  }
  if (sm !== em) {
    return `${startMonth} ${sd} – ${endMonth} ${ed}, ${sy}`;
  }
  return `${startMonth} ${sd} – ${ed}, ${sy}`;
}
