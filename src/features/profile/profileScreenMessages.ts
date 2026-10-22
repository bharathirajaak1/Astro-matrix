/**
 * Pure, UI-framework-free decision logic extracted from `app/profile/switch.tsx`
 * and `app/profile/create.tsx` - DOB formatting and the user-facing message
 * each repository result status maps to. Extracted specifically so this
 * logic has real, running test coverage: the project's Jest config
 * (`jest.config.js`) only matches `**\/*.test.ts` under `testEnvironment:
 * 'node'`, and no React Native component-testing library is installed, so a
 * `.tsx` test file for either screen would never actually be executed by
 * Jest. This module contains everything from those screens that is
 * meaningful to test without rendering a component tree.
 */
import type { CreateProfileResult, SetActiveProfileResult } from './repo';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Formats an ISO 'YYYY-MM-DD' date of birth as e.g. "14 May 1992". */
export function formatDob(dob: string): string {
  const [year, month, day] = dob.split('-').map(Number);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/** User-facing message for every non-`activated` `SetActiveProfileResult`. */
export function describeSwitchFailure(result: SetActiveProfileResult): string {
  switch (result.status) {
    case 'not_found':
      return 'That profile could not be found. Try refreshing the list.';
    case 'registry_malformed':
      return 'Your saved profiles could not be verified right now. Nothing was changed.';
    case 'registry_read_failure':
      return 'Your saved profiles could not be read right now. Nothing was changed.';
    case 'write_failure':
      return "Couldn't save your selection. Please try again.";
    default:
      return 'Nothing was changed.';
  }
}

/** User-facing message for every non-`created` `CreateProfileResult`. */
export function describeCreateFailure(result: CreateProfileResult): string {
  switch (result.status) {
    case 'invalid_input':
      return result.reason;
    case 'registry_malformed':
      return 'Your saved profiles could not be verified right now. Nothing was created.';
    case 'registry_read_failure':
      return 'Your saved profiles could not be read right now. Nothing was created.';
    case 'write_failure':
      return "Couldn't save the new profile. Please try again.";
    default:
      return 'Nothing was created.';
  }
}
