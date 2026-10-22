/**
 * Exercises `src/features/profile/profileScreenMessages.ts` - the pure
 * message/formatting logic extracted from `app/profile/switch.tsx` and
 * `app/profile/create.tsx` (see that module's own doc comment for why: this
 * project's Jest config only matches `**\/*.test.ts` under `testEnvironment:
 * 'node'`, with no React Native component-testing library installed, so the
 * screens themselves cannot be rendered/tested here - this file covers
 * everything from them that genuinely can be).
 */
import {
  describeCreateFailure,
  describeSwitchFailure,
  formatDob,
} from '@/features/profile/profileScreenMessages';
import type { CreateProfileResult, SetActiveProfileResult } from '@/features/profile/repo';
import type { Profile } from '@/core/types';

const SOME_PROFILE: Profile = {
  id: 'p_1',
  fullName: 'Someone',
  dob: '1992-05-14',
  system: 'pythagorean',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('formatDob', () => {
  test('formats a single-digit day and month correctly', () => {
    expect(formatDob('1992-05-14')).toBe('14 May 1992');
  });

  test('formats a double-digit day correctly', () => {
    expect(formatDob('1990-12-25')).toBe('25 December 1990');
  });

  test('formats the first day of January correctly', () => {
    expect(formatDob('2000-01-01')).toBe('1 January 2000');
  });
});

describe('describeSwitchFailure', () => {
  test('not_found', () => {
    expect(describeSwitchFailure({ status: 'not_found' })).toMatch(/could not be found/i);
  });

  test('registry_malformed', () => {
    const result: SetActiveProfileResult = { status: 'registry_malformed', raw: 'junk' };
    const message = describeSwitchFailure(result);
    expect(message).toMatch(/could not be verified/i);
    expect(message).not.toContain('junk'); // never surfaces raw storage bytes to the user
  });

  test('registry_read_failure', () => {
    expect(describeSwitchFailure({ status: 'registry_read_failure', error: new Error('boom') })).toMatch(
      /could not be read/i,
    );
  });

  test('write_failure', () => {
    expect(describeSwitchFailure({ status: 'write_failure', error: new Error('boom') })).toMatch(
      /couldn't save/i,
    );
  });

  test('activated is never passed here in practice, but is handled without throwing', () => {
    expect(() => describeSwitchFailure({ status: 'activated', profile: SOME_PROFILE })).not.toThrow();
  });
});

describe('describeCreateFailure', () => {
  test('invalid_input surfaces the repository-provided reason directly', () => {
    const result: CreateProfileResult = { status: 'invalid_input', reason: 'fullName must be non-empty' };
    expect(describeCreateFailure(result)).toBe('fullName must be non-empty');
  });

  test('registry_malformed', () => {
    const result: CreateProfileResult = { status: 'registry_malformed', raw: 'junk' };
    const message = describeCreateFailure(result);
    expect(message).toMatch(/could not be verified/i);
    expect(message).not.toContain('junk');
  });

  test('registry_read_failure', () => {
    expect(describeCreateFailure({ status: 'registry_read_failure', error: new Error('boom') })).toMatch(
      /could not be read/i,
    );
  });

  test('write_failure', () => {
    expect(describeCreateFailure({ status: 'write_failure', error: new Error('boom') })).toMatch(
      /couldn't save/i,
    );
  });

  test('created is never passed here in practice, but is handled without throwing', () => {
    expect(() => describeCreateFailure({ status: 'created', profile: SOME_PROFILE })).not.toThrow();
  });
});
