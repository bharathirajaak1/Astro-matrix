import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type * as ExpoNotifications from 'expo-notifications';

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

export async function scheduleDailyNotifications(userName?: string): Promise<void> {
  if (!Notifications) {
    return;
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    const morningTitle = userName ? `🌅 Good morning, ${userName}` : '🌅 Good Morning!';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: morningTitle,
        body: 'Your free daily forecast & power color are ready. Align your frequency for today.',
        data: { type: 'morning', target: '/(tabs)/forecast' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
        ...(Platform.OS === 'android' ? { channelId: 'daily-forecast' } : {}),
      },
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '☀️ Golden Hour Approaching',
        body: 'Your midday alignment window opens soon. Take 2 minutes for your micro-ritual.',
        data: { type: 'midday', target: '/(tabs)/forecast' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 13,
        minute: 30,
        ...(Platform.OS === 'android' ? { channelId: 'daily-forecast' } : {}),
      },
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌙 Evening Wind-Down',
        body: 'Time for your evening reflection. Review your day’s energetic flow.',
        data: { type: 'evening', target: '/(tabs)/remedies' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
        ...(Platform.OS === 'android' ? { channelId: 'daily-forecast' } : {}),
      },
    });
  } catch (error) {
    console.warn('Could not schedule notifications:', error);
  }
}