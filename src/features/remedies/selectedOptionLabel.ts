import type { PracticeActivity } from '@/data/practiceLibrary';

/**
 * The label of the option a user selected for an options-based activity
 * (e.g. Morning's "Today's Focus" choice), or `null` if nothing is selected
 * yet, or the activity isn't an options-based type (only `choice`,
 * `multiChoice`, `scenario`, `pattern` and `logic` carry `options`).
 *
 * Pure and side-effect free - used by the render to show a short
 * confirmation ("Your choice: Organize ✓") once a choice has been made,
 * without duplicating or altering the underlying activity/options content.
 */
export function selectedOptionLabel(
  activity: PracticeActivity,
  selection: string | string[] | undefined,
): string | null {
  if (!('options' in activity)) return null;
  if (typeof selection !== 'string') return null;
  return activity.options.find((option) => option.id === selection)?.label ?? null;
}
