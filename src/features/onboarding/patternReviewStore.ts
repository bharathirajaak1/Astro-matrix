/**
 * Personal Pattern Review (`app/onboarding/swot-audit.tsx`, "Step 3 of 3")
 * expand/collapse + explored-once state, keyed by profile id - fixes the
 * state loss on Step 3 -> Step 2 -> Step 3: that screen's `expanded`/
 * `explored` used to be local `useState`, which React Navigation/Expo
 * Router resets to defaults every time the screen is popped (back) and then
 * pushed again, since popping unmounts the component entirely. A plain
 * Zustand store is module-scoped, so it survives that unmount/remount cycle
 * - the same reason `useRitualStore`/`useEntitlement`/`useNotificationsStore`
 * already use this pattern elsewhere in this codebase.
 *
 * In-memory only, deliberately - nothing here is written to AsyncStorage.
 * The original TODO item only asked for state to survive in-session
 * back-and-forward navigation, not an app restart; this keeps the fix at
 * exactly that scope rather than adding a persistence layer nothing asked
 * for.
 *
 * Profile isolation: every record lives at `byProfileId[profileId]` - a
 * profile only ever reads/writes its own slot, so switching never surfaces
 * another profile's expanded/explored state. A profile with no record yet
 * reads as `ALL_UNEXPLORED` (a shared, frozen, read-only default - never
 * itself stored or mutated) rather than any other profile's real data.
 *
 * No-profile-id safety: when there is no profile at all (e.g. this screen
 * rendered before a profile exists), state goes to a separate `ephemeral`
 * slot entirely outside `byProfileId` - never a shared map key like `'null'`
 * or `''`, which could otherwise collide with a real (if malformed) id and
 * let two unrelated things read/write the same slot by accident.
 */
import { create } from 'zustand';

export type PatternReviewSection = 'strengths' | 'weaknesses' | 'opportunities' | 'blindSpot';

export const PATTERN_REVIEW_SECTIONS: readonly PatternReviewSection[] = [
  'strengths',
  'weaknesses',
  'opportunities',
  'blindSpot',
];

export type PatternReviewSectionState = Record<PatternReviewSection, boolean>;

/** Shared, frozen, never mutated - returned for a profile with no record
 *  yet, and as the starting shape for a freshly-created one. */
const ALL_UNEXPLORED: PatternReviewSectionState = Object.freeze({
  strengths: false,
  weaknesses: false,
  opportunities: false,
  blindSpot: false,
});

interface PatternReviewRecord {
  expanded: PatternReviewSectionState;
  explored: PatternReviewSectionState;
}

function freshRecord(): PatternReviewRecord {
  return { expanded: ALL_UNEXPLORED, explored: ALL_UNEXPLORED };
}

/** How many of the four sections have ever been expanded at least once. */
export function computeExploredCount(explored: PatternReviewSectionState): number {
  return PATTERN_REVIEW_SECTIONS.filter((section) => explored[section]).length;
}

/** True once every section has been expanded at least once. */
export function computeAllExplored(explored: PatternReviewSectionState): boolean {
  return PATTERN_REVIEW_SECTIONS.every((section) => explored[section]);
}

interface PatternReviewStoreState {
  byProfileId: Record<string, PatternReviewRecord>;
  ephemeral: PatternReviewRecord;
  /**
   * Mirrors the original component's own toggle rule exactly: flips
   * `expanded[section]`; if the section is now expanded, marks
   * `explored[section]` true (and never clears it back to false on a later
   * collapse). `profileId` is an explicit parameter, supplied by the caller
   * from whatever profile that screen is currently showing - this action
   * never looks up "the active profile" itself, so a caller can never
   * accidentally write to a profile other than the one its own render was
   * showing when the tap happened.
   */
  toggleSection: (profileId: string | null, section: PatternReviewSection) => void;
}

export const usePatternReviewStore = create<PatternReviewStoreState>((set) => ({
  byProfileId: {},
  ephemeral: freshRecord(),

  toggleSection: (profileId, section) => {
    set((state) => {
      const current = profileId === null ? state.ephemeral : state.byProfileId[profileId] ?? freshRecord();
      const nextExpandedValue = !current.expanded[section];
      const nextExpanded: PatternReviewSectionState = { ...current.expanded, [section]: nextExpandedValue };
      const nextExplored: PatternReviewSectionState = nextExpandedValue
        ? { ...current.explored, [section]: true }
        : current.explored;
      const nextRecord: PatternReviewRecord = { expanded: nextExpanded, explored: nextExplored };

      if (profileId === null) {
        return { ephemeral: nextRecord };
      }
      return { byProfileId: { ...state.byProfileId, [profileId]: nextRecord } };
    });
  },
}));

/** Selector factory for `expanded` - use as `usePatternReviewStore(selectExpanded(profileId))`. */
export function selectExpanded(profileId: string | null) {
  return (state: PatternReviewStoreState): PatternReviewSectionState =>
    profileId === null ? state.ephemeral.expanded : state.byProfileId[profileId]?.expanded ?? ALL_UNEXPLORED;
}

/** Selector factory for `explored` - use as `usePatternReviewStore(selectExplored(profileId))`. */
export function selectExplored(profileId: string | null) {
  return (state: PatternReviewStoreState): PatternReviewSectionState =>
    profileId === null ? state.ephemeral.explored : state.byProfileId[profileId]?.explored ?? ALL_UNEXPLORED;
}
