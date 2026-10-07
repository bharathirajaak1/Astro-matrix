import { isDayFullyComplete, isSectionUnlocked } from '../../../src/features/remedies/sectionGating';
import type { PracticePart } from '../../../src/features/remedies/ritualStore';

describe('isSectionUnlocked', () => {
  test('Morning is always unlocked, regardless of completion state', () => {
    expect(isSectionUnlocked('morning', [])).toBe(true);
    expect(isSectionUnlocked('morning', ['morning'])).toBe(true);
    expect(isSectionUnlocked('morning', ['morning', 'afternoon', 'night'])).toBe(true);
  });

  test('Afternoon is locked until Morning is complete', () => {
    expect(isSectionUnlocked('afternoon', [])).toBe(false);
    expect(isSectionUnlocked('afternoon', ['afternoon'])).toBe(false);
    expect(isSectionUnlocked('afternoon', ['night'])).toBe(false);
  });

  test('Afternoon becomes unlocked once Morning is complete', () => {
    expect(isSectionUnlocked('afternoon', ['morning'])).toBe(true);
    expect(isSectionUnlocked('afternoon', ['morning', 'afternoon'])).toBe(true);
  });

  test('Night is locked until Afternoon is complete, even if Morning alone is done', () => {
    expect(isSectionUnlocked('night', [])).toBe(false);
    expect(isSectionUnlocked('night', ['morning'])).toBe(false);
  });

  test('Night becomes unlocked once Afternoon is complete', () => {
    expect(isSectionUnlocked('night', ['morning', 'afternoon'])).toBe(true);
    expect(isSectionUnlocked('night', ['afternoon'])).toBe(true);
  });

  test('a freshly-reset day (empty completedParts) locks Afternoon and Night again', () => {
    const freshDay: PracticePart[] = [];
    expect(isSectionUnlocked('morning', freshDay)).toBe(true);
    expect(isSectionUnlocked('afternoon', freshDay)).toBe(false);
    expect(isSectionUnlocked('night', freshDay)).toBe(false);
  });

  test('is a pure function - never mutates the completedParts array passed in', () => {
    const completedParts: PracticePart[] = ['morning'];
    isSectionUnlocked('afternoon', completedParts);
    expect(completedParts).toEqual(['morning']);
  });
});

describe('isDayFullyComplete', () => {
  test('false when no sections are complete', () => {
    expect(isDayFullyComplete([])).toBe(false);
  });

  test('false when only some sections are complete', () => {
    expect(isDayFullyComplete(['morning'])).toBe(false);
    expect(isDayFullyComplete(['morning', 'afternoon'])).toBe(false);
    expect(isDayFullyComplete(['night'])).toBe(false);
  });

  test('true only once morning, afternoon, and night are all complete', () => {
    expect(isDayFullyComplete(['morning', 'afternoon', 'night'])).toBe(true);
  });

  test('is order-independent', () => {
    expect(isDayFullyComplete(['night', 'morning', 'afternoon'])).toBe(true);
  });

  test('does not depend on any daily-feedback state - it only looks at the three sections', () => {
    // isDayFullyComplete has no feedback parameter at all - this is a
    // structural guarantee that completion can never be gated on feedback.
    expect(isDayFullyComplete.length).toBe(1);
  });
});
