import { Redirect, Stack } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { buildNumerologyReport } from '@/core/numerology';
import { RemedyGate } from '@/features/entitlements';
import { alignmentForLifePath } from '@/data/remedies';
import { useProfileStore } from '@/features/profile/store';
import { Card, NumberBadge, Screen, SectionHeader, Txt } from '@/ui/components';
import { spacing } from '@/ui/theme';

export default function LifePathRemedy() {
  const profile = useProfileStore((s) => s.profile);
  const alignment = useMemo(
    () => (profile ? alignmentForLifePath(buildNumerologyReport(profile).lifePath) : null),
    [profile],
  );

  if (!profile || !alignment) {
    return <Redirect href="/" />;
  }

  return (
    <RemedyGate>
      <Stack.Screen options={{ title: `Life Path ${alignment.lifePath}` }} />
      <Screen>
        <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
          <NumberBadge value={alignment.lifePath} size="lg" />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="title">Life Path {alignment.lifePath}</Txt>
            <Txt variant="caption" color="textMuted">
              Staying aligned with your main path
            </Txt>
          </View>
        </View>

        <Card>
          <Txt variant="label" color="textMuted">
            YOUR STRENGTH
          </Txt>
          <Txt variant="body">{alignment.strength}</Txt>
        </Card>

        <Card>
          <Txt variant="label" color="textMuted">
            WHEN IT IS OUT OF BALANCE
          </Txt>
          <Txt variant="body" color="textMuted">
            {alignment.imbalance}
          </Txt>
        </Card>

        <SectionHeader title="Alignment practices" />
        {alignment.alignment.map((item) => (
          <Card key={item.title}>
            <Txt variant="heading">{item.title}</Txt>
            <Txt variant="body" color="textMuted">
              {item.detail}
            </Txt>
          </Card>
        ))}
      </Screen>
    </RemedyGate>
  );
}
