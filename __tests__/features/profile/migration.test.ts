/**
 * Exercises `migrateLegacyProfileToRegistry()` entirely against mocked
 * storage (`getRawItem`/`setItem` from `@/lib/storage`), backed by a
 * per-test in-memory Map - the same mocking style already used in
 * `ritualStore.test.ts`. Nothing here touches real AsyncStorage, app
 * startup, onboarding, or any `remedies.rituals.*` key.
 */
jest.mock('@/lib/storage', () => ({
  getRawItem: jest.fn(),
  setItem: jest.fn(),
}));

import { getRawItem, setItem } from '@/lib/storage';
import { migrateLegacyProfileToRegistry } from '@/features/profile/migration';
import type { Profile } from '@/core/types';

const getRawItemMock = getRawItem as jest.Mock;
const setItemMock = setItem as jest.Mock;

const PROFILES_ALL_KEY = 'profiles.all';
const ACTIVE_ID_KEY = 'profiles.activeId';
const LEGACY_KEY = 'profile.current';

let store: Map<string, string>;

function seed(key: string, value: unknown): void {
  store.set(key, JSON.stringify(value));
}

function readStored<T>(key: string): T | undefined {
  const raw = store.get(key);
  return raw === undefined ? undefined : (JSON.parse(raw) as T);
}

const MAYA: Profile = {
  id: 'p_maya',
  fullName: 'Maya Sharma',
  dob: '1992-05-14',
  system: 'pythagorean',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const MEERA: Profile = {
  id: 'p_meera',
  fullName: 'Meera Sharma',
  dob: '1992-05-14',
  system: 'pythagorean',
  createdAt: '2026-01-02T00:00:00.000Z',
};

beforeEach(() => {
  store = new Map();
  getRawItemMock.mockReset();
  setItemMock.mockReset();
  getRawItemMock.mockImplementation(async (key: string) => store.get(key) ?? null);
  setItemMock.mockImplementation(async (key: string, value: unknown) => {
    store.set(key, JSON.stringify(value));
  });
});

/**
 * Applies to EVERY test in this file, not just the ones that mention it -
 * migration must never write `profile.current` or any `remedies.rituals.*`
 * key, under any scenario exercised anywhere above. Reads `setItemMock`'s
 * call history immediately after each test, before the next test's
 * `beforeEach` resets it.
 */
afterEach(() => {
  for (const [key] of setItemMock.mock.calls) {
    expect(key).not.toBe(LEGACY_KEY);
    expect(String(key).startsWith('remedies.rituals')).toBe(false);
  }
});

describe('1. No registry and no legacy profile', () => {
  test('creates an empty registry and never invents a profile or active id', async () => {
    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'initialized_empty', pointerStep: 'skipped' });
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([]);
    expect(store.has(ACTIVE_ID_KEY)).toBe(false);
    // Exactly one write (the empty registry) - activeId is never touched.
    expect(setItemMock).toHaveBeenCalledTimes(1);
  });
});

describe('2. Valid legacy profile and absent registry', () => {
  test('migrates the legacy profile with its exact id and fields preserved, and sets the active id', async () => {
    seed(LEGACY_KEY, MAYA);

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'merged', pointerStep: 'set' });
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]);
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe(MAYA.id);
  });
});

describe('3. Legacy profile already exists in the registry', () => {
  test('identical fields: does not duplicate, and still sets the active id if it was unset', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);
    seed(LEGACY_KEY, MAYA);

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'already_present', pointerStep: 'set' });
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]); // no duplicate
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe(MAYA.id);
  });

  test('the active-pointer step is evaluated independently even when the data step is a full no-op', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);
    seed(ACTIVE_ID_KEY, MAYA.id); // already set
    seed(LEGACY_KEY, MAYA);

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'already_present', pointerStep: 'left_unchanged' });
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]);
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe(MAYA.id);
    // Nothing was written at all - a true full no-op.
    expect(setItemMock).not.toHaveBeenCalled();
  });
});

describe('4. Existing registry contains other profiles', () => {
  test('preserves existing entries and their order, appending the legacy profile once', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);
    seed(LEGACY_KEY, MAYA);

    const result = await migrateLegacyProfileToRegistry();

    expect(result.dataStep).toBe('merged');
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MEERA, MAYA]);
  });
});

describe('5. Existing active id is never overwritten', () => {
  test('appending a new legacy profile never steals the active selection from an existing one', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);
    seed(ACTIVE_ID_KEY, MEERA.id);
    seed(LEGACY_KEY, MAYA);

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'merged', pointerStep: 'left_unchanged' });
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MEERA, MAYA]);
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe(MEERA.id);
  });
});

describe('6. Registry write succeeds, active-pointer write fails, then retry succeeds', () => {
  test('retry completes only the missing pointer write, with no duplication', async () => {
    seed(LEGACY_KEY, MAYA);

    // First run: the profiles.all write (1st setItem call) succeeds
    // normally; the profiles.activeId write (2nd call) fails.
    setItemMock.mockImplementationOnce(async (key: string, value: unknown) => {
      store.set(key, JSON.stringify(value));
    });
    setItemMock.mockImplementationOnce(async () => {
      throw new Error('simulated write failure');
    });

    const firstResult = await migrateLegacyProfileToRegistry();

    expect(firstResult).toEqual({
      dataStep: 'merged',
      pointerStep: 'aborted',
      abortReason: { activeId: 'write_failure' },
    });
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]);
    expect(store.has(ACTIVE_ID_KEY)).toBe(false);

    // Retry - no more queued failures, falls back to the normal mock.
    const secondResult = await migrateLegacyProfileToRegistry();

    expect(secondResult).toEqual({ dataStep: 'already_present', pointerStep: 'set' });
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]); // still no duplicate
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe(MAYA.id);
  });
});

describe('7. Conflicting profile records', () => {
  test('same id, different fields: reports a conflict and writes nothing', async () => {
    const registryVersion: Profile = { ...MAYA, dob: '1990-01-01' };
    seed(PROFILES_ALL_KEY, [registryVersion]);
    seed(LEGACY_KEY, MAYA);

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({
      dataStep: 'conflict',
      pointerStep: 'skipped',
      conflict: { id: MAYA.id, registryVersion, legacyVersion: MAYA },
    });
    expect(setItemMock).not.toHaveBeenCalled();
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([registryVersion]); // untouched
  });
});

describe('8. Malformed registry aborts safely', () => {
  test('a shape-invalid registry value is never treated as absent, and nothing is written', async () => {
    seed(PROFILES_ALL_KEY, { notAnArray: true });
    seed(LEGACY_KEY, MAYA);

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'aborted', pointerStep: 'skipped', abortReason: { registry: 'malformed' } });
    expect(setItemMock).not.toHaveBeenCalled();
    expect(readStored(PROFILES_ALL_KEY)).toEqual({ notAnArray: true }); // original bytes preserved
  });
});

describe('9. Registry read failure aborts safely', () => {
  test('a thrown native read is distinct from malformed and never proceeds as if empty', async () => {
    getRawItemMock.mockImplementationOnce(async () => {
      throw new Error('native read failure');
    });
    seed(LEGACY_KEY, MAYA);

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({
      dataStep: 'aborted',
      pointerStep: 'skipped',
      abortReason: { registry: 'read_failure' },
    });
    expect(setItemMock).not.toHaveBeenCalled();
    // The registry's own read is what failed - nothing is claimed about it.
    // But `profile.current` was never even attempted (the function aborts
    // before reaching it), so the value seeded there is still exactly as
    // seeded and still readable - this IS a value whose read succeeded.
    expect(readStored<Profile>(LEGACY_KEY)).toEqual(MAYA);
  });
});

describe('10. Malformed legacy data aborts safely', () => {
  test('nothing is written when legacy data cannot be validated, even with an absent registry', async () => {
    seed(LEGACY_KEY, { missing: 'required fields' });

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'aborted', pointerStep: 'skipped', abortReason: { legacy: 'malformed' } });
    expect(setItemMock).not.toHaveBeenCalled();
    expect(store.has(PROFILES_ALL_KEY)).toBe(false); // not even initialized to []
  });
});

describe('11. Legacy read failure aborts safely', () => {
  test('a thrown native read for the legacy key is distinct from malformed and writes nothing', async () => {
    // A genuinely pre-existing, successfully-readable registry value - so
    // there is something concrete to prove is preserved, distinct from the
    // legacy value whose read is about to fail.
    seed(PROFILES_ALL_KEY, [MEERA]);

    // 1st getRawItem call = profiles.all (succeeds, returns the seeded
    // value above); 2nd = profile.current (throws).
    getRawItemMock.mockImplementationOnce(async (key: string) => store.get(key) ?? null);
    getRawItemMock.mockImplementationOnce(async () => {
      throw new Error('native read failure');
    });

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'aborted', pointerStep: 'skipped', abortReason: { legacy: 'read_failure' } });
    expect(setItemMock).not.toHaveBeenCalled();
    // The registry's own read succeeded and is left completely unchanged -
    // no claim is made about `profile.current`, whose read is what failed.
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MEERA]);
  });
});

describe('12. Dangling active-id detection (correction: previously unreported)', () => {
  // --- Case A: a legacy profile exists to merge ---

  test('1. dangling active id with a legacy profile being merged is reported, never fixed', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);
    seed(ACTIVE_ID_KEY, 'p_ghost'); // resolves to no real entry, in either the old or final registry
    seed(LEGACY_KEY, MAYA);

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'merged', pointerStep: 'left_unchanged', danglingActiveId: 'p_ghost' });
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe('p_ghost'); // preserved verbatim, never "fixed"
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MEERA, MAYA]); // the merge itself still happens
    expect(setItemMock).toHaveBeenCalledTimes(1); // only the registry merge write - never the pointer
  });

  test('2. a valid active id matching a registry profile is never reported as dangling', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);
    seed(ACTIVE_ID_KEY, MEERA.id);
    seed(LEGACY_KEY, MAYA);

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'merged', pointerStep: 'left_unchanged' });
    expect(result.danglingActiveId).toBeUndefined();
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe(MEERA.id); // untouched either way
  });

  test('5a. a malformed active pointer is never classified as dangling (Case A)', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);
    store.set(ACTIVE_ID_KEY, JSON.stringify(42)); // well-formed JSON, wrong shape
    seed(LEGACY_KEY, MAYA);

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'merged', pointerStep: 'aborted', abortReason: { activeId: 'malformed' } });
    expect(result.danglingActiveId).toBeUndefined();
    expect(setItemMock).toHaveBeenCalledTimes(1); // only the registry merge - pointer untouched
  });

  test('7a. a thrown active-pointer read is reported as read_failure, distinct from malformed (Case A)', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);
    seed(LEGACY_KEY, MAYA);
    // Call order: 1st getRawItem = profiles.all, 2nd = profile.current,
    // 3rd = profiles.activeId (the one that throws). Queuing the first two
    // with the normal behavior guarantees the throw lands on the third
    // call specifically, regardless of the registry-merge `setItem` call
    // that happens in between (setItem has its own, separate mock queue).
    getRawItemMock.mockImplementationOnce(async (key: string) => store.get(key) ?? null);
    getRawItemMock.mockImplementationOnce(async (key: string) => store.get(key) ?? null);
    getRawItemMock.mockImplementationOnce(async () => {
      throw new Error('native read failure');
    });

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'merged', pointerStep: 'aborted', abortReason: { activeId: 'read_failure' } });
    expect(result.danglingActiveId).toBeUndefined();
    expect(setItemMock).toHaveBeenCalledTimes(1); // only the registry merge - no unsafe pointer write
    expect(store.has(ACTIVE_ID_KEY)).toBe(false); // never written
  });

  // --- Case B: no legacy profile exists ---

  test('3. a dangling active id with no legacy profile is reported, with no writes at all', async () => {
    seed(PROFILES_ALL_KEY, [MEERA, MAYA]);
    seed(ACTIVE_ID_KEY, 'p_ghost'); // resolves to no real entry

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'no_legacy', pointerStep: 'skipped', danglingActiveId: 'p_ghost' });
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe('p_ghost'); // completely untouched
    expect(setItemMock).not.toHaveBeenCalled();
  });

  test('4. an absent active pointer is never reported as dangling', async () => {
    seed(PROFILES_ALL_KEY, [MEERA, MAYA]); // no ACTIVE_ID_KEY seeded at all

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'no_legacy', pointerStep: 'skipped' });
    expect(result.danglingActiveId).toBeUndefined();
    expect(setItemMock).not.toHaveBeenCalled();
  });

  test('2b. a valid active id already matching a registry profile, with no legacy present, is never reported as dangling (Case B)', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);
    seed(ACTIVE_ID_KEY, MAYA.id); // already correctly set, no legacy involved at all

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'no_legacy', pointerStep: 'skipped' });
    expect(result.danglingActiveId).toBeUndefined();
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe(MAYA.id); // untouched
    expect(setItemMock).not.toHaveBeenCalled();
  });

  test('7b. a thrown active-pointer read is reported as read_failure, distinct from malformed (Case B)', async () => {
    seed(PROFILES_ALL_KEY, [MEERA, MAYA]); // valid, populated - no legacy to merge
    // Call order: 1st getRawItem = profiles.all, 2nd = profile.current
    // (absent, legacy === null), 3rd = profiles.activeId (throws).
    getRawItemMock.mockImplementationOnce(async (key: string) => store.get(key) ?? null);
    getRawItemMock.mockImplementationOnce(async (key: string) => store.get(key) ?? null);
    getRawItemMock.mockImplementationOnce(async () => {
      throw new Error('native read failure');
    });

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'no_legacy', pointerStep: 'aborted', abortReason: { activeId: 'read_failure' } });
    expect(result.danglingActiveId).toBeUndefined();
    expect(setItemMock).not.toHaveBeenCalled(); // no unsafe writes at all
  });

  test('5b. a malformed active pointer is never classified as dangling, and nothing is guessed or repaired (Case B)', async () => {
    seed(PROFILES_ALL_KEY, [MEERA, MAYA]);
    store.set(ACTIVE_ID_KEY, JSON.stringify({ not: 'a valid id' })); // well-formed JSON, wrong shape

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'no_legacy', pointerStep: 'aborted', abortReason: { activeId: 'malformed' } });
    expect(result.danglingActiveId).toBeUndefined();
    expect(setItemMock).not.toHaveBeenCalled(); // no automatic repair, selection, or deletion
    expect(readStored(PROFILES_ALL_KEY)).toEqual([MEERA, MAYA]); // registry untouched
  });

  test('6. a malformed registry still aborts fully, before any dangling check is possible', async () => {
    seed(PROFILES_ALL_KEY, { notAnArray: true });
    seed(ACTIVE_ID_KEY, 'p_ghost');

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({ dataStep: 'aborted', pointerStep: 'skipped', abortReason: { registry: 'malformed' } });
    expect(result.danglingActiveId).toBeUndefined();
    expect(setItemMock).not.toHaveBeenCalled();
  });
});

describe('13. Write failures are reported accurately', () => {
  test('a registry write failure is reported distinctly, and the pointer step is never attempted', async () => {
    seed(LEGACY_KEY, MAYA);
    setItemMock.mockImplementationOnce(async () => {
      throw new Error('simulated write failure');
    });

    const result = await migrateLegacyProfileToRegistry();

    expect(result).toEqual({
      dataStep: 'aborted',
      pointerStep: 'skipped',
      abortReason: { registry: 'write_failure' },
    });
    expect(setItemMock).toHaveBeenCalledTimes(1); // only the one failed attempt
    expect(store.has(ACTIVE_ID_KEY)).toBe(false);
  });
});

describe('14. Re-running a completed migration causes no duplicate profiles or unnecessary writes', () => {
  test('a second run after a fully successful first run performs zero writes', async () => {
    seed(LEGACY_KEY, MAYA);

    const first = await migrateLegacyProfileToRegistry();
    expect(first).toEqual({ dataStep: 'merged', pointerStep: 'set' });
    expect(setItemMock).toHaveBeenCalledTimes(2);

    setItemMock.mockClear();

    const second = await migrateLegacyProfileToRegistry();

    expect(second).toEqual({ dataStep: 'already_present', pointerStep: 'left_unchanged' });
    expect(setItemMock).not.toHaveBeenCalled();
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]); // still exactly one entry
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe(MAYA.id);
  });
});
