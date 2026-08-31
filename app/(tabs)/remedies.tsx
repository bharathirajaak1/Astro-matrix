import { Redirect } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { buildLoShuGrid } from '@/core/loShu';
import { useProfileStore } from '@/features/profile/store';
import { Card, LockOverlay, Screen, SectionHeader, Txt } from '@/ui/components';
import { radius, spacing, useTheme } from '@/ui/theme';

/**
 * Milestone 2 stub. The Remedies feature is intentionally locked; the real
 * entitlement check + paywall + remedy content land in Milestone 4. The free
 * teaser (which numbers are weak) stays visible; the remedy text is blurred.
 */
export default function RemediesScreen() {
  const theme = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const grid = useMemo(
    () => (profile ? buildLoShuGrid(profile.dob) : null),
    [profile],
  );

  if (!profile || !grid) {
    return <Redirect href="/" />;
  }

  const weak = grid.missing;

  return (
    <Screen>
      <Txt variant="body" color="textMuted">
        Remedies suggest simple practices to strengthen the numbers your Lo Shu grid is missing.
      </Txt>

      <SectionHeader title="Your grid is missing" subtitle="These are the numbers a remedy would target" />
      {weak.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {weak.map((n) => (
            <View
              key={n}
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.accentSoft,
              }}
            >
              <Txt variant="heading" color="accent">
                {n}
              </Txt>
            </View>
          ))}
        </View>
      ) : (
        <Txt variant="body" color="textMuted">
          Nothing is missing - every number 1 to 9 is present in your grid.
        </Txt>
      )}

      <SectionHeader title="Remedies" />
      <LockOverlay>
        <View style={{ gap: spacing.md }}>
          {(weak.length > 0 ? weak : [1, 2, 3]).map((n) => (
            <Card key={n} alt>
              <Txt variant="heading">Number {n}</Txt>
              <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
                {[0.9, 0.7, 0.5].map((w, i) => (
                  <View
                    key={i}
                    style={{
                      height: 10,
                      width: `${w * 100}%`,
                      borderRadius: radius.sm,
                      backgroundColor: theme.colors.border,
                    }}
                  />
                ))}
              </View>
            </Card>
          ))}
        </View>
      </LockOverlay>
    </Screen>
  );
}
