/**
 * Exercises the 21-day cycle ritual store with an in-memory stand-in for
 * `@/lib/storage` (the real one needs the native AsyncStorage module) and a
 * controllable `todayISO()` so calendar-day rollover can be tested without
 * touching the system clock.
 */
jest.mock('@/lib/storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (k: string) => {
      const raw = store.get(k);
      return raw == null ? null : JSON.parse(raw);
    }),
    setItem: jest.fn(async (k: string, v: unknown) => {
      store.set(k, JSON.stringify(v));
    }),
    removeItem: jest.fn(async (k: string) => {
      store.delete(k);
    }),
  };
});

let mockToday = '2026-01-01';
jest.mock('@/lib/date', () => ({
  todayISO: jest.fn(() => mockToday),
}));

import { getItem, removeItem, setItem } from '@/lib/storage';
import { useRitualStore, type RitualPersistenceData } from '@/features/remedies/ritualStore';
import { resolveActiveNumber } from '@/services/questEngine';
import type { Digit, Profile } from '@/core/types';

const RITUAL_KEY = 'remedies.rituals';

/** The profile active for most tests - established once by `beforeEach`. */
const ACTIVE_PROFILE_ID = 'profile-a';
/** A second, distinct profile used by the ownership tests. */
const OTHER_PROFILE_ID = 'profile-b';

function profileWithId(id: string): Profile {
  return {
    id,
    fullName: 'Test User',
    dob: '2000-01-01',
    system: 'pythagorean',
    createdAt: '2026-01-01T00:00:00Z',
  };
}

const DEFAULT_STATE: RitualPersistenceData = {
  profileId: null,
  cycleDay: 1,
  completedParts: [],
  completedCycleNumbers: [],
  lastCompletedDate: null,
  lastCycleCompletionDate: null,
  streakDays: 0,
};

/**
 * Seed the mocked persisted record directly, bypassing store actions.
 * Defaults to belonging to `ACTIVE_PROFILE_ID` so tests that seed then
 * relaunch as the same profile exercise the preserved-state path; ownership
 * tests override `profileId` explicitly.
 */
async function seed(overrides: Partial<RitualPersistenceData>): Promise<void> {
  await setItem(RITUAL_KEY, { ...DEFAULT_STATE, profileId: ACTIVE_PROFILE_ID, ...overrides });
}

/**
 * Simulate a fresh app launch: reset in-memory state, then hydrate from
 * storage as the given profile id (defaulting to the usual active profile).
 * `null` simulates launching with no active profile at all. `missingNumbers`
 * is forwarded to `hydrate()` only when explicitly provided, mirroring how a
 * caller that predates the 21-day cycle would omit it entirely.
 */
async function relaunch(profileId: string | null = ACTIVE_PROFILE_ID, missingNumbers?: Digit[]): Promise<void> {
  useRitualStore.setState({ ...DEFAULT_STATE, hydrated: false });
  const profile = profileId ? profileWithId(profileId) : null;
  if (missingNumbers === undefined) {
    await useRitualStore.getState().hydrate(profile);
  } else {
    await useRitualStore.getState().hydrate(profile, missingNumbers);
  }
}

beforeEach(async () => {
  mockToday = '2026-01-01';
  await removeItem(RITUAL_KEY);
  // Simulate "already hydrated as the active profile" for tests that call
  // store actions directly without an explicit relaunch.
  useRitualStore.setState({ ...DEFAULT_STATE, profileId: ACTIVE_PROFILE_ID, hydrated: true });
});

describe('initial state', () => {
  test('1: a fresh profile starts at cycleDay 1', async () => {
    await relaunch(ACTIVE_PROFILE_ID);
    expect(useRitualStore.getState().cycleDay).toBe(1);
  });

  test('2: completedParts is empty', async () => {
    await relaunch(ACTIVE_PROFILE_ID);
    expect(useRitualStore.getState().completedParts).toEqual([]);
  });

  test('3: completedCycleNumbers is empty', async () => {
    await relaunch(ACTIVE_PROFILE_ID);
    expect(useRitualStore.getState().completedCycleNumbers).toEqual([]);
  });

  test('4: streakDays starts at 0', async () => {
    await relaunch(ACTIVE_PROFILE_ID);
    expect(useRitualStore.getState().streakDays).toBe(0);
  });

  test('5: profileId belongs to the active profile', async () => {
    await relaunch(ACTIVE_PROFILE_ID);
    expect(useRitualStore.getState().profileId).toBe(ACTIVE_PROFILE_ID);
  });
});

describe('profile ownership', () => {
  test('6: stored state for profile A is not restored for profile B', async () => {
    await seed({ profileId: ACTIVE_PROFILE_ID, cycleDay: 9, completedCycleNumbers: [3] });

    await relaunch(OTHER_PROFILE_ID);

    const state = useRitualStore.getState();
    expect(state.profileId).toBe(OTHER_PROFILE_ID);
    expect(state.cycleDay).toBe(1);
    expect(state.completedCycleNumbers).toEqual([]);
  });

  test('7: the same profile restores its own progress', async () => {
    await seed({ profileId: ACTIVE_PROFILE_ID, cycleDay: 9, completedCycleNumbers: [3], streakDays: 4, lastCompletedDate: '2026-01-01' });

    await relaunch(ACTIVE_PROFILE_ID);

    const state = useRitualStore.getState();
    expect(state.cycleDay).toBe(9);
    expect(state.completedCycleNumbers).toEqual([3]);
    expect(state.streakDays).toBe(4);
  });

  test('8: legacy state without profileId (old shape, pre-migration) does not leak into a profile', async () => {
    // Old pre-migration shape: questDay/dailyPackItems, no cycleDay at all.
    await setItem(RITUAL_KEY, {
      completedNumbers: [4, 8],
      questDay: 5,
      lastCompletedDate: '2026-01-01',
      lastQuestCompletionDate: null,
      streakDays: 3,
      dailyPackCompleted: false,
      dailyPackItems: { morning: false, midday: false, evening: false },
    });

    await relaunch(ACTIVE_PROFILE_ID);

    const state = useRitualStore.getState();
    expect(state.profileId).toBe(ACTIVE_PROFILE_ID);
    expect(state.cycleDay).toBe(1);
    expect(state.completedCycleNumbers).toEqual([]);
    expect(state.streakDays).toBe(0);
  });
});

describe('section completion', () => {
  test('9: completeSection("morning") marks morning complete', async () => {
    await useRitualStore.getState().completeSection('morning');
    expect(useRitualStore.getState().completedParts).toEqual(['morning']);
  });

  test('10: completing morning twice does not duplicate it', async () => {
    await useRitualStore.getState().completeSection('morning');
    const streakAfterFirst = useRitualStore.getState().streakDays;

    await useRitualStore.getState().completeSection('morning');

    expect(useRitualStore.getState().completedParts).toEqual(['morning']);
    expect(useRitualStore.getState().streakDays).toBe(streakAfterFirst);
  });

  test('11: afternoon completion works', async () => {
    await useRitualStore.getState().completeSection('afternoon');
    expect(useRitualStore.getState().completedParts).toEqual(['afternoon']);
  });

  test('12: night completion works', async () => {
    await useRitualStore.getState().completeSection('night');
    expect(useRitualStore.getState().completedParts).toEqual(['night']);
  });

  test('13: completing all three marks the day/cycle completion state', async () => {
    await useRitualStore.getState().completeSection('morning');
    await useRitualStore.getState().completeSection('afternoon');
    await useRitualStore.getState().completeSection('night');

    const state = useRitualStore.getState();
    expect(state.completedParts).toEqual(expect.arrayContaining(['morning', 'afternoon', 'night']));
    expect(state.completedParts).toHaveLength(3);
    expect(state.lastCycleCompletionDate).toBe('2026-01-01');
  });
});

describe('calendar progression', () => {
  test('14: completing all three sections does not immediately advance cycleDay', async () => {
    await useRitualStore.getState().completeSection('morning');
    await useRitualStore.getState().completeSection('afternoon');
    await useRitualStore.getState().completeSection('night');

    expect(useRitualStore.getState().cycleDay).toBe(1);
  });

  test('15: next-day hydration advances cycleDay by one', async () => {
    await seed({ cycleDay: 1, lastCycleCompletionDate: '2026-01-01' });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID);

    expect(useRitualStore.getState().cycleDay).toBe(2);
  });

  test('16: the new day\'s completedParts are empty', async () => {
    await seed({
      cycleDay: 1,
      lastCycleCompletionDate: '2026-01-01',
      completedParts: ['morning', 'afternoon', 'night'],
    });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID);

    expect(useRitualStore.getState().completedParts).toEqual([]);
  });

  test('17: same-day hydration advances cycleDay once the day is complete (advancement is calendar-independent)', async () => {
    await seed({ cycleDay: 1, lastCycleCompletionDate: '2026-01-01' });

    await relaunch(ACTIVE_PROFILE_ID);

    expect(useRitualStore.getState().cycleDay).toBe(2);
  });

  test('18: missing multiple calendar days does not replay every missed day', async () => {
    await seed({ cycleDay: 3, lastCycleCompletionDate: '2026-01-01' });

    // Several days pass with no activity at all.
    mockToday = '2026-01-10';
    await relaunch(ACTIVE_PROFILE_ID);

    // Advances by exactly one day, never by the number of days actually missed.
    expect(useRitualStore.getState().cycleDay).toBe(4);
  });

  test('an incomplete day survives a multi-day calendar gap completely unchanged', async () => {
    await seed({
      cycleDay: 5,
      completedParts: ['morning'],
      lastCompletedDate: '2026-01-01',
      lastCycleCompletionDate: null,
    });

    // Several days pass with no further activity at all.
    mockToday = '2026-01-10';
    await relaunch(ACTIVE_PROFILE_ID);

    const state = useRitualStore.getState();
    expect(state.cycleDay).toBe(5);
    expect(state.completedParts).toEqual(['morning']);
  });

  test('an incomplete day is a safe no-op for the live advancePracticeDayIfComplete action too', async () => {
    await useRitualStore.getState().completeSection('morning');

    await useRitualStore.getState().advancePracticeDayIfComplete();

    const state = useRitualStore.getState();
    expect(state.cycleDay).toBe(1);
    expect(state.completedParts).toEqual(['morning']);
  });

  test('advancePracticeDayIfComplete is a safe no-op when nothing has been completed yet', async () => {
    await useRitualStore.getState().advancePracticeDayIfComplete();

    const state = useRitualStore.getState();
    expect(state.cycleDay).toBe(1);
    expect(state.completedParts).toEqual([]);
    expect(state.streakDays).toBe(0);
  });

  test('advancePracticeDayIfComplete advances immediately on the same calendar date once all three sections are done', async () => {
    await useRitualStore.getState().completeSection('morning');
    await useRitualStore.getState().completeSection('afternoon');
    await useRitualStore.getState().completeSection('night');

    await useRitualStore.getState().advancePracticeDayIfComplete();

    const state = useRitualStore.getState();
    expect(state.cycleDay).toBe(2);
    expect(state.completedParts).toEqual([]);
    expect(state.lastCycleCompletionDate).toBeNull();
  });
});

describe('21-day cycle completion', () => {
  const missingNumbers: Digit[] = [8, 3, 6];

  test('19: completing day 21 does not immediately switch to another number', async () => {
    useRitualStore.setState({ cycleDay: 21 });

    await useRitualStore.getState().completeSection('morning');
    await useRitualStore.getState().completeSection('afternoon');
    await useRitualStore.getState().completeSection('night');

    const state = useRitualStore.getState();
    expect(state.cycleDay).toBe(21);
    expect(state.completedCycleNumbers).toEqual([]);
  });

  test('20: next-day hydration marks the completed number in completedCycleNumbers', async () => {
    // Profile A was working through Number 3's cycle (the highest-priority
    // remaining missing number) and just finished day 21.
    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [] });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, missingNumbers);

    expect(useRitualStore.getState().completedCycleNumbers).toEqual([3]);
  });

  test('21: the next eligible missing number becomes active (derived, not stored)', async () => {
    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [] });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, missingNumbers);

    const nextActive = resolveActiveNumber(missingNumbers, useRitualStore.getState().completedCycleNumbers);
    expect(nextActive).toBe(8); // 3 is now done; 8 is next in HEALING_PRIORITY_ORDER.
  });

  test('22: the new active number starts at cycleDay 1', async () => {
    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [] });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, missingNumbers);

    expect(useRitualStore.getState().cycleDay).toBe(1);
  });

  test('23: the new active number starts with empty completedParts', async () => {
    await seed({
      cycleDay: 21,
      lastCycleCompletionDate: '2026-01-01',
      completedCycleNumbers: [],
      completedParts: ['morning', 'afternoon', 'night'],
    });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, missingNumbers);

    expect(useRitualStore.getState().completedParts).toEqual([]);
  });

  test('24: once all missing numbers are completed, active-number resolution safely returns null', async () => {
    // Finishing the last remaining number (6).
    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [3, 8] });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, missingNumbers);

    expect(useRitualStore.getState().completedCycleNumbers).toEqual(expect.arrayContaining([3, 8, 6]));
    const nextActive = resolveActiveNumber(missingNumbers, useRitualStore.getState().completedCycleNumbers);
    expect(nextActive).toBeNull();
  });

  test('a hydrate call with no missingNumbers defers the day-21 transition instead of guessing', async () => {
    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [] });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID); // no missingNumbers passed

    const state = useRitualStore.getState();
    expect(state.cycleDay).toBe(21);
    expect(state.completedCycleNumbers).toEqual([]);

    // A later hydrate that does supply missingNumbers completes the deferred transition.
    await relaunch(ACTIVE_PROFILE_ID, missingNumbers);
    expect(useRitualStore.getState().completedCycleNumbers).toEqual([3]);
    expect(useRitualStore.getState().cycleDay).toBe(1);
  });

  test('completing day 21 and calling advancePracticeDayIfComplete advances immediately, same session', async () => {
    useRitualStore.setState({ cycleDay: 21 });

    await useRitualStore.getState().completeSection('morning');
    await useRitualStore.getState().completeSection('afternoon');
    await useRitualStore.getState().completeSection('night');

    await useRitualStore.getState().advancePracticeDayIfComplete(missingNumbers);

    const state = useRitualStore.getState();
    expect(state.completedCycleNumbers).toEqual([3]);
    expect(state.cycleDay).toBe(1);
    expect(state.completedParts).toEqual([]);
  });

  test('advancePracticeDayIfComplete without missingNumbers defers day 21; a later call with them resolves it', async () => {
    useRitualStore.setState({ cycleDay: 21 });

    await useRitualStore.getState().completeSection('morning');
    await useRitualStore.getState().completeSection('afternoon');
    await useRitualStore.getState().completeSection('night');

    await useRitualStore.getState().advancePracticeDayIfComplete(); // no missingNumbers

    let state = useRitualStore.getState();
    expect(state.cycleDay).toBe(21);
    expect(state.completedCycleNumbers).toEqual([]);

    await useRitualStore.getState().advancePracticeDayIfComplete(missingNumbers);

    state = useRitualStore.getState();
    expect(state.completedCycleNumbers).toEqual([3]);
    expect(state.cycleDay).toBe(1);
  });
});

describe('streak', () => {
  test('25: first section completion establishes lastCompletedDate', async () => {
    await useRitualStore.getState().completeSection('morning');
    expect(useRitualStore.getState().lastCompletedDate).toBe('2026-01-01');
    expect(useRitualStore.getState().streakDays).toBe(1);
  });

  test('26: same-day completion does not increase streak repeatedly', async () => {
    await useRitualStore.getState().completeSection('morning');
    await useRitualStore.getState().completeSection('afternoon');
    await useRitualStore.getState().completeSection('night');

    expect(useRitualStore.getState().streakDays).toBe(1);
  });

  test('27: next-day activity increments streak appropriately', async () => {
    await useRitualStore.getState().completeSection('morning');
    await useRitualStore.getState().completeSection('afternoon');
    await useRitualStore.getState().completeSection('night');
    expect(useRitualStore.getState().streakDays).toBe(1);

    // Advance past the now-complete day within the same session (the live
    // action, not a calendar rollover), then complete a section on the new
    // calendar day.
    await useRitualStore.getState().advancePracticeDayIfComplete();

    mockToday = '2026-01-02';
    await useRitualStore.getState().completeSection('morning');

    expect(useRitualStore.getState().streakDays).toBe(2);
  });

  test('28: a calendar gap resets streak according to the existing approved behavior', async () => {
    await seed({ streakDays: 5, lastCompletedDate: '2026-01-01' });

    mockToday = '2026-01-03'; // 2026-01-02 was skipped entirely
    await relaunch(ACTIVE_PROFILE_ID);

    expect(useRitualStore.getState().streakDays).toBe(0);
  });

  test('29: lastCompletedDate and lastCycleCompletionDate remain semantically distinct', async () => {
    await useRitualStore.getState().completeSection('morning');

    const state = useRitualStore.getState();
    // Only one section is done - the day is not fully complete yet.
    expect(state.lastCompletedDate).toBe('2026-01-01');
    expect(state.lastCycleCompletionDate).toBeNull();

    await useRitualStore.getState().completeSection('afternoon');
    await useRitualStore.getState().completeSection('night');

    // Now that all three are done, both dates are set (to the same date here,
    // but driven by two independent conditions - see completeSection above).
    expect(useRitualStore.getState().lastCompletedDate).toBe('2026-01-01');
    expect(useRitualStore.getState().lastCycleCompletionDate).toBe('2026-01-01');
  });
});

describe('persistence', () => {
  test('30: state survives a hydrate/persist round trip', async () => {
    await useRitualStore.getState().completeSection('morning');
    await relaunch(ACTIVE_PROFILE_ID);
    expect(useRitualStore.getState().completedParts).toEqual(['morning']);
  });

  test('31: completedCycleNumbers survives persistence', async () => {
    await seed({ completedCycleNumbers: [3, 8] });
    await relaunch(ACTIVE_PROFILE_ID);
    expect(useRitualStore.getState().completedCycleNumbers).toEqual([3, 8]);
  });

  test('32: cycleDay survives persistence', async () => {
    await seed({ cycleDay: 14 });
    await relaunch(ACTIVE_PROFILE_ID);
    expect(useRitualStore.getState().cycleDay).toBe(14);
  });

  test('33: completedParts survives persistence for the same day', async () => {
    await seed({ completedParts: ['morning', 'afternoon'], lastCompletedDate: '2026-01-01' });
    await relaunch(ACTIVE_PROFILE_ID);
    expect(useRitualStore.getState().completedParts).toEqual(['morning', 'afternoon']);
  });

  test('34: profile ownership survives persistence', async () => {
    await useRitualStore.getState().completeSection('morning');
    expect(await getItem(RITUAL_KEY)).toMatchObject({ profileId: ACTIVE_PROFILE_ID });
  });
});

describe('legacy compatibility (current Remedies UI still reads these)', () => {
  test('completeActiveQuest delegates to completeSection("morning") with no independent state', async () => {
    await useRitualStore.getState().completeActiveQuest(4);
    const state = useRitualStore.getState();
    expect(state.completedParts).toEqual(['morning']);
    expect(state.dailyPackItems.morning).toBe(true);
  });

  test('togglePackItem maps morning/midday/evening onto morning/afternoon/night', async () => {
    await useRitualStore.getState().togglePackItem('morning');
    await useRitualStore.getState().togglePackItem('midday');
    await useRitualStore.getState().togglePackItem('evening');

    const state = useRitualStore.getState();
    expect(state.completedParts).toEqual(expect.arrayContaining(['morning', 'afternoon', 'night']));
    expect(state.dailyPackCompleted).toBe(true);
  });

  test('completeDailyPack completes all three sections via completeSection', async () => {
    await useRitualStore.getState().completeDailyPack();
    const state = useRitualStore.getState();
    expect(state.dailyPackCompleted).toBe(true);
    expect(state.completedParts).toHaveLength(3);
  });

  test('questDay and completedNumbers mirror cycleDay and completedCycleNumbers', async () => {
    await seed({ cycleDay: 6, completedCycleNumbers: [3] });
    await relaunch(ACTIVE_PROFILE_ID);

    const state = useRitualStore.getState();
    expect(state.questDay).toBe(6);
    expect(state.completedNumbers).toEqual([3]);
  });
});
