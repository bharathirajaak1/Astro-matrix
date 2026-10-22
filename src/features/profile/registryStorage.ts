/**
 * Generic, storage-key-agnostic read classification. Distinguishes four
 * outcomes that `@/lib/storage`'s `getItem()` deliberately collapses into
 * a single `null` for its own callers:
 *
 *   - absent:        the key was never written
 *   - ok:            parsed AND passed the caller's shape validator
 *   - malformed:     a value exists but fails to parse, or parses to
 *                    something the validator rejects - the raw bytes are
 *                    returned, never discarded or silently replaced
 *   - read_failure:  the underlying storage read itself threw - distinct
 *                    from malformed, since here we don't know anything
 *                    about the actual contents
 *
 * Not wired to any real key yet - no caller exists. This is purely the
 * read-side classification primitive; it never writes anything.
 */
import { getRawItem } from '@/lib/storage';

export type StorageReadResult<T> =
  | { status: 'absent' }
  | { status: 'ok'; value: T }
  | { status: 'malformed'; raw: string }
  | { status: 'read_failure'; error: unknown };

export async function readClassified<T>(
  key: string,
  isValid: (value: unknown) => value is T,
): Promise<StorageReadResult<T>> {
  let raw: string | null;
  try {
    raw = await getRawItem(key);
  } catch (error) {
    return { status: 'read_failure', error };
  }

  if (raw == null) {
    return { status: 'absent' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'malformed', raw };
  }

  if (!isValid(parsed)) {
    return { status: 'malformed', raw };
  }

  return { status: 'ok', value: parsed };
}
