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
import {
  useRitualStore,
  ritualStorageKeyForProfile,
  type RitualPersistenceData,
} from '@/features/remedies/ritualStore';
import { resolveCurrentFocusNumber } from '@/services/questEngine';
import type { Digit, Profile } from '@/core/types';

/** The legacy shared key, still used pre-migration and as a back-compat
 *  fallback - see `ritualStorageKeyForProfile`. */
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
  colorCueDoneForDayId: null,
  resetDoneForDayId: null,
  completedCycleNumbers: [],
  lastCompletedDate: null,
  lastCycleCompletionDate: null,
  streakDays: 0,
};

/**
 * Seed a profile's persisted record directly at its own storage key,
 * bypassing store actions - matching where the store itself now writes
 * (see `ritualStorageKeyForProfile`). Defaults to `ACTIVE_PROFILE_ID` so
 * tests that seed then relaunch as the same profile exercise the
 * preserved-state path; ownership tests pass a different `profileId`
 * explicitly.
 */
async function seed(overrides: Partial<RitualPersistenceData>, profileId: string = ACTIVE_PROFILE_ID): Promise<void> {
  await setItem(ritualStorageKeyForProfile(profileId), { ...DEFAULT_STATE, profileId, ...overrides });
}

/** Seed a record at the single legacy shared key - simulates data written
 *  before per-profile storage keys existed (a real device that hasn't
 *  hydrated under this fix yet). */
async function seedLegacy(overrides: Partial<RitualPersistenceData>): Promise<void> {
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
  await removeItem(ritualStorageKeyForProfile(ACTIVE_PROFILE_ID));
  await removeItem(ritualStorageKeyForProfile(OTHER_PROFILE_ID));
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

  test('6b: profile A\'s own stored record is untouched after profile B hydrates (regression: hydrate() must never overwrite another profile\'s data merely by running)', async () => {
    await seed({ profileId: ACTIVE_PROFILE_ID, cycleDay: 9, completedCycleNumbers: [3], streakDays: 4 });
    const beforeA = await getItem<RitualPersistenceData>(ritualStorageKeyForProfile(ACTIVE_PROFILE_ID));

    await relaunch(OTHER_PROFILE_ID);

    const afterA = await getItem<RitualPersistenceData>(ritualStorageKeyForProfile(ACTIVE_PROFILE_ID));
    expect(afterA).toEqual(beforeA);
    expect(afterA?.cycleDay).toBe(9);
    expect(afterA?.completedCycleNumbers).toEqual([3]);
  });

  test('6c: profile A\'s stored record (even at the legacy pre-migration shared key) survives profile B hydrating', async () => {
    // Simulates a real device that hasn't had any profile hydrate under
    // this fix yet, so profile A's progress still lives at the single
    // shared key rather than its own scoped one.
    await seedLegacy({ cycleDay: 15, completedCycleNumbers: [3, 8], streakDays: 6 });
    const beforeLegacy = await getItem<RitualPersistenceData>(RITUAL_KEY);

    await relaunch(OTHER_PROFILE_ID);

    const afterLegacy = await getItem<RitualPersistenceData>(RITUAL_KEY);
    expect(afterLegacy).toEqual(beforeLegacy);
    expect(afterLegacy?.profileId).toBe(ACTIVE_PROFILE_ID);
    expect(afterLegacy?.cycleDay).toBe(15);

    // Profile B must not see any of it either.
    const stateB = useRitualStore.getState();
    expect(stateB.cycleDay).toBe(1);
    expect(stateB.completedCycleNumbers).toEqual([]);
  });

  test('6d: once profile B performs a real action, its write lands only on its own key - profile A\'s record (legacy-key scenario) remains unchanged', async () => {
    await seedLegacy({ cycleDay: 15, completedCycleNumbers: [3, 8], streakDays: 6 });
    const beforeLegacy = await getItem<RitualPersistenceData>(RITUAL_KEY);

    await relaunch(OTHER_PROFILE_ID);
    await useRitualStore.getState().completeSection('morning');

    // Profile A's legacy-key record is byte-for-byte unchanged.
    const afterLegacy = await getItem<RitualPersistenceData>(RITUAL_KEY);
    expect(afterLegacy).toEqual(beforeLegacy);

    // Profile B's action persisted correctly, but only to its OWN key.
    const persistedB = await getItem<RitualPersistenceData>(ritualStorageKeyForProfile(OTHER_PROFILE_ID));
    expect(persistedB?.profileId).toBe(OTHER_PROFILE_ID);
    expect(persistedB?.completedParts).toEqual(['morning']);

    // And profile B's own in-memory state reflects only its own action.
    const stateB = useRitualStore.getState();
    expect(stateB.completedParts).toEqual(['morning']);
    expect(stateB.cycleDay).toBe(1);
  });

  test('6e: profile A relaunching later still recovers its own progress untouched, after profile B hydrated and acted in between', async () => {
    await seed({ profileId: ACTIVE_PROFILE_ID, cycleDay: 9, completedCycleNumbers: [3], streakDays: 4, lastCompletedDate: '2026-01-01' });

    await relaunch(OTHER_PROFILE_ID);
    await useRitualStore.getState().completeSection('morning');

    await relaunch(ACTIVE_PROFILE_ID);

    const state = useRitualStore.getState();
    expect(state.cycleDay).toBe(9);
    expect(state.completedCycleNumbers).toEqual([3]);
    expect(state.streakDays).toBe(4);
    // Never inherits profile B's unrelated completion.
    expect(state.completedParts).toEqual([]);
  });

  test('6f: a profile\'s own data at the legacy shared key still restores correctly, and migrates to its own key once a write is triggered', async () => {
    await seedLegacy({ cycleDay: 7, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [] });

    mockToday = '2026-01-02'; // forces a day-rollover reconciliation write
    await relaunch(ACTIVE_PROFILE_ID);

    const state = useRitualStore.getState();
    expect(state.cycleDay).toBe(8);

    // Migrated forward onto this profile's own key.
    const scoped = await getItem<RitualPersistenceData>(ritualStorageKeyForProfile(ACTIVE_PROFILE_ID));
    expect(scoped?.cycleDay).toBe(8);
    expect(scoped?.profileId).toBe(ACTIVE_PROFILE_ID);
  });

  test('7: the same profile restores its own progress', async () => {
    await seed({ profileId: ACTIVE_PROFILE_ID, cycleDay: 9, completedCycleNumbers: [3], streakDays: 4, lastCompletedDate: '2026-01-01' });

    await relaunch(ACTIVE_PROFILE_ID);

    const state = useRitualStore.getState();
    expect(state.cycleDay).toBe(9);
    expect(state.completedCycleNumbers).toEqual([3]);
    expect(state.streakDays).toBe(4);
  });

  test('8a: a stale hydrate() for profile A cannot overwrite in-memory state after profile B has already hydrated (Fix B: generation guard)', async () => {
    await seed({ cycleDay: 9, completedCycleNumbers: [3] }, ACTIVE_PROFILE_ID);
    await seed({ cycleDay: 15, completedCycleNumbers: [7] }, OTHER_PROFILE_ID);

    // Deterministically pause profile A's hydrate() at its very first
    // awaited storage read, using a manually-resolved gate (same technique
    // as the `setItem` gate above) rather than a timer - so the ordering
    // below is forced, not incidental to mock speed.
    const getItemMock = getItem as jest.Mock;
    const originalGetItemImpl = getItemMock.getMockImplementation()!;
    let releaseProfileARead: () => void = () => {};
    const profileAReadGate = new Promise<void>((resolve) => {
      releaseProfileARead = resolve;
    });
    getItemMock.mockImplementationOnce(async (key: string) => {
      await profileAReadGate;
      return originalGetItemImpl(key);
    });

    // Start profile A's hydration - it immediately suspends on the gated
    // storage read above and does not resolve yet.
    const hydrateAPromise = useRitualStore.getState().hydrate(profileWithId(ACTIVE_PROFILE_ID));

    // Profile B's hydration is started afterward (a later profile switch)
    // but runs to completion first, via the normal unblocked mock.
    await useRitualStore.getState().hydrate(profileWithId(OTHER_PROFILE_ID));

    expect(useRitualStore.getState().profileId).toBe(OTHER_PROFILE_ID);
    expect(useRitualStore.getState().cycleDay).toBe(15);

    // Now let the stale, earlier-started profile A hydration actually finish.
    releaseProfileARead();
    await hydrateAPromise;

    // Profile B's in-memory state must still be in place - A's
    // later-resolving result must not win just because its storage read
    // took longer, even though A's hydrate() call was initiated first.
    const state = useRitualStore.getState();
    expect(state.profileId).toBe(OTHER_PROFILE_ID);
    expect(state.cycleDay).toBe(15);
    expect(state.completedCycleNumbers).toEqual([7]);
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

describe('Color Cue / Body & Breath Reset prerequisite persistence', () => {
  const DAY_A = 'n3-d5';
  const DAY_B = 'n3-d6';

  test('markColorCueDone sets colorCueDoneForDayId', async () => {
    await useRitualStore.getState().markColorCueDone(DAY_A);
    expect(useRitualStore.getState().colorCueDoneForDayId).toBe(DAY_A);
  });

  test('markResetDone sets resetDoneForDayId', async () => {
    await useRitualStore.getState().markResetDone(DAY_A);
    expect(useRitualStore.getState().resetDoneForDayId).toBe(DAY_A);
  });

  test('Color Cue completion survives a simulated app relaunch', async () => {
    await useRitualStore.getState().markColorCueDone(DAY_A);

    await relaunch(ACTIVE_PROFILE_ID);

    expect(useRitualStore.getState().colorCueDoneForDayId).toBe(DAY_A);
  });

  test('Body & Breath Reset completion survives a simulated app relaunch', async () => {
    await useRitualStore.getState().markResetDone(DAY_A);

    await relaunch(ACTIVE_PROFILE_ID);

    expect(useRitualStore.getState().resetDoneForDayId).toBe(DAY_A);
  });

  test('completing only Color Cue does not mark morning complete', async () => {
    await useRitualStore.getState().markColorCueDone(DAY_A);

    expect(useRitualStore.getState().completedParts).toEqual([]);
  });

  test('completing only Body & Breath Reset does not mark morning complete', async () => {
    await useRitualStore.getState().markResetDone(DAY_A);

    expect(useRitualStore.getState().completedParts).toEqual([]);
  });

  test('completing both prerequisites still allows the existing morning-completion flow to work, and does not discard them', async () => {
    // Mirrors `remedies.tsx`'s own effect: once both prerequisites are done
    // for today, it calls `completeSection('morning')` itself - the store
    // does not auto-complete morning on its own.
    await useRitualStore.getState().markColorCueDone(DAY_A);
    await useRitualStore.getState().markResetDone(DAY_A);
    expect(useRitualStore.getState().completedParts).toEqual([]);

    await useRitualStore.getState().completeSection('morning');

    const state = useRitualStore.getState();
    expect(state.completedParts).toEqual(['morning']);
    // Regression guard: completing a section must not overwrite the
    // already-persisted prerequisite flags with stale/undefined values.
    expect(state.colorCueDoneForDayId).toBe(DAY_A);
    expect(state.resetDoneForDayId).toBe(DAY_A);
  });

  test('advancing to a new practice day leaves the old day\'s ids in place, which the caller compares against the new practiceDay.id', async () => {
    await useRitualStore.getState().markColorCueDone(DAY_A);
    await useRitualStore.getState().markResetDone(DAY_A);
    await useRitualStore.getState().completeSection('morning');
    await useRitualStore.getState().completeSection('afternoon');
    await useRitualStore.getState().completeSection('night');

    await useRitualStore.getState().advancePracticeDayIfComplete();

    const state = useRitualStore.getState();
    expect(state.cycleDay).toBe(2);
    // Neither field is explicitly cleared on advance - by design, the
    // caller's `=== practiceDay.id` comparison is what makes a stale id
    // read as "not done" for the new day (DAY_A !== DAY_B here).
    expect(state.colorCueDoneForDayId).toBe(DAY_A);
    expect(state.resetDoneForDayId).toBe(DAY_A);
    expect(state.colorCueDoneForDayId).not.toBe(DAY_B);
    expect(state.resetDoneForDayId).not.toBe(DAY_B);
  });

  test('older stored records without these fields hydrate safely as null, not undefined or a crash', async () => {
    // Simulates a record written before this fix existed: valid 21-day
    // cycle data (satisfies isCycleData), but genuinely missing both keys.
    await setItem(RITUAL_KEY, {
      profileId: ACTIVE_PROFILE_ID,
      cycleDay: 5,
      completedParts: ['morning'],
      completedCycleNumbers: [],
      lastCompletedDate: '2026-01-01',
      lastCycleCompletionDate: null,
      streakDays: 2,
    });

    await relaunch(ACTIVE_PROFILE_ID);

    const state = useRitualStore.getState();
    expect(state.colorCueDoneForDayId).toBeNull();
    expect(state.resetDoneForDayId).toBeNull();
    // The rest of the older record hydrates normally alongside it.
    expect(state.cycleDay).toBe(5);
    expect(state.completedParts).toEqual(['morning']);
  });

  test('marking the same day done twice does not duplicate effects or change the stored id', async () => {
    await useRitualStore.getState().markColorCueDone(DAY_A);
    await useRitualStore.getState().markColorCueDone(DAY_A);

    expect(useRitualStore.getState().colorCueDoneForDayId).toBe(DAY_A);
  });

  test('Color Cue then Body & Breath Reset: both flags and completedParts persist correctly through a relaunch', async () => {
    await useRitualStore.getState().markColorCueDone(DAY_A);
    await useRitualStore.getState().markResetDone(DAY_A);
    await useRitualStore.getState().completeSection('morning');

    await relaunch(ACTIVE_PROFILE_ID);

    const state = useRitualStore.getState();
    expect(state.colorCueDoneForDayId).toBe(DAY_A);
    expect(state.resetDoneForDayId).toBe(DAY_A);
    expect(state.completedParts).toEqual(['morning']);

    const persisted = await getItem<RitualPersistenceData>(ritualStorageKeyForProfile(ACTIVE_PROFILE_ID));
    expect(persisted?.colorCueDoneForDayId).toBe(DAY_A);
    expect(persisted?.resetDoneForDayId).toBe(DAY_A);
    expect(persisted?.completedParts).toEqual(['morning']);
  });

  test('Body & Breath Reset then Color Cue: both flags and completedParts persist correctly through a relaunch', async () => {
    // The mirrored order - this previously failed intermittently on-device
    // due to unserialized, unawaited writes racing each other.
    await useRitualStore.getState().markResetDone(DAY_A);
    await useRitualStore.getState().markColorCueDone(DAY_A);
    await useRitualStore.getState().completeSection('morning');

    await relaunch(ACTIVE_PROFILE_ID);

    const state = useRitualStore.getState();
    expect(state.colorCueDoneForDayId).toBe(DAY_A);
    expect(state.resetDoneForDayId).toBe(DAY_A);
    expect(state.completedParts).toEqual(['morning']);

    const persisted = await getItem<RitualPersistenceData>(ritualStorageKeyForProfile(ACTIVE_PROFILE_ID));
    expect(persisted?.colorCueDoneForDayId).toBe(DAY_A);
    expect(persisted?.resetDoneForDayId).toBe(DAY_A);
    expect(persisted?.completedParts).toEqual(['morning']);
  });

  test('overlapping prerequisite and completeSection writes land on disk in initiation order, not out of order', async () => {
    // Simulates the real production pattern: a tap fires `markColorCueDone`
    // without awaiting it, then (via remedies.tsx's effect) `markResetDone`
    // and the auto-triggered `completeSection('morning')` are both initiated
    // before the first write has actually settled. Uses a manually-resolved
    // gate - not a timer/delay - to force the FIRST write's underlying
    // `setItem` to stay pending while the next two are initiated, so the
    // queue's ordering guarantee (rather than incidental mock speed) is what
    // the assertion below actually exercises.
    const setItemMock = setItem as jest.Mock;
    const originalImpl = setItemMock.getMockImplementation()!;
    let releaseFirstWrite: () => void = () => {};
    const firstWriteGate = new Promise<void>((resolve) => {
      releaseFirstWrite = resolve;
    });
    setItemMock.mockImplementationOnce(async (key: string, value: unknown) => {
      await firstWriteGate;
      return originalImpl(key, value);
    });

    const colorCuePromise = useRitualStore.getState().markColorCueDone(DAY_A);
    const resetPromise = useRitualStore.getState().markResetDone(DAY_A);
    const morningPromise = useRitualStore.getState().completeSection('morning');

    // Only release the first write once all three actions have already
    // synchronously applied their in-memory `set()` and enqueued their
    // writes - proving the final result doesn't depend on which underlying
    // `setItem` call happens to finish fastest.
    releaseFirstWrite();
    await Promise.all([colorCuePromise, resetPromise, morningPromise]);

    const state = useRitualStore.getState();
    expect(state.colorCueDoneForDayId).toBe(DAY_A);
    expect(state.resetDoneForDayId).toBe(DAY_A);
    expect(state.completedParts).toEqual(['morning']);

    const persisted = await getItem<RitualPersistenceData>(ritualStorageKeyForProfile(ACTIVE_PROFILE_ID));
    expect(persisted?.colorCueDoneForDayId).toBe(DAY_A);
    expect(persisted?.resetDoneForDayId).toBe(DAY_A);
    expect(persisted?.completedParts).toEqual(['morning']);
  });

  test('a failed queued write does not block a later write from still being persisted', async () => {
    const setItemMock = setItem as jest.Mock;
    setItemMock.mockImplementationOnce(async () => {
      throw new Error('simulated AsyncStorage failure');
    });

    // The failure must propagate to its own caller, not be silently
    // swallowed as if persistence had succeeded.
    await expect(useRitualStore.getState().markColorCueDone(DAY_A)).rejects.toThrow(
      'simulated AsyncStorage failure',
    );

    // But the queue itself must recover - a later write must still go
    // through normally rather than being stuck behind the failed one.
    await useRitualStore.getState().markResetDone(DAY_A);

    const persisted = await getItem<RitualPersistenceData>(ritualStorageKeyForProfile(ACTIVE_PROFILE_ID));
    expect(persisted?.resetDoneForDayId).toBe(DAY_A);
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
    // Profile A was working through Number 3's cycle (the first-in-Lo-Shu-
    // order remaining missing number - 4,9,2,3,5,7,8,1,6 - among 8,3,6, 3
    // is first) and just finished day 21.
    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [] });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, missingNumbers);

    expect(useRitualStore.getState().completedCycleNumbers).toEqual([3]);
  });

  test('21: the next eligible missing number becomes active, matching resolveCurrentFocusNumber for the same inputs (derived, not stored)', async () => {
    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [] });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, missingNumbers);

    const completedNow = useRitualStore.getState().completedCycleNumbers;
    // 3 is now done; among the remaining {8, 6}, 8 precedes 6 in Lo Shu
    // order (4,9,2,3,5,7,8,1,6) - the same rule `remedies.tsx` uses to pick
    // what to display, via `resolveCurrentFocusNumber`.
    const nextActive = resolveCurrentFocusNumber(missingNumbers, completedNow, {} as Record<Digit, number>, 1);
    expect(nextActive).toBe(8);
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

  test('24: once all missing numbers are completed, completedCycleNumbers holds exactly those three and stops growing', async () => {
    // Finishing the last remaining number (6).
    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [3, 8] });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, missingNumbers);

    const state = useRitualStore.getState();
    expect(state.completedCycleNumbers.slice().sort()).toEqual([3, 6, 8]);

    // A further wraparound (every missing number now already completed)
    // must not add a duplicate or any other number.
    useRitualStore.setState({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01' });
    await useRitualStore.getState().advancePracticeDayIfComplete(missingNumbers);
    expect(useRitualStore.getState().completedCycleNumbers.slice().sort()).toEqual([3, 6, 8]);
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

  test('the number credited at wraparound follows Lo Shu order (4,9,2,3,5,7,8,1,6), not HEALING_PRIORITY_ORDER', async () => {
    // Among {1, 9}: Lo Shu order places 9 first (position 2); the old
    // HEALING_PRIORITY_ORDER ([1,3,4,8,7,6,2,5,9]) would have picked 1
    // first instead - this is the deliberately-diverging case.
    const divergingMissing: Digit[] = [1, 9];
    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [] });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, divergingMissing);

    expect(useRitualStore.getState().completedCycleNumbers).toEqual([9]);
  });

  test('a previously completed missing number is skipped at wraparound, crediting the next eligible one in Lo Shu order', async () => {
    // Lo Shu order among {4, 9, 2} is 4, 9, 2 - 4 has already finished, so
    // the next wraparound should credit 9, not re-credit 4 or skip to 2.
    const threeMissing: Digit[] = [4, 9, 2];
    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [4] });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, threeMissing);

    expect(useRitualStore.getState().completedCycleNumbers.slice().sort()).toEqual([4, 9]);
  });

  test('the credited number matches resolveCurrentFocusNumber\'s selection for the same missing/completed inputs', async () => {
    const someMissing: Digit[] = [7, 1, 2];
    const alreadyCompleted: Digit[] = [];

    // What the screen's resolver would select right now for these inputs
    // (Lo Shu order among {7,1,2}: 2 first).
    const expectedSelection = resolveCurrentFocusNumber(
      someMissing,
      alreadyCompleted,
      {} as Record<Digit, number>,
      1,
    );
    expect(expectedSelection).toBe(2);

    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: alreadyCompleted });
    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, someMissing);

    // The store credits the exact same number the resolver would have
    // selected to display/practice for these same inputs.
    expect(useRitualStore.getState().completedCycleNumbers).toEqual([expectedSelection]);
  });

  test('fallback: once every missing number has already completed its cycle, a further wraparound credits nothing new', async () => {
    const allDoneMissing: Digit[] = [5, 2];
    await seed({ cycleDay: 21, lastCycleCompletionDate: '2026-01-01', completedCycleNumbers: [5, 2] });

    mockToday = '2026-01-02';
    await relaunch(ACTIVE_PROFILE_ID, allDoneMissing);

    const state = useRitualStore.getState();
    // Still advances the day (the 21-day cycle itself always wraps once
    // complete) but credits nothing new - there is no missing-number
    // equivalent of "finishing a cycle" for the least-represented fallback.
    expect(state.cycleDay).toBe(1);
    expect(state.completedCycleNumbers.slice().sort()).toEqual([2, 5]);
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
    expect(await getItem(ritualStorageKeyForProfile(ACTIVE_PROFILE_ID))).toMatchObject({ profileId: ACTIVE_PROFILE_ID });
  });
});

describe('resetRituals (Fix A: preserves profileId)', () => {
  test('reset persists the active profile\'s cleared state to its own key, and never touches the shared legacy key', async () => {
    // Unrelated data at the shared legacy key, owned by a different
    // profile - resetRituals() must have zero effect on it.
    await setItem(RITUAL_KEY, { ...DEFAULT_STATE, profileId: OTHER_PROFILE_ID, cycleDay: 15, completedCycleNumbers: [7] });
    const beforeLegacy = await getItem<RitualPersistenceData>(RITUAL_KEY);

    await relaunch(ACTIVE_PROFILE_ID);
    await useRitualStore.getState().completeSection('morning');
    expect(useRitualStore.getState().completedParts).toEqual(['morning']);

    await useRitualStore.getState().resetRituals();

    // In-memory state is cleared, but profile ownership is preserved.
    const state = useRitualStore.getState();
    expect(state.profileId).toBe(ACTIVE_PROFILE_ID);
    expect(state.cycleDay).toBe(1);
    expect(state.completedParts).toEqual([]);

    // The reset payload landed on this profile's OWN key, carrying its id.
    const persisted = await getItem<RitualPersistenceData>(ritualStorageKeyForProfile(ACTIVE_PROFILE_ID));
    expect(persisted?.profileId).toBe(ACTIVE_PROFILE_ID);
    expect(persisted?.cycleDay).toBe(1);
    expect(persisted?.completedParts).toEqual([]);

    // The shared legacy key - and whatever other profile's data lives
    // there - is completely untouched by this reset.
    const afterLegacy = await getItem<RitualPersistenceData>(RITUAL_KEY);
    expect(afterLegacy).toEqual(beforeLegacy);
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
