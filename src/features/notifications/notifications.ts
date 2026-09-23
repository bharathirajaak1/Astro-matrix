import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type * as ExpoNotifications from 'expo-notifications';

import type { ReminderContent } from './content';

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof ExpoNotifications | null = null;
try {
  if (!isExpoGo) {
    Notifications = require('expo-notifications');
  }
} catch {
  Notifications = null;
}

/**
 * Stable identifier for the single daily forecast reminder. Scheduling and
 * cancellation are always targeted at this identifier so this feature never
 * touches any other notification that might be scheduled elsewhere.
 */
export const DAILY_FORECAST_REMINDER_ID = 'daily-forecast-reminder';

export const REMINDER_HOUR = 8;
export const REMINDER_MINUTE = 0;

export type PermissionState = 'granted' | 'denied' | 'undetermined';

function toPermissionState(status?: string): PermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function configureNotifications(): Promise<void> {
  if (!Notifications) {
    return;
  }

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-forecast', {
        name: 'Daily Forecast & Alignments',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#57715E',
      });
    }
  } catch (err) {
    console.log('Notification handler configuration skipped.');
  }
}

/** Query the current OS notification permission without prompting the user. */
export async function getPermissionState(): Promise<PermissionState> {
  if (!Notifications) {
    return 'undetermined';
  }
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return toPermissionState(status);
  } catch {
    return 'undetermined';
  }
}

/**
 * Prompt the user for notification permission. Callers must only invoke this
 * in direct response to the user opting in (e.g. the Settings reminder
 * toggle) - never automatically on launch.
 */
export async function requestPermission(): Promise<PermissionState> {
  if (!Notifications) {
    return 'undetermined';
  }
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return toPermissionState(status);
  } catch {
    return 'undetermined';
  }
}

/**
 * Cancel only the daily forecast reminder, by its stable identifier. Never
 * touches any other scheduled notification.
 */
export async function cancelDailyForecastReminder(): Promise<void> {
  if (!Notifications) {
    return;
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_FORECAST_REMINDER_ID);
  } catch {
    // Nothing scheduled under this identifier - nothing to do.
  }
}

/**
 * Schedule the single daily forecast reminder at 8:00 AM local time, daily
 * repeating, from already-built content (see `content.ts` - this function
 * never calculates a forecast itself). Any existing instance is cancelled by
 * identifier first, so calling this repeatedly never produces duplicates.
 *
 * Resolves `true` only if the notification was actually scheduled, and
 * `false` if scheduling was unavailable (Expo Go) or failed - it never
 * throws, so callers can safely `await` it without a try/catch.
 */
export async function scheduleDailyForecastReminder(content: ReminderContent): Promise<boolean> {
  if (!Notifications) {
    return false;
  }

  await cancelDailyForecastReminder();

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_FORECAST_REMINDER_ID,
      content: {
        title: content.title,
        body: content.body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: REMINDER_HOUR,
        minute: REMINDER_MINUTE,
        ...(Platform.OS === 'android' ? { channelId: 'daily-forecast' } : {}),
      },
    });
    return true;
  } catch (error) {
    console.warn('Could not schedule the daily forecast reminder:', error);
    return false;
  }
}
