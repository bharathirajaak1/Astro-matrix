import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { buildNumerologyReport } from '@/core/numerology';
import type { NumerologyReport } from '@/core/types';
import { CORE_NUMBERS, meaningFor } from '@/data/interpretations';
import { useProfileStore } from '@/features/profile/store';
import { Card, NumberBadge, Screen, Txt } from '@/ui/components';
import { spacing } from '@/ui/theme';

type CoreKey = (typeof CORE_NUMBERS)[number]['key'];

function trailText(report: NumerologyReport, key: CoreKey): string {
  const r = report.reductions;
  if (key === 'lifePath') {
    return `${(r.lifePathParts ?? []).join('  +  ')}  =  ${(r.lifePath ?? []).join('  →  ')}`;
  }
  if (key === 'birthday') {
    return 'Taken directly from the day of the month, without reducing.';
  }
  const chain = r[key] ?? [];
  return chain.length > 1
    ? chain.join('  →  ')
    : `${chain[0] ?? ''} is already a single digit.`;
}

export default function NumerologyScreen() {
  const profile = useProfileStore((s) => s.profile);
  const report = useMemo(
    () => (profile ? buildNumerologyReport(profile) : null),
    [profile],
  );
  const [openKey, setOpenKey] = useState<CoreKey | null>('lifePath');

  if (!profile || !report) {
    return <Redirect href="/" />;
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Txt variant="title">{profile.fullName}</Txt>
        <Txt variant="caption" color="textMuted">
          Born {profile.dob} · {profile.system === 'chaldean' ? 'Chaldean' : 'Pythagorean'} system
        </Txt>
      </View>

      {CORE_NUMBERS.map(({ key, title, blurb }) => {
        const value = report[key];
        const open = openKey === key;
        return (
          <Card
            key={key}
            onPress={() => setOpenKey(open ? null : key)}
            accessibilityLabel={`${title}, ${value}`}
            accessibilityState={{ expanded: open }}
            accessibilityHint={open ? 'Double tap to collapse' : 'Double tap to expand'}
          >
            <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
              <NumberBadge value={value} label={`${title} number ${value}`} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="heading">{title}</Txt>
                <Txt variant="caption" color="textMuted">
                  {blurb}
                </Txt>
              </View>
            </View>

            {open ? (
              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                <Txt variant="body">{meaningFor(value)}</Txt>
                <View style={{ gap: 2 }}>
                  <Txt variant="label" color="textMuted">
                    HOW IT IS CALCULATED
                  </Txt>
                  <Txt variant="caption" color="textMuted">
                    {trailText(report, key)}
                  </Txt>
                </View>
              </View>
            ) : (
              <Txt variant="caption" color="primary">
                Tap to expand
              </Txt>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
