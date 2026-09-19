import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/features/profile/store';
import { buildNumerologyReport } from '@/core/numerology';
import { NUMBER_TRAITS, LIFE_PATH_ARCHETYPES } from '@/core/archetypes';
import { Screen, Txt, Card, Button } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

const GRID_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];

function getDigitCounts(dob: string): Record<number, number> {
  const counts: Record<number, number> = {};
  const digitsOnly = dob.replace(/\D/g, '');
  for (const ch of digitsOnly) {
    const num = Number(ch);
    if (num >= 1 && num <= 9) {
      counts[num] = (counts[num] || 0) + 1;
    }
  }
  return counts;
}

export default function SwotAuditScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);

  const dob = (profile as any)?.dob || (profile as any)?.birthDate || '2000-01-01';
  const counts = getDigitCounts(dob);

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

  const [expanded, setExpanded] = useState({
    strengths: false,
    weaknesses: false,
    opportunities: false,
    blindSpot: false,
  });

  const [explored, setExplored] = useState({
    strengths: false,
    weaknesses: false,
    opportunities: false,
    blindSpot: false,
  });

  const toggleSection = (key: 'strengths' | 'weaknesses' | 'opportunities' | 'blindSpot') => {
    void Haptics.selectionAsync();
    setExpanded((prev) => {
      const next = !prev[key];
      if (next) {
        setExplored((e) => ({ ...e, [key]: true }));
      }
      return { ...prev, [key]: next };
    });
  };

  const markExplored = (key: 'strengths' | 'weaknesses' | 'opportunities' | 'blindSpot') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExplored((prev) => ({ ...prev, [key]: true }));
    setExpanded((prev) => ({ ...prev, [key]: false }));
  };

  const exploredCount = [
    explored.strengths,
    explored.weaknesses,
    explored.opportunities,
    explored.blindSpot,
  ].filter(Boolean).length;

  const allExplored =
    explored.strengths &&
    explored.weaknesses &&
    explored.opportunities &&
    explored.blindSpot;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: spacing.md,
          paddingTop: 56,
          paddingBottom: spacing.xxl,
        }}
      >
        {/* Header */}
        <View style={{ gap: spacing.xs }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Txt variant="label" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                ← Back
              </Txt>
            </TouchableOpacity>
            <Txt variant="label" color="textMuted">
              STEP 3 OF 3: ENERGETIC AUDIT
            </Txt>
          </View>
          <Txt variant="heading">Your Personal SWOT</Txt>
        </View>

        {/* Synthesis Summary */}
        <Card style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
          <Txt variant="body" style={{ lineHeight: 22 }}>
            💡 <Txt variant="body" style={{ fontWeight: '700' }}>SUMMARY:</Txt> You carry the soul blueprint of {lpInfo.archetype}. Your greatest growth area lies in harmonizing the energy gaps left by your missing numbers ({missingDigits.join(', ')}).
          </Txt>
        </Card>

        {/* Progress Tracker Banner */}
        <Card style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', gap: spacing.xs }}>
          <View style={styles.rowBetween}>
            <Txt variant="label" style={{ color: '#3730A3', fontWeight: '800' }}>
              COMPLETE YOUR ENERGETIC AUDIT
            </Txt>
            <View style={styles.pillBadge}>
              <Txt variant="caption" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
                {exploredCount} of 4 explored
              </Txt>
            </View>
          </View>
          <Txt variant="body" style={{ color: '#4338CA', fontSize: 13, lineHeight: 18 }}>
            Expand each quadrant below to uncover your Strengths, Weaknesses, Opportunities, and Blind Spot.
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
                Your Core Power
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
                  • <Txt variant="body" style={{ fontWeight: '700', color: '#14532D' }}>Number {d} ({counts[d]}x):</Txt> {NUMBER_TRAITS[d]?.activeTrait}
                </Txt>
              ))}

              {!explored.strengths && (
                <TouchableOpacity
                  style={styles.readButtonGreen}
                  onPress={() => markExplored('strengths')}
                >
                  <Txt variant="caption" style={{ color: '#166534', fontWeight: '700' }}>
                    ✅ I've explored my strengths
                  </Txt>
                </TouchableOpacity>
              )}
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
                {expanded.weaknesses ? '▲' : '▼'} 🌒 WEAKNESSES
              </Txt>
              <Txt variant="caption" style={{ color: '#B91C1C', fontWeight: '600' }}>
                Your Energy Voids
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
                  • <Txt variant="body" style={{ fontWeight: '700', color: '#7F1D1D' }}>Number {d} (Missing):</Txt> {NUMBER_TRAITS[d]?.missingImpact}
                </Txt>
              ))}

              {!explored.weaknesses && (
                <TouchableOpacity
                  style={styles.readButtonRed}
                  onPress={() => markExplored('weaknesses')}
                >
                  <Txt variant="caption" style={{ color: '#991B1B', fontWeight: '700' }}>
                    ✅ I've explored my weaknesses
                  </Txt>
                </TouchableOpacity>
              )}
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
                When Activated
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
                Bridging these unlocks steady momentum.
              </Txt>

              {!explored.opportunities && (
                <TouchableOpacity
                  style={styles.readButtonBlue}
                  onPress={() => markExplored('opportunities')}
                >
                  <Txt variant="caption" style={{ color: '#1E40AF', fontWeight: '700' }}>
                    ✅ I've explored opportunities
                  </Txt>
                </TouchableOpacity>
              )}
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
                {expanded.blindSpot ? '▲' : '▼'} ⚠️ BLIND SPOT
              </Txt>
              <Txt variant="caption" style={{ color: '#B45309', fontWeight: '600' }}>
                Hidden Pattern
              </Txt>
            </View>
            {explored.blindSpot && (
              <Txt variant="body" style={{ color: '#D97706', fontWeight: '800' }}>✓</Txt>
            )}
          </TouchableOpacity>

          {expanded.blindSpot && (
            <View style={styles.accordionBody}>
              <Txt variant="body" style={{ color: '#78350F', fontSize: 13, lineHeight: 19 }}>
                You start endeavors with immense vision and intuitive spark, but struggle with the repetitive daily routines needed to carry them through.
              </Txt>
              <Txt variant="caption" style={{ color: '#92400E', fontStyle: 'italic', marginTop: 4 }}>
                This isn't a personal flaw—it's simply a missing frequency you can harmonize.
              </Txt>

              {!explored.blindSpot && (
                <TouchableOpacity
                  style={styles.readButtonYellow}
                  onPress={() => markExplored('blindSpot')}
                >
                  <Txt variant="caption" style={{ color: '#92400E', fontWeight: '700' }}>
                    ✅ I've explored my blind spot
                  </Txt>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>

        {/* Paywall Bridge (Unlocks ONLY when all 4 are explored) */}
        {allExplored && (
          <Card style={styles.paywallCard}>
            <Txt variant="label" style={{ color: '#FCD34D' }}>
              ⚡ CLOSE YOUR ENERGY GAPS
            </Txt>
            <Txt variant="heading" style={{ color: '#FFFFFF', marginTop: spacing.xs }}>
              From Insight to Transformation
            </Txt>
            <Txt variant="body" style={{ color: '#E2E8F0', marginTop: spacing.xs, lineHeight: 20 }}>
              You now understand your core identity (Life Path {lp}) and exactly where your energetic leaks occur (Missing {missingDigits.join(', ')}).
            </Txt>
            <Txt variant="caption" style={{ color: '#CBD5E1', marginTop: spacing.xs, lineHeight: 18 }}>
              Knowing your gaps changes nothing without alignment. Your personalized Remedy Engine provides tailored daily frequencies, grounding colors, and micro-rituals to harmonize each missing number.
            </Txt>

            <View style={{ marginTop: spacing.md }}>
              <Button
                label="Unlock My Tailored Remedies →"
                onPress={() => router.push('/paywall')}
              />
            </View>

            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/forecast')}
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <Txt variant="caption" style={{ color: '#94A3B8' }}>
                Continue with free daily forecast
              </Txt>
            </TouchableOpacity>

            <Txt variant="caption" style={{ color: '#64748B', textAlign: 'center', marginTop: 4 }}>
              Join 10,000+ seekers who've balanced their energetic matrix
            </Txt>
          </Card>
        )}
      </ScrollView>
    </Screen>
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
  },
  rowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
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