/**
 * Exercises the entitlement persistence logic with an in-memory stand-in for
 * `@/lib/secureStore` (the real one needs the native expo-secure-store module).
 */
jest.mock('@/lib/secureStore', () => {
  const store = new Map<string, string>();
  return {
    getSecure: jest.fn(async (k: string) => {
      const raw = store.get(k);
      return raw == null ? null : JSON.parse(raw);
    }),
    setSecure: jest.fn(async (k: string, v: unknown) => {
      store.set(k, JSON.stringify(v));
    }),
    deleteSecure: jest.fn(async (k: string) => {
      store.delete(k);
    }),
  };
});

import {
  clearRemedyEntitlement,
  readRemedyEntitlement,
  writeRemedyEntitlement,
} from '@/features/entitlements/entitlements';

beforeEach(async () => {
  await clearRemedyEntitlement();
});

describe('remedy entitlement persistence', () => {
  test('starts locked', async () => {
    expect(await readRemedyEntitlement()).toEqual({
      unlocked: false,
      unlockedAt: null,
      source: null,
    });
  });

  test('writing an unlock persists it and stamps the source + time', async () => {
    const written = await writeRemedyEntitlement('purchase');
    expect(written.unlocked).toBe(true);
    expect(written.source).toBe('purchase');
    expect(Number.isNaN(Date.parse(written.unlockedAt ?? ''))).toBe(false);

    const readBack = await readRemedyEntitlement();
    expect(readBack).toEqual(written);
  });

  test('clearing relocks', async () => {
    await writeRemedyEntitlement('promo');
    expect((await readRemedyEntitlement()).unlocked).toBe(true);

    await clearRemedyEntitlement();
    expect(await readRemedyEntitlement()).toEqual({
      unlocked: false,
      unlockedAt: null,
      source: null,
    });
  });

  test('a stored value that is not unlocked reads as locked', async () => {
    const { setSecure } = jest.requireMock('@/lib/secureStore') as {
      setSecure: (k: string, v: unknown) => Promise<void>;
    };
    await setSecure('entitlement.remedies', { unlocked: false, unlockedAt: null, source: null });
    expect((await readRemedyEntitlement()).unlocked).toBe(false);
  });
});
