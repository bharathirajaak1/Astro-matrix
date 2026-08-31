import { FontAwesome } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { buildLoShuGrid, LO_SHU_LAYOUT } from '@/core/loShu';
import type { LoShuPlanes } from '@/core/types';
import { PLANE_MEANING } from '@/data/interpretations';
import { useProfileStore } from '@/features/profile/store';
import { Card, Chip, GridCell, Screen, SectionHeader, Txt } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

const PLANE_KEYS: (keyof LoShuPlanes)[] = [
  'mind',
  'soul',
  'practical',
  'thought',
  'will',
  'action',
];

export default function GridScreen() {
  const theme = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const grid = useMemo(
    () => (profile ? buildLoShuGrid(profile.dob) : null),
    [profile],
  );

  if (!profile || !grid) {
    return <Redirect href="/" />;
  }

  return (
    <Screen>
      <Txt variant="caption" color="textMuted">
        Built from the digits of {profile.dob} (zeros are not placed).
      </Txt>

      <Card>
        <View style={{ gap: spacing.sm }}>
          {LO_SHU_LAYOUT.map((row, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: 'row', gap: spacing.sm }}>
              {row.map((digit) => (
                <GridCell key={digit} digit={digit} count={grid.counts[digit]} />
              ))}
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Missing numbers" subtitle="Absent from the grid" />
      {grid.missing.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {grid.missing.map((n) => (
            <Chip key={n} label={String(n)} tone="accent" accessibilityLabel={`Number ${n} missing`} />
          ))}
        </View>
      ) : (
        <Txt variant="body" color="textMuted">
          None - every number 1 to 9 is present.
        </Txt>
      )}

      <SectionHeader title="Repeated numbers" subtitle="Appear two or more times" />
      {grid.repeated.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {grid.repeated.map((n) => (
            <Chip
              key={n}
              label={`${n} ×${grid.counts[n]}`}
              tone="primary"
              accessibilityLabel={`Number ${n} appears ${grid.counts[n]} times`}
            />
          ))}
        </View>
      ) : (
        <Txt variant="body" color="textMuted">
          None repeat.
        </Txt>
      )}

      <SectionHeader title="Planes" subtitle="A plane is complete when all three of its cells are filled" />
      <Card>
        <View style={{ gap: spacing.md }}>
          {PLANE_KEYS.map((key) => {
            const complete = grid.planes[key];
            return (
              <View key={key} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <FontAwesome
                  name={complete ? 'check-circle' : 'circle-o'}
                  size={18}
                  color={complete ? theme.colors.primary : theme.colors.textMuted}
                />
                <Txt variant="caption" color={complete ? 'text' : 'textMuted'} style={{ flex: 1 }}>
                  {PLANE_MEANING[key]}
                </Txt>
              </View>
            );
          })}
        </View>
      </Card>

      {grid.planes.goldenYogas.length > 0 ? (
        <>
          <SectionHeader title="Golden yogas" subtitle="Lines that are fully present" />
          {grid.planes.goldenYogas.map((name) => (
            <Txt key={name} variant="body">
              • {name}
            </Txt>
          ))}
        </>
      ) : null}

      {grid.planes.silverYogas.length > 0 ? (
        <>
          <SectionHeader title="Silver yogas" subtitle="Lines that are fully absent" />
          {grid.planes.silverYogas.map((name) => (
            <Txt key={name} variant="body" color="textMuted">
              • {name}
            </Txt>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
