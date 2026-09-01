import { FontAwesome } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { buildLoShuGrid } from '@/core/loShu';
import { buildNumerologyReport } from '@/core/numerology';
import { useEntitlement } from '@/features/entitlements';
import { useProfileStore } from '@/features/profile/store';
import { MISSING_NUMBER_REMEDIES } from '@/data/remedies';
import { Card, Chip, LockOverlay, NumberBadge, Screen, SectionHeader, Txt } from '@/ui/components';
import { radius, spacing, useTheme } from '@/ui/theme';

interface RemedyRowProps {
  value: number;
  title: string;
  subtitle: string;
  locked: boolean;
  onPress?: () => void;
}

function RemedyRow({ value, title, subtitle, locked, onPress }: RemedyRowProps) {
  const theme = useTheme();
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
        <NumberBadge value={value} size="sm" />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">{title}</Txt>
          {locked ? (
            <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
              {[0.9, 0.65].map((w, i) => (
                <View
                  key={i}
                  style={{
                    height: 9,
                    width: `${w * 100}%`,
                    borderRadius: radius.sm,
                    backgroundColor: theme.colors.border,
                  }}
                />
              ))}
            </View>
          ) : (
            <Txt variant="caption" color="textMuted">
              {subtitle}
            </Txt>
          )}
        </View>
        {!locked ? (
          <FontAwesome name="chevron-right" size={14} color={theme.colors.textMuted} />
        ) : null}
      </View>
    </Card>
  );
}

export default function RemediesScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const remediesUnlocked = useEntitlement((s) => s.remediesUnlocked);

  const data = useMemo(() => {
    if (!profile) return null;
    return {
      grid: buildLoShuGrid(profile.dob),
      report: buildNumerologyReport(profile),
    };
  }, [profile]);

  if (!profile || !data) {
    return <Redirect href="/" />;
  }

  const { grid, report } = data;
  const missing = grid.missing;
  const lifePath = report.lifePath;

  const list = (
    <View style={{ gap: spacing.md }}>
      {missing.length > 0 ? (
        missing.map((n) => (
          <RemedyRow
            key={n}
            value={n}
            title={MISSING_NUMBER_REMEDIES[n].theme}
            subtitle={`${MISSING_NUMBER_REMEDIES[n].remedies.length} practices · ${MISSING_NUMBER_REMEDIES[n].affirmation}`}
            locked={!remediesUnlocked}
            onPress={remediesUnlocked ? () => router.push(`/remedy/${n}`) : undefined}
          />
        ))
      ) : (
        <Card>
          <Txt variant="body" color="textMuted">
            Every number 1-9 is present in your grid, so there are no missing-number remedies. The
            Life Path alignment below still applies.
          </Txt>
        </Card>
      )}

      <RemedyRow
        value={lifePath}
        title={`Life Path ${lifePath} alignment`}
        subtitle="Balance the shadow side of your main path"
        locked={!remediesUnlocked}
        onPress={remediesUnlocked ? () => router.push('/remedy/life-path') : undefined}
      />
    </View>
  );

  return (
    <Screen>
      <Txt variant="body" color="textMuted">
        Remedies are simple daily practices to strengthen weak numbers and stay aligned with your
        Life Path.
      </Txt>

      <SectionHeader title="Your focus numbers" subtitle="From your Lo Shu grid and Life Path" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {missing.map((n) => (
          <Chip key={n} label={String(n)} tone="accent" accessibilityLabel={`Number ${n} missing`} />
        ))}
        <Chip label={`Life Path ${lifePath}`} tone="primary" />
      </View>

      <SectionHeader title="Remedies" />
      {remediesUnlocked ? (
        list
      ) : (
        <LockOverlay
          title="Unlock your remedies"
          message="Personalised practices for every missing number, plus your Life Path alignment."
          ctaLabel="See AstroMatrix Plus"
          onPressCta={() => router.push('/paywall')}
        >
          {list}
        </LockOverlay>
      )}
    </Screen>
  );
}
