import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

import { useEntitlement } from '@/features/entitlements';
import { useProfileStore } from '@/features/profile/store';
import { track } from '@/lib/analytics';
import { Button, Card, Screen, Txt } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

export default function Paywall() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const updateFlags = useProfileStore((s) => s.updateFlags);
  const unlock = useEntitlement((s) => s.unlock);
  const restore = useEntitlement((s) => s.restore);

  const [busy, setBusy] = useState<null | 'unlock' | 'restore'>(null);
  const [note, setNote] = useState<string | null>(null);

  // Derive missing numbers from user birthdate
  const digits = (profile?.dob || '').replace(/\D/g, '').split('').map(Number);
  const missingNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !digits.includes(n));
  const missingLabel = missingNumbers.length > 0 ? missingNumbers.join(', ') : null;

  const dynamicTitle = missingLabel
    ? `Unlock Remedies for Missing ${missingLabel}`
    : 'Harmonize Your Full Energetic Chart';

  const BENEFITS = [
    missingLabel
      ? `Full remedy sets specifically balancing your missing numbers (${missingLabel})`
      : 'Comprehensive remedy sets for every unrepresented grid position',
    'Sound & Frequency Therapy (528Hz heart alignment & 432Hz grounding anchors)',
    'Tailored micro-rituals, color frequencies, and environmental Feng Shui alignments',
    'Full Life Path alignment and shadow-plane harmonizers',
    '100% Ad-free uninterrupted experience',
  ];

  useEffect(() => {
    track('remedy_paywall_view');
  }, []);

  const handleFinish = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/numerology');
    }
  };

  async function onUnlock() {
    setBusy('unlock');
    setNote(null);
    try {
      const ok = await unlock();
      if (ok) {
        updateFlags({ hasSubscribed: true });
        handleFinish();
      } else {
        setNote('That didn’t go through. Please try again.');
      }
    } catch {
      setNote('Something unexpected happened. Please try again.');
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
        updateFlags({ hasSubscribed: true });
        handleFinish();
      } else {
        setNote('No previous purchase found on this device.');
      }
    } finally {
      setBusy(null);
    }
  }

  const onDismiss = () => {
    handleFinish();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: theme.colors.primarySoft },
          ]}
        >
          <FontAwesome name="star" size={26} color={theme.colors.primary} />
        </View>
        <Txt variant="title" center>
          AstroMatrix Plus
        </Txt>
        <Txt variant="body" color="textMuted" center>
          {dynamicTitle}
        </Txt>
      </View>

      <Card>
        <View style={{ gap: spacing.md }}>
          {BENEFITS.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <FontAwesome
                name="check"
                size={16}
                color={theme.colors.primary}
                style={{ marginTop: 2 }}
              />
              <Txt variant="body" style={{ flex: 1 }}>
                {benefit}
              </Txt>
            </View>
          ))}
        </View>
      </Card>

      <Txt variant="caption" color="textMuted" center>
        Cancel anytime. Keep your daily forecast free forever.
      </Txt>

      {note ? (
        <Txt variant="caption" color="danger" center>
          {note}
        </Txt>
      ) : null}

      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <Button
          label="Start My 7-Day Free Trial"
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

        {/* Dismissible link */}
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Txt variant="caption" color="textMuted" style={styles.dismissText}>
            Continue with free version
          </Txt>
        </TouchableOpacity>
      </View>

      <Txt variant="caption" color="textMuted" center>
        Nothing about your chart leaves this device.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dismissText: {
    textDecorationLine: 'underline',
  },
});