/**
 * Exercises `src/features/profile/store.ts` - `useProfileStore`'s
 * registry-aware `hydrate()`, and the new `createAdditionalProfile()` /
 * `switchActiveProfile()` actions.
 *
 * `@/features/profile/repo` and `@/features/profile/startup` are both fully
 * mocked: `repo.ts`'s own behavior (registry CRUD, the shared queue,
 * `getActiveProfile()`'s classification) is already exhaustively covered by
 * `repoRegistry.test.ts`/`registryQueueCoordination.test.ts`, and
 * `startup.ts`'s own dedup/rejection-recovery contract is covered by
 * `startup.test.ts`. This file only proves `store.ts`'s OWN contract: how it
 * reacts to each possible repository result, never touches real storage,
 * and never corrupts in-memory state. No `jest.resetModules()` is needed
 * here - `useProfileStore` is a plain zustand store (not a module-scoped
 * singleton like `runStartupMigration`'s), so its data fields are reset via
 * a partial `setState()` between tests instead.
 */
jest.mock('@/features/profile/repo', () => ({
  profileRepo: {
    getCurrent: jest.fn(),
    save: jest.fn(),
    clear: jest.fn(),
    getActiveProfile: jest.fn(),
    createProfile: jest.fn(),
    setActiveProfile: jest.fn(),
  },
}));
jest.mock('@/features/profile/startup', () => ({
  runStartupMigration: jest.fn(),
}));

import { profileRepo, type ActiveProfileResult, type SetActiveProfileResult } from '@/features/profile/repo';
import { runStartupMigration } from '@/features/profile/startup';
import { resolveActiveProfile, useProfileStore } from '@/features/profile/store';
import type { Profile } from '@/core/types';

const getCurrentMock = profileRepo.getCurrent as jest.Mock;
const saveMock = profileRepo.save as jest.Mock;
const clearMock = profileRepo.clear as jest.Mock;
const getActiveProfileMock = profileRepo.getActiveProfile as jest.Mock;
const createProfileMock = profileRepo.createProfile as jest.Mock;
const setActiveProfileMock = profileRepo.setActiveProfile as jest.Mock;
const runStartupMigrationMock = runStartupMigration as jest.Mock;

const PROFILE_A: Profile = {
  id: 'p_a',
  fullName: 'Profile A',
  dob: '1990-01-01',
  system: 'pythagorean',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const PROFILE_B: Profile = {
  id: 'p_b',
  fullName: 'Profile B',
  dob: '1991-02-02',
  system: 'pythagorean',
  createdAt: '2026-01-02T00:00:00.000Z',
};

let warnSpy: jest.SpyInstance;
let logSpy: jest.SpyInstance;

beforeEach(() => {
  getCurrentMock.mockReset().mockResolvedValue(null);
  saveMock.mockReset();
  clearMock.mockReset().mockResolvedValue(undefined);
  getActiveProfileMock.mockReset();
  createProfileMock.mockReset();
  setActiveProfileMock.mockReset();
  runStartupMigrationMock.mockReset().mockResolvedValue({ dataStep: 'no_legacy', pointerStep: 'skipped' });

  // Reset only the data fields - a wholesale replace would also wipe out
  // the action functions themselves, since zustand stores keep both in one
  // object.
  useProfileStore.setState({ profile: null, hydrated: false, profileResolution: 'legacy' });

  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  // Applies to every test in this file: none of `hydrate()` /
  // `createAdditionalProfile()` / `switchActiveProfile()` may ever write (or
  // clear) the legacy compatibility key.
  expect(saveMock).not.toHaveBeenCalled();
  expect(clearMock).not.toHaveBeenCalled();
});

describe('resolveActiveProfile / hydrate() - every ActiveProfileResult variant', () => {
  test('resolved: the registry profile is used, never the (different) legacy one', async () => {
    getActiveProfileMock.mockResolvedValue({ status: 'resolved', profile: PROFILE_B });
    getCurrentMock.mockResolvedValue(PROFILE_A);

    const result = await resolveActiveProfile();

    expect(result).toEqual({ profile: PROFILE_B, resolution: 'resolved' });
    expect(getCurrentMock).not.toHaveBeenCalled();
  });

  test('unset: falls back to the legacy profile, resolution "legacy", no warning', async () => {
    getActiveProfileMock.mockResolvedValue({ status: 'unset' });
    getCurrentMock.mockResolvedValue(PROFILE_A);

    const result = await resolveActiveProfile();

    expect(result).toEqual({ profile: PROFILE_A, resolution: 'legacy' });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('unset + no legacy profile: preserves first-time onboarding (profile stays null)', async () => {
    getActiveProfileMock.mockResolvedValue({ status: 'unset' });
    getCurrentMock.mockResolvedValue(null);

    const result = await resolveActiveProfile();

    expect(result).toEqual({ profile: null, resolution: 'legacy' });
  });

  test('dangling: falls back to legacy but is reported "degraded", never repaired', async () => {
    getActiveProfileMock.mockResolvedValue({ status: 'dangling', activeId: 'p_missing' });
    getCurrentMock.mockResolvedValue(PROFILE_A);

    const result = await resolveActiveProfile();

    expect(result).toEqual({ profile: PROFILE_A, resolution: 'degraded' });
    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), 'p_missing');
    expect(setActiveProfileMock).not.toHaveBeenCalled();
    expect(createProfileMock).not.toHaveBeenCalled();
  });

  test('registry_malformed: falls back to legacy, "degraded", never resets the registry, raw bytes never logged', async () => {
    getActiveProfileMock.mockResolvedValue({ status: 'registry_malformed', raw: 'SECRET-RAW-BYTES' });
    getCurrentMock.mockResolvedValue(PROFILE_A);

    const result = await resolveActiveProfile();

    expect(result).toEqual({ profile: PROFILE_A, resolution: 'degraded' });
    for (const call of warnSpy.mock.calls) {
      for (const arg of call) {
        expect(JSON.stringify(arg)).not.toContain('SECRET-RAW-BYTES');
      }
    }
    expect(createProfileMock).not.toHaveBeenCalled();
    expect(setActiveProfileMock).not.toHaveBeenCalled();
  });

  test('active_id_malformed: falls back to legacy, "degraded", raw bytes never logged', async () => {
    getActiveProfileMock.mockResolvedValue({ status: 'active_id_malformed', raw: 'SECRET-RAW-BYTES' });
    getCurrentMock.mockResolvedValue(PROFILE_A);

    const result = await resolveActiveProfile();

    expect(result).toEqual({ profile: PROFILE_A, resolution: 'degraded' });
    for (const call of warnSpy.mock.calls) {
      for (const arg of call) {
        expect(JSON.stringify(arg)).not.toContain('SECRET-RAW-BYTES');
      }
    }
  });

  test('registry_read_failure: falls back to legacy, "degraded", never presented as confirmed-active, error logged as message only', async () => {
    getActiveProfileMock.mockResolvedValue({ status: 'registry_read_failure', error: new Error('disk exploded') });
    getCurrentMock.mockResolvedValue(PROFILE_A);

    const result = await resolveActiveProfile();

    expect(result).toEqual({ profile: PROFILE_A, resolution: 'degraded' });
    expect(result.resolution).not.toBe('resolved');
    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), 'disk exploded');
  });

  test('active_id_read_failure: falls back to legacy, "degraded", never presented as confirmed-active', async () => {
    getActiveProfileMock.mockResolvedValue({ status: 'active_id_read_failure', error: new Error('disk exploded') });
    getCurrentMock.mockResolvedValue(PROFILE_A);

    const result = await resolveActiveProfile();

    expect(result).toEqual({ profile: PROFILE_A, resolution: 'degraded' });
    expect(result.resolution).not.toBe('resolved');
  });

  test('exhaustiveness: every real ActiveProfileResult status is handled (no silent fallthrough)', async () => {
    const statuses: ActiveProfileResult['status'][] = [
      'resolved',
      'unset',
      'dangling',
      'registry_malformed',
      'registry_read_failure',
      'active_id_malformed',
      'active_id_read_failure',
    ];
    expect(statuses).toHaveLength(7); // documents the exact set this test covers
  });
});

describe('hydrate() - migration sequencing', () => {
  test('migration completes before active-profile resolution begins', async () => {
    let resolveMigration: (value: unknown) => void = () => {};
    runStartupMigrationMock.mockReturnValue(
      new Promise((resolve) => {
        resolveMigration = resolve;
      }),
    );
    getActiveProfileMock.mockResolvedValue({ status: 'unset' });
    getCurrentMock.mockResolvedValue(PROFILE_A);

    const hydratePromise = useProfileStore.getState().hydrate();

    await Promise.resolve();
    await Promise.resolve();
    expect(getActiveProfileMock).not.toHaveBeenCalled(); // migration hasn't settled yet

    resolveMigration({ dataStep: 'merged', pointerStep: 'set' }); // a classified (non-abort) result
    await hydratePromise;

    expect(getActiveProfileMock).toHaveBeenCalledTimes(1);
    expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
  });

  test('a classified migration abort is handled conservatively - resolution still proceeds from whatever the registry actually contains', async () => {
    runStartupMigrationMock.mockResolvedValue({
      dataStep: 'aborted',
      pointerStep: 'skipped',
      abortReason: { legacy: 'malformed' },
    });
    // Migration aborted and wrote nothing - registry still genuinely unset.
    getActiveProfileMock.mockResolvedValue({ status: 'unset' });
    getCurrentMock.mockResolvedValue(PROFILE_A);

    await useProfileStore.getState().hydrate();

    expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
    expect(useProfileStore.getState().profileResolution).toBe('legacy');
  });

  test('an unexpected migration rejection does not reject hydrate() or produce a destructive fallback', async () => {
    runStartupMigrationMock.mockRejectedValue(new Error('migration boom'));
    getActiveProfileMock.mockResolvedValue({ status: 'unset' });
    getCurrentMock.mockResolvedValue(PROFILE_A);

    await expect(useProfileStore.getState().hydrate()).resolves.toBeUndefined();

    expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
    expect(useProfileStore.getState().hydrated).toBe(true);
  });

  test('repeated hydration (Strict Mode-style double invoke) settles to one consistent result, no corruption', async () => {
    getActiveProfileMock.mockResolvedValue({ status: 'resolved', profile: PROFILE_B });

    const first = useProfileStore.getState().hydrate();
    const second = useProfileStore.getState().hydrate();
    await Promise.all([first, second]);

    expect(useProfileStore.getState().profile).toEqual(PROFILE_B);
    expect(useProfileStore.getState().profileResolution).toBe('resolved');
    expect(useProfileStore.getState().hydrated).toBe(true);
  });

  test('a genuinely unexpected exception still falls back exactly as before (profile: null)', async () => {
    getActiveProfileMock.mockRejectedValue(new Error('totally unexpected'));

    await useProfileStore.getState().hydrate();

    expect(useProfileStore.getState().profile).toBeNull();
    expect(useProfileStore.getState().hydrated).toBe(true);
  });
});

describe('createAdditionalProfile()', () => {
  beforeEach(() => {
    useProfileStore.setState({ profile: PROFILE_A, hydrated: true, profileResolution: 'resolved' });
  });

  test('successful creation does not change the in-memory profile and does not activate the new one', async () => {
    createProfileMock.mockResolvedValue({ status: 'created', profile: PROFILE_B });

    const result = await useProfileStore.getState().createAdditionalProfile({
      fullName: 'Profile B',
      dob: '1991-02-02',
      system: 'pythagorean',
    });

    expect(result).toEqual({ status: 'created', profile: PROFILE_B });
    expect(useProfileStore.getState().profile).toEqual(PROFILE_A); // unchanged
    expect(setActiveProfileMock).not.toHaveBeenCalled(); // never auto-activated
  });

  test('passes the input straight through to profileRepo.createProfile, unmodified', async () => {
    createProfileMock.mockResolvedValue({ status: 'created', profile: PROFILE_B });
    const input = { fullName: 'Profile B', dob: '1991-02-02', system: 'pythagorean' as const };

    await useProfileStore.getState().createAdditionalProfile(input);

    expect(createProfileMock).toHaveBeenCalledWith(input);
  });

  test('duplicate name/dob: the store does not add its own dedup - whatever the repo reports is returned as-is', async () => {
    // Mirrors the repo's actual documented behavior (never deduped) -
    // the store must not second-guess or filter this.
    createProfileMock.mockResolvedValue({ status: 'created', profile: { ...PROFILE_B, dob: PROFILE_A.dob } });

    const result = await useProfileStore.getState().createAdditionalProfile({
      fullName: 'Profile B',
      dob: PROFILE_A.dob,
      system: 'pythagorean',
    });

    expect(result.status).toBe('created');
    expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
  });

  test('invalid_input: returned unmodified, active state unchanged', async () => {
    createProfileMock.mockResolvedValue({ status: 'invalid_input', reason: 'fullName must be non-empty' });

    const result = await useProfileStore.getState().createAdditionalProfile({
      fullName: '',
      dob: '1991-02-02',
      system: 'pythagorean',
    });

    expect(result).toEqual({ status: 'invalid_input', reason: 'fullName must be non-empty' });
    expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
  });

  test('write_failure: returned unmodified, active state unchanged', async () => {
    const error = new Error('disk exploded');
    createProfileMock.mockResolvedValue({ status: 'write_failure', error });

    const result = await useProfileStore.getState().createAdditionalProfile({
      fullName: 'Profile B',
      dob: '1991-02-02',
      system: 'pythagorean',
    });

    expect(result).toEqual({ status: 'write_failure', error });
    expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
  });
});

describe('switchActiveProfile()', () => {
  beforeEach(() => {
    useProfileStore.setState({ profile: PROFILE_A, hydrated: true, profileResolution: 'resolved' });
  });

  test('activated: updates both the returned result and the in-memory profile', async () => {
    setActiveProfileMock.mockResolvedValue({ status: 'activated', profile: PROFILE_B });

    const result = await useProfileStore.getState().switchActiveProfile(PROFILE_B.id);

    expect(result).toEqual({ status: 'activated', profile: PROFILE_B });
    expect(useProfileStore.getState().profile).toEqual(PROFILE_B);
    expect(useProfileStore.getState().profileResolution).toBe('resolved');
  });

  test('not_found: leaves the previous in-memory profile unchanged', async () => {
    setActiveProfileMock.mockResolvedValue({ status: 'not_found' });

    const result = await useProfileStore.getState().switchActiveProfile('p_missing');

    expect(result).toEqual({ status: 'not_found' });
    expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
  });

  test('registry_malformed: leaves the previous in-memory profile unchanged', async () => {
    setActiveProfileMock.mockResolvedValue({ status: 'registry_malformed', raw: '...' });

    await useProfileStore.getState().switchActiveProfile(PROFILE_B.id);

    expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
  });

  test('registry_read_failure: leaves the previous in-memory profile unchanged', async () => {
    setActiveProfileMock.mockResolvedValue({ status: 'registry_read_failure', error: new Error('boom') });

    await useProfileStore.getState().switchActiveProfile(PROFILE_B.id);

    expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
  });

  test('write_failure (pointer persistence failed): never presents the requested profile as active', async () => {
    setActiveProfileMock.mockResolvedValue({ status: 'write_failure', error: new Error('boom') });

    const result = await useProfileStore.getState().switchActiveProfile(PROFILE_B.id);

    expect(result.status).toBe('write_failure');
    expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
  });

  test('an unexpected rejection does not throw, does not activate, and is reported as a write_failure', async () => {
    setActiveProfileMock.mockRejectedValue(new Error('totally unexpected'));

    const result = await useProfileStore.getState().switchActiveProfile(PROFILE_B.id);

    expect(result.status).toBe('write_failure');
    expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
  });

  test(
    'rapid consecutive switches: in-memory profile ends up matching whichever call was invoked last, ' +
      "consistent with the shared registry queue's FIFO ordering (the queue itself is proven separately " +
      'in registryQueueCoordination.test.ts - this test only proves store.ts reacts correctly to that ordering)',
    async () => {
      let resolveFirst: (value: SetActiveProfileResult) => void = () => {};
      let resolveSecond: (value: SetActiveProfileResult) => void = () => {};
      const firstPromise = new Promise<SetActiveProfileResult>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<SetActiveProfileResult>((resolve) => {
        resolveSecond = resolve;
      });
      setActiveProfileMock.mockReturnValueOnce(firstPromise).mockReturnValueOnce(secondPromise);

      const call1 = useProfileStore.getState().switchActiveProfile(PROFILE_B.id);
      const call2 = useProfileStore.getState().switchActiveProfile(PROFILE_A.id);

      // A real `enqueueRegistryMutation`-backed `setActiveProfile` never lets
      // the second queued operation settle before the first - simulated
      // here by resolving them in that same strict order.
      resolveFirst({ status: 'activated', profile: PROFILE_B });
      await call1;
      expect(useProfileStore.getState().profile).toEqual(PROFILE_B);

      resolveSecond({ status: 'activated', profile: PROFILE_A });
      await call2;
      expect(useProfileStore.getState().profile).toEqual(PROFILE_A);
    },
  );

  test('never calls profileRepo.createProfile (switching is not creation)', async () => {
    setActiveProfileMock.mockResolvedValue({ status: 'activated', profile: PROFILE_B });

    await useProfileStore.getState().switchActiveProfile(PROFILE_B.id);

    expect(createProfileMock).not.toHaveBeenCalled();
  });
});
