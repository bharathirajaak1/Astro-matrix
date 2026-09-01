import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, Switch, View } from 'react-native';

import { useEntitlement } from '@/features/entitlements';
import { REMINDER_HOUR, REMINDER_MINUTE, useNotificationsStore } from '@/features/notifications';
import { useProfileStore } from '@/features/profile/store';
import { type ThemePreference, useThemePreferenceStore } from '@/features/preferences';
import { Button, Card, Screen, SectionHeader, SegmentedControl, Txt } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

const isDev = (globalThis as { __DEV__?: boolean }).__DEV__ ?? false;

function reminderTimeLabel(): string {
  const h12 = ((REMINDER_HOUR + 11) % 12) + 1;
  const suffix = REMINDER_HOUR < 12 ? 'am' : 'pm';
  return `${h12}:${String(REMINDER_MINUTE).padStart(2, '0')} ${suffix}`;
}

export default function Settings() {
  const theme = useTheme();
  const router = useRouter();

  const profile = useProfileStore((s) => s.profile);
  const enabled = useNotificationsStore((s) => s.enabled);
  const permission = useNotificationsStore((s) => s.permission);
  const setEnabled = useNotificationsStore((s) => s.setEnabled);

  const remediesUnlocked = useEntitlement((s) => s.remediesUnlocked);
  const resetEntitlement = useEntitlement((s) => s.reset);

  const themePreference = useThemePreferenceStore((s) => s.preference);
  const setThemePreference = useThemePreferenceStore((s) => s.setPreference);

  const [busy, setBusy] = useState(false);
  const blocked = permission === 'denied';

  async function onToggle(next: boolean) {
    setBusy(true);
    try {
      await setEnabled(next, profile);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <SectionHeader title="Appearance" />
      <Card>
        <SegmentedControl<ThemePreference>
          value={themePreference}
          onChange={(next) => void setThemePreference(next)}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Card>

      <SectionHeader title="Daily forecast reminder" />
      <Card>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="heading">Remind me every day</Txt>
            <Txt variant="caption" color="textMuted">
              A local notification at {reminderTimeLabel()} with your forecast for the day.
            </Txt>
          </View>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            disabled={busy || blocked}
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
            accessibilityLabel="Daily forecast reminder"
            accessibilityHint={`Sends a notification at ${reminderTimeLabel()} every day`}
          />
        </View>

        {blocked ? (
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            <Txt variant="caption" color="danger">
              Notifications are turned off for AstroMatrix. Enable them in your device settings, then
              turn this on again.
            </Txt>
            <Pressable
              onPress={() => void Linking.openSettings()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open device settings"
              style={{ alignSelf: 'flex-start', paddingVertical: spacing.xs }}
            >
              <Txt variant="caption" color="primary">
                Open device settings
              </Txt>
            </Pressable>
          </View>
        ) : null}
      </Card>

      <SectionHeader title="AstroMatrix Plus" />
      <Card>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="heading">Remedies</Txt>
            <Txt variant="caption" color={remediesUnlocked ? 'primary' : 'textMuted'}>
              {remediesUnlocked ? 'Unlocked on this device' : 'Locked'}
            </Txt>
          </View>
          {!remediesUnlocked ? (
            <FontAwesome name="chevron-right" size={14} color={theme.colors.textMuted} />
          ) : null}
        </View>
        {!remediesUnlocked ? (
          <View style={{ marginTop: spacing.sm }}>
            <Button label="See what's included" variant="secondary" onPress={() => router.push('/paywall')} />
          </View>
        ) : null}
        {isDev && remediesUnlocked ? (
          <View style={{ marginTop: spacing.sm }}>
            <Button label="Reset unlock (dev)" variant="ghost" onPress={() => void resetEntitlement()} />
          </View>
        ) : null}
      </Card>

      <SectionHeader title="Profile" />
      <Card onPress={() => router.push('/profile/edit')}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ gap: 2, flex: 1 }}>
            <Txt variant="heading">Birth details</Txt>
            <Txt variant="caption" color="textMuted">
              {profile ? `${profile.fullName} · ${profile.dob}` : 'Not set'}
            </Txt>
          </View>
          <FontAwesome name="chevron-right" size={14} color={theme.colors.textMuted} />
        </View>
      </Card>

      <Txt variant="caption" color="textMuted" style={{ marginTop: spacing.sm }}>
        Reminders are scheduled on this device only. Nothing about your profile leaves the phone.
      </Txt>
    </Screen>
  );
}
