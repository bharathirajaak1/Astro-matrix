/**
 * The only module that talks to AsyncStorage directly. Everything is JSON and
 * every key is namespaced under `astromatrix/`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const NAMESPACE = 'astromatrix/';

const namespaced = (key: string): string => `${NAMESPACE}${key}`;

/**
 * Reads the raw, unparsed string for a key - distinguishes "nothing was
 * ever stored" (null) from "something was stored but isn't valid JSON"
 * (a caller-side `JSON.parse` failure), which `getItem()` deliberately
 * collapses into the same `null` for its own callers. Used by storage
 * classification helpers (e.g. the profile registry's) that need to tell
 * "absent" apart from "malformed" rather than treat both the same way.
 */
export async function getRawItem(key: string): Promise<string | null> {
  return AsyncStorage.getItem(namespaced(key));
}

export async function getItem<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(namespaced(key));
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    // Corrupt value - treat as absent so callers can recover. Logged (key
    // and error only, never the raw value) so this is visible in the Metro
    // log instead of silently vanishing.
    console.warn(`[storage] Failed to parse stored value for key "${namespaced(key)}":`, error);
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(namespaced(key), JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(namespaced(key));
}
