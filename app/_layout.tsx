import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useEntitlement } from '@/features/entitlements';
import { useNotificationsStore } from '@/features/notifications';
import { configureNotifications } from '@/features/notifications/notifications';
import { useThemePreferenceStore } from '@/features/preferences';
import { useProfileStore } from '@/features/profile/store';
import { runStartupMigration } from '@/features/profile/startup';
import { useTheme } from '@/ui/theme';
import { useRitualStore } from '@/features/remedies/ritualStore';

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
  const hydrateRituals = useRitualStore((s) => s.hydrate);
  const ritualsHydrated = useRitualStore((s) => s.hydrated);

  // Tracks the profile the Ritual Store was last hydrated for, so the
  // profile-change effect below can tell a genuine subsequent profile
  // change apart from merely observing `ritualsHydrated` flip to `true`
  // right after the initial hydrate() call seeds this ref.
  const lastHydratedProfileRef = useRef(profile);

  // Load persisted state on launch
  useEffect(() => {
    configureNotifications();
    // Stage 4: runs the legacy-to-registry migration once per app process.
    // Fired alongside (not before) profile hydration below - it writes only
    // to `profiles.all`/`profiles.activeId`, never `profile.current`, so it
    // has nothing to block or race against here. `profile.current` stays
    // authoritative for routing/Remedies this session; see startup.ts.
    // The failure itself is already logged (without any profile data) inside
    // `runStartupMigration()` - this `.catch()` exists only so a rejection
    // here can never surface as an unhandled promise rejection at startup.
    void runStartupMigration().catch(() => {});
    void (async () => {
      await hydrateProfile();
      const currentProfile = useProfileStore.getState().profile;
      lastHydratedProfileRef.current = currentProfile;

      await Promise.all([
        hydrateNotifications(currentProfile),
        hydrateEntitlement(),
        hydrateThemePreference(),
        hydrateRituals(currentProfile),
      ]);
    })();
  }, [hydrateProfile, hydrateNotifications, hydrateEntitlement, hydrateThemePreference, hydrateRituals]);

  // Re-schedule whenever profile changes
  useEffect(() => {
    if (notificationsHydrated) {
      void syncNotifications(profile);
    }
  }, [profile, notificationsHydrated, syncNotifications]);

  // Re-check which profile owns the Remedies ritual journey on a genuine
  // subsequent profile change (e.g. after saving edited/new profile details) -
  // mirrors the notifications resync effect above. `hydrate()` itself already
  // decides preserve-vs-reset by comparing the stored profileId. Compared
  // against `lastHydratedProfileRef` (seeded by the initial hydrate above)
  // rather than firing on every change to `ritualsHydrated`, so this does
  // not immediately re-run the instant the initial hydrate() completes and
  // sets `hydrated: true` - only an actual profile change triggers it.
  useEffect(() => {
    if (ritualsHydrated && profile !== lastHydratedProfileRef.current) {
      lastHydratedProfileRef.current = profile;
      void hydrateRituals(profile);
    }
  }, [profile, ritualsHydrated, hydrateRituals]);

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
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/disclaimer" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/details" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/blueprint-result" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/loshu-reveal" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/swot-audit" options={{ headerShown: false }} />

        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Settings' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', title: 'AstroMatrix Plus' }} />
        <Stack.Screen name="profile/switch" options={{ presentation: 'modal', title: 'Your Profiles' }} />
        <Stack.Screen name="profile/create" options={{ presentation: 'modal', title: 'Create Profile' }} />
        <Stack.Screen name="explore/birth-chart" options={{ presentation: 'modal', title: 'Birth Chart Report' }} />
      </Stack>
    </SafeAreaProvider>
  );
}