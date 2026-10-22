import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/features/profile/store';
import { buildNumerologyReport } from '@/core/numerology';
import { buildLoShuGrid } from '@/core/loShu';
import { NUMBER_TRAITS, LIFE_PATH_ARCHETYPES } from '@/core/archetypes';
import { Screen, Txt, Card, Button } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';
import {
  computeAllExplored,
  computeExploredCount,
  selectExpanded,
  selectExplored,
  usePatternReviewStore,
  type PatternReviewSection,
} from '@/features/onboarding/patternReviewStore';

const GRID_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];

/** Join a list of phrases with commas and a trailing "and", e.g. "a, b, and c". */
function joinWithAnd(items: string[]): string {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')}, and ${filtered[filtered.length - 1]}`;
}

function lowerFirst(text: string): string {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

export default function SwotAuditScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ context?: string }>();
  const isBlueprintContext = params.context === 'blueprint';
  const profile = useProfileStore((s) => s.profile);

  const dob = (profile as any)?.dob || (profile as any)?.birthDate || '2000-01-01';
  const counts: Record<number, number> = buildLoShuGrid(dob).counts;

  const report = profile
    ? buildNumerologyReport({
        id: (profile as any).id ?? 'default',
        createdAt: (profile as any).createdAt ?? new Date().toISOString(),
        fullName: profile.fullName,
        dob,
        system: profile.system || 'pythagorean',
      })
    : null;

  const activeDigits = GRID_ORDER.filter((d) => (counts[d] || 0) > 0);
  const missingDigits = GRID_ORDER.filter((d) => !counts[d] || counts[d] === 0);

  const lp = (report?.lifePath ?? 9) as number;
  const lpInfo = LIFE_PATH_ARCHETYPES[lp] || LIFE_PATH_ARCHETYPES[9];

  // Same first-3 missing numbers already surfaced by the Opportunities
  // section below, so the Summary and that section always agree.
  const topMissing = missingDigits.slice(0, 3);

  const summaryParagraph1 = `Your blueprint reflects the qualities of ${lpInfo.archetype} — Life Path ${lp}. Your active numbers add their own strengths to this pattern: ${joinWithAnd(
    activeDigits.map((d) => `Number ${d} brings ${lowerFirst(NUMBER_TRAITS[d]?.activeTrait ?? '')}`),
  )}.`;

  const summaryParagraph2 = `${missingDigits.length} number${missingDigits.length === 1 ? '' : 's'} ${
    missingDigits.length === 1 ? 'is' : 'are'
  } missing from your chart, and each highlights a growth edge. ${topMissing
    .map((d) => NUMBER_TRAITS[d]?.missingImpact)
    .filter(Boolean)
    .join('. ')}.`;

  const summaryParagraph3 = `The opportunity is to work with these gaps through steady, practical steps: ${topMissing
    .map((d) => NUMBER_TRAITS[d]?.unlockOpportunity)
    .filter(Boolean)
    .join('; ')}. Your strengths already point the way — use what comes naturally to you to build what your blueprint is asking for.`;

  // Keyed by profile id in `usePatternReviewStore`, not local `useState` -
  // local state is reset to defaults every time this screen is popped (Back)
  // and pushed again, since React Navigation/Expo Router unmounts a popped
  // screen entirely. The store is module-scoped, so it survives that
  // unmount/remount cycle, and is isolated per profile id so switching
  // profiles never surfaces another profile's expanded/explored state.
  const profileId = profile?.id ?? null;
  const expanded = usePatternReviewStore(selectExpanded(profileId));
  const explored = usePatternReviewStore(selectExplored(profileId));
  const toggleSectionInStore = usePatternReviewStore((s) => s.toggleSection);

  const toggleSection = (key: PatternReviewSection) => {
    void Haptics.selectionAsync();
    toggleSectionInStore(profileId, key);
  };

  const exploredCount = computeExploredCount(explored);
  const allExplored = computeAllExplored(explored);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Screen>
        {/* Header */}
        <View style={{ gap: spacing.xs, marginTop: spacing.md }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Txt variant="label" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                ← Back
              </Txt>
            </TouchableOpacity>
            <Txt variant="label" color="textMuted">
              STEP 3 OF 3: PERSONAL PATTERN REVIEW
            </Txt>
          </View>
          <Txt variant="heading" style={{ textAlign: 'left', fontSize: 21, fontWeight: '700' }}>
            Your Personal Pattern Review
          </Txt>

          <View style={{ gap: spacing.xs }}>
            <Txt variant="heading" style={{ fontSize: 17 }}>
              Four Perspectives on Your Pattern
            </Txt>
            <Txt variant="body" style={{ fontSize: 13, lineHeight: 20 }}>
              Your Lo Shu pattern offers another way to look at the numbers in your birth date. This review brings those patterns together through four perspectives — qualities you may naturally draw on, areas to explore, opportunities to develop, and patterns that may be easy to overlook.
            </Txt>
          </View>
        </View>

        {/* Progress Tracker Banner */}
        <Card style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', gap: spacing.xs }}>
          <View style={styles.rowBetween}>
            <Txt variant="label" style={{ color: '#3730A3', fontWeight: '800', flex: 1 }}>
              EXPLORE YOUR PERSONAL PATTERN
            </Txt>
            <View style={styles.pillBadge}>
              <Txt variant="caption" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
                {exploredCount} of 4 explored
              </Txt>
            </View>
          </View>
          <Txt variant="body" style={{ color: '#4338CA', fontSize: 13, lineHeight: 18 }}>
            Open each section below to explore different aspects of the pattern in your birth date.
          </Txt>
        </Card>

        {/* Collapsible Section 1: STRENGTHS */}
        <Card style={styles.cardStrengths}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.7}
            onPress={() => toggleSection('strengths')}
          >
            <View style={styles.rowFlex}>
              <Txt variant="heading" style={{ color: '#166534', fontSize: 15 }}>
                {expanded.strengths ? '▲' : '▼'} ⚡ STRENGTHS
              </Txt>
              <Txt variant="caption" style={{ color: '#15803D', fontWeight: '600' }}>
                Qualities You May Draw On
              </Txt>
            </View>
            {explored.strengths && (
              <Txt variant="body" style={{ color: '#16A34A', fontWeight: '800' }}>✓</Txt>
            )}
          </TouchableOpacity>

          {expanded.strengths && (
            <View style={styles.accordionBody}>
              {activeDigits.map((d) => (
                <Txt key={d} variant="body" style={{ color: '#14532D', fontSize: 13, lineHeight: 18 }}>
                  • <Txt variant="body" style={{ fontWeight: '700', color: '#14532D' }}>Number {d}:</Txt> {NUMBER_TRAITS[d]?.activeTrait}
                </Txt>
              ))}
            </View>
          )}
        </Card>

        {/* Collapsible Section 2: WEAKNESSES */}
        <Card style={styles.cardWeaknesses}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.7}
            onPress={() => toggleSection('weaknesses')}
          >
            <View style={styles.rowFlex}>
              <Txt variant="heading" style={{ color: '#991B1B', fontSize: 15 }}>
                {expanded.weaknesses ? '▲' : '▼'} 🌒 AREAS TO EXPLORE
              </Txt>
              <Txt variant="caption" style={{ color: '#B91C1C', fontWeight: '600' }}>
                Numbers to Reflect On
              </Txt>
            </View>
            {explored.weaknesses && (
              <Txt variant="body" style={{ color: '#DC2626', fontWeight: '800' }}>✓</Txt>
            )}
          </TouchableOpacity>

          {expanded.weaknesses && (
            <View style={styles.accordionBody}>
              {missingDigits.map((d) => (
                <Txt key={d} variant="body" style={{ color: '#7F1D1D', fontSize: 13, lineHeight: 18 }}>
                  • <Txt variant="body" style={{ fontWeight: '700', color: '#7F1D1D' }}>Number {d}:</Txt> {NUMBER_TRAITS[d]?.missingImpact}
                </Txt>
              ))}
            </View>
          )}
        </Card>

        {/* Collapsible Section 3: OPPORTUNITIES */}
        <Card style={styles.cardOpportunities}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.7}
            onPress={() => toggleSection('opportunities')}
          >
            <View style={styles.rowFlex}>
              <Txt variant="heading" style={{ color: '#1E40AF', fontSize: 15 }}>
                {expanded.opportunities ? '▲' : '▼'} 🎯 OPPORTUNITIES
              </Txt>
              <Txt variant="caption" style={{ color: '#2563EB', fontWeight: '600' }}>
                Ways to Develop
              </Txt>
            </View>
            {explored.opportunities && (
              <Txt variant="body" style={{ color: '#2563EB', fontWeight: '800' }}>✓</Txt>
            )}
          </TouchableOpacity>

          {expanded.opportunities && (
            <View style={styles.accordionBody}>
              <View style={{ gap: 8 }}>
                {missingDigits.slice(0, 3).map((d) => (
                  <Txt key={d} variant="body" style={{ color: '#1E3A8A', fontSize: 13, lineHeight: 19 }}>
                    • <Txt variant="body" style={{ fontWeight: '700', color: '#1E3A8A' }}>Number {d}: </Txt>
                    {NUMBER_TRAITS[d]?.unlockOpportunity}
                  </Txt>
                ))}
              </View>

              <Txt variant="caption" style={{ color: '#1E40AF', fontStyle: 'italic', marginTop: 4 }}>
                Exploring these qualities can open up new ways of approaching everyday life.
              </Txt>
            </View>
          )}
        </Card>

        {/* Collapsible Section 4: BLIND SPOT */}
        <Card style={styles.cardBlindSpot}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.7}
            onPress={() => toggleSection('blindSpot')}
          >
            <View style={styles.rowFlex}>
              <Txt variant="heading" style={{ color: '#92400E', fontSize: 15 }}>
                {expanded.blindSpot ? '▲' : '▼'} ⚠️ PATTERNS TO NOTICE
              </Txt>
              <Txt variant="caption" style={{ color: '#B45309', fontWeight: '600' }}>
                What May Be Easy to Overlook
              </Txt>
            </View>
            {explored.blindSpot && (
              <Txt variant="body" style={{ color: '#D97706', fontWeight: '800' }}>✓</Txt>
            )}
          </TouchableOpacity>

          {expanded.blindSpot && (
            <View style={styles.accordionBody}>
              <Txt variant="body" style={{ color: '#78350F', fontSize: 13, lineHeight: 19 }}>
                You may bring strong vision and intuitive spark to new ideas, while finding that consistency and routine require more conscious attention.
              </Txt>
              <Txt variant="caption" style={{ color: '#92400E', fontStyle: 'italic', marginTop: 4 }}>
                This isn't a personal flaw. It is simply another part of your pattern worth noticing.
              </Txt>
            </View>
          )}
        </Card>

        {/* Synthesis Summary (only once all 4 sections are explored) */}
        {allExplored && (
          <Card style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
            <Txt variant="body" style={{ lineHeight: 22 }}>
              💡 <Txt variant="body" style={{ fontWeight: '700' }}>SUMMARY</Txt>
            </Txt>
            <Txt variant="body" style={{ lineHeight: 22 }}>{summaryParagraph1}</Txt>
            <Txt variant="body" style={{ lineHeight: 22 }}>{summaryParagraph2}</Txt>
            <Txt variant="body" style={{ lineHeight: 22 }}>{summaryParagraph3}</Txt>
          </Card>
        )}

        {/* Paywall Bridge (Unlocks ONLY when all 4 are explored) */}
        {allExplored && (
          <Card style={styles.paywallCard}>
            <Txt variant="label" style={{ color: '#FCD34D' }}>
              PERSONALIZED NEXT STEPS
            </Txt>
            <Txt variant="heading" style={{ color: '#FFFFFF', marginTop: spacing.xs }}>
              From Insight to Transformation
            </Txt>
            <Txt variant="body" style={{ color: '#E2E8F0', marginTop: spacing.xs, lineHeight: 20 }}>
              Your Personal Pattern Review has highlighted the numbers that appear in your birth date and those that don't. Your personalized daily activations offer simple practices designed around your individual pattern.
            </Txt>
            <Txt variant="caption" style={{ color: '#CBD5E1', marginTop: spacing.xs, lineHeight: 18 }}>
              Explore tailored frequencies, grounding colors, and mindful practices that you can incorporate into your daily routine.
            </Txt>

            <View style={{ marginTop: spacing.md }}>
              <Button
                label="Unlock Daily Activations →"
                onPress={() => router.push('/paywall')}
              />
            </View>

            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/home')}
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <Txt variant="caption" style={{ color: '#94A3B8' }}>
                Continue with free daily forecast
              </Txt>
            </TouchableOpacity>
          </Card>
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowFlex: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    flex: 1,
  },
  pillBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexShrink: 0,
  },
  cardStrengths: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    padding: 16,
  },
  cardWeaknesses: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    padding: 16,
  },
  cardOpportunities: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    padding: 16,
  },
  cardBlindSpot: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
    padding: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionBody: {
    paddingTop: 12,
    gap: 8,
  },
  readButtonGreen: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  readButtonRed: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  readButtonBlue: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  readButtonYellow: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  paywallCard: {
    backgroundColor: '#1E1B4B',
    borderColor: '#312E81',
  },
});