/**
 * Whether Daily Activations should be unlocked for today - true only once
 * every applicable prerequisite (Color Cue, Body & Breath Reset) is done.
 * A prerequisite that isn't required for today (e.g. no Color Cue content)
 * is skipped rather than blocking unlock forever. Pure and side-effect
 * free - used by `remedies.tsx`'s render so the displayed lock message and
 * the actual gating can never drift out of sync with each other.
 */
export function isDailyActivationsUnlocked(params: {
  colorCueRequired: boolean;
  colorCueDone: boolean;
  resetRequired: boolean;
  resetDone: boolean;
}): boolean {
  const { colorCueRequired, colorCueDone, resetRequired, resetDone } = params;
  return (!colorCueRequired || colorCueDone) && (!resetRequired || resetDone);
}
