import { useMemo, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';

import { buildLoShuGrid } from '@/core/loShu';
import { buildNumerologyReport } from '@/core/numerology';
import { generateNumbersSummary, generateLoShuSummary } from '@/core/summaryGenerator';
import type { NumerologyReport } from '@/core/types';
import { CORE_NUMBERS, meaningFor } from '@/data/interpretations';
import { useProfileStore } from '@/features/profile/store';
import { Card, NumberBadge, Screen, SectionHeader, Txt } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

/**
 * Dashboard foundation: a persistent Blueprint screen consolidating the
 * existing Numbers (core numerology) and Lo Shu (sacred matrix) detail views
 * under one destination. Reads only the canonical engines already used by
 * numerology.tsx and grid.tsx - no new calculations, no re-tallying of DOB
 * digits, no new state. Not yet registered as a tab.
 */

type CoreKey = (typeof CORE_NUMBERS)[number]['key'];

function trailText(report: NumerologyReport, key: CoreKey): string {
  const r = report.reductions;
  if (key === 'lifePath') {
    return `${(r.lifePathParts ?? []).join(' + ')} = ${(r.lifePath ?? []).join(' -> ')}`;
  }
  if (key === 'birthday') {
    return 'Taken directly from the day of the month, without reducing.';
  }
  const chain = r[key] ?? [];
  return chain.length > 1
    ? chain.join(' -> ')
    : `${chain[0] ?? ''} is already a single digit.`;
}

const GRID_ROWS: readonly (readonly number[])[] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

interface PlaneInfo {
  friendlyName: string;
  subtitle: string;
  description: string;
  icon: string;
  numbers: readonly number[];
}

const PLANES: readonly PlaneInfo[] = [
  {
    friendlyName: 'Mind & Logic',
    subtitle: 'Intellect & memory',
    description: 'Your analytical thinking, memory, and cognitive agility.',
    icon: '🧠',
    numbers: [4, 9, 2],
  },
  {
    friendlyName: 'Heart & Intuition',
    subtitle: 'Empathy & feelings',
    description: 'Your empathy, spiritual attunement, feelings, and emotional resilience.',
    icon: '💖',
    numbers: [3, 5, 7],
  },
  {
    friendlyName: 'Action & Grounding',
    subtitle: 'Execution & discipline',
    description: 'Your physical endurance, discipline, material mastery, and everyday habits.',
    icon: '🌱',
    numbers: [8, 1, 6],
  },
  {
    friendlyName: 'Vision & Planning',
    subtitle: 'Conception & strategy',
    description: 'Your ability to conceive, plan, and structure ideas.',
    icon: '🔭',
    numbers: [4, 3, 8],
  },
  {
    friendlyName: 'Drive & Persistence',
    subtitle: 'Focus & resolve',
    description: 'Your inner persistence, focus, and grit to complete objectives.',
    icon: '⚡',
    numbers: [9, 5, 1],
  },
  {
    friendlyName: 'Manifestation',
    subtitle: 'Decisive movement',
    description: 'Your physical realization, decisive movement, and tangible execution.',
    icon: '🏃',
    numbers: [2, 7, 6],
  },
];

export default function BlueprintScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);

  const report = useMemo(
    () => (profile ? buildNumerologyReport(profile) : null),
    [profile],
  );
  const loShu = useMemo(
    () => (profile ? buildLoShuGrid(profile.dob) : null),
    [profile],
  );

  const [openKey, setOpenKey] = useState<CoreKey | null>(null);

  if (!profile || !report || !loShu) {
    return <Redirect href="/" />;
  }

  const counts: Record<number, number> = loShu.counts;

  const numbersSummary = generateNumbersSummary(
    report.lifePath ?? 1,
    report.soulUrge ?? report.destiny ?? 1,
    report.soulUrge ? 'Soul Urge' : 'Destiny',
  );
  const loShuSummary = generateLoShuSummary(profile.dob);

  return (
    <Screen>
      <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
        <Txt variant="title">{profile.fullName}</Txt>
        <Txt variant="caption" color="textMuted">
          Born {profile.dob} • {profile.system === 'chaldean' ? 'Chaldean' : 'Pythagorean'} system
        </Txt>
      </View>

      <Txt variant="body" color="textMuted">
        {numbersSummary}
      </Txt>

      <SectionHeader title="Core Numbers" subtitle="Your blueprint, in detail" />
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

      <SectionHeader title="Sacred Matrix" subtitle="Your Lo Shu grid" />
      <Card>
        <View style={{ gap: spacing.sm }}>
          {GRID_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: 'row', gap: spacing.sm }}>
              {row.map((digit) => {
                const count = counts[digit] || 0;
                const isMissing = count === 0;
                return (
                  <View
                    key={digit}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: 12,
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isMissing ? theme.colors.gridEmpty : theme.colors.gridFilled,
                      borderColor: isMissing ? theme.colors.border : theme.colors.primary,
                    }}
                  >
                    <Txt variant="heading" color={isMissing ? 'textMuted' : 'primary'}>
                      {digit}
                    </Txt>
                    <Txt variant="caption" color={isMissing ? 'textMuted' : 'primary'}>
                      {isMissing ? 'Missing' : `${count}x`}
                    </Txt>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </Card>

      <Txt variant="body" color="textMuted">
        {loShuSummary}
      </Txt>

      <SectionHeader title="Planes of Expression" subtitle="Where your energy flows" />
      {PLANES.map((plane) => {
        const activeCount = plane.numbers.filter((num) => (counts[num] || 0) > 0).length;
        const total = plane.numbers.length;
        const statusText =
          activeCount === 0
            ? '🌱 Awakening'
            : activeCount === total
              ? '✨ Harmonized'
              : `🌿 ${activeCount}/${total} Active`;
        return (
          <Card key={plane.friendlyName}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Txt variant="heading">{plane.icon}</Txt>
                <View>
                  <Txt variant="heading">{plane.friendlyName}</Txt>
                  <Txt variant="caption" color="textMuted">
                    {plane.subtitle}
                  </Txt>
                </View>
              </View>
              <Txt variant="caption" color="textMuted">
                {statusText}
              </Txt>
            </View>
            <Txt variant="caption" color="textMuted" style={{ marginTop: spacing.sm }}>
              {plane.description}
            </Txt>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.colors.surfaceAlt,
                overflow: 'hidden',
                marginTop: spacing.sm,
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${(activeCount / total) * 100}%`,
                  backgroundColor: activeCount === total ? theme.colors.primary : theme.colors.accent,
                }}
              />
            </View>
          </Card>
        );
      })}

      <SectionHeader title="Explore Further" subtitle="Dive deeper into your blueprint" />
      <Card onPress={() => router.push('/(tabs)/numerology')} accessibilityLabel="Open Numbers">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="heading">Numbers</Txt>
            <Txt variant="caption" color="textMuted">
              Full core numerology details
            </Txt>
          </View>
          <Txt variant="caption" color="primary">
            View →
          </Txt>
        </View>
      </Card>
      <Card onPress={() => router.push('/(tabs)/grid')} accessibilityLabel="Open Lo Shu grid">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="heading">Lo Shu / Sacred Matrix</Txt>
            <Txt variant="caption" color="textMuted">
              Full grid detail view
            </Txt>
          </View>
          <Txt variant="caption" color="primary">
            View →
          </Txt>
        </View>
      </Card>
      <Card
        onPress={() => router.push('/onboarding/swot-audit?context=blueprint')}
        accessibilityLabel="Open Personal SWOT"
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="heading">Personal SWOT</Txt>
            <Txt variant="caption" color="textMuted">
              Your energetic audit
            </Txt>
          </View>
          <Txt variant="caption" color="primary">
            View →
          </Txt>
        </View>
      </Card>
    </Screen>
  );
}
