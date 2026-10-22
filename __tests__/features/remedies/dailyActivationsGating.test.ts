import { isDailyActivationsUnlocked } from '../../../src/features/remedies/dailyActivationsGating';

describe('isDailyActivationsUnlocked', () => {
  test('locked when both Color Cue and Body & Breath Reset are incomplete', () => {
    expect(
      isDailyActivationsUnlocked({
        colorCueRequired: true,
        colorCueDone: false,
        resetRequired: true,
        resetDone: false,
      }),
    ).toBe(false);
  });

  test('locked when only Color Cue is complete', () => {
    expect(
      isDailyActivationsUnlocked({
        colorCueRequired: true,
        colorCueDone: true,
        resetRequired: true,
        resetDone: false,
      }),
    ).toBe(false);
  });

  test('locked when only Body & Breath Reset is complete', () => {
    expect(
      isDailyActivationsUnlocked({
        colorCueRequired: true,
        colorCueDone: false,
        resetRequired: true,
        resetDone: true,
      }),
    ).toBe(false);
  });

  test('unlocked once both Color Cue and Body & Breath Reset are complete', () => {
    expect(
      isDailyActivationsUnlocked({
        colorCueRequired: true,
        colorCueDone: true,
        resetRequired: true,
        resetDone: true,
      }),
    ).toBe(true);
  });

  test('a prerequisite that is not required today is skipped rather than blocking unlock', () => {
    // No Color Cue content for today - only Reset is required.
    expect(
      isDailyActivationsUnlocked({
        colorCueRequired: false,
        colorCueDone: false,
        resetRequired: true,
        resetDone: true,
      }),
    ).toBe(true);

    // Reset is somehow not required - only Color Cue is required.
    expect(
      isDailyActivationsUnlocked({
        colorCueRequired: true,
        colorCueDone: true,
        resetRequired: false,
        resetDone: false,
      }),
    ).toBe(true);
  });

  test('unlocked when neither prerequisite is required at all', () => {
    expect(
      isDailyActivationsUnlocked({
        colorCueRequired: false,
        colorCueDone: false,
        resetRequired: false,
        resetDone: false,
      }),
    ).toBe(true);
  });
});
