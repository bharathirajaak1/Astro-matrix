import { useMemo, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';

import { buildLoShuGrid, LO_SHU_LAYOUT } from '@/core/loShu';
import { buildNumerologyReport } from '@/core/numerology';
import { generateNumbersSummary, generateLoShuSummary } from '@/core/summaryGenerator';
import {
  getAllExpressionPlanePresence,
  type ExpressionPlaneId,
  type ExpressionPlanePresence,
} from '@/core/expressionPlanes';
import type { NumerologyReport } from '@/core/types';
import { CORE_NUMBERS } from '@/data/interpretations';
import { getCoreNumberInterpretation, getCoreNumberSummary, type CoreNumberKey } from '@/data/coreNumberContent';
import { useProfileStore } from '@/features/profile/store';
import { Card, NumberBadge, Screen, SectionHeader, Txt } from '@/ui/components';
import { radius, spacing, useTheme } from '@/ui/theme';

/**
 * Dashboard foundation: a persistent Blueprint screen consolidating the
 * existing Numbers (core numerology) and Lo Shu (sacred matrix) detail views
 * under one destination. Reads only the canonical engines already used by
 * numerology.tsx and grid.tsx - no new calculations, no re-tallying of DOB
 * digits, no new state. Not yet registered as a tab.
 */

type CoreKey = CoreNumberKey;

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

/** The shared heading treatment for every Core Number interpretation
 *  section - noticeably stronger than the surrounding body/caption text
 *  (heavier weight, wider letter-spacing, the existing `primary` accent
 *  already used elsewhere on this screen for emphasis, e.g. `NumberBadge`'s
 *  digit colour) while staying smaller than the card's own `heading`-sized
 *  title, so it reads as clearly subordinate to it. A thin top border (the
 *  existing `border` token, nothing new) separates this section from the
 *  one before it - every section after the first carries one, so a long
 *  expanded card still reads as a sequence of distinct sections rather
 *  than one block of text. */
function SectionDivider({ first }: { first?: boolean }) {
  const theme = useTheme();
  if (first) return null;
  return <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: spacing.xs }} />;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Txt variant="label" color="primary" style={{ fontWeight: '800', letterSpacing: 0.5, fontSize: 13.5 }}>
      {label}
    </Txt>
  );
}

/** A heading above a short paragraph, used for each of the Core Number
 *  interpretation sections so they stay easy to scan rather than reading as
 *  one dense block of text. `muted` keeps "HOW IT IS CALCULATED" visually
 *  lighter/technical, as it was before this refinement - only the heading
 *  treatment is new for that section, not its body text. */
function InterpretationBlock({
  label,
  text,
  first,
  muted,
}: {
  label: string;
  text: string;
  first?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <SectionDivider first={first} />
      <SectionLabel label={label} />
      <Txt variant={muted ? 'caption' : 'body'} color={muted ? 'textMuted' : 'text'}>
        {text}
      </Txt>
    </View>
  );
}

/** Same labeled pattern as `InterpretationBlock`, for the sections that are
 *  a short bullet list rather than a paragraph. */
function InterpretationBullets({ label, items }: { label: string; items: string[] }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <SectionDivider />
      <SectionLabel label={label} />
      <View style={{ gap: spacing.xs }}>
        {items.map((item) => (
          <Txt key={item} variant="body">
            • {item}
          </Txt>
        ))}
      </View>
    </View>
  );
}

/** Blueprint-only presentation metadata for each canonical Expression
 *  Plane (src/core/expressionPlanes.ts) - icon/subtitle/description text
 *  that has no equivalent in the canonical model and belongs here, not in
 *  a second Plane/numbers definition. Keyed by the canonical Plane id so
 *  it can never drift out of sync with which numbers a Plane actually
 *  represents; names, numbers, and presence all come from the canonical
 *  module itself. */
const PLANE_PRESENTATION: Record<ExpressionPlaneId, { icon: string; subtitle: string; description: string }> = {
  mindLogic: {
    icon: '🧠',
    subtitle: 'Intellect & memory',
    description: 'Your analytical thinking, memory, and cognitive agility.',
  },
  heartIntuition: {
    icon: '💖',
    subtitle: 'Empathy & feelings',
    description: 'Your empathy, spiritual attunement, feelings, and emotional resilience.',
  },
  actionGrounding: {
    icon: '🌱',
    subtitle: 'Execution & discipline',
    description: 'Your physical endurance, discipline, material mastery, and everyday habits.',
  },
  visionPlanning: {
    icon: '🔭',
    subtitle: 'Ideas & strategy',
    description: 'Your ability to come up with ideas, plan ahead, and structure your approach.',
  },
  drivePersistence: {
    icon: '⚡',
    subtitle: 'Focus & resolve',
    description: 'Your inner persistence, focus, and grit to complete objectives.',
  },
  manifestation: {
    icon: '🏃',
    subtitle: 'Decisive movement',
    description: 'Your ability to turn ideas into visible results, and to follow through until something becomes real.',
  },
};

/** A small, fixed-size 3x3 Lo Shu mini-grid for one Plane card - always
 *  built from the canonical `LO_SHU_LAYOUT` (never a second hardcoded
 *  digit grid). Three visual states per cell, using only existing theme
 *  tokens: a cell outside this Plane is neutral/subdued; a Plane cell
 *  whose digit is present gets the strong filled look; a Plane cell whose
 *  digit is missing gets a muted but still Plane-colored outline, visually
 *  between the other two. No text beyond the digit itself. */
function PlaneMiniGrid({ presence }: { presence: ExpressionPlanePresence }) {
  const theme = useTheme();
  const { plane, presentNumbers } = presence;

  return (
    <View style={{ width: 68, height: 68, gap: spacing.xs }}>
      {LO_SHU_LAYOUT.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flex: 1, flexDirection: 'row', gap: spacing.xs }}>
          {row.map((digit, colIndex) => {
            const belongsToPlane = plane.cells.some((cell) => cell.row === rowIndex && cell.col === colIndex);
            const isPresent = belongsToPlane && presentNumbers.includes(digit);
            return (
              <View
                key={digit}
                style={{
                  flex: 1,
                  borderRadius: radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: belongsToPlane && isPresent ? 2 : 1,
                  borderColor: belongsToPlane ? theme.colors.primary : theme.colors.border,
                  backgroundColor: belongsToPlane
                    ? isPresent
                      ? theme.colors.primarySoft
                      : theme.colors.surface
                    : theme.colors.surfaceAlt,
                }}
              >
                <Txt
                  variant="caption"
                  color={belongsToPlane && isPresent ? 'primary' : 'textMuted'}
                  style={belongsToPlane && isPresent ? { fontWeight: '700' } : undefined}
                >
                  {digit}
                </Txt>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

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
  const coreSummary = getCoreNumberSummary(report);
  const planePresences = getAllExpressionPlanePresence(loShu.counts);

  const [dobYear, dobMonth, dobDay] = profile.dob.split('-').map(Number);
  const dobFormatted = new Date(dobYear, dobMonth - 1, dobDay).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Screen>
      <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
        <Txt variant="title">{profile.fullName}</Txt>
        <Txt variant="caption" color="textMuted">
          Born {dobFormatted} • {profile.system === 'chaldean' ? 'Chaldean' : 'Pythagorean'} system
        </Txt>
      </View>

      <Txt variant="body">
        Your Blueprint brings together your core numerology numbers and your Lo Shu birth-date
        pattern — two different ways of looking at your personality and tendencies.
      </Txt>

      <Txt variant="body" color="textMuted">
        {numbersSummary}
      </Txt>

      <SectionHeader
        title="Core Numbers"
        subtitle="Your blueprint, in detail"
        titleStyle={{ color: '#5A459D', fontWeight: '700', fontSize: 18 }}
      />
      <Txt variant="body">
        Your core numbers are calculated from your name and date of birth, and each one offers a
        different perspective on your personality, strengths, and motivations.
      </Txt>
      {CORE_NUMBERS.map(({ key, title, blurb }) => {
        const value = report[key];
        const open = openKey === key;
        const section = open ? getCoreNumberInterpretation(key, value) : null;
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

            {section ? (
              <View style={{ gap: spacing.lg, marginTop: spacing.sm }}>
                <InterpretationBlock label="HOW YOUR NUMBER IS CALCULATED" text={trailText(report, key)} first muted />
                <InterpretationBlock label="WHAT THIS NUMBER REPRESENTS" text={section.represents} />
                <InterpretationBlock label="YOUR INTERPRETATION" text={section.yourInterpretation} />
                <InterpretationBullets label="HOW IT MAY SHOW UP" items={section.showsUpAs} />
                <InterpretationBullets label="NATURAL STRENGTHS" items={section.strengths} />
                <InterpretationBullets label="THINGS TO BE MINDFUL OF" items={section.mindfulOf} />
                <InterpretationBlock label="HOW YOU CAN USE THIS INSIGHT" text={section.howToUse} />
              </View>
            ) : (
              <Txt variant="caption" color="primary">
                Tap to expand
              </Txt>
            )}
          </Card>
        );
      })}

      <SectionHeader
        title="Your Personal Core Summary"
        subtitle="How your five numbers fit together"
        titleStyle={{ color: '#5A459D', fontWeight: '700', fontSize: 16 }}
      />
      <Card>
        <Txt variant="body">{coreSummary.paragraph}</Txt>
      </Card>

      <SectionHeader
        title="Sacred Matrix"
        subtitle="Your Lo Shu grid"
        titleStyle={{ color: '#5A459D', fontWeight: '700', fontSize: 16 }}
      />
      <Txt variant="body">
        The Lo Shu Grid is a numerology tool based on an ancient Chinese number square. It places
        each digit of your birth date onto this fixed 3×3 pattern, showing how often each number
        appears — traditionally used to reflect on your natural strengths and areas you may want
        to develop.
      </Txt>
      <Card>
        <View style={{ gap: spacing.sm }}>
          {LO_SHU_LAYOUT.map((row, rowIndex) => (
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

      <SectionHeader
        title="Planes of Expression"
        subtitle="Six ways to explore your Lo Shu pattern"
        titleStyle={{ color: '#5A459D', fontWeight: '700', fontSize: 16 }}
      />
      <Txt variant="body">
        The six planes group the numbers in your Lo Shu Grid into six areas: thinking, emotions,
        action, planning, persistence, and manifestation. The number of digits present in each
        group gives you a simple view of how represented that area is in your birth-date pattern.
      </Txt>
      <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
        <Txt variant="label" color="textMuted" style={{ fontWeight: '700' }}>
          How to read the mini-grids
        </Txt>
        <Txt variant="caption" color="textMuted">
          Each mini-grid highlights the three numbers that form that Plane. A stronger highlight
          means the number is present in your birth date; a softer highlight means it isn't.
          Numbers outside the Plane are shown neutrally.
        </Txt>
      </View>
      {planePresences.map((presence) => {
        const { plane, presentCount } = presence;
        const presentation = PLANE_PRESENTATION[plane.id];
        const total = plane.numbers.length;
        const statusText =
          presentCount === 0
            ? '🌱 None of the 3 numbers present'
            : presentCount === total
              ? '✨ All 3 numbers present'
              : `🌿 ${presentCount} of ${total} numbers present`;
        return (
          <Card key={plane.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Txt variant="heading">{presentation.icon}</Txt>
              <View style={{ flex: 1 }}>
                <Txt variant="heading">{plane.name}</Txt>
                <Txt variant="caption" color="textMuted">
                  {presentation.subtitle}
                </Txt>
              </View>
              <PlaneMiniGrid presence={presence} />
            </View>
            <Txt
              variant="caption"
              color="textMuted"
              style={{ fontSize: 11, fontWeight: '400', marginTop: spacing.xs }}
            >
              {statusText}
            </Txt>
            <Txt variant="body" color="text" style={{ marginTop: spacing.sm }}>
              {presentation.description}
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
                  width: `${(presentCount / total) * 100}%`,
                  backgroundColor: presentCount === total ? theme.colors.primary : theme.colors.accent,
                }}
              />
            </View>
          </Card>
        );
      })}

      <SectionHeader
        title="Explore Further"
        subtitle="Dive deeper into your blueprint"
        titleStyle={{ color: '#5A459D', fontWeight: '700', fontSize: 16 }}
      />
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
