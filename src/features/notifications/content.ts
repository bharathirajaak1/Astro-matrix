/**
 * Pure builder for the daily reminder's text. No `expo-notifications` import so
 * it can be unit-tested in a plain Node environment. The service layer feeds it
 * today's ISO date and passes the result to `scheduleNotificationAsync`.
 */
import { buildForecast } from '@/core/forecast';
import type { Profile } from '@/core/types';

export interface ReminderContent {
  title: string;
  body: string;
}

export function buildReminderContent(profile: Profile, onDateISO: string): ReminderContent {
  const forecast = buildForecast(profile, onDateISO);
  return {
    title: `Personal day ${forecast.personalDay} · ${forecast.headline}`,
    body: forecast.body,
  };
}
