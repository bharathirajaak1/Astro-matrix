import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/features/profile/store';
import { buildNumerologyReport } from '@/core/numerology';
import { formatUSDate } from '@/lib/date';
import {
  LIFE_PATH_ARCHETYPES,
  DESTINY_ARCHETYPES,
  SOUL_URGE_ARCHETYPES,
} from '@/core/archetypes';
import { summaryThemeFor } from '@/data/coreNumberContent';
import { getCoreIdentitySection, type CoreIdentitySection } from '@/data/coreIdentityContent';
import { Screen, Txt, Card, Button } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

/**
 * The concise, reflective body of one expanded Core Number accordion -
 * sourced from the dedicated `coreIdentityContent.ts` (never the detailed
 * `coreNumberContent.ts`, which remains exclusive to the Blueprint tab), so
 * it reads correctly for any of the 12 possible values a category can
 * resolve to, not just one example number.
 */
function ExpandedNumberContent({ section }: { section: CoreIdentitySection }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ gap: 4 }}>
        <Txt variant="label" color="textMuted" style={{ fontSize: 11 }}>
          SHORT REFLECTIVE INTERPRETATION
        </Txt>
        <Txt variant="body" color="textMuted" style={{ fontSize: 13, lineHeight: 20 }}>
          {section.shortInterpretation}
        </Txt>
      </View>

      <View style={{ gap: 4 }}>
        <Txt variant="label" color="textMuted" style={{ fontSize: 11 }}>
          YOU MAY NOTICE
        </Txt>
        <Txt variant="body" style={{ fontSize: 13, lineHeight: 20 }}>
          {section.youMayNotice}
        </Txt>
      </View>
    </View>
  );
}

export default function BlueprintResultScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);

  const report = profile
    ? buildNumerologyReport({
        id: (profile as any).id ?? 'default',
        createdAt: (profile as any).createdAt ?? new Date().toISOString(),
        fullName: profile.fullName,
        dob: (profile as any).dob || (profile as any).birthDate || '2000-01-01',
        system: profile.system || 'pythagorean',
      })
    : null;

  const fullName = profile?.fullName?.trim() || 'Seeker';
  const birthDate = (profile as any)?.dob || (profile as any)?.birthDate || '2000-01-01';

  const lp = (report?.lifePath ?? 7) as number;
  const dest = (report?.destiny ?? 5) as number;
  const su = (report?.soulUrge ?? 8) as number;

  // A reflective, non-deterministic Summary paragraph built from the same
  // short theme phrases `coreNumberContent.ts` already exports for this
  // exact purpose ("Exported so other content-layer modules... can reuse
  // this exact short phrase") - so it reads correctly for every possible
  // Life Path/Destiny/Soul Urge value, not just one example combination.
  const summaryText =
    `These three numbers suggest a pattern worth noticing, not a verdict. ` +
    `You may naturally lean into ${summaryThemeFor('lifePath', lp)} (Life Path ${lp}), ` +
    `and the way you tend to contribute often reflects ${summaryThemeFor('destiny', dest)} (Destiny ${dest}). ` +
    `Underneath both, what may feel most satisfying is ${summaryThemeFor('soulUrge', su)} (Soul Urge ${su}). ` +
    `Seen together, these qualities can sit alongside each other in plenty of ways — this is just one lens for thinking about yourself.`;

  const lifePathInfo = LIFE_PATH_ARCHETYPES[lp] || LIFE_PATH_ARCHETYPES[9] || {
    title: 'The Seeker',
    archetype: 'The Seeker',
    description: 'A journey of inner wisdom, discovery, and uncovering higher truths.',
  };
  const destinyInfo = DESTINY_ARCHETYPES[dest] || DESTINY_ARCHETYPES[3] || {
    title: 'The Catalyst',
    archetype: 'The Catalyst',
    description: 'Bridging ideas and inspiring transformation in your circle.',
  };
  const soulUrgeInfo = SOUL_URGE_ARCHETYPES[su] || SOUL_URGE_ARCHETYPES[3] || {
    title: 'The Sovereign',
    archetype: 'The Sovereign',
    description: 'Craving personal independence, leadership, and purposeful impact.',
  };

  // Expanded accordion content - the concise, reflective body from the
  // dedicated coreIdentityContent.ts (never the detailed coreNumberContent.ts,
  // which remains exclusive to the Blueprint tab), dynamic for the user's
  // actual values. Collapsed-state headers above still use
  // lifePathInfo/destinyInfo/soulUrgeInfo's `.title`, unchanged.
  const lifePathSection = getCoreIdentitySection('lifePath', lp);
  const destinySection = getCoreIdentitySection('destiny', dest);
  const soulUrgeSection = getCoreIdentitySection('soulUrge', su);

  // All three sections start collapsed. Each has independent expand state,
  // so multiple can be open at once. Opening a section immediately marks it
  // explored; closing it again never clears that explored status.
  const [expanded, setExpanded] = useState({
    lifePath: false,
    destiny: false,
    soulUrge: false,
  });

  const [explored, setExplored] = useState({
    lifePath: false,
    destiny: false,
    soulUrge: false,
  });

  const toggleSection = (key: 'lifePath' | 'destiny' | 'soulUrge') => {
    void Haptics.selectionAsync();
    setExpanded((prev) => {
      const next = !prev[key];
      if (next) {
        setExplored((e) => ({ ...e, [key]: true }));
      }
      return { ...prev, [key]: next };
    });
  };

  const exploredCount = [explored.lifePath, explored.destiny, explored.soulUrge].filter(Boolean).length;
  const allExplored = explored.lifePath && explored.destiny && explored.soulUrge;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Screen>
        {/* Navigation & Header */}
        <View style={{ gap: spacing.xs, marginTop: spacing.md }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Txt variant="label" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                ← Back
              </Txt>
            </TouchableOpacity>
            <Txt variant="label" color="textMuted">
              STEP 1 OF 3: YOUR BLUEPRINT
            </Txt>
          </View>
          <Txt variant="heading">Core Identity Revealed</Txt>
          <Txt variant="body" color="textMuted">
            Your Core Numbers highlight three important aspects of your personal blueprint. Life Path reflects your overall life direction, Destiny relates to how you express your abilities, and Soul Urge speaks to your inner motivations.
          </Txt>
        </View>

        {/* Calculation Info Card */}
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <Txt variant="caption" color="textMuted" style={{ lineHeight: 18 }}>
            ✨ Calculated using your full name (
            <Txt variant="caption" style={{ fontWeight: '700', color: theme.colors.text }}>{fullName}</Txt>) and date of birth (
            <Txt variant="caption" style={{ fontWeight: '700', color: theme.colors.text }}>{formatUSDate(birthDate)}</Txt>).
          </Txt>
        </Card>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Txt variant="display" color="primary" center>
              {lp}
            </Txt>
            <Txt variant="caption" color="textMuted" center>
              Life Path
            </Txt>
          </Card>
          <Card style={styles.metricCard}>
            <Txt variant="display" color="primary" center>
              {dest}
            </Txt>
            <Txt variant="caption" color="textMuted" center>
              Destiny
            </Txt>
          </Card>
          <Card style={styles.metricCard}>
            <Txt variant="display" color="primary" center>
              {su}
            </Txt>
            <Txt variant="caption" color="textMuted" center>
              Soul Urge
            </Txt>
          </Card>
        </View>

        {/* Instructions & Progress Indicator */}
        <Card style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', gap: spacing.xs }}>
          <View style={styles.badgeRow}>
            <Txt variant="label" style={{ color: '#3730A3', fontWeight: '800' }}>
              EXPLORE YOUR CORE NUMBERS
            </Txt>
            <View style={styles.pillBadge}>
              <Txt variant="caption" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
                {exploredCount} of 3 explored
              </Txt>
            </View>
          </View>
          <Txt variant="body" style={{ color: '#4338CA', fontSize: 13, lineHeight: 18 }}>
            Open each section below to explore what your numbers may suggest. Your personalized Summary will appear once you've explored all three.
          </Txt>
        </Card>

        {/* Accordions */}
        <Card style={{ gap: spacing.md, padding: 16 }}>
          <Txt variant="label" color="textMuted">
            WHAT YOUR CORE NUMBERS MEAN
          </Txt>

          {/* Life Path Accordion */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              activeOpacity={0.7}
              onPress={() => toggleSection('lifePath')}
            >
              <Txt variant="heading" style={{ fontSize: 15, flex: 1 }}>
                {expanded.lifePath ? '▲' : '▼'} 🧭 LIFE PATH {lp} — {lifePathInfo.title}
              </Txt>
              {explored.lifePath && (
                <Txt variant="body" style={{ color: '#16A34A', fontWeight: '800' }}>✓</Txt>
              )}
            </TouchableOpacity>

            {expanded.lifePath && (
              <View style={styles.accordionBody}>
                <ExpandedNumberContent section={lifePathSection} />
              </View>
            )}
          </View>

          <View style={{ height: 1, backgroundColor: theme.colors.border }} />

          {/* Destiny Accordion */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              activeOpacity={0.7}
              onPress={() => toggleSection('destiny')}
            >
              <Txt variant="heading" style={{ fontSize: 15, flex: 1 }}>
                {expanded.destiny ? '▲' : '▼'} 🎯 DESTINY {dest} — {destinyInfo.title}
              </Txt>
              {explored.destiny && (
                <Txt variant="body" style={{ color: '#16A34A', fontWeight: '800' }}>✓</Txt>
              )}
            </TouchableOpacity>

            {expanded.destiny && (
              <View style={styles.accordionBody}>
                <ExpandedNumberContent section={destinySection} />
              </View>
            )}
          </View>

          <View style={{ height: 1, backgroundColor: theme.colors.border }} />

          {/* Soul Urge Accordion */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              activeOpacity={0.7}
              onPress={() => toggleSection('soulUrge')}
            >
              <Txt variant="heading" style={{ fontSize: 15, flex: 1 }}>
                {expanded.soulUrge ? '▲' : '▼'} 💖 SOUL URGE {su} — {soulUrgeInfo.title}
              </Txt>
              {explored.soulUrge && (
                <Txt variant="body" style={{ color: '#16A34A', fontWeight: '800' }}>✓</Txt>
              )}
            </TouchableOpacity>

            {expanded.soulUrge && (
              <View style={styles.accordionBody}>
                <ExpandedNumberContent section={soulUrgeSection} />
              </View>
            )}
          </View>
        </Card>

        {/* Payoff & Matrix Transition (Reveals ONLY when all 3 are explored) */}
        {allExplored && (
          <>
            <Card style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
              <Txt variant="label" color="textMuted">
                SUMMARY
              </Txt>
              <Txt variant="caption" color="textMuted" style={{ marginTop: spacing.xs, lineHeight: 18 }}>
                Your core numbers offer different perspectives on your personality, strengths, motivations, and natural tendencies. Together, they offer a personal numerology blueprint based on your name and date of birth.
              </Txt>
              <Txt variant="body" style={{ marginTop: spacing.sm, lineHeight: 22 }}>
                {summaryText}
              </Txt>
            </Card>

            <Card style={styles.darkCard}>
              <Txt variant="label" color="textMuted" style={{ color: '#A5B4FC' }}>
                THE LO SHU MATRIX
              </Txt>
              <Txt variant="heading" style={{ color: '#FFFFFF', marginTop: spacing.xs }}>
                A Different Lens on the Same Numbers
              </Txt>
              <Txt variant="body" style={{ color: '#E2E8F0', marginTop: spacing.xs, lineHeight: 20 }}>
                So far, you've explored what your Core Numbers may suggest about different aspects of your inner patterns and tendencies. The Lo Shu Matrix looks at the same birth date from a different angle — a traditional 3x3 grid that shows which numbers appear often, and which don't appear at all.
              </Txt>
              <View style={{ marginTop: spacing.md }}>
                <Button
                  label="See My Lo Shu Grid →"
                  onPress={() => router.push('/onboarding/loshu-reveal')}
                />
              </View>
            </Card>
          </>
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  accordionContainer: {
    paddingVertical: 4,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  accordionBody: {
    paddingTop: 8,
    gap: 10,
  },
  readButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  darkCard: {
    backgroundColor: '#1E1B4B',
    borderColor: '#312E81',
  },
});