import type { PracticeActivity } from '@/data/practiceLibrary';

/**
 * Filters a day's Afternoon activities down to the ones that should actually
 * be shown to the user right now.
 *
 * Activities with no `requiresMorningOptionId` are ordinary, always-shown
 * activities. An activity WITH `requiresMorningOptionId` is one of several
 * alternatives keyed to the day's Morning `choice` activity - it is visible
 * only once the user has selected the matching Morning option. Before any
 * Morning selection exists (`selectedMorningOptionId` is `undefined`), gated
 * alternatives stay hidden rather than all being shown at once.
 *
 * Pure and side-effect free - used identically by both the Afternoon render
 * list and the Afternoon completion check in `remedies.tsx`, so the two can
 * never drift out of sync with each other.
 */
export function visibleAfternoonActivities(
  activities: PracticeActivity[],
  selectedMorningOptionId: string | string[] | undefined,
): PracticeActivity[] {
  return activities.filter((activity) => {
    if (!activity.requiresMorningOptionId) return true;
    return activity.requiresMorningOptionId === selectedMorningOptionId;
  });
}
