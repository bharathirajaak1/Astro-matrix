/**
 * Exercises the daily-forecast-reminder scheduler primitives in
 * `src/features/notifications/notifications.ts` against a mocked
 * `expo-notifications` (the real module needs native code).
 *
 * `notifications.ts` decides Expo-Go vs. native behavior once, at module
 * load time, from `expo-constants`. To exercise both branches in one file we
 * mock `expo-constants` per scenario with `jest.doMock` + `jest.resetModules()`
 * and `require()` the module under test fresh inside each loader, rather than
 * a single static top-level `import`.
 *
 * `react-native` itself is stubbed (its real entry file uses Flow/ESM syntax
 * this project's plain-Node Jest config isn't set up to transform) - only
 * `Platform.OS` is used by the module under test.
 */
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

const mockNotifications = {
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'undetermined' })),
  scheduleNotificationAsync: jest.fn(async () => 'mock-schedule-id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
};

function mockConstants(executionEnvironment: 'standalone' | 'storeClient') {
  jest.doMock('expo-constants', () => ({
    __esModule: true,
    default: { executionEnvironment },
    ExecutionEnvironment: { StoreClient: 'storeClient', Standalone: 'standalone', Bare: 'bare' },
  }));
}

/** Fresh native (non-Expo-Go) module instance, wired to `mockNotifications`. */
function loadNative(): typeof import('../../../src/features/notifications/notifications') {
  jest.resetModules();
  mockConstants('standalone');
  jest.doMock('expo-notifications', () => mockNotifications);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../../../src/features/notifications/notifications');
}

/** Fresh Expo-Go module instance - `require('expo-notifications')` must never run. */
function loadExpoGo(): typeof import('../../../src/features/notifications/notifications') {
  jest.resetModules();
  mockConstants('storeClient');
  jest.doMock('expo-notifications', () => mockNotifications);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../../../src/features/notifications/notifications');
}

describe('getPermissionState', () => {
  test('granted', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    const notifications = loadNative();
    await expect(notifications.getPermissionState()).resolves.toBe('granted');
  });

  test('denied', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    const notifications = loadNative();
    await expect(notifications.getPermissionState()).resolves.toBe('denied');
  });

  test('undetermined', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
    const notifications = loadNative();
    await expect(notifications.getPermissionState()).resolves.toBe('undetermined');
  });
});

describe('requestPermission', () => {
  test('actually invokes the OS permission request', async () => {
    mockNotifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    const notifications = loadNative();

    const result = await notifications.requestPermission();

    expect(result).toBe('granted');
    expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  test('does not schedule anything as a side effect', async () => {
    mockNotifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    const notifications = loadNative();

    await notifications.requestPermission();

    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('scheduleDailyForecastReminder', () => {
  test('schedules exactly one notification with the stable identifier, daily at 8:00 AM, with the supplied content unchanged, and resolves true', async () => {
    const notifications = loadNative();

    const result = await notifications.scheduleDailyForecastReminder({
      title: 'Personal day 9 · Let something end',
      body: 'A 9 day is for completion and release.',
    });

    expect(result).toBe(true);
    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    const call = mockNotifications.scheduleNotificationAsync.mock.calls[0][0];

    expect(call.identifier).toBe(notifications.DAILY_FORECAST_REMINDER_ID);
    expect(call.content).toEqual({
      title: 'Personal day 9 · Let something end',
      body: 'A 9 day is for completion and release.',
    });
    expect(call.trigger.type).toBe(mockNotifications.SchedulableTriggerInputTypes.DAILY);
    expect(call.trigger.hour).toBe(notifications.REMINDER_HOUR);
    expect(call.trigger.minute).toBe(notifications.REMINDER_MINUTE);
    expect(notifications.REMINDER_HOUR).toBe(8);
    expect(notifications.REMINDER_MINUTE).toBe(0);
  });

  test('cancels the existing reminder by identifier before scheduling', async () => {
    const notifications = loadNative();

    await notifications.scheduleDailyForecastReminder({ title: 't', body: 'b' });

    expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      notifications.DAILY_FORECAST_REMINDER_ID,
    );
    const cancelOrder = mockNotifications.cancelScheduledNotificationAsync.mock.invocationCallOrder[0];
    const scheduleOrder = mockNotifications.scheduleNotificationAsync.mock.invocationCallOrder[0];
    expect(cancelOrder).toBeLessThan(scheduleOrder);
  });

  test('never calls the blanket cancel-all API', async () => {
    const notifications = loadNative();

    await notifications.scheduleDailyForecastReminder({ title: 't', body: 'b' });

    expect(mockNotifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });
});

describe('duplicate prevention', () => {
  test('repeated calls always cancel-by-identifier before each replacement, and never cancel-all', async () => {
    const notifications = loadNative();
    const order: string[] = [];
    mockNotifications.cancelScheduledNotificationAsync.mockImplementation(async () => {
      order.push('cancel');
    });
    mockNotifications.scheduleNotificationAsync.mockImplementation(async () => {
      order.push('schedule');
      return 'mock-schedule-id';
    });

    await notifications.scheduleDailyForecastReminder({ title: 'first', body: 'b1' });
    await notifications.scheduleDailyForecastReminder({ title: 'second', body: 'b2' });

    expect(order).toEqual(['cancel', 'schedule', 'cancel', 'schedule']);
    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(mockNotifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });
});

describe('cancelDailyForecastReminder', () => {
  test('cancels only the reminder identifier, never cancel-all', async () => {
    const notifications = loadNative();

    await notifications.cancelDailyForecastReminder();

    expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      notifications.DAILY_FORECAST_REMINDER_ID,
    );
    expect(mockNotifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });
});

describe('Expo Go behavior', () => {
  test('getPermissionState resolves to undetermined without touching expo-notifications', async () => {
    const notifications = loadExpoGo();

    await expect(notifications.getPermissionState()).resolves.toBe('undetermined');
    expect(mockNotifications.getPermissionsAsync).not.toHaveBeenCalled();
  });

  test('requestPermission resolves to undetermined without touching expo-notifications', async () => {
    const notifications = loadExpoGo();

    await expect(notifications.requestPermission()).resolves.toBe('undetermined');
    expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test('scheduleDailyForecastReminder resolves without throwing and schedules nothing', async () => {
    const notifications = loadExpoGo();

    await expect(
      notifications.scheduleDailyForecastReminder({ title: 't', body: 'b' }),
    ).resolves.toBe(false);
    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(mockNotifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  test('cancelDailyForecastReminder resolves without throwing and cancels nothing', async () => {
    const notifications = loadExpoGo();

    await expect(notifications.cancelDailyForecastReminder()).resolves.toBeUndefined();
    expect(mockNotifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  test('isExpoGo is true and no expo-notifications function is ever invoked', async () => {
    const notifications = loadExpoGo();

    expect(notifications.isExpoGo).toBe(true);

    await notifications.getPermissionState();
    await notifications.requestPermission();
    await notifications.scheduleDailyForecastReminder({ title: 't', body: 'b' });
    await notifications.cancelDailyForecastReminder();

    expect(mockNotifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(mockNotifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    expect(mockNotifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });
});

/**
 * Error handling: every exported function in the current implementation
 * catches its own errors internally and resolves with a safe fallback rather
 * than rejecting. None of them are currently designed to propagate/reject -
 * these tests document and pin that behavior rather than inventing new
 * error-handling semantics.
 */
describe('error handling (documents current swallow-and-resolve behavior)', () => {
  test('getPermissionState resolves to undetermined if the OS call rejects', async () => {
    mockNotifications.getPermissionsAsync.mockRejectedValueOnce(new Error('boom'));
    const notifications = loadNative();

    await expect(notifications.getPermissionState()).resolves.toBe('undetermined');
  });

  test('requestPermission resolves to undetermined if the OS call rejects', async () => {
    mockNotifications.requestPermissionsAsync.mockRejectedValueOnce(new Error('boom'));
    const notifications = loadNative();

    await expect(notifications.requestPermission()).resolves.toBe('undetermined');
  });

  test('cancelDailyForecastReminder resolves (does not throw) if the OS call rejects', async () => {
    mockNotifications.cancelScheduledNotificationAsync.mockRejectedValueOnce(new Error('boom'));
    const notifications = loadNative();

    await expect(notifications.cancelDailyForecastReminder()).resolves.toBeUndefined();
  });

  test('scheduleDailyForecastReminder resolves false (does not throw) if scheduling rejects', async () => {
    mockNotifications.scheduleNotificationAsync.mockRejectedValueOnce(new Error('boom'));
    const notifications = loadNative();

    await expect(
      notifications.scheduleDailyForecastReminder({ title: 't', body: 'b' }),
    ).resolves.toBe(false);
  });
});
