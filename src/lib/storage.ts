/**
 * The only module that talks to AsyncStorage directly. Everything is JSON and
 * every key is namespaced under `astromatrix/`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const NAMESPACE = 'astromatrix/';

const namespaced = (key: string): string => `${NAMESPACE}${key}`;

export async function getItem<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(namespaced(key));
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt value - treat as absent so callers can recover.
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(namespaced(key), JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(namespaced(key));
}
