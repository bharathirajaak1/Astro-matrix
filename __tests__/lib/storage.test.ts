/**
 * Exercises `getItem()`'s corrupt-JSON diagnostic logging - added so a
 * parse failure is visible in the Metro log instead of silently vanishing.
 * Mocks `@react-native-async-storage/async-storage` directly (rather than
 * `@/lib/storage` itself, as other tests do) since this is the module under
 * test.
 */
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store.get(k) ?? null),
      setItem: jest.fn(async (k: string, v: string) => {
        store.set(k, v);
      }),
      removeItem: jest.fn(async (k: string) => {
        store.delete(k);
      }),
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItem, setItem } from '@/lib/storage';

describe('getItem - corrupt value diagnostics', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('a missing key returns null without logging anything', async () => {
    const result = await getItem('nonexistent-key');

    expect(result).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('a value that fails to parse returns null and logs the key and error, never the raw value', async () => {
    await (AsyncStorage.setItem as jest.Mock)('astromatrix/broken-key', 'not valid json {');

    const result = await getItem('broken-key');

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message, loggedError] = warnSpy.mock.calls[0];
    expect(message).toContain('astromatrix/broken-key');
    expect(message).not.toContain('not valid json');
    expect(loggedError).toBeInstanceOf(Error);
  });

  test('a valid value still parses and returns normally, with no logging', async () => {
    await setItem('good-key', { hello: 'world' });

    const result = await getItem<{ hello: string }>('good-key');

    expect(result).toEqual({ hello: 'world' });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
