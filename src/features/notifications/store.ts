/**
 * Reminder preference store. Persists a single boolean (`notifications.enabled`)
 * through `lib/storage.ts` and mirrors the OS permission state for the UI.
 *
 * Drives the single daily forecast reminder: content always comes from
 * `buildReminderContent` (which itself defers to the canonical forecast
 * engine) and scheduling always goes through the `notifications.ts`
 * primitives - this store never calculates a forecast or talks to
 * `expo-notifications` directly. Permission is only ever *requested* from
 * `setEnabled(true, ...)`; `hydrate`/`sync` only ever *query* it.
 */
import { create } from 'zustand';

import type { Profile } from '@/core/types';
import { getItem, setItem } from '@/lib/storage';
import { todayISO } from '@/lib/date';

import { buildReminderContent } from './content';
import {
  cancelDailyForecastReminder,
  getPermissionState,
  requestPermission,
  scheduleDailyForecastReminder,
  type PermissionState,
} from './notifications';

const ENABLED_KEY = 'notifications.enabled';

interface NotificationsState {
  /** User preference. May be true while `permission` is not 'granted' if the
   *  user revoked access in OS settings after enabling - `sync` reconciles. */
  enabled: boolean;
  permission: PermissionState;
  hydrated: boolean;
  /** Load the stored preference + current permission, then reconcile.
   *  Never requests permission. */
  hydrate: (profile: Profile | null) => Promise<void>;
  /** Toggle from the settings switch. Requests permission only when turning
   *  on. Returns the value that actually took effect. */
  setEnabled: (next: boolean, profile: Profile | null) => Promise<boolean>;
  /** Re-check permission + reschedule today's content. Call on app
   *  foreground / profile change. Never requests permission. */
  sync: (profile: Profile | null) => Promise<void>;
}

/** Reschedule with today's personalized content, if a profile is available.
 *  With no profile yet (e.g. before onboarding), there is nothing to
 *  personalize - the next hydrate/sync once a profile exists will schedule. */
async function rescheduleFor(profile: Profile | null): Promise<void> {
  if (!profile) {
    return;
  }
  const content = buildReminderContent(profile, todayISO());
  await scheduleDailyForecastReminder(content);
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  enabled: false,
  permission: 'undetermined',
  hydrated: false,

  hydrate: async (profile) => {
    try {
      const stored = await getItem<{ enabled: boolean }>(ENABLED_KEY);
      const enabled = stored?.enabled ?? false;
      const permission = await getPermissionState();

      if (enabled && permission === 'granted') {
        await rescheduleFor(profile);
        set({ enabled: true, permission, hydrated: true });
        return;
      }

      if (enabled && permission !== 'granted') {
        // Permission was lost while the preference was on - correct it, but
        // never re-prompt from here.
        await setItem(ENABLED_KEY, { enabled: false });
        set({ enabled: false, permission, hydrated: true });
        return;
      }

      set({ enabled: false, permission, hydrated: true });
    } catch {
      // Notifications unavailable on this platform - keep the app usable.
      set({ hydrated: true });
    }
  },

  setEnabled: async (next, profile) => {
    if (!next) {
      try {
        await cancelDailyForecastReminder();
      } catch {
        // Best-effort cancel; the preference below is what actually matters.
      }
      set({ enabled: false });
      try {
        await setItem(ENABLED_KEY, { enabled: false });
      } catch {
        // Storage unavailable - in-memory state still reflects the choice.
      }
      return false;
    }

    try {
      const permission = await requestPermission();
      set({ permission });

      if (permission !== 'granted') {
        set({ enabled: false });
        await setItem(ENABLED_KEY, { enabled: false });
        return false;
      }

      if (!profile) {
        // Nothing to personalize yet - don't claim success without scheduling.
        set({ enabled: false });
        await setItem(ENABLED_KEY, { enabled: false });
        return false;
      }

      const content = buildReminderContent(profile, todayISO());
      const scheduled = await scheduleDailyForecastReminder(content);

      if (!scheduled) {
        // Scheduling itself failed (or was unavailable) - don't claim the
        // reminder is enabled when it was never actually put on the calendar.
        set({ enabled: false });
        await setItem(ENABLED_KEY, { enabled: false });
        return false;
      }

      set({ enabled: true });
      await setItem(ENABLED_KEY, { enabled: true });
      return true;
    } catch {
      set({ enabled: false });
      try {
        await setItem(ENABLED_KEY, { enabled: false });
      } catch {
        // Storage unavailable - in-memory state still reflects the failure.
      }
      return false;
    }
  },

  sync: async (profile) => {
    try {
      const { enabled } = get();
      const permission = await getPermissionState();

      if (!enabled) {
        set({ permission });
        return;
      }

      if (permission !== 'granted') {
        set({ enabled: false, permission });
        await setItem(ENABLED_KEY, { enabled: false });
        return;
      }

      await rescheduleFor(profile);
      set({ permission, enabled: true });
    } catch {
      // Ignore - a transient scheduling failure shouldn't disrupt the app.
    }
  },
}));
