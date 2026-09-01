import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useNotificationsStore } from '@/features/notifications';
import { useProfileStore } from '@/features/profile/store';
import { useTheme } from '@/ui/theme';

export default function RootLayout() {
  const theme = useTheme();

  const hydrateProfile = useProfileStore((s) => s.hydrate);
  const profile = useProfileStore((s) => s.profile);

  const hydrateNotifications = useNotificationsStore((s) => s.hydrate);
  const notificationsHydrated = useNotificationsStore((s) => s.hydrated);
  const syncNotifications = useNotificationsStore((s) => s.sync);

  // Load the persisted profile, then reconcile the daily reminder against it.
  useEffect(() => {
    void (async () => {
      await hydrateProfile();
      await hydrateNotifications(useProfileStore.getState().profile);
    })();
  }, [hydrateProfile, hydrateNotifications]);

  // Re-schedule whenever the profile changes (new name/DOB -> new forecast text).
  useEffect(() => {
    if (notificationsHydrated) {
      void syncNotifications(profile);
    }
  }, [profile, notificationsHydrated, syncNotifications]);

  // Re-schedule on every return to the foreground ("reschedule on app open").
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncNotifications(useProfileStore.getState().profile);
      }
    });
    return () => subscription.remove();
  }, [syncNotifications]);

  return (
    <SafeAreaProvider>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Settings' }} />
        <Stack.Screen
          name="profile/edit"
          options={{ presentation: 'modal', title: 'Your details' }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
