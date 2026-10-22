/**
 * Exercises the Stage 3 registry APIs on `profileRepo`
 * (`createProfile` / `updateProfile` / `setActiveProfile` / `getAll` /
 * `getById` / `getActiveProfile`) against mocked storage, backed by a
 * per-test in-memory Map - the same mocking style already used in
 * `migration.test.ts`. The pre-existing `repo.test.ts` (legacy `save()`
 * identity-change behavior) is untouched and unaffected by this file.
 */
jest.mock('@/lib/storage', () => ({
  getRawItem: jest.fn(),
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { getRawItem, setItem } from '@/lib/storage';
import { profileRepo } from '@/features/profile/repo';
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

const MAYA_INPUT = { fullName: 'Maya Sharma', dob: '1992-05-14', system: 'pythagorean' as const };
const MEERA_INPUT = { fullName: 'Meera Sharma', dob: '1992-05-14', system: 'pythagorean' as const };

beforeEach(() => {
  store = new Map();
  getRawItemMock.mockReset();
  setItemMock.mockReset();
  getRawItemMock.mockImplementation(async (key: string) => store.get(key) ?? null);
  setItemMock.mockImplementation(async (key: string, value: unknown) => {
    store.set(key, JSON.stringify(value));
  });
});

/** Applies to every test here - none of the registry APIs may ever touch
 *  `profile.current` or any `remedies.rituals.*` key. */
afterEach(() => {
  for (const [key] of setItemMock.mock.calls) {
    expect(key).not.toBe(LEGACY_KEY);
    expect(String(key).startsWith('remedies.rituals')).toBe(false);
  }
});

describe('createProfile', () => {
  test('creates the first profile when the registry is absent', async () => {
    const result = await profileRepo.createProfile(MAYA_INPUT);

    expect(result.status).toBe('created');
    if (result.status !== 'created') return;
    expect(result.profile.fullName).toBe('Maya Sharma');
    expect(result.profile.dob).toBe('1992-05-14');
    expect(result.profile.system).toBe('pythagorean');
    expect(typeof result.profile.id).toBe('string');
    expect(result.profile.id.length).toBeGreaterThan(0);
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([result.profile]);
  });

  test('appends to an existing registry without removing other profiles', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);

    const result = await profileRepo.createProfile(MAYA_INPUT);

    expect(result.status).toBe('created');
    const registry = readStored<Profile[]>(PROFILES_ALL_KEY)!;
    expect(registry).toHaveLength(2);
    expect(registry[0]).toEqual(MEERA);
    expect(registry[1]?.fullName).toBe('Maya Sharma');
  });

  test('two profiles with identical name and dob get distinct ids', async () => {
    const first = await profileRepo.createProfile(MAYA_INPUT);
    const second = await profileRepo.createProfile(MAYA_INPUT);

    expect(first.status).toBe('created');
    expect(second.status).toBe('created');
    if (first.status !== 'created' || second.status !== 'created') return;
    expect(first.profile.id).not.toBe(second.profile.id);
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toHaveLength(2);
  });

  test('rejects an empty or whitespace-only fullName without writing', async () => {
    const result = await profileRepo.createProfile({ ...MAYA_INPUT, fullName: '   ' });

    expect(result.status).toBe('invalid_input');
    expect(store.has(PROFILES_ALL_KEY)).toBe(false);
  });

  test('rejects a calendar-invalid dob without writing', async () => {
    const result = await profileRepo.createProfile({ ...MAYA_INPUT, dob: '2099-02-30' });

    expect(result.status).toBe('invalid_input');
    expect(store.has(PROFILES_ALL_KEY)).toBe(false);
  });

  test('rejects a runtime-invalid numerology system (bypassing TypeScript) without writing', async () => {
    // Simulates a value reaching this function from an untyped boundary -
    // `as unknown as 'pythagorean'` bypasses compile-time checking the
    // same way an untyped caller or `JSON.parse`d value could.
    const result = await profileRepo.createProfile({
      ...MAYA_INPUT,
      system: 'western' as unknown as 'pythagorean',
    });

    expect(result).toEqual({ status: 'invalid_input', reason: 'system must be a supported numerology system' });
    expect(store.has(PROFILES_ALL_KEY)).toBe(false);
  });

  test('never writes profiles.activeId as a side effect', async () => {
    await profileRepo.createProfile(MAYA_INPUT);

    expect(store.has(ACTIVE_ID_KEY)).toBe(false);
  });

  test('a malformed registry aborts without creating anything', async () => {
    seed(PROFILES_ALL_KEY, { notAnArray: true });

    const result = await profileRepo.createProfile(MAYA_INPUT);

    expect(result).toEqual({ status: 'registry_malformed', raw: JSON.stringify({ notAnArray: true }) });
    expect(setItemMock).not.toHaveBeenCalled();
    expect(readStored(PROFILES_ALL_KEY)).toEqual({ notAnArray: true }); // original bytes preserved
  });

  test('a registry read failure aborts without creating anything', async () => {
    getRawItemMock.mockImplementationOnce(async () => {
      throw new Error('native read failure');
    });

    const result = await profileRepo.createProfile(MAYA_INPUT);

    expect(result.status).toBe('registry_read_failure');
    expect(setItemMock).not.toHaveBeenCalled();
  });

  test('a write failure is reported accurately, not silently as success', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);
    setItemMock.mockImplementationOnce(async () => {
      throw new Error('simulated write failure');
    });

    const result = await profileRepo.createProfile(MAYA_INPUT);

    expect(result.status).toBe('write_failure');
    // The pre-existing profile is untouched - the failed write never landed.
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MEERA]);
  });

  test('two concurrent createProfile calls are serialized - neither clobbers the other', async () => {
    let releaseFirstRead: () => void = () => {};
    const firstReadGate = new Promise<void>((resolve) => {
      releaseFirstRead = resolve;
    });
    let registryReadCount = 0;
    getRawItemMock.mockImplementation(async (key: string) => {
      if (key === PROFILES_ALL_KEY) {
        registryReadCount += 1;
        if (registryReadCount === 1) {
          await firstReadGate; // the FIRST registry read pauses here
        }
      }
      return store.get(key) ?? null;
    });

    const firstCall = profileRepo.createProfile(MAYA_INPUT);
    const secondCall = profileRepo.createProfile(MEERA_INPUT);

    // Let the synchronous validation and queue scheduling for both calls
    // run. If the mutation queue is working, the second call's own
    // registry read must NOT have started yet - it's queued behind the
    // first, which is still paused on the gate.
    await Promise.resolve();
    await Promise.resolve();
    expect(registryReadCount).toBe(1);

    releaseFirstRead();
    const [firstResult, secondResult] = await Promise.all([firstCall, secondCall]);

    expect(firstResult.status).toBe('created');
    expect(secondResult.status).toBe('created');
    expect(registryReadCount).toBe(2); // the second call's read only happened after the first settled

    const finalRegistry = readStored<Profile[]>(PROFILES_ALL_KEY)!;
    expect(finalRegistry).toHaveLength(2);
    expect(finalRegistry.map((p) => p.fullName).sort()).toEqual(['Maya Sharma', 'Meera Sharma']);
  });

  test('the mutation queue still processes a later createProfile after an earlier one reports write_failure', async () => {
    setItemMock.mockImplementationOnce(async () => {
      throw new Error('simulated write failure');
    });

    const firstResult = await profileRepo.createProfile(MAYA_INPUT);
    expect(firstResult.status).toBe('write_failure');
    expect(store.has(PROFILES_ALL_KEY)).toBe(false); // the failed attempt persisted nothing

    const secondResult = await profileRepo.createProfile(MEERA_INPUT);
    expect(secondResult.status).toBe('created');

    const finalRegistry = readStored<Profile[]>(PROFILES_ALL_KEY)!;
    expect(finalRegistry).toHaveLength(1);
    expect(finalRegistry[0]?.fullName).toBe('Meera Sharma');
  });

  test('the shared mutation queue recovers across methods - updateProfile failing does not block a later createProfile', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);
    setItemMock.mockImplementationOnce(async () => {
      throw new Error('simulated write failure');
    });

    const updateResult = await profileRepo.updateProfile(MAYA.id, { dob: '1990-01-01' });
    expect(updateResult.status).toBe('write_failure');
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]); // unchanged by the failed update

    const createResult = await profileRepo.createProfile(MEERA_INPUT);
    expect(createResult.status).toBe('created');

    const finalRegistry = readStored<Profile[]>(PROFILES_ALL_KEY)!;
    expect(finalRegistry).toHaveLength(2);
    expect(finalRegistry[0]).toEqual(MAYA); // untouched by the earlier failed update
    expect(finalRegistry[1]?.fullName).toBe('Meera Sharma');
  });
});

describe('updateProfile', () => {
  test('updates the given fields while preserving id and createdAt', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);

    const result = await profileRepo.updateProfile(MAYA.id, { dob: '1990-01-01' });

    expect(result.status).toBe('updated');
    if (result.status !== 'updated') return;
    expect(result.profile.id).toBe(MAYA.id);
    expect(result.profile.createdAt).toBe(MAYA.createdAt);
    expect(result.profile.dob).toBe('1990-01-01');
    expect(result.profile.fullName).toBe(MAYA.fullName); // unspecified field kept
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([result.profile]);
  });

  test('rejects an unknown id without creating a new profile', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);

    const result = await profileRepo.updateProfile('p_ghost', { dob: '1990-01-01' });

    expect(result).toEqual({ status: 'not_found' });
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MEERA]); // unchanged, no new entry
    expect(setItemMock).not.toHaveBeenCalled();
  });

  test('does not change profiles.activeId as a side effect', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);
    seed(ACTIVE_ID_KEY, MEERA.id);

    await profileRepo.updateProfile(MEERA.id, { dob: '1990-01-01' });

    expect(readStored<string>(ACTIVE_ID_KEY)).toBe(MEERA.id);
  });

  test('rejects a calendar-invalid dob without writing', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);

    const result = await profileRepo.updateProfile(MAYA.id, { dob: '2099-02-30' });

    expect(result.status).toBe('invalid_input');
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]); // unchanged
  });

  test('rejects an empty or whitespace-only fullName without writing', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);

    const result = await profileRepo.updateProfile(MAYA.id, { fullName: '   ' });

    expect(result).toEqual({ status: 'invalid_input', reason: 'fullName must be non-empty' });
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]); // unchanged
    expect(setItemMock).not.toHaveBeenCalled();
  });

  test('rejects a runtime-invalid numerology system supplied via input (bypassing TypeScript) without writing', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);

    const result = await profileRepo.updateProfile(MAYA.id, { system: 'western' as unknown as 'pythagorean' });

    expect(result).toEqual({ status: 'invalid_input', reason: 'system must be a supported numerology system' });
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]); // unchanged
    expect(setItemMock).not.toHaveBeenCalled();
  });

  test('an empty input leaves the existing profile valid and unchanged (current convention: still reports updated)', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);

    const result = await profileRepo.updateProfile(MAYA.id, {});

    expect(result.status).toBe('updated');
    if (result.status !== 'updated') return;
    // Every field - including the system inherited unchanged from the
    // existing profile - is preserved exactly as it was.
    expect(result.profile).toEqual(MAYA);
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]);
  });

  test('a malformed registry aborts safely, preserving the original raw bytes untouched', async () => {
    const malformed = { notAnArray: true };
    seed(PROFILES_ALL_KEY, malformed);

    const result = await profileRepo.updateProfile(MAYA.id, { dob: '1990-01-01' });

    expect(result).toEqual({ status: 'registry_malformed', raw: JSON.stringify(malformed) });
    expect(setItemMock).not.toHaveBeenCalled();
    expect(readStored(PROFILES_ALL_KEY)).toEqual(malformed); // byte-for-byte unchanged
  });

  test('a registry read failure aborts safely', async () => {
    getRawItemMock.mockImplementationOnce(async () => {
      throw new Error('native read failure');
    });

    const result = await profileRepo.updateProfile(MAYA.id, { dob: '1990-01-01' });

    expect(result.status).toBe('registry_read_failure');
    expect(setItemMock).not.toHaveBeenCalled();
  });

  test('a write failure is reported accurately, with the registry left exactly as it was', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);
    setItemMock.mockImplementationOnce(async () => {
      throw new Error('simulated write failure');
    });

    const result = await profileRepo.updateProfile(MAYA.id, { dob: '1990-01-01' });

    expect(result.status).toBe('write_failure');
    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MAYA]); // the original, unmodified
  });

  test('createProfile and updateProfile share the same mutation queue - neither clobbers the other', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);

    let releaseFirstRead: () => void = () => {};
    const firstReadGate = new Promise<void>((resolve) => {
      releaseFirstRead = resolve;
    });
    let registryReadCount = 0;
    getRawItemMock.mockImplementation(async (key: string) => {
      if (key === PROFILES_ALL_KEY) {
        registryReadCount += 1;
        if (registryReadCount === 1) {
          await firstReadGate;
        }
      }
      return store.get(key) ?? null;
    });

    const updateCall = profileRepo.updateProfile(MEERA.id, { dob: '1990-01-01' });
    const createCall = profileRepo.createProfile(MAYA_INPUT);

    await Promise.resolve();
    await Promise.resolve();
    expect(registryReadCount).toBe(1);

    releaseFirstRead();
    const [updateResult, createResult] = await Promise.all([updateCall, createCall]);

    expect(updateResult.status).toBe('updated');
    expect(createResult.status).toBe('created');

    const finalRegistry = readStored<Profile[]>(PROFILES_ALL_KEY)!;
    expect(finalRegistry).toHaveLength(2);
    const updatedMeera = finalRegistry.find((p) => p.id === MEERA.id);
    expect(updatedMeera?.dob).toBe('1990-01-01');
    expect(updatedMeera?.createdAt).toBe(MEERA.createdAt);
    expect(finalRegistry.some((p) => p.fullName === 'Maya Sharma')).toBe(true);
  });
});

describe('setActiveProfile', () => {
  test('activates an existing profile', async () => {
    seed(PROFILES_ALL_KEY, [MEERA, MAYA]);

    const result = await profileRepo.setActiveProfile(MAYA.id);

    expect(result).toEqual({ status: 'activated', profile: MAYA });
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe(MAYA.id);
  });

  test('rejects an unknown id without writing', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);

    const result = await profileRepo.setActiveProfile('p_ghost');

    expect(result).toEqual({ status: 'not_found' });
    expect(store.has(ACTIVE_ID_KEY)).toBe(false);
    expect(setItemMock).not.toHaveBeenCalled();
  });

  test('verifies before writing - never creates, deletes, updates, or reorders profiles', async () => {
    seed(PROFILES_ALL_KEY, [MEERA, MAYA]);

    await profileRepo.setActiveProfile(MAYA.id);

    expect(readStored<Profile[]>(PROFILES_ALL_KEY)).toEqual([MEERA, MAYA]); // untouched
  });

  test('a malformed registry fails safely without guessing', async () => {
    seed(PROFILES_ALL_KEY, { notAnArray: true });

    const result = await profileRepo.setActiveProfile('any-id');

    expect(result.status).toBe('registry_malformed');
    expect(setItemMock).not.toHaveBeenCalled();
  });

  test('a registry read failure fails safely without guessing', async () => {
    getRawItemMock.mockImplementationOnce(async () => {
      throw new Error('native read failure');
    });

    const result = await profileRepo.setActiveProfile('any-id');

    expect(result.status).toBe('registry_read_failure');
    expect(setItemMock).not.toHaveBeenCalled();
  });

  test('a write failure is reported accurately, not silently as success', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);
    setItemMock.mockImplementationOnce(async () => {
      throw new Error('simulated write failure');
    });

    const result = await profileRepo.setActiveProfile(MAYA.id);

    expect(result.status).toBe('write_failure');
    expect(store.has(ACTIVE_ID_KEY)).toBe(false);
  });
});

describe('getAll', () => {
  test('an absent registry is distinct from a valid empty registry', async () => {
    const absentResult = await profileRepo.getAll();
    expect(absentResult).toEqual({ status: 'absent' });

    seed(PROFILES_ALL_KEY, []);
    const emptyResult = await profileRepo.getAll();
    expect(emptyResult).toEqual({ status: 'ok', value: [] });
  });

  test('returns all profiles in stored order', async () => {
    seed(PROFILES_ALL_KEY, [MEERA, MAYA]);

    const result = await profileRepo.getAll();

    expect(result).toEqual({ status: 'ok', value: [MEERA, MAYA] });
  });

  test('a malformed registry is reported, never silently treated as empty', async () => {
    seed(PROFILES_ALL_KEY, { notAnArray: true });

    const result = await profileRepo.getAll();

    expect(result).toEqual({ status: 'malformed', raw: JSON.stringify({ notAnArray: true }) });
  });

  test('a registry read failure is reported distinctly', async () => {
    getRawItemMock.mockImplementationOnce(async () => {
      throw new Error('native read failure');
    });

    const result = await profileRepo.getAll();

    expect(result.status).toBe('read_failure');
  });

  test('does not mutate storage', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);

    await profileRepo.getAll();

    expect(setItemMock).not.toHaveBeenCalled();
  });
});

describe('getById', () => {
  test('finds an existing id', async () => {
    seed(PROFILES_ALL_KEY, [MEERA, MAYA]);

    const result = await profileRepo.getById(MAYA.id);

    expect(result).toEqual({ status: 'found', profile: MAYA });
  });

  test('reports not_found for a missing id in a valid registry', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);

    const result = await profileRepo.getById('p_ghost');

    expect(result).toEqual({ status: 'not_found' });
  });

  test('reports not_found (not an error) when the registry is absent', async () => {
    const result = await profileRepo.getById('any-id');

    expect(result).toEqual({ status: 'not_found' });
  });

  test('a malformed registry is reported, never conflated with not_found', async () => {
    seed(PROFILES_ALL_KEY, { notAnArray: true });

    const result = await profileRepo.getById(MAYA.id);

    expect(result.status).toBe('malformed');
  });

  test('a registry read failure is reported, never conflated with not_found', async () => {
    getRawItemMock.mockImplementationOnce(async () => {
      throw new Error('native read failure');
    });

    const result = await profileRepo.getById(MAYA.id);

    expect(result.status).toBe('read_failure');
  });

  test('does not mutate storage', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);

    await profileRepo.getById(MAYA.id);

    expect(setItemMock).not.toHaveBeenCalled();
  });
});

describe('getActiveProfile', () => {
  test('resolves the active profile when the pointer matches a real entry', async () => {
    seed(PROFILES_ALL_KEY, [MEERA, MAYA]);
    seed(ACTIVE_ID_KEY, MAYA.id);

    const result = await profileRepo.getActiveProfile();

    expect(result).toEqual({ status: 'resolved', profile: MAYA });
  });

  test('reports unset when the pointer is absent', async () => {
    seed(PROFILES_ALL_KEY, [MEERA, MAYA]);

    const result = await profileRepo.getActiveProfile();

    expect(result).toEqual({ status: 'unset' });
  });

  test('reports dangling when the pointer matches no profile, without repairing it', async () => {
    seed(PROFILES_ALL_KEY, [MEERA]);
    seed(ACTIVE_ID_KEY, 'p_ghost');

    const result = await profileRepo.getActiveProfile();

    expect(result).toEqual({ status: 'dangling', activeId: 'p_ghost' });
    expect(setItemMock).not.toHaveBeenCalled(); // never "fixed"
    expect(readStored<string>(ACTIVE_ID_KEY)).toBe('p_ghost'); // untouched
  });

  test('never falls back to profile.current when the pointer is unset', async () => {
    seed(LEGACY_KEY, MAYA); // a legacy profile exists, but must play no role here
    seed(PROFILES_ALL_KEY, []); // valid, empty registry - no entries at all

    const result = await profileRepo.getActiveProfile();

    expect(result).toEqual({ status: 'unset' });
    expect(getRawItemMock).not.toHaveBeenCalledWith(LEGACY_KEY); // never even consulted
  });

  test('a malformed registry is reported, distinct from an active-pointer problem', async () => {
    seed(PROFILES_ALL_KEY, { notAnArray: true });
    seed(ACTIVE_ID_KEY, MAYA.id);

    const result = await profileRepo.getActiveProfile();

    expect(result.status).toBe('registry_malformed');
  });

  test('a registry read failure is reported, distinct from an active-pointer problem', async () => {
    getRawItemMock.mockImplementationOnce(async () => {
      throw new Error('native read failure');
    });

    const result = await profileRepo.getActiveProfile();

    expect(result.status).toBe('registry_read_failure');
  });

  test('a malformed active pointer is reported distinctly from a malformed registry', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);
    seed(ACTIVE_ID_KEY, 42); // well-formed JSON, wrong shape

    const result = await profileRepo.getActiveProfile();

    expect(result.status).toBe('active_id_malformed');
  });

  test('an active-pointer read failure is reported distinctly from a registry read failure', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);
    // 1st getRawItem = profiles.all (succeeds); 2nd = profiles.activeId (throws).
    getRawItemMock.mockImplementationOnce(async (key: string) => store.get(key) ?? null);
    getRawItemMock.mockImplementationOnce(async () => {
      throw new Error('native read failure');
    });

    const result = await profileRepo.getActiveProfile();

    expect(result.status).toBe('active_id_read_failure');
  });

  test('does not mutate storage under any resolved state', async () => {
    seed(PROFILES_ALL_KEY, [MAYA]);
    seed(ACTIVE_ID_KEY, MAYA.id);

    await profileRepo.getActiveProfile();

    expect(setItemMock).not.toHaveBeenCalled();
  });
});
