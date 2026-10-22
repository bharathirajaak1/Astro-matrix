import {
  isValidProfileId,
  isValidFullName,
  isValidNumerologySystem,
  isValidCreatedAt,
  isValidDob,
  isValidProfile,
  hasDuplicateProfileIds,
  isValidProfileArray,
  isValidActiveId,
} from '@/features/profile/validation';
import type { Profile } from '@/core/types';

const VALID_PROFILE: Profile = {
  id: 'p_abc123_xyz',
  fullName: 'Maya Sharma',
  dob: '1992-05-14',
  system: 'pythagorean',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('isValidProfileId', () => {
  test('a non-empty string is valid', () => {
    expect(isValidProfileId('p_123')).toBe(true);
  });
  test('an empty string is invalid', () => {
    expect(isValidProfileId('')).toBe(false);
  });
  test('a whitespace-only string is invalid', () => {
    expect(isValidProfileId('   ')).toBe(false);
    expect(isValidProfileId('\t\n')).toBe(false);
  });
  test('a non-string is invalid', () => {
    expect(isValidProfileId(123)).toBe(false);
    expect(isValidProfileId(null)).toBe(false);
    expect(isValidProfileId(undefined)).toBe(false);
  });
});

describe('isValidFullName', () => {
  test('a non-empty name is valid', () => {
    expect(isValidFullName('Maya Sharma')).toBe(true);
  });
  test('an empty or whitespace-only name is invalid', () => {
    expect(isValidFullName('')).toBe(false);
    expect(isValidFullName('   ')).toBe(false);
    expect(isValidFullName('\t\n')).toBe(false);
  });
  test('a non-string is invalid', () => {
    expect(isValidFullName(42)).toBe(false);
  });
  test('leading/trailing whitespace around real content is valid - this is a predicate, not a sanitizer, so it never modifies the stored value', () => {
    expect(isValidFullName('  Maya Sharma  ')).toBe(true);
  });
});

describe('isValidNumerologySystem', () => {
  test('pythagorean and chaldean are valid', () => {
    expect(isValidNumerologySystem('pythagorean')).toBe(true);
    expect(isValidNumerologySystem('chaldean')).toBe(true);
  });
  test('any other value is invalid', () => {
    expect(isValidNumerologySystem('western')).toBe(false);
    expect(isValidNumerologySystem('')).toBe(false);
    expect(isValidNumerologySystem(undefined)).toBe(false);
  });
});

describe('isValidCreatedAt', () => {
  test('a round-tripping ISO string is valid', () => {
    expect(isValidCreatedAt('2026-01-01T00:00:00.000Z')).toBe(true);
  });
  test('a non-ISO or garbage string is invalid', () => {
    expect(isValidCreatedAt('not a date')).toBe(false);
    expect(isValidCreatedAt('2026-01-01')).toBe(false); // valid date, but doesn't round-trip to the same string
  });
  test('an impossible calendar date (ISO-shaped but not real) is invalid', () => {
    expect(isValidCreatedAt('2026-13-45T00:00:00.000Z')).toBe(false);
  });
  test('a noncanonical timestamp for an otherwise valid date is invalid', () => {
    // Missing milliseconds - a real, parseable instant, but not the exact
    // canonical `toISOString()` form `createdAt` is always written in.
    expect(isValidCreatedAt('2026-01-01T00:00:00Z')).toBe(false);
    // A non-UTC offset instead of `Z` - also a real instant, also non-canonical.
    expect(isValidCreatedAt('2026-01-01T00:00:00.000+05:30')).toBe(false);
  });
  test('a non-string is invalid', () => {
    expect(isValidCreatedAt(Date.now())).toBe(false);
  });
});

describe('isValidDob', () => {
  test('a well-formed, real, past date is valid', () => {
    expect(isValidDob('1992-05-14')).toBe(true);
  });
  test('the wrong format is invalid', () => {
    expect(isValidDob('14-05-1992')).toBe(false);
    expect(isValidDob('1992/05/14')).toBe(false);
  });
  test('a calendar-invalid date (regex-shaped but not real) is invalid', () => {
    expect(isValidDob('2099-02-30')).toBe(false); // Feb 30 never exists
  });
  test('a year before 1900 is invalid', () => {
    expect(isValidDob('1899-05-14')).toBe(false);
  });
  test('a future date is invalid', () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(isValidDob(`${nextYear}-01-01`)).toBe(false);
  });
  test('a non-string is invalid', () => {
    expect(isValidDob(19920514)).toBe(false);
  });
});

describe('isValidProfile', () => {
  test('a well-formed profile is valid', () => {
    expect(isValidProfile(VALID_PROFILE)).toBe(true);
  });
  test('missing or invalid id invalidates the whole profile', () => {
    expect(isValidProfile({ ...VALID_PROFILE, id: '' })).toBe(false);
  });
  test('missing or invalid fullName invalidates the whole profile', () => {
    expect(isValidProfile({ ...VALID_PROFILE, fullName: '' })).toBe(false);
  });
  test('an invalid dob invalidates the whole profile', () => {
    expect(isValidProfile({ ...VALID_PROFILE, dob: '2099-02-30' })).toBe(false);
  });
  test('an unsupported system invalidates the whole profile', () => {
    expect(isValidProfile({ ...VALID_PROFILE, system: 'western' })).toBe(false);
  });
  test('an invalid createdAt invalidates the whole profile', () => {
    expect(isValidProfile({ ...VALID_PROFILE, createdAt: 'not a date' })).toBe(false);
  });
  test('a non-object is invalid', () => {
    expect(isValidProfile(null)).toBe(false);
    expect(isValidProfile('a string')).toBe(false);
    expect(isValidProfile(42)).toBe(false);
  });
});

describe('hasDuplicateProfileIds', () => {
  test('distinct ids are not duplicates', () => {
    const meera: Profile = { ...VALID_PROFILE, id: 'p_other' };
    expect(hasDuplicateProfileIds([VALID_PROFILE, meera])).toBe(false);
  });
  test('a repeated id is detected as a duplicate', () => {
    expect(hasDuplicateProfileIds([VALID_PROFILE, { ...VALID_PROFILE }])).toBe(true);
  });
  test('an empty list has no duplicates', () => {
    expect(hasDuplicateProfileIds([])).toBe(false);
  });
});

describe('isValidActiveId', () => {
  test('a non-empty string is valid', () => {
    expect(isValidActiveId('p_maya')).toBe(true);
  });
  test('an explicit null (nothing selected yet) is valid', () => {
    expect(isValidActiveId(null)).toBe(true);
  });
  test('an empty or whitespace-only string is invalid', () => {
    expect(isValidActiveId('')).toBe(false);
    expect(isValidActiveId('   ')).toBe(false);
  });
  test('a non-string, non-null value is invalid', () => {
    expect(isValidActiveId(42)).toBe(false);
    expect(isValidActiveId(undefined)).toBe(false);
  });
});

describe('isValidProfileArray', () => {
  test('a valid empty array is valid', () => {
    expect(isValidProfileArray([])).toBe(true);
  });
  test('an array of distinct, well-formed profiles is valid', () => {
    const meera: Profile = { ...VALID_PROFILE, id: 'p_other', fullName: 'Meera Sharma' };
    expect(isValidProfileArray([VALID_PROFILE, meera])).toBe(true);
  });
  test('duplicate ids invalidate the whole array', () => {
    expect(isValidProfileArray([VALID_PROFILE, { ...VALID_PROFILE }])).toBe(false);
  });
  test('one malformed entry invalidates the whole array, not just that entry', () => {
    const meera: Profile = { ...VALID_PROFILE, id: 'p_other' };
    const broken = { ...VALID_PROFILE, id: 'p_broken', system: 'western' };
    expect(isValidProfileArray([meera, broken])).toBe(false);
  });
  test('a non-array value is invalid', () => {
    expect(isValidProfileArray({})).toBe(false);
    expect(isValidProfileArray(null)).toBe(false);
    expect(isValidProfileArray('not an array')).toBe(false);
  });
});
