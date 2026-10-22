/**
 * Stage 4: the one place that invokes the Stage 2 migration
 * (`migrateLegacyProfileToRegistry()`) during application startup.
 *
 * Scope of this stage, deliberately narrow:
 *  - `profile.current` stays the sole source of truth for routing, onboarding,
 *    and Remedies hydration this session - nothing here changes that. This
 *    module only runs the migration and reports its result; it never reads
 *    `useProfileStore`, never touches routing, and never decides which
 *    profile is "active" for anything the rest of the app does.
 *  - No new persisted "migration marker" is introduced. The in-memory guard
 *    below (`migrationRun`) is NOT a marker - it is never written to storage,
 *    carries no meaning across app restarts, and resets naturally every time
 *    the JS process restarts. `migrateLegacyProfileToRegistry()` is already
 *    idempotent by construction (see its own module doc), so a persisted
 *    marker remains unnecessary for correctness - this guard exists purely
 *    to stop the same process from kicking off two independent migration
 *    runs concurrently (see below), not to remember anything between runs.
 *
 * Duplicate-invocation protection:
 * React 18/19 Strict Mode intentionally double-invokes effects (and some
 * component bodies) in development, and `app/_layout.tsx` could in principle
 * remount. `migrateLegacyProfileToRegistry()` itself is safe to call more than
 * once (idempotent, retry-safe per its own design) - but two *concurrent*
 * calls would each independently read `profiles.all` and `profile.current`
 * and could both decide to append the same legacy profile, racing on the
 * final `setItem('profiles.all', ...)`. Memoizing a single in-flight/resolved
 * promise at module scope means every caller within the same process -
 * however many times this function is invoked - shares exactly one real
 * migration run.
 *
 * Queue coordination (Stage 5a):
 * `migrateLegacyProfileToRegistry()`'s own `profiles.all` / `profiles.activeId`
 * read-modify-write is executed through `repo.ts`'s shared
 * `enqueueRegistryMutation` - the exact same queue `createProfile` /
 * `updateProfile` / `setActiveProfile` use - so a migration run and a registry
 * CRUD call initiated close together can never interleave their reads/writes
 * against those two keys. This wraps only the *call site* here; `migration.ts`
 * itself has no knowledge of the queue and is not modified by this - its
 * algorithm, result shape, and retry-safety guarantees are unchanged. Any code
 * that performs registry CRUD should still prefer to `await
 * runStartupMigration()` first where practical (so migration's own work isn't
 * left pending behind a long-running queue), but correctness no longer
 * depends on that ordering the way it did before this stage - the queue
 * itself is now what prevents a conflicting interleave, regardless of call
 * order.
 *
 * Rejection recovery:
 * `migrateLegacyProfileToRegistry()` is written to never reject - every
 * internal read/write failure it can encounter is already caught and reported
 * via `MigrationResult.abortReason` instead (see that module's own code).
 * Still, the singleton below must not silently wedge the app into a
 * permanently-broken state if that invariant is ever violated (a future
 * change to that module, or `logMigrationResult` itself throwing) - a bare
 * memoized promise would otherwise cache a rejected promise forever, so a
 * single unexpected failure would disable migration for the rest of the
 * process with no way to retry. The `.catch()` below resets `migrationRun`
 * back to `null` (after an identity check - see its comment) so the very
 * next call starts a fresh attempt, while still propagating the original
 * rejection to whoever awaited this particular call.
 *
 * Why onboarding cannot race this into an inconsistent state:
 * onboarding (`app/onboarding/details.tsx` -> `useProfileStore.save()` ->
 * `profileRepo.save()`) only ever reads and writes the legacy `profile.current`
 * key - it never touches `profiles.all` or `profiles.activeId`, and migration
 * never writes `profile.current` (only reads it). The one interleaving that
 * can occur - migration's single read of `profile.current` lands a moment
 * before onboarding's write completes - simply makes this run's `dataStep`
 * come back `'no_legacy'` (or `'initialized_empty'`): a fully safe, idempotent
 * outcome. The newly-onboarded profile is merged on the *next* call to
 * `migrateLegacyProfileToRegistry()` (next app launch), exactly as the
 * module's own retry-safety guarantees. Nothing is lost or corrupted either
 * way, so no additional lock between onboarding and migration is introduced.
 */
import { migrateLegacyProfileToRegistry, type MigrationResult } from './migration';
import { enqueueRegistryMutation } from './repo';

/** Purely observational - never performs a write, never "fixes" anything.
 *  Exported so its behavior per outcome is directly testable. */
export function logMigrationResult(result: MigrationResult): void {
  if (result.dataStep === 'conflict') {
    console.warn(
      '[profile migration] legacy profile and registry entry disagree for id',
      result.conflict?.id,
      '- left unresolved; profile.current remains authoritative this session.',
    );
  } else if (result.abortReason) {
    console.warn('[profile migration] run aborted this launch; will retry next launch.', result.abortReason);
  } else {
    console.log(`[profile migration] dataStep=${result.dataStep} pointerStep=${result.pointerStep}`);
  }

  if (result.danglingActiveId !== undefined) {
    console.warn(
      '[profile migration] profiles.activeId does not resolve to any registry entry:',
      result.danglingActiveId,
    );
  }
}

/**
 * Logs an unexpected migration failure (the run rejected, rather than
 * resolving to a `MigrationResult` - see the rejection-recovery note above).
 * Only ever logs `error.message` - a plain string - never the error object
 * itself, so an error that happened to carry extra properties (a profile, a
 * raw storage payload, anything unexpected) can never have those surface in
 * logs. Exported so this guarantee is directly testable.
 */
export function logMigrationFailure(error: unknown): void {
  const message = error instanceof Error ? error.message : 'unknown error';
  console.warn(
    '[profile migration] startup migration failed unexpectedly - will retry on next call:',
    message,
  );
}

let migrationRun: Promise<MigrationResult> | null = null;

/**
 * Runs the Stage 2 migration exactly once per application process, however
 * many times this is called. The first call triggers the real migration and
 * every call (including ones made while it is still in flight) resolves to
 * that same result - never a second, independent run.
 *
 * If that run rejects (see the rejection-recovery note above), this specific
 * call's returned promise rejects too - but the singleton itself is reset so
 * the *next* call starts a genuinely new attempt rather than replaying the
 * same failure forever.
 */
export function runStartupMigration(): Promise<MigrationResult> {
  if (migrationRun !== null) {
    return migrationRun;
  }

  const thisRun: Promise<MigrationResult> = enqueueRegistryMutation(() => migrateLegacyProfileToRegistry())
    .then((result) => {
      logMigrationResult(result);
      return result;
    })
    .catch((error: unknown) => {
      // Only clear the singleton if it still points at THIS run - a newer
      // run can only ever have started after this one already cleared the
      // slot (see above), so this can never observe a newer run in flight
      // under the current single-entry-point design. Kept as an explicit
      // identity check anyway, defensively, so a stale/settling run can
      // never clobber a run that isn't itself.
      if (migrationRun === thisRun) {
        migrationRun = null;
      }
      logMigrationFailure(error);
      throw error;
    });

  migrationRun = thisRun;
  return thisRun;
}
