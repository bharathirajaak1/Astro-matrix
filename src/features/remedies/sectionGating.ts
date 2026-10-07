import type { PracticePart } from './ritualStore';

/**
 * The intended daily sequence is Morning -> Afternoon -> Night. This
 * determines whether a given section's interactive content should be
 * available right now, purely from which sections are already complete
 * today (`completedParts`, from the Ritual Store) - no new/competing
 * completion concept, just the existing sequential rule applied to data the
 * store already tracks.
 *
 * Pure and side-effect free - used identically by the render (to show a
 * locked message instead of a section's interactive content) and by the
 * auto-completion effects (to guard against completing a section out of
 * order), so the two can never drift out of sync with each other.
 */
export function isSectionUnlocked(part: PracticePart, completedParts: readonly PracticePart[]): boolean {
  if (part === 'morning') return true;
  if (part === 'afternoon') return completedParts.includes('morning');
  return completedParts.includes('afternoon');
}

/**
 * Whether today's three sections are all done - the single rule for
 * "today's practice is complete", independent of the optional daily
 * feedback interaction. Advancing to the next day is a separate, explicit
 * user action (not triggered by this becoming true), so this only answers
 * whether that action should now be available - never whether it has been
 * taken.
 */
export function isDayFullyComplete(completedParts: readonly PracticePart[]): boolean {
  return completedParts.includes('morning') && completedParts.includes('afternoon') && completedParts.includes('night');
}
