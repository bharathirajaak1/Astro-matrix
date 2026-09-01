import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Switch, View } from 'react-native';

import { REMINDER_HOUR, REMINDER_MINUTE, useNotificationsStore } from '@/features/notifications';
import { useProfileStore } from '@/features/profile/store';
import { Card, Screen, SectionHeader, Txt } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

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
          />
        </View>

        {blocked ? (
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            <Txt variant="caption" color="danger">
              Notifications are turned off for AstroMatrix. Enable them in your device settings, then
              turn this on again.
            </Txt>
            <Txt variant="caption" color="primary" onPress={() => void Linking.openSettings()}>
              Open device settings
            </Txt>
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
