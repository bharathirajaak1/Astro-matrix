/**
 * Exercises `src/features/profile/startup.ts` - the orchestrator that
 * invokes `migrateLegacyProfileToRegistry()` once per app process.
 *
 * `migrateLegacyProfileToRegistry` itself is mocked here: its own behavior
 * for every storage state is already exhaustively covered by
 * `migration.test.ts` against mocked `@/lib/storage`. This file only proves
 * the orchestrator's own contract - dedup, result pass-through, and
 * per-outcome logging - never touches real storage, routing, or any
 * `remedies.rituals.*`/`profile.current` key.
 *
 * `./repo` is ALSO mocked (Stage 5a: `startup.ts` now imports
 * `enqueueRegistryMutation` from it to share the registry queue with
 * migration). The mock here is a plain pass-through (`(op) => op()`) -
 * deliberately NOT the real queue implementation - because this file's job
 * is only to prove `runStartupMigration()`'s own singleton/dedup/rejection
 * contract, not the queue's serialization behavior. The queue itself,
 * including migration sharing it with `createProfile`/`updateProfile`/
 * `setActiveProfile`, is exercised separately and deterministically against
 * the REAL `enqueueRegistryMutation` in `registryQueueCoordination.test.ts`.
 * Mocking `./repo` here also means this file never transitively loads real
 * `@/lib/storage` (and so never touches AsyncStorage), keeping it isolated
 * and deterministic exactly as before this stage.
 *
 * Each test loads a fresh module instance via `jest.resetModules()` so the
 * orchestrator's module-scoped "already running" guard never leaks between
 * tests, matching the pattern used in `notifications.test.ts`.
 */
import type { MigrationResult } from '@/features/profile/migration';

const migrateMock = jest.fn<Promise<MigrationResult>, []>();

function loadStartup(): typeof import('../../../src/features/profile/startup') {
  jest.resetModules();
  jest.doMock('../../../src/features/profile/migration', () => ({
    migrateLegacyProfileToRegistry: migrateMock,
  }));
  jest.doMock('../../../src/features/profile/repo', () => ({
    enqueueRegistryMutation: (operation: () => Promise<unknown>) => operation(),
  }));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../../../src/features/profile/startup');
}

const SUCCESS_RESULT: MigrationResult = { dataStep: 'merged', pointerStep: 'set' };

let warnSpy: jest.SpyInstance;
let logSpy: jest.SpyInstance;

beforeEach(() => {
  migrateMock.mockReset();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  logSpy.mockRestore();
});

describe('runStartupMigration - dedup', () => {
  test('a single call invokes the migration exactly once', async () => {
    migrateMock.mockResolvedValueOnce(SUCCESS_RESULT);
    const { runStartupMigration } = loadStartup();

    const result = await runStartupMigration();

    expect(result).toEqual(SUCCESS_RESULT);
    expect(migrateMock).toHaveBeenCalledTimes(1);
  });

  test('concurrent calls (e.g. Strict Mode double-invoke) share one run and one result', async () => {
    let resolveMigration: (value: MigrationResult) => void;
    migrateMock.mockReturnValueOnce(
      new Promise<MigrationResult>((resolve) => {
        resolveMigration = resolve;
      }),
    );
    const { runStartupMigration } = loadStartup();

    const first = runStartupMigration();
    const second = runStartupMigration();

    expect(migrateMock).toHaveBeenCalledTimes(1);
    resolveMigration!(SUCCESS_RESULT);

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult).toBe(secondResult);
    expect(migrateMock).toHaveBeenCalledTimes(1);
  });

  test('a later call after the first has already resolved still does not re-run migration', async () => {
    migrateMock.mockResolvedValueOnce(SUCCESS_RESULT);
    const { runStartupMigration } = loadStartup();

    await runStartupMigration();
    const second = await runStartupMigration();

    expect(second).toEqual(SUCCESS_RESULT);
    expect(migrateMock).toHaveBeenCalledTimes(1);
  });
});

describe('runStartupMigration - rejection recovery', () => {
  test('a rejected run is surfaced to its own caller, then a later call retries and succeeds', async () => {
    const failure = new Error('storage exploded');
    migrateMock.mockRejectedValueOnce(failure);
    migrateMock.mockResolvedValueOnce(SUCCESS_RESULT);
    const { runStartupMigration } = loadStartup();

    await expect(runStartupMigration()).rejects.toThrow('storage exploded');
    expect(migrateMock).toHaveBeenCalledTimes(1);

    await expect(runStartupMigration()).resolves.toEqual(SUCCESS_RESULT);
    expect(migrateMock).toHaveBeenCalledTimes(2);
  });

  test('logMigrationResult throwing is recovered identically, and a later call retries and succeeds', async () => {
    migrateMock.mockResolvedValueOnce(SUCCESS_RESULT);
    migrateMock.mockResolvedValueOnce(SUCCESS_RESULT);
    // SUCCESS_RESULT hits logMigrationResult's plain console.log branch -
    // force that one call to throw, simulating the logging step itself
    // failing rather than the migration call.
    logSpy.mockImplementationOnce(() => {
      throw new Error('log boom');
    });
    const { runStartupMigration } = loadStartup();

    await expect(runStartupMigration()).rejects.toThrow('log boom');
    expect(migrateMock).toHaveBeenCalledTimes(1);

    await expect(runStartupMigration()).resolves.toEqual(SUCCESS_RESULT);
    expect(migrateMock).toHaveBeenCalledTimes(2);
  });

  test('concurrent calls still share one run and one rejection (dedup holds for failures too)', async () => {
    let rejectMigration: (error: unknown) => void;
    migrateMock.mockReturnValueOnce(
      new Promise<MigrationResult>((_resolve, reject) => {
        rejectMigration = reject;
      }),
    );
    const { runStartupMigration } = loadStartup();

    const first = runStartupMigration();
    const second = runStartupMigration();
    expect(migrateMock).toHaveBeenCalledTimes(1);

    rejectMigration!(new Error('storage exploded'));

    await expect(first).rejects.toThrow('storage exploded');
    await expect(second).rejects.toThrow('storage exploded');
    expect(migrateMock).toHaveBeenCalledTimes(1);
  });

  test('a rejection logs via logMigrationFailure and never leaves the rejection unhandled', async () => {
    const failure = new Error('storage exploded');
    migrateMock.mockRejectedValueOnce(failure);
    const { runStartupMigration } = loadStartup();

    await expect(runStartupMigration()).rejects.toThrow('storage exploded');

    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), 'storage exploded');
  });
});

describe('logMigrationFailure - never exposes anything beyond the error message', () => {
  test('an error carrying extra, unexpected fields never leaks them into the log', () => {
    const { logMigrationFailure } = loadStartup();
    const dangerousError = Object.assign(new Error('boom'), {
      profile: { fullName: 'Secret Name', dob: '1990-01-01' },
    });

    logMigrationFailure(dangerousError);

    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), 'boom');
    for (const call of warnSpy.mock.calls) {
      for (const arg of call) {
        expect(JSON.stringify(arg)).not.toContain('Secret Name');
        expect(JSON.stringify(arg)).not.toContain('1990-01-01');
      }
    }
  });

  test('a non-Error rejection value still logs safely as "unknown error"', () => {
    const { logMigrationFailure } = loadStartup();

    logMigrationFailure('a raw string rejection, not an Error');

    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), 'unknown error');
  });
});

describe('runStartupMigration - never performs its own writes', () => {
  test('resolves without calling anything beyond the mocked migration function', async () => {
    migrateMock.mockResolvedValueOnce(SUCCESS_RESULT);
    const { runStartupMigration } = loadStartup();

    await runStartupMigration();

    // `./repo` is mocked to a bare pass-through here (see the file header),
    // so this only confirms the orchestrator itself performs no writes of
    // its own beyond invoking the migration function exactly once - the
    // real queue's own write-free-ness for reads is covered separately in
    // `registryQueueCoordination.test.ts`.
    expect(migrateMock).toHaveBeenCalledTimes(1);
  });
});

describe('logMigrationResult - conservative, observation-only per outcome', () => {
  test('conflict: warns and names the conflicting id, takes no action', () => {
    const { logMigrationResult } = loadStartup();
    const result: MigrationResult = {
      dataStep: 'conflict',
      pointerStep: 'skipped',
      conflict: {
        id: 'p_1',
        registryVersion: { id: 'p_1', fullName: 'Registry Name', dob: '1990-01-01', system: 'pythagorean', createdAt: '2026-01-01T00:00:00.000Z' },
        legacyVersion: { id: 'p_1', fullName: 'Legacy Name', dob: '1990-01-01', system: 'pythagorean', createdAt: '2026-01-01T00:00:00.000Z' },
      },
    };

    logMigrationResult(result);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('disagree'),
      'p_1',
      expect.any(String),
    );
  });

  test('aborted: warns with the abort reason', () => {
    const { logMigrationResult } = loadStartup();
    const result: MigrationResult = {
      dataStep: 'aborted',
      pointerStep: 'skipped',
      abortReason: { legacy: 'malformed' },
    };

    logMigrationResult(result);

    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), { legacy: 'malformed' });
  });

  test('clean success: logs informationally, does not warn', () => {
    const { logMigrationResult } = loadStartup();

    logMigrationResult(SUCCESS_RESULT);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('merged'));
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('danglingActiveId: warns in addition to the dataStep/pointerStep outcome', () => {
    const { logMigrationResult } = loadStartup();
    const result: MigrationResult = {
      dataStep: 'no_legacy',
      pointerStep: 'skipped',
      danglingActiveId: 'p_missing',
    };

    logMigrationResult(result);

    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), 'p_missing');
  });

  test('no abortReason and no conflict: never calls console.warn', () => {
    const { logMigrationResult } = loadStartup();

    logMigrationResult({ dataStep: 'already_present', pointerStep: 'left_unchanged' });

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
