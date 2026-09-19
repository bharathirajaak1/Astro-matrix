import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { Digit } from '@/core/types';
import { useEntitlement } from '@/features/entitlements';
import { useAdStore, DAILY_AD_CAP } from '@/features/ads/adStore';
import { showRewardedAdForRemedy } from '@/features/ads/adService';
import { remedyForMissingNumber } from '@/data/remedies';
import { Card, NumberBadge, Screen, SectionHeader, Txt, Button } from '@/ui/components';
import { radius, spacing, useTheme } from '@/ui/theme';
import { getSoundFrequencyForNumber } from '@/features/remedies/soundTherapy';
import { FrequencyPlayer } from '@/ui/components/FrequencyPlayer';

function isDigit(n: number): n is Digit {
  return Number.isInteger(n) && n >= 1 && n <= 9;
}

export default function MissingNumberRemedy() {
  const theme = useTheme();
  const router = useRouter();
  const { number } = useLocalSearchParams<{ number: string }>();
  const parsed = Number(number);

  const isSubscribed = useEntitlement((s: any) => s.isUnlocked ?? s.unlocked ?? s.hasFullAccess ?? false);
  const isRemedyUnlockedByAd = useAdStore((s) => s.isRemedyUnlockedByAd);
  const dailyWatchCount = useAdStore((s) => s.dailyWatchCount);
  const canWatchAd = useAdStore((s) => s.canWatchAd);

  if (!isDigit(parsed)) {
    return <Redirect href="/(tabs)/remedies" />;
  }

  const remedyKey = `missing_${parsed}`;
  const isUnlocked = isSubscribed || isRemedyUnlockedByAd(remedyKey);
  const adsRemaining = Math.max(0, DAILY_AD_CAP - dailyWatchCount);

  const remedy = remedyForMissingNumber(parsed);
  const soundFrequency = getSoundFrequencyForNumber(parsed);
  const handleWatchAd = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await showRewardedAdForRemedy(remedyKey, () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: `Number ${remedy.number}` }} />
      <Screen>
        <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
          <NumberBadge value={remedy.number} size="lg" />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="title">{remedy.theme}</Txt>
            <Txt variant="caption" color="textMuted">
              Missing from your Lo Shu grid
            </Txt>
          </View>
        </View>

        <Txt variant="body">{remedy.meaning}</Txt>

        {!isUnlocked ? (
          /* Rewarded Ad / Paywall Gate Card */
          <Card style={styles.gateCard}>
            <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }}>
              <View
                style={[
                  styles.lockCircle,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <FontAwesome name="lock" size={24} color={theme.colors.primary} />
              </View>

              <Txt variant="heading" center>
                Unlock Number {remedy.number} Remedies
              </Txt>

              <Txt variant="body" color="textMuted" center>
                Watch a short video to unlock this remedy set today, or get instant unlimited access with AstroMatrix Plus.
              </Txt>

              <View style={{ width: '100%', gap: spacing.sm, marginTop: spacing.sm }}>
                <Button
                  label={
                    canWatchAd()
                      ? `Watch Ad to Unlock (${adsRemaining}/${DAILY_AD_CAP} left today)`
                      : 'Daily Ad Limit Reached (2/2)'
                  }
                  onPress={handleWatchAd}
                  disabled={!canWatchAd()}
                />

                <Button
                  label="Unlock All Forever ($4.99)"
                  variant="ghost"
                  onPress={() => router.push('/paywall')}
                />
              </View>
            </View>
          </Card>
        ) : (
          /* Unlocked Content */
          <>
            <Card>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: radius.pill,
                    backgroundColor: remedy.focusColor,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Txt variant="label" color="textMuted">
                    SUPPORTIVE COLOUR
                  </Txt>
                  <Txt variant="body">Bring this colour into your day.</Txt>
                </View>
              </View>
            </Card>
            {/* Frequency & Sound Alignment Player */}
            <FrequencyPlayer sound={soundFrequency} />

            <SectionHeader title="Practices" subtitle="Pick one and keep it for a month" />
            <SectionHeader title="Practices" subtitle="Pick one and keep it for a month" />
            {remedy.remedies.map((item) => (
              <Card key={item.title}>
                <Txt variant="heading">{item.title}</Txt>
                <Txt variant="body" color="textMuted">
                  {item.detail}
                </Txt>
              </Card>
            ))}

            <Card alt>
              <Txt variant="label" color="textMuted">
                AFFIRMATION
              </Txt>
              <Txt variant="body" style={{ fontStyle: 'italic' }}>
                “{remedy.affirmation}”
              </Txt>
            </Card>
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  gateCard: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: '#E7E5E4',
  },
  lockCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});