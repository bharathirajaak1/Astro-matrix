/**
 * The only module that talks to expo-secure-store directly. Used for the
 * entitlement flag (and later, any purchase receipt/token). Values are JSON and
 * keys are namespaced. All calls degrade to a no-op / null on platforms where
 * secure storage is unavailable (e.g. web) so callers never have to guard.
 */
import * as SecureStore from 'expo-secure-store';

// SecureStore keys allow [A-Za-z0-9._-] only.
const PREFIX = 'astromatrix.';

const key = (k: string): string => `${PREFIX}${k}`;

export async function getSecure<T>(k: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(key(k));
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setSecure<T>(k: string, value: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(key(k), JSON.stringify(value));
  } catch {
    // Secure storage unavailable - silently skip.
  }
}

export async function deleteSecure(k: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key(k));
  } catch {
    // Nothing stored / unavailable - nothing to do.
  }
}
