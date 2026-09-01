import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import type { Digit } from '@/core/types';
import { RemedyGate } from '@/features/entitlements';
import { remedyForMissingNumber } from '@/data/remedies';
import { Card, NumberBadge, Screen, SectionHeader, Txt } from '@/ui/components';
import { radius, spacing, useTheme } from '@/ui/theme';

function isDigit(n: number): n is Digit {
  return Number.isInteger(n) && n >= 1 && n <= 9;
}

export default function MissingNumberRemedy() {
  const theme = useTheme();
  const { number } = useLocalSearchParams<{ number: string }>();
  const parsed = Number(number);

  if (!isDigit(parsed)) {
    return <Redirect href="/(tabs)/remedies" />;
  }

  const remedy = remedyForMissingNumber(parsed);

  return (
    <RemedyGate>
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
      </Screen>
    </RemedyGate>
  );
}
