/**
 * expo-notifications glue for the daily forecast reminder.
 *
 * - One repeating local notification at 08:00 local time.
 * - Permission is only ever requested from `requestPermission()`, which the
 *   settings toggle calls - never on app launch.
 * - `syncDailyReminder()` runs on every app open to (re)schedule with fresh
 *   text or to clear the reminder if it was turned off / permission was revoked.
 *
 * Note: a DAILY trigger carries static text, so the body reflects the forecast
 * from the last app open. Daily users see current copy; a future milestone can
 * switch to a rolling set of date-triggered notifications for exact per-day text.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Profile } from '@/core/types';
import { todayISO } from '@/lib/date';

import { buildReminderContent } from './content';

export const REMINDER_HOUR = 8;
export const REMINDER_MINUTE = 0;

const DAILY_REMINDER_ID = 'astromatrix.daily-forecast';
const ANDROID_CHANNEL_ID = 'daily-forecast';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

let handlerConfigured = false;

/** Register how a notification behaves while the app is foregrounded. Idempotent. */
export function configureNotifications(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function toState(response: Notifications.NotificationPermissionsStatus): PermissionState {
  if (response.granted) return 'granted';
  if (response.canAskAgain && response.status === 'undetermined') return 'undetermined';
  return response.canAskAgain ? 'undetermined' : 'denied';
}

export async function getPermissionState(): Promise<PermissionState> {
  return toState(await Notifications.getPermissionsAsync());
}

/** Prompts the OS permission dialog. Call this only from a user action. */
export async function requestPermission(): Promise<PermissionState> {
  return toState(await Notifications.requestPermissionsAsync());
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Daily forecast',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
  } catch {
    // No matching scheduled notification - nothing to cancel.
  }
}

/** Cancel any existing reminder and schedule a fresh one for 08:00 local. */
export async function scheduleDailyReminder(profile: Profile): Promise<void> {
  await ensureAndroidChannel();
  await cancelDailyReminder();

  const { title, body } = buildReminderContent(profile, todayISO());

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null),
    },
  });
}

/**
 * Reconcile the scheduled reminder with the current preference + permission +
 * profile. Safe to call on every app open. Returns the effective state so the
 * store can correct itself if permission was revoked in OS settings.
 */
export async function syncDailyReminder(params: {
  enabled: boolean;
  profile: Profile | null;
}): Promise<{ scheduled: boolean; permission: PermissionState }> {
  const permission = await getPermissionState();

  if (!params.enabled || !params.profile || permission !== 'granted') {
    await cancelDailyReminder();
    return { scheduled: false, permission };
  }

  await scheduleDailyReminder(params.profile);
  return { scheduled: true, permission };
}
