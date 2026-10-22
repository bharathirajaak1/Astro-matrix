/**
 * Pure, storage-agnostic validation for the `Profile` shape. Used by the
 * profile registry's storage-classification layer to tell a genuinely
 * well-formed stored value apart from malformed data - never by anything
 * that writes profiles (no multi-profile write path exists yet).
 *
 * The DOB calendar-validity rule mirrors `app/onboarding/details.tsx`'s
 * existing `isValidDob` check exactly (format, year range, real calendar
 * date, not in the future) rather than inventing a second, divergent rule.
 * It's reimplemented here rather than imported because that onboarding
 * screen is out of scope for this change.
 */
import type { NumerologySystem, Profile } from '@/core/types';

export function isValidProfileId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidFullName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidNumerologySystem(value: unknown): value is NumerologySystem {
  return value === 'pythagorean' || value === 'chaldean';
}

/** `createdAt` is always machine-generated, never user-typed, so a strict
 *  round-trip check is safe and carries no legitimate-data false-positive risk. */
export function isValidCreatedAt(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

/** Mirrors `app/onboarding/details.tsx`'s `isValidDob` exactly: format,
 *  year range (1900-current), a real calendar date for that month, and
 *  not in the future. */
export function isValidDob(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const currentYear = new Date().getFullYear();

  if (year < 1900 || year > currentYear) return false;
  if (month < 1 || month > 12) return false;

  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return false;
  }

  if (dateObj > new Date()) return false;

  return true;
}

export function isValidProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isValidProfileId(candidate.id) &&
    isValidFullName(candidate.fullName) &&
    isValidDob(candidate.dob) &&
    isValidNumerologySystem(candidate.system) &&
    isValidCreatedAt(candidate.createdAt)
  );
}

/** `profiles.activeId` is either a known profile id, or an explicit stored
 *  `null` meaning "nothing selected yet" - both are valid stored shapes. */
export function isValidActiveId(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && value.trim().length > 0);
}

export function hasDuplicateProfileIds(profiles: readonly Profile[]): boolean {
  const seen = new Set<string>();
  for (const profile of profiles) {
    if (seen.has(profile.id)) return true;
    seen.add(profile.id);
  }
  return false;
}

/** A duplicate id anywhere in the array - or any single malformed entry -
 *  invalidates the whole array, rather than silently filtering/deduping,
 *  so no data is ever silently discarded. */
export function isValidProfileArray(value: unknown): value is Profile[] {
  if (!Array.isArray(value)) return false;
  if (!value.every(isValidProfile)) return false;
  return !hasDuplicateProfileIds(value as Profile[]);
}
