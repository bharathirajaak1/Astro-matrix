/**
 * Reminder preference store. Persists a single boolean (`notifications.enabled`)
 * through `lib/storage.ts` and mirrors the OS permission state for the UI.
 */
import { create } from 'zustand';

import type { Profile } from '@/core/types';
import { getItem, setItem } from '@/lib/storage';

import {
  configureNotifications,
  getPermissionState,
  requestPermission,
  syncDailyReminder,
  type PermissionState,
} from './notifications';

const ENABLED_KEY = 'notifications.enabled';

interface NotificationsState {
  /** User preference. May be true while `permission` is not 'granted' if the
   *  user revoked access in OS settings after enabling - `sync` reconciles. */
  enabled: boolean;
  permission: PermissionState;
  hydrated: boolean;
  /** Load the stored preference + current permission, then reconcile. */
  hydrate: (profile: Profile | null) => Promise<void>;
  /** Toggle from the settings switch. Requests permission when turning on.
   *  Returns the value that actually took effect. */
  setEnabled: (next: boolean, profile: Profile | null) => Promise<boolean>;
  /** Re-check permission + reschedule. Call on app foreground / profile change. */
  sync: (profile: Profile | null) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  enabled: false,
  permission: 'undetermined',
  hydrated: false,

  hydrate: async (profile) => {
    try {
      configureNotifications();
      const stored = await getItem<{ enabled: boolean }>(ENABLED_KEY);
      const enabled = stored?.enabled ?? false;
      const result = await syncDailyReminder({ enabled, profile });
      set({
        enabled: enabled && result.permission === 'granted',
        permission: result.permission,
        hydrated: true,
      });
      // If permission was lost while the preference was on, persist the correction.
      if (enabled && result.permission !== 'granted') {
        await setItem(ENABLED_KEY, { enabled: false });
      }
    } catch {
      // Notifications unavailable on this platform - keep the app usable.
      set({ hydrated: true });
    }
  },

  setEnabled: async (next, profile) => {
    if (!next) {
      set({ enabled: false });
      await setItem(ENABLED_KEY, { enabled: false });
      await syncDailyReminder({ enabled: false, profile });
      return false;
    }

    let permission = await getPermissionState();
    if (permission !== 'granted') {
      permission = await requestPermission();
    }
    set({ permission });

    if (permission !== 'granted') {
      set({ enabled: false });
      await setItem(ENABLED_KEY, { enabled: false });
      return false;
    }

    set({ enabled: true });
    await setItem(ENABLED_KEY, { enabled: true });
    await syncDailyReminder({ enabled: true, profile });
    return true;
  },

  sync: async (profile) => {
    const { enabled } = get();
    try {
      const result = await syncDailyReminder({ enabled, profile });
      set({
        permission: result.permission,
        enabled: enabled && result.permission === 'granted',
      });
      if (enabled && result.permission !== 'granted') {
        await setItem(ENABLED_KEY, { enabled: false });
      }
    } catch {
      // Ignore - a transient scheduling failure shouldn't disrupt the app.
    }
  },
}));
