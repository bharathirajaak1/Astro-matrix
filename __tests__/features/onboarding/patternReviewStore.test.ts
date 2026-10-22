/**
 * Exercises `src/features/onboarding/patternReviewStore.ts` - the
 * profile-scoped, in-memory-only expand/collapse + explored-once state for
 * the Personal Pattern Review screen ("Step 3 of 3",
 * `app/onboarding/swot-audit.tsx`).
 *
 * These tests verify the store's own logic only - dedup, derivation, and
 * profile isolation. They do NOT verify actual React Native navigation or
 * rendering (e.g. that the real screen visually preserves state across a
 * genuine Expo Router back-then-forward navigation): this project has no
 * React Native component-rendering test infrastructure (`jest.config.js`
 * only matches `**\/*.test.ts` under `testEnvironment: 'node'`, and no
 * `@testing-library/react-native` is installed - confirmed during the
 * Stage 5b.2 audit). A "simulated remount" here means calling the store's
 * own selectors again after other calls, standing in for what a fresh
 * component instance would read - it is not a substitute for an actual
 * render test.
 */
import {
  computeAllExplored,
  computeExploredCount,
  selectExpanded,
  selectExplored,
  usePatternReviewStore,
  type PatternReviewSectionState,
} from '@/features/onboarding/patternReviewStore';

const ALL_UNEXPLORED: PatternReviewSectionState = {
  strengths: false,
  weaknesses: false,
  opportunities: false,
  blindSpot: false,
};

function readExpanded(profileId: string | null): PatternReviewSectionState {
  return selectExpanded(profileId)(usePatternReviewStore.getState());
}

function readExplored(profileId: string | null): PatternReviewSectionState {
  return selectExplored(profileId)(usePatternReviewStore.getState());
}

beforeEach(() => {
  // Fresh store between tests - these fields are the store's entire state.
  usePatternReviewStore.setState({ byProfileId: {}, ephemeral: { expanded: ALL_UNEXPLORED, explored: ALL_UNEXPLORED } });
});

describe('initial state', () => {
  test('a profile with no previous review state starts fully unexplored and uncollapsed', () => {
    expect(readExpanded('p_a')).toEqual(ALL_UNEXPLORED);
    expect(readExplored('p_a')).toEqual(ALL_UNEXPLORED);
  });

  test('a null profile id (no profile yet) also starts fully unexplored, via the ephemeral slot', () => {
    expect(readExpanded(null)).toEqual(ALL_UNEXPLORED);
    expect(readExplored(null)).toEqual(ALL_UNEXPLORED);
  });
});

describe('toggleSection', () => {
  test('expanding a section sets expanded[section] true', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'strengths');

    expect(readExpanded('p_a')).toEqual({ ...ALL_UNEXPLORED, strengths: true });
  });

  test('collapsing an expanded section sets expanded[section] back to false', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'strengths');
    usePatternReviewStore.getState().toggleSection('p_a', 'strengths');

    expect(readExpanded('p_a')).toEqual(ALL_UNEXPLORED);
  });

  test('expanding a section marks it explored on first expansion', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'weaknesses');

    expect(readExplored('p_a')).toEqual({ ...ALL_UNEXPLORED, weaknesses: true });
  });

  test('re-collapsing and re-expanding a previously explored section does not clear its explored flag', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'opportunities'); // expand -> explored
    usePatternReviewStore.getState().toggleSection('p_a', 'opportunities'); // collapse
    usePatternReviewStore.getState().toggleSection('p_a', 'opportunities'); // re-expand

    expect(readExpanded('p_a')).toEqual({ ...ALL_UNEXPLORED, opportunities: true });
    expect(readExplored('p_a')).toEqual({ ...ALL_UNEXPLORED, opportunities: true });
  });

  test('collapsing a section after it is explored leaves explored true even while collapsed', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'blindSpot'); // expand -> explored
    usePatternReviewStore.getState().toggleSection('p_a', 'blindSpot'); // collapse

    expect(readExpanded('p_a')).toEqual(ALL_UNEXPLORED); // collapsed again
    expect(readExplored('p_a')).toEqual({ ...ALL_UNEXPLORED, blindSpot: true }); // still explored
  });
});

describe('computeExploredCount / computeAllExplored', () => {
  test('0 of 4 explored initially', () => {
    expect(computeExploredCount(ALL_UNEXPLORED)).toBe(0);
    expect(computeAllExplored(ALL_UNEXPLORED)).toBe(false);
  });

  test('count increments per distinct section explored, order-independent', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'strengths');
    usePatternReviewStore.getState().toggleSection('p_a', 'weaknesses');

    expect(computeExploredCount(readExplored('p_a'))).toBe(2);
    expect(computeAllExplored(readExplored('p_a'))).toBe(false);
  });

  test('allExplored is true only once every one of the four sections has been expanded at least once', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'strengths');
    usePatternReviewStore.getState().toggleSection('p_a', 'weaknesses');
    usePatternReviewStore.getState().toggleSection('p_a', 'opportunities');
    expect(computeAllExplored(readExplored('p_a'))).toBe(false);

    usePatternReviewStore.getState().toggleSection('p_a', 'blindSpot');
    expect(computeExploredCount(readExplored('p_a'))).toBe(4);
    expect(computeAllExplored(readExplored('p_a'))).toBe(true);
  });
});

describe('persistence across a simulated remount', () => {
  test('profile A state survives re-reading the store fresh (standing in for a screen remount)', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'strengths');
    usePatternReviewStore.getState().toggleSection('p_a', 'opportunities');

    // A real remount would create a brand-new component instance, but since
    // this store is module-scoped (not component state), simply reading its
    // selectors again - exactly as a fresh component instance's first render
    // would - must still see the same data.
    expect(readExpanded('p_a')).toEqual({ ...ALL_UNEXPLORED, strengths: true, opportunities: true });
    expect(readExplored('p_a')).toEqual({ ...ALL_UNEXPLORED, strengths: true, opportunities: true });
  });
});

describe('profile isolation', () => {
  test('profile A and profile B states are independent', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'strengths');
    usePatternReviewStore.getState().toggleSection('p_b', 'blindSpot');

    expect(readExpanded('p_a')).toEqual({ ...ALL_UNEXPLORED, strengths: true });
    expect(readExpanded('p_b')).toEqual({ ...ALL_UNEXPLORED, blindSpot: true });
    expect(readExplored('p_a')).toEqual({ ...ALL_UNEXPLORED, strengths: true });
    expect(readExplored('p_b')).toEqual({ ...ALL_UNEXPLORED, blindSpot: true });
  });

  test('switching away and back to profile A never surfaces profile B\'s state', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'strengths');
    usePatternReviewStore.getState().toggleSection('p_b', 'weaknesses');
    usePatternReviewStore.getState().toggleSection('p_b', 'opportunities');

    // "Returning" to A is just reading A's own selector again - nothing B
    // did can appear here.
    expect(readExpanded('p_a')).toEqual({ ...ALL_UNEXPLORED, strengths: true });
    expect(readExplored('p_a')).toEqual({ ...ALL_UNEXPLORED, strengths: true });
  });

  test('returning to profile A restores exactly its own prior state, unaffected by B\'s activity in between', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'strengths');
    usePatternReviewStore.getState().toggleSection('p_a', 'weaknesses');
    const aExpandedBefore = readExpanded('p_a');
    const aExploredBefore = readExplored('p_a');

    usePatternReviewStore.getState().toggleSection('p_b', 'strengths');
    usePatternReviewStore.getState().toggleSection('p_b', 'opportunities');
    usePatternReviewStore.getState().toggleSection('p_b', 'blindSpot');

    expect(readExpanded('p_a')).toEqual(aExpandedBefore);
    expect(readExplored('p_a')).toEqual(aExploredBefore);
  });

  test('a profile id never seen before starts fresh, uncontaminated by any other profile', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'strengths');
    usePatternReviewStore.getState().toggleSection('p_b', 'weaknesses');

    expect(readExpanded('p_c')).toEqual(ALL_UNEXPLORED);
    expect(readExplored('p_c')).toEqual(ALL_UNEXPLORED);
  });
});

describe('missing profile id safety', () => {
  test('a null profile id writes only to the ephemeral slot, never to any real profile\'s record', () => {
    usePatternReviewStore.getState().toggleSection(null, 'strengths');

    expect(readExpanded(null)).toEqual({ ...ALL_UNEXPLORED, strengths: true });
    // No real profile's state was touched by the null-id write.
    expect(readExpanded('p_a')).toEqual(ALL_UNEXPLORED);
    expect(readExpanded('p_b')).toEqual(ALL_UNEXPLORED);
  });

  test('toggling for a real profile never leaks into or reads from the ephemeral (null-id) slot', () => {
    usePatternReviewStore.getState().toggleSection('p_a', 'strengths');

    expect(readExpanded(null)).toEqual(ALL_UNEXPLORED);
    expect(readExplored(null)).toEqual(ALL_UNEXPLORED);
  });
});
