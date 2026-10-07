/**
 * Exercises `profileRepo.save()`'s identity-change detection with an
 * in-memory stand-in for `@/lib/storage`, matching the mocking pattern
 * already used in `__tests__/features/remedies/ritualStore.test.ts`.
 */
jest.mock('@/lib/storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (k: string) => {
      const raw = store.get(k);
      return raw == null ? null : JSON.parse(raw);
    }),
    setItem: jest.fn(async (k: string, v: unknown) => {
      store.set(k, JSON.stringify(v));
    }),
    removeItem: jest.fn(async (k: string) => {
      store.delete(k);
    }),
  };
});

import { removeItem } from '@/lib/storage';
import { profileRepo } from '@/features/profile/repo';

const CURRENT_KEY = 'profile.current';

beforeEach(async () => {
  await removeItem(CURRENT_KEY);
});

describe('profileRepo.save - identity-change detection', () => {
  test('E: saving again with the same fullName and dob keeps the same profile.id', async () => {
    const first = await profileRepo.save({
      fullName: 'Ada Lovelace',
      dob: '1990-01-15',
      system: 'pythagorean',
    });

    const second = await profileRepo.save({
      fullName: 'Ada Lovelace',
      dob: '1990-01-15',
      system: 'pythagorean',
    });

    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(first.createdAt);
  });

  test('F: changing dob generates a new profile.id', async () => {
    const first = await profileRepo.save({
      fullName: 'Ada Lovelace',
      dob: '1990-01-15',
      system: 'pythagorean',
    });

    const second = await profileRepo.save({
      fullName: 'Ada Lovelace',
      dob: '1990-02-20',
      system: 'pythagorean',
    });

    expect(second.id).not.toBe(first.id);
  });

  test('G: changing fullName generates a new profile.id', async () => {
    const first = await profileRepo.save({
      fullName: 'Ada Lovelace',
      dob: '1990-01-15',
      system: 'pythagorean',
    });

    const second = await profileRepo.save({
      fullName: 'Grace Hopper',
      dob: '1990-01-15',
      system: 'pythagorean',
    });

    expect(second.id).not.toBe(first.id);
  });

  test('changing only the numerology system keeps the same profile.id', async () => {
    const first = await profileRepo.save({
      fullName: 'Ada Lovelace',
      dob: '1990-01-15',
      system: 'pythagorean',
    });

    const second = await profileRepo.save({
      fullName: 'Ada Lovelace',
      dob: '1990-01-15',
      system: 'chaldean',
    });

    expect(second.id).toBe(first.id);
    expect(second.system).toBe('chaldean');
  });

  test('the very first save generates a fresh id, matching prior behavior', async () => {
    const profile = await profileRepo.save({
      fullName: 'Ada Lovelace',
      dob: '1990-01-15',
      system: 'pythagorean',
    });

    expect(typeof profile.id).toBe('string');
    expect(profile.id.length).toBeGreaterThan(0);
  });

});
