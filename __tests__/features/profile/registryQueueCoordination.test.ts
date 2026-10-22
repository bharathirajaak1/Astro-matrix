/**
 * Stage 5a: proves that `migrateLegacyProfileToRegistry()` (invoked via
 * `runStartupMigration()`) and `profileRepo`'s registry CRUD methods
 * (`createProfile` / `updateProfile` / `setActiveProfile`) now share exactly
 * one FIFO queue over `profiles.all` / `profiles.activeId`, so they can never
 * interleave their reads/writes against those two keys.
 *
 * Uses the REAL `migrateLegacyProfileToRegistry()` algorithm, the REAL
 * `profileRepo` registry methods, and the REAL shared queue
 * (`enqueueRegistryMutation`) - only `@/lib/storage` is mocked, backed by a
 * per-test in-memory Map, matching the exact style already established in
 * `migration.test.ts` and `repoRegistry.test.ts`. Deferred-promise gates
 * force deterministic overlap between operations; no arbitrary sleeps are
 * used anywhere in this file.
 *
 * Each test (re)loads fresh module instances via `jest.resetModules()` so
 * `runStartupMigration()`'s own module-scoped singleton and `repo.ts`'s
 * module-scoped `registryMutationQueue` never leak state between tests -
 * the same pattern used in `startup.test.ts` and `notifications.test.ts`.
 * The storage mock functions themselves are declared once at module scope
 * and re-wired into every freshly-loaded instance via `jest.doMock`, so a
 * single `store` Map and a single set of mock-call histories stay valid
 * across every `jest.resetModules()` call within one test.
 */
import type { Profile } from '@/core/types';
import type { MigrationResult } from '@/features/profile/migration';
import type { CreateProfileResult, SetActiveProfileResult, UpdateProfileResult } from '@/features/profile/repo';

const PROFILES_ALL_KEY = 'profiles.all';
const ACTIVE_ID_KEY = 'profiles.activeId';
const LEGACY_KEY = 'profile.current';

const getRawItemMock = jest.fn<Promise<string | null>, [string]>();
const getItemMock = jest.fn<Promise<unknown>, [string]>();
const setItemMock = jest.fn<Promise<void>, [string, unknown]>();
const removeItemMock = jest.fn<Promise<void>, [string]>();

let store: Map<string, string>;

function seed(key: string, value: unknown): void {
  store.set(key, JSON.stringify(value));
}

function readStored<T>(key: string): T | undefined {
  const raw = store.get(key);
  return raw === undefined ? undefined : (JSON.parse(raw) as T);
}

const LEGACY_PROFILE: Profile = {
  id: 'p_legacy',
  fullName: 'Legacy Person',
  dob: '1990-01-01',
  system: 'pythagorean',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const INPUT_A = { fullName: 'Profile A', dob: '1991-02-02', system: 'pythagorean' as const };
const INPUT_B = { fullName: 'Profile B', dob: '1992-03-03', system: 'pythagorean' as const };

type RepoModule = typeof import('../../../src/features/profile/repo');
type StartupModule = typeof import('../../../src/features/profile/startup');

interface LoadedModules {
  profileRepo: RepoModule['profileRepo'];
  runStartupMigration: StartupModule['runStartupMigration'];
}

/** Fresh, REAL `repo.ts` + `startup.ts` instances sharing one queue, backed
 *  by the shared mocked `@/lib/storage`. Used by every test except the one
 *  exercising a migration rejection (see its own loader below for why). */
function loadModules(): LoadedModules {
  jest.resetModules();
  // `jest.doMock` registrations are NOT cleared by `jest.resetModules()` -
  // only the instantiated-module cache is. Without this, a prior test's
  // `loadModulesWithRejectingMigration()` registration of `./migration`
  // would silently leak forward into every later test's fresh require of
  // `startup.ts` (which itself requires `./migration`), making this loader
  // secretly return a module instance wired to the rejecting mock instead
  // of the real algorithm. Explicitly un-mocking it here guarantees this
  // loader always gets the real `migrateLegacyProfileToRegistry`.
  jest.dontMock('../../../src/features/profile/migration');
  jest.doMock('@/lib/storage', () => ({
    getRawItem: getRawItemMock,
    getItem: getItemMock,
    setItem: setItemMock,
    removeItem: removeItemMock,
  }));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const repoModule: RepoModule = require('../../../src/features/profile/repo');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const startupModule: StartupModule = require('../../../src/features/profile/startup');
  return { profileRepo: repoModule.profileRepo, runStartupMigration: startupModule.runStartupMigration };
}

/**
 * LIMITATION (documented rather than worked around): `migrateLegacyProfileToRegistry()`
 * is written so every internal storage failure it can encounter is already
 * caught and reported via `MigrationResult.abortReason` - it never rejects
 * by design (see `migration.ts`'s own module doc, confirmed by re-reading it
 * for this stage). That means "migration rejects" cannot be exercised
 * against the real, unmodified algorithm through storage-mock failures alone
 * - there is no real input that makes it reject. This one test therefore
 * mocks `migrateLegacyProfileToRegistry` itself at the module boundary
 * (`./migration`) to force a rejection, while still using the REAL `repo.ts`
 * queue - so what's actually proven is "the shared queue recovers from a
 * rejected queued operation and still runs the next one," which is the part
 * of requirement 3 that touches Stage 5a's own code. The question "could the
 * real algorithm itself ever reject" is already answered (no) and tested
 * elsewhere (`startup.test.ts`'s rejection-recovery suite, against a mocked
 * migration function for the same reason).
 */
function loadModulesWithRejectingMigration(error: Error): LoadedModules {
  jest.resetModules();
  jest.doMock('@/lib/storage', () => ({
    getRawItem: getRawItemMock,
    getItem: getItemMock,
    setItem: setItemMock,
    removeItem: removeItemMock,
  }));
  jest.doMock('../../../src/features/profile/migration', () => ({
    migrateLegacyProfileToRegistry: jest.fn().mockRejectedValueOnce(error),
  }));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const repoModule: RepoModule = require('../../../src/features/profile/repo');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const startupModule: StartupModule = require('../../../src/features/profile/startup');
  // Clean up immediately after this one require - the already-loaded module
  // instance above keeps whatever it captured, but no LATER test's
  // `loadModules()` should ever see this registration still active.
  jest.dontMock('../../../src/features/profile/migration');
  return { profileRepo: repoModule.profileRepo, runStartupMigration: startupModule.runStartupMigration };
}

beforeEach(() => {
  store = new Map();
  getRawItemMock.mockReset();
  getItemMock.mockReset();
  setItemMock.mockReset();
  removeItemMock.mockReset();
  getRawItemMock.mockImplementation(async (key: string) => store.get(key) ?? null);
  getItemMock.mockImplementation(async (key: string) => {
    const raw = store.get(key);
    return raw === undefined ? null : JSON.parse(raw);
  });
  setItemMock.mockImplementation(async (key: string, value: unknown) => {
    store.set(key, JSON.stringify(value));
  });
  removeItemMock.mockImplementation(async (key: string) => {
    store.delete(key);
  });
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  // Applies to every test in this file: the shared queue must never cause a
  // write to the legacy compatibility key or any Remedies progress key,
  // under any interleaving exercised below.
  for (const [key] of setItemMock.mock.calls) {
    expect(key).not.toBe(LEGACY_KEY);
    expect(String(key).startsWith('remedies.rituals')).toBe(false);
  }
  for (const [key] of removeItemMock.mock.calls) {
    expect(key).not.toBe(LEGACY_KEY);
    expect(String(key).startsWith('remedies.rituals')).toBe(false);
  }
});

function expectCreated(result: CreateProfileResult): Profile {
  if (result.status !== 'created') {
    throw new Error(`expected status 'created', got '${result.status}'`);
  }
  return result.profile;
}

function expectUpdated(result: UpdateProfileResult): Profile {
  if (result.status !== 'updated') {
    throw new Error(`expected status 'updated', got '${result.status}'`);
  }
  return result.profile;
}

function expectActivated(result: SetActiveProfileResult): Profile {
  if (result.status !== 'activated') {
    throw new Error(`expected status 'activated', got '${result.status}'`);
  }
  return result.profile;
}

test('1. migration and createProfile() initiated close together: final registry contains both', async () => {
  seed(LEGACY_KEY, LEGACY_PROFILE);

  let releaseFirstRead: () => void = () => {};
  const firstReadGate = new Promise<void>((resolve) => {
    releaseFirstRead = resolve;
  });
  let registryReadCount = 0;
  getRawItemMock.mockImplementation(async (key: string) => {
    if (key === PROFILES_ALL_KEY) {
      registryReadCount += 1;
      if (registryReadCount === 1) {
        await firstReadGate; // migration's own first registry read pauses here
      }
    }
    return store.get(key) ?? null;
  });

  const { profileRepo, runStartupMigration } = loadModules();

  const migrationCall = runStartupMigration();
  const createCall = profileRepo.createProfile(INPUT_A);

  // Migration was invoked first and so entered the queue first - its read
  // must be the only one that has started; createProfile's own read must
  // still be queued behind it.
  await Promise.resolve();
  await Promise.resolve();
  expect(registryReadCount).toBe(1);

  releaseFirstRead();
  const [migrationResult, createResult] = await Promise.all([migrationCall, createCall]);

  expect(migrationResult.dataStep).toBe('merged');
  expect(migrationResult.pointerStep).toBe('set');
  const created = expectCreated(createResult);

  const finalRegistry = readStored<Profile[]>(PROFILES_ALL_KEY)!;
  expect(finalRegistry.map((p) => p.id).sort()).toEqual([LEGACY_PROFILE.id, created.id].sort());
  expect(readStored<string | null>(ACTIVE_ID_KEY)).toBe(LEGACY_PROFILE.id);
});

test('2. a CRUD operation enqueued before migration completes first: migration observes the committed registry, never a stale absent one', async () => {
  // No legacy profile this time - isolates the one question this test
  // exists to answer: does migration's own registry read, once it's this
  // operation's turn in the queue, reflect createProfile's already-committed
  // write, or a stale pre-write snapshot? If it saw a stale "absent"
  // registry it would both misreport dataStep AND attempt to initialize
  // `profiles.all` to `[]` - destroying the profile createProfile just
  // created. That is exactly the bug class this queue exists to prevent.
  let releaseFirstRead: () => void = () => {};
  const firstReadGate = new Promise<void>((resolve) => {
    releaseFirstRead = resolve;
  });
  let registryReadCount = 0;
  getRawItemMock.mockImplementation(async (key: string) => {
    if (key === PROFILES_ALL_KEY) {
      registryReadCount += 1;
      if (registryReadCount === 1) {
        await firstReadGate; // createProfile's own first registry read pauses here
      }
    }
    return store.get(key) ?? null;
  });

  const { profileRepo, runStartupMigration } = loadModules();

  const createCall = profileRepo.createProfile(INPUT_A);
  const migrationCall = runStartupMigration();

  await Promise.resolve();
  await Promise.resolve();
  expect(registryReadCount).toBe(1); // only createProfile's read has started

  releaseFirstRead();
  const [createResult, migrationResult] = await Promise.all([createCall, migrationCall]);

  const created = expectCreated(createResult);
  // 'no_legacy', not 'initialized_empty' - proves the registry was already
  // populated (by createProfile) by the time migration's read ran, never
  // seen as absent.
  expect(migrationResult.dataStep).toBe('no_legacy');

  const finalRegistry = readStored<Profile[]>(PROFILES_ALL_KEY)!;
  expect(finalRegistry).toHaveLength(1);
  expect(finalRegistry[0]).toEqual(created);
});

test('3. a migration run that rejects while queued does not block the next queued CRUD operation', async () => {
  const { profileRepo, runStartupMigration } = loadModulesWithRejectingMigration(new Error('simulated migration failure'));

  await expect(runStartupMigration()).rejects.toThrow('simulated migration failure');

  const createResult = await profileRepo.createProfile(INPUT_A);
  const created = expectCreated(createResult);

  const finalRegistry = readStored<Profile[]>(PROFILES_ALL_KEY)!;
  expect(finalRegistry).toEqual([created]);
});

test('4. mixed migration and CRUD operations preserve FIFO order', async () => {
  seed(LEGACY_KEY, LEGACY_PROFILE);

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

  const { profileRepo, runStartupMigration } = loadModules();

  // Enqueued in this exact order, synchronously, before any awaits: migration,
  // then createProfile(A), then createProfile(B).
  const migrationCall = runStartupMigration();
  const createACall = profileRepo.createProfile(INPUT_A);
  const createBCall = profileRepo.createProfile(INPUT_B);

  await Promise.resolve();
  await Promise.resolve();
  expect(registryReadCount).toBe(1); // only migration (enqueued first) has started

  releaseFirstRead();
  const [migrationResult, createAResult, createBResult] = await Promise.all([migrationCall, createACall, createBCall]);

  expect(migrationResult.dataStep).toBe('merged');
  const createdA = expectCreated(createAResult);
  const createdB = expectCreated(createBResult);

  // `createProfile` always appends - so the final order can only match
  // enqueue order if each operation actually ran in that order. Any
  // violation of FIFO would scramble this sequence.
  const finalRegistry = readStored<Profile[]>(PROFILES_ALL_KEY)!;
  expect(finalRegistry.map((p) => p.id)).toEqual([LEGACY_PROFILE.id, createdA.id, createdB.id]);
});

test('5. setActiveProfile() observes registry changes from previously queued operations', async () => {
  seed(PROFILES_ALL_KEY, [LEGACY_PROFILE]);

  let releaseFirstRead: () => void = () => {};
  const firstReadGate = new Promise<void>((resolve) => {
    releaseFirstRead = resolve;
  });
  let registryReadCount = 0;
  getRawItemMock.mockImplementation(async (key: string) => {
    if (key === PROFILES_ALL_KEY) {
      registryReadCount += 1;
      if (registryReadCount === 1) {
        await firstReadGate; // updateProfile's own first registry read pauses here
      }
    }
    return store.get(key) ?? null;
  });

  const { profileRepo } = loadModules();

  const updateCall = profileRepo.updateProfile(LEGACY_PROFILE.id, { fullName: 'Renamed Person' });
  const activateCall = profileRepo.setActiveProfile(LEGACY_PROFILE.id);

  await Promise.resolve();
  await Promise.resolve();
  expect(registryReadCount).toBe(1); // only the update's read has started; activate is still queued

  releaseFirstRead();
  const [updateResult, activateResult] = await Promise.all([updateCall, activateCall]);

  const updated = expectUpdated(updateResult);
  const activated = expectActivated(activateResult);

  // setActiveProfile's own read happened AFTER the update committed (it was
  // queued behind it) - so it must see the renamed profile, not the stale
  // pre-rename one.
  expect(activated.fullName).toBe('Renamed Person');
  expect(activated).toEqual(updated);
});

test('6. existing queue recovery remains intact: a createProfile write_failure does not block a subsequently queued migration run', async () => {
  seed(LEGACY_KEY, LEGACY_PROFILE);
  setItemMock.mockImplementationOnce(async () => {
    throw new Error('simulated write failure');
  });

  const { profileRepo, runStartupMigration } = loadModules();

  const createResult = await profileRepo.createProfile(INPUT_A);
  expect(createResult.status).toBe('write_failure');
  expect(store.has(PROFILES_ALL_KEY)).toBe(false); // the failed attempt persisted nothing

  const migrationResult = await runStartupMigration();
  expect(migrationResult.dataStep).toBe('merged');
  expect(migrationResult.pointerStep).toBe('set');

  const finalRegistry = readStored<Profile[]>(PROFILES_ALL_KEY)!;
  expect(finalRegistry).toEqual([LEGACY_PROFILE]);
});

test('7. startup deduplication remains intact through the real shared queue: concurrent runStartupMigration() calls still merge exactly once', async () => {
  seed(LEGACY_KEY, LEGACY_PROFILE);

  const { runStartupMigration } = loadModules();

  const first = runStartupMigration();
  const second = runStartupMigration();

  const [firstResult, secondResult] = await Promise.all([first, second]);
  expect(firstResult).toBe(secondResult);

  const profilesAllWrites = setItemMock.mock.calls.filter(([key]) => key === PROFILES_ALL_KEY);
  expect(profilesAllWrites).toHaveLength(1); // not duplicated by the two calls

  const finalRegistry = readStored<Profile[]>(PROFILES_ALL_KEY)!;
  expect(finalRegistry).toEqual([LEGACY_PROFILE]);
});
