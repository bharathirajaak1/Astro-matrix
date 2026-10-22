import { useMemo, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';

import { buildLoShuGrid, LO_SHU_LAYOUT } from '@/core/loShu';
import { buildNumerologyReport, DIGITS } from '@/core/numerology';
import {
  getAllExpressionPlanePresence,
  type ExpressionPlanePresence,
} from '@/core/expressionPlanes';
import { generateNumbersSummary, generateLoShuSummary } from '@/core/summaryGenerator';
import type { NumerologyReport } from '@/core/types';
import { CORE_NUMBERS } from '@/data/interpretations';
import { getCoreNumberInterpretation, getCoreNumberSummary, type CoreNumberKey } from '@/data/coreNumberContent';
import { PLANE_PRESENTATION } from '@/data/expressionPlaneContent';
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


const PLANES_OF_EXPRESSION_INTRO_TEXT =
  'Your Lo Shu Grid shows the numbers represented in your birth date and the numbers that are missing.\n\n' +
  'These numbers form six Planes of Expression, each representing a different area of how you may think, feel, plan, act and express yourself.\n\n' +
  'AstroMatrix looks at these patterns to identify areas for conscious attention. Your Daily Activations then turn that personal focus into simple activities you can practise each day.';

/** A small, fixed-size 3x3 Lo Shu mini-grid for one Plane card - always
 *  built from the canonical `LO_SHU_LAYOUT` (never a second hardcoded digit
 *  grid). Ported verbatim (same colors/layout, including the `#5A459D`
 *  accent) from its prior home in app/(tabs)/remedies.tsx - appearance is
 *  unchanged, only the surrounding file moved. */
function PlaneMiniGrid({ presence }: { presence: ExpressionPlanePresence }) {
  const { plane, presentNumbers } = presence;

  return (
    <View style={{ width: 68, height: 68, gap: 4 }}>
      {LO_SHU_LAYOUT.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {row.map((digit, colIndex) => {
            const belongsToPlane = plane.cells.some((cell) => cell.row === rowIndex && cell.col === colIndex);
            const isPresent = belongsToPlane && presentNumbers.includes(digit);
            return (
              <View
                key={digit}
                style={{
                  flex: 1,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isPresent ? 2 : 1,
                  borderColor: belongsToPlane ? '#5A459D' : '#EDEBE6',
                  backgroundColor: !belongsToPlane ? '#F5F3EF' : isPresent ? '#F4F2FF' : '#FFFFFF',
                }}
              >
                <Txt style={{ fontSize: 12, fontWeight: isPresent ? '700' : '500', color: isPresent ? '#5A459D' : '#6B655E' }}>
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
  // Derived directly from the canonical `loShu` counts - `missing`/
  // `repeated` are already computed by `buildLoShuGrid()`; `active` is the
  // one straightforward complement (count > 0), not a second calculation.
  const activeNumbers = DIGITS.filter((d) => counts[d] > 0);
  // Each Plane's presence against this profile's Lo Shu counts - reads the
  // existing canonical `getAllExpressionPlanePresence()`, never re-derived.
  const planePresences = getAllExpressionPlanePresence(counts);

  const numbersSummary = generateNumbersSummary(
    report.lifePath ?? 1,
    report.soulUrge ?? report.destiny ?? 1,
    report.soulUrge ? 'Soul Urge' : 'Destiny',
  );
  const loShuSummary = generateLoShuSummary(profile.dob);
  const coreSummary = getCoreNumberSummary(report);

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

      <SectionHeader
        title="Blueprint"
        subtitle="Understand your personal numerology pattern"
        titleStyle={{ color: '#5A459D', fontWeight: '700', fontSize: 18 }}
      />
      <Txt variant="body">
        Your Blueprint brings together the key patterns found in your name and date of birth.
        Explore your Core Numbers, personal summary and Lo Shu Grid to understand different
        aspects of your natural tendencies and personal pattern.
      </Txt>
      <Txt variant="body">
        As you explore your Blueprint, you'll also find areas for further reflection and discovery
        based on your unique numbers.
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

      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <View style={{ gap: 2 }}>
          <SectionLabel label="Active numbers" />
          <Txt variant="body">{activeNumbers.length > 0 ? activeNumbers.join(', ') : 'None'}</Txt>
        </View>
        <View style={{ gap: 2 }}>
          <SectionLabel label="Missing numbers" />
          <Txt variant="body">{loShu.missing.length > 0 ? loShu.missing.join(', ') : 'None'}</Txt>
        </View>
        <View style={{ gap: 2 }}>
          <SectionLabel label="Repeated numbers" />
          <Txt variant="body">{loShu.repeated.length > 0 ? loShu.repeated.join(', ') : 'None'}</Txt>
        </View>
        <Txt variant="body" color="textMuted" style={{ marginTop: spacing.xs }}>
          These numbers show which digits are represented in your birth-date pattern, which are
          absent, and which appear more than once.
        </Txt>
      </View>

      <Txt variant="body" color="textMuted">
        {loShuSummary}
      </Txt>

      <SectionHeader
        title="Planes of Expression"
        subtitle="Six areas shaped by your Lo Shu grid"
        titleStyle={{ color: '#5A459D', fontWeight: '700', fontSize: 16 }}
      />
      <Txt variant="body">
        {PLANES_OF_EXPRESSION_INTRO_TEXT}
      </Txt>

      <SectionLabel label="How to read the mini-grids" />
      <Txt variant="caption" color="textMuted">
        Each mini-grid highlights the three numbers that form that Plane. A stronger highlight
        means the number is present in your birth date; a softer highlight means it isn't.
        Numbers outside the Plane are shown neutrally.
      </Txt>

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Txt style={{ fontSize: 22 }}>{presentation.icon}</Txt>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="heading">{plane.name}</Txt>
                <Txt variant="caption" color="textMuted">
                  {presentation.subtitle}
                </Txt>
              </View>
              <PlaneMiniGrid presence={presence} />
            </View>
            <Txt style={{ fontSize: 13, fontWeight: '700', color: '#5A459D', marginTop: spacing.sm, marginBottom: 4 }}>
              {statusText}
            </Txt>
            <Txt variant="body">{presentation.description}</Txt>
          </Card>
        );
      })}

      <SectionHeader
        title="Explore Further"
        subtitle="Dive deeper into your blueprint"
        titleStyle={{ color: '#5A459D', fontWeight: '700', fontSize: 16 }}
      />
      <Card
        onPress={() => router.push('/onboarding/blueprint-result')}
        accessibilityLabel="Open Core Identity Revealed"
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="heading">Core Identity Revealed</Txt>
            <Txt variant="caption" color="textMuted">
              Revisit your Life Path, Destiny & Soul Urge
            </Txt>
          </View>
          <Txt variant="caption" color="primary">
            View →
          </Txt>
        </View>
      </Card>

      <Card
        onPress={() => router.push('/onboarding/swot-audit?context=blueprint')}
        accessibilityLabel="Open Personal Pattern Review"
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="heading">Personal Pattern Review</Txt>
            <Txt variant="caption" color="textMuted">
              Explore the patterns in your Lo Shu numbers
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
