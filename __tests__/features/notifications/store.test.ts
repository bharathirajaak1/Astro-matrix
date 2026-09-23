/**
 * Exercises `useNotificationsStore` against mocked `notifications.ts`
 * primitives (permission/scheduling - the real module needs native code and
 * is already covered by `notifications.test.ts`), an in-memory stand-in for
 * `@/lib/storage`, and a controllable `todayISO()`. `content.ts` is used
 * for real (it's pure and already covered by `content.test.ts`), so the
 * content actually passed to the scheduler is verified against its genuine
 * output rather than a mock.
 */
jest.mock('@/features/notifications/notifications', () => ({
  getPermissionState: jest.fn(),
  requestPermission: jest.fn(),
  scheduleDailyForecastReminder: jest.fn(),
  cancelDailyForecastReminder: jest.fn(),
}));

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

let mockToday = '2026-09-01';
jest.mock('@/lib/date', () => ({
  todayISO: jest.fn(() => mockToday),
}));

import { getItem, setItem } from '@/lib/storage';
import {
  getPermissionState,
  requestPermission,
  scheduleDailyForecastReminder,
  cancelDailyForecastReminder,
} from '@/features/notifications/notifications';
import { useNotificationsStore } from '@/features/notifications/store';
import type { Profile } from '@/core/types';

const ENABLED_KEY = 'notifications.enabled';

const profile: Profile = {
  id: 'u1',
  fullName: 'Ada Lovelace',
  dob: '1990-01-15',
  system: 'pythagorean',
  createdAt: '2026-01-01T00:00:00Z',
};

// Golden content for `profile` on `mockToday` (2026-09-01), matching the
// known value already pinned in content.test.ts.
const TODAY_CONTENT = {
  title: 'Personal day 9 · Let something end',
  body: 'A 9 day is for completion and release. Close the loop, give it away, and clear space for what is next.',
};

const mockGetPermissionState = getPermissionState as jest.Mock;
const mockRequestPermission = requestPermission as jest.Mock;
const mockSchedule = scheduleDailyForecastReminder as jest.Mock;
const mockCancel = cancelDailyForecastReminder as jest.Mock;

function resetStore() {
  useNotificationsStore.setState({
    enabled: false,
    permission: 'undetermined',
    hydrated: false,
  });
}

beforeEach(() => {
  mockToday = '2026-09-01';
  resetStore();
  mockGetPermissionState.mockResolvedValue('undetermined');
  mockRequestPermission.mockResolvedValue('undetermined');
  mockSchedule.mockResolvedValue(true);
  mockCancel.mockResolvedValue(undefined);
});

describe('hydrate', () => {
  test('enabled + granted permission: reschedules with today\'s content and stays enabled', async () => {
    await setItem(ENABLED_KEY, { enabled: true });
    mockGetPermissionState.mockResolvedValue('granted');

    await useNotificationsStore.getState().hydrate(profile);

    const state = useNotificationsStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.enabled).toBe(true);
    expect(state.permission).toBe('granted');
    expect(mockSchedule).toHaveBeenCalledWith(TODAY_CONTENT);
  });

  test('enabled + revoked permission: disables, persists the correction, does not schedule', async () => {
    await setItem(ENABLED_KEY, { enabled: true });
    mockGetPermissionState.mockResolvedValue('denied');

    await useNotificationsStore.getState().hydrate(profile);

    const state = useNotificationsStore.getState();
    expect(state.enabled).toBe(false);
    expect(state.permission).toBe('denied');
    expect(state.hydrated).toBe(true);
    expect(mockSchedule).not.toHaveBeenCalled();
    await expect(getItem<{ enabled: boolean }>(ENABLED_KEY)).resolves.toEqual({ enabled: false });
  });

  test('never requests permission', async () => {
    await setItem(ENABLED_KEY, { enabled: true });
    mockGetPermissionState.mockResolvedValue('granted');

    await useNotificationsStore.getState().hydrate(profile);

    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  test('disabled preference: leaves enabled false and does not schedule', async () => {
    await setItem(ENABLED_KEY, { enabled: false });
    mockGetPermissionState.mockResolvedValue('granted');

    await useNotificationsStore.getState().hydrate(profile);

    const state = useNotificationsStore.getState();
    expect(state.enabled).toBe(false);
    expect(state.hydrated).toBe(true);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  test('a rejected permission query does not crash the store', async () => {
    await setItem(ENABLED_KEY, { enabled: true });
    mockGetPermissionState.mockRejectedValue(new Error('boom'));

    await expect(useNotificationsStore.getState().hydrate(profile)).resolves.toBeUndefined();
    expect(useNotificationsStore.getState().hydrated).toBe(true);
  });
});

describe('setEnabled(true, profile)', () => {
  test('requests permission', async () => {
    mockRequestPermission.mockResolvedValue('granted');

    await useNotificationsStore.getState().setEnabled(true, profile);

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });

  test('granted permission: schedules today\'s content, persists enabled, resolves true', async () => {
    mockRequestPermission.mockResolvedValue('granted');

    const result = await useNotificationsStore.getState().setEnabled(true, profile);

    expect(result).toBe(true);
    expect(mockSchedule).toHaveBeenCalledWith(TODAY_CONTENT);
    expect(useNotificationsStore.getState().enabled).toBe(true);
    expect(useNotificationsStore.getState().permission).toBe('granted');
    await expect(getItem<{ enabled: boolean }>(ENABLED_KEY)).resolves.toEqual({ enabled: true });
  });

  test('denied permission: does not schedule, persists disabled, resolves false', async () => {
    mockRequestPermission.mockResolvedValue('denied');

    const result = await useNotificationsStore.getState().setEnabled(true, profile);

    expect(result).toBe(false);
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(useNotificationsStore.getState().enabled).toBe(false);
    await expect(getItem<{ enabled: boolean }>(ENABLED_KEY)).resolves.toEqual({ enabled: false });
  });

  test('granted permission but the scheduler reports failure (returns false): does not persist enabled, resolves false', async () => {
    mockRequestPermission.mockResolvedValue('granted');
    mockSchedule.mockResolvedValue(false);

    const result = await useNotificationsStore.getState().setEnabled(true, profile);

    expect(result).toBe(false);
    expect(mockSchedule).toHaveBeenCalledWith(TODAY_CONTENT);
    expect(useNotificationsStore.getState().enabled).toBe(false);
    await expect(getItem<{ enabled: boolean }>(ENABLED_KEY)).resolves.toEqual({ enabled: false });
  });

  test('a rejected schedule call does not crash the store and does not leave it enabled', async () => {
    mockRequestPermission.mockResolvedValue('granted');
    mockSchedule.mockRejectedValue(new Error('boom'));

    const result = await useNotificationsStore.getState().setEnabled(true, profile);

    expect(result).toBe(false);
    expect(useNotificationsStore.getState().enabled).toBe(false);
  });
});

describe('setEnabled(false, profile)', () => {
  test('cancels the reminder, persists disabled, does not request permission', async () => {
    useNotificationsStore.setState({ enabled: true, permission: 'granted', hydrated: true });

    const result = await useNotificationsStore.getState().setEnabled(false, profile);

    expect(result).toBe(false);
    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(useNotificationsStore.getState().enabled).toBe(false);
    await expect(getItem<{ enabled: boolean }>(ENABLED_KEY)).resolves.toEqual({ enabled: false });
  });
});

describe('sync', () => {
  test('enabled + granted permission: reschedules with fresh content', async () => {
    useNotificationsStore.setState({ enabled: true, permission: 'granted', hydrated: true });
    mockGetPermissionState.mockResolvedValue('granted');

    await useNotificationsStore.getState().sync(profile);

    expect(mockSchedule).toHaveBeenCalledWith(TODAY_CONTENT);
    expect(useNotificationsStore.getState().enabled).toBe(true);
  });

  test('revoked permission: disables without prompting', async () => {
    useNotificationsStore.setState({ enabled: true, permission: 'granted', hydrated: true });
    mockGetPermissionState.mockResolvedValue('denied');

    await useNotificationsStore.getState().sync(profile);

    expect(useNotificationsStore.getState().enabled).toBe(false);
    expect(mockRequestPermission).not.toHaveBeenCalled();
    await expect(getItem<{ enabled: boolean }>(ENABLED_KEY)).resolves.toEqual({ enabled: false });
  });

  test('never requests permission', async () => {
    useNotificationsStore.setState({ enabled: true, permission: 'granted', hydrated: true });

    await useNotificationsStore.getState().sync(profile);

    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  test('disabled: does not schedule', async () => {
    useNotificationsStore.setState({ enabled: false, permission: 'undetermined', hydrated: true });
    mockGetPermissionState.mockResolvedValue('granted');

    await useNotificationsStore.getState().sync(profile);

    expect(mockSchedule).not.toHaveBeenCalled();
  });

  test('behaves safely when permission resolves undetermined (Expo Go surface)', async () => {
    useNotificationsStore.setState({ enabled: true, permission: 'granted', hydrated: true });
    mockGetPermissionState.mockResolvedValue('undetermined');

    await useNotificationsStore.getState().sync(profile);

    expect(useNotificationsStore.getState().enabled).toBe(false);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  test('a rejected reschedule does not crash the store', async () => {
    useNotificationsStore.setState({ enabled: true, permission: 'granted', hydrated: true });
    mockSchedule.mockRejectedValue(new Error('boom'));

    await expect(useNotificationsStore.getState().sync(profile)).resolves.toBeUndefined();
  });
});

describe('Expo Go safety (undetermined permission surfaced by the mocked primitives)', () => {
  test('setEnabled(true) with undetermined permission does not schedule and resolves false', async () => {
    mockRequestPermission.mockResolvedValue('undetermined');

    const result = await useNotificationsStore.getState().setEnabled(true, profile);

    expect(result).toBe(false);
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(useNotificationsStore.getState().enabled).toBe(false);
  });

  test('hydrate with undetermined permission does not schedule and disables cleanly', async () => {
    await setItem(ENABLED_KEY, { enabled: true });
    mockGetPermissionState.mockResolvedValue('undetermined');

    await useNotificationsStore.getState().hydrate(profile);

    expect(mockSchedule).not.toHaveBeenCalled();
    expect(useNotificationsStore.getState().enabled).toBe(false);
  });
});
