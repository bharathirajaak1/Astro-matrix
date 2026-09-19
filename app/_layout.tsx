import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useEntitlement } from '@/features/entitlements';
import { useNotificationsStore } from '@/features/notifications';
import {
  configureNotifications,
  scheduleDailyNotifications,
} from '@/features/notifications/notifications';
import { useThemePreferenceStore } from '@/features/preferences';
import { useProfileStore } from '@/features/profile/store';
import { useTheme } from '@/ui/theme';
import { useRitualStore } from '@/features/remedies/ritualStore';
import { useAdStore } from '@/features/ads/adStore';

// Suppress Expo Go push notification warning on Android development
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

export default function RootLayout() {
  const theme = useTheme();

  const hydrateProfile = useProfileStore((s) => s.hydrate);
  const profile = useProfileStore((s) => s.profile);

  const hydrateNotifications = useNotificationsStore((s) => s.hydrate);
  const notificationsHydrated = useNotificationsStore((s) => s.hydrated);
  const syncNotifications = useNotificationsStore((s) => s.sync);

  const hydrateEntitlement = useEntitlement((s) => s.hydrate);
  const hydrateThemePreference = useThemePreferenceStore((s) => s.hydrate);
  const hydrateAds = useAdStore((s) => s.hydrate);

  // Load persisted state on launch
  useEffect(() => {
    configureNotifications();
    void (async () => {
      await hydrateProfile();
      const currentProfile = useProfileStore.getState().profile;
      void scheduleDailyNotifications(currentProfile?.fullName);

      await Promise.all([
        hydrateNotifications(currentProfile),
        hydrateEntitlement(),
        hydrateThemePreference(),
        hydrateAds(),
      ]);
    })();
  }, [hydrateProfile, hydrateNotifications, hydrateEntitlement, hydrateThemePreference, hydrateAds]);

  // Re-schedule whenever profile changes
  useEffect(() => {
    if (notificationsHydrated) {
      void syncNotifications(profile);
    }
  }, [profile, notificationsHydrated, syncNotifications]);

  // Re-schedule on app foreground
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
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/disclaimer" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/system-choice" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/details" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/blueprint-result" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/loshu-reveal" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/swot-audit" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/swot" options={{ headerShown: false }} />
        
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Settings' }} />
        <Stack.Screen
          name="profile/edit"
          options={{ presentation: 'modal', title: 'Your details' }}
        />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', title: 'AstroMatrix Plus' }} />
        <Stack.Screen name="remedy/[number]" options={{ title: 'Remedy' }} />
        <Stack.Screen name="remedy/life-path" options={{ title: 'Life Path alignment' }} />
      </Stack>
    </SafeAreaProvider>
  );
}