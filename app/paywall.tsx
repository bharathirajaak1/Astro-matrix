import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useEntitlement } from '@/features/entitlements';
import { track } from '@/lib/analytics';
import { Button, Card, Screen, Txt } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

const BENEFITS = [
  'A remedy set for every number missing from your Lo Shu grid',
  'Your Life Path alignment - working with the shadow side of your path',
  'Concrete daily practices, colours, and affirmations',
  'One-time unlock, yours on this device forever',
];

export default function Paywall() {
  const theme = useTheme();
  const router = useRouter();
  const unlock = useEntitlement((s) => s.unlock);
  const restore = useEntitlement((s) => s.restore);

  const [busy, setBusy] = useState<null | 'unlock' | 'restore'>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    track('remedy_paywall_view');
  }, []);

  async function onUnlock() {
    setBusy('unlock');
    setNote(null);
    try {
      const ok = await unlock();
      if (ok) {
        router.back();
      } else {
        setNote('That didn’t go through. Please try again.');
      }
    } finally {
      setBusy(null);
    }
  }

  async function onRestore() {
    setBusy('restore');
    setNote(null);
    try {
      const found = await restore();
      if (found) {
        router.back();
      } else {
        setNote('No previous purchase found on this device.');
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primarySoft,
          }}
        >
          <FontAwesome name="star" size={26} color={theme.colors.primary} />
        </View>
        <Txt variant="title" center>
          AstroMatrix Plus
        </Txt>
        <Txt variant="body" color="textMuted" center>
          Unlock every remedy for your chart.
        </Txt>
      </View>

      <Card>
        <View style={{ gap: spacing.md }}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={{ flexDirection: 'row', gap: spacing.md }}>
              <FontAwesome name="check" size={16} color={theme.colors.primary} style={{ marginTop: 2 }} />
              <Txt variant="body" style={{ flex: 1 }}>
                {benefit}
              </Txt>
            </View>
          ))}
        </View>
      </Card>

      <Txt variant="caption" color="textMuted" center>
        One-time purchase · $4.99
      </Txt>

      {note ? (
        <Txt variant="caption" color="danger" center>
          {note}
        </Txt>
      ) : null}

      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <Button
          label="Unlock remedies"
          onPress={onUnlock}
          loading={busy === 'unlock'}
          disabled={busy !== null}
        />
        <Button
          label="Restore purchase"
          variant="ghost"
          onPress={onRestore}
          loading={busy === 'restore'}
          disabled={busy !== null}
        />
      </View>

      <Txt variant="caption" color="textMuted" center>
        Nothing about your chart leaves this device.
      </Txt>
    </Screen>
  );
}
