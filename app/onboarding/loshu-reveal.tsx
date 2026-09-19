import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/features/profile/store';
import { NUMBER_TRAITS } from '@/core/archetypes';
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

export default function LoShuRevealScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);

  const dob = (profile as any)?.dob || (profile as any)?.birthDate || '2000-01-01';
  const counts = getDigitCounts(dob);

  const activeDigits = GRID_ORDER.filter((d) => (counts[d] || 0) > 0);
  const missingDigits = GRID_ORDER.filter((d) => !counts[d] || counts[d] === 0);

  const [expanded, setExpanded] = useState({
    strengths: false,
    blockages: false,
  });

  const [explored, setExplored] = useState({
    strengths: false,
    blockages: false,
  });

  const toggleSection = (key: 'strengths' | 'blockages') => {
    void Haptics.selectionAsync();
    setExpanded((prev) => {
      const next = !prev[key];
      if (next) {
        setExplored((e) => ({ ...e, [key]: true }));
      }
      return { ...prev, [key]: next };
    });
  };

  const markExplored = (key: 'strengths' | 'blockages') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExplored((prev) => ({ ...prev, [key]: true }));
    setExpanded((prev) => ({ ...prev, [key]: false }));
  };

  const exploredCount = [explored.strengths, explored.blockages].filter(Boolean).length;
  const allExplored = explored.strengths && explored.blockages;

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
        {/* Navigation & Header */}
        <View style={{ gap: spacing.xs }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Txt variant="label" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                ← Back
              </Txt>
            </TouchableOpacity>
            <Txt variant="label" color="textMuted">
              STEP 2 OF 3: SACRED MATRIX
            </Txt>
          </View>
          <Txt variant="heading">Your Energy Distribution</Txt>
        </View>

        {/* 3x3 Lo Shu Grid (Visual Anchor) */}
        <Card style={styles.gridContainer}>
          <View style={styles.grid}>
            {GRID_ORDER.map((digit) => {
              const count = counts[digit] || 0;
              const isActive = count > 0;
              return (
                <View
                  key={digit}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: isActive ? '#E8F5E9' : '#F5F5F4',
                      borderColor: isActive ? '#A5D6A7' : '#E7E5E4',
                    },
                  ]}
                >
                  <Txt
                    variant="title"
                    style={{ color: isActive ? '#1B5E20' : '#A8A29E', fontWeight: '700' }}
                  >
                    {digit}
                  </Txt>
                  <Txt
                    variant="caption"
                    style={{ color: isActive ? '#2E7D32' : '#A8A29E', fontSize: 11 }}
                  >
                    {isActive ? `${count}x` : 'Missing'}
                  </Txt>
                </View>
              );
            })}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#A5D6A7' }]} />
              <Txt variant="caption" color="textMuted">
                Active Energy
              </Txt>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#E7E5E4' }]} />
              <Txt variant="caption" color="textMuted">
                Missing Element
              </Txt>
            </View>
          </View>
        </Card>

        {/* Interactive Exploration Prompt */}
        <Card style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', gap: spacing.xs }}>
          <View style={styles.badgeRow}>
            <Txt variant="label" style={{ color: '#3730A3', fontWeight: '800' }}>
              ENERGY BALANCE
            </Txt>
            <View style={styles.pillBadge}>
              <Txt variant="caption" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
                {exploredCount} of 2 explored
              </Txt>
            </View>
          </View>
          <Txt variant="body" style={{ color: '#4338CA', fontSize: 13, lineHeight: 18 }}>
            Active: {activeDigits.length} | Missing: {missingDigits.length}. Tap below to uncover your natural strengths and energetic blockages.
          </Txt>
        </Card>

        {/* Collapsible Section 1: Natural Strengths */}
        <Card style={styles.cardStrengths}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.7}
            onPress={() => toggleSection('strengths')}
          >
            <Txt variant="heading" style={{ color: '#166534', fontSize: 15, flex: 1 }}>
              {expanded.strengths ? '▲' : '▼'} ✅ YOUR NATURAL STRENGTHS ({activeDigits.length})
            </Txt>
            {explored.strengths && (
              <Txt variant="body" style={{ color: '#16A34A', fontWeight: '800' }}>✓</Txt>
            )}
          </TouchableOpacity>

          {expanded.strengths && (
            <View style={styles.accordionBody}>
              {activeDigits.map((digit) => {
                const trait = NUMBER_TRAITS[digit];
                return (
                  <Txt key={digit} variant="body" style={{ color: '#14532D', fontSize: 13, lineHeight: 19 }}>
                    • <Txt variant="body" style={{ fontWeight: '700', color: '#14532D' }}>Number {digit} ({counts[digit]}x):</Txt> {trait?.activeTrait || 'Balanced energetic presence.'}
                  </Txt>
                );
              })}

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

        {/* Collapsible Section 2: Energy Blockages */}
        <Card style={styles.cardBlockages}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.7}
            onPress={() => toggleSection('blockages')}
          >
            <Txt variant="heading" style={{ color: '#991B1B', fontSize: 15, flex: 1 }}>
              {expanded.blockages ? '▲' : '▼'} ⚠️ YOUR ENERGY BLOCKAGES ({missingDigits.length})
            </Txt>
            {explored.blockages && (
              <Txt variant="body" style={{ color: '#DC2626', fontWeight: '800' }}>✓</Txt>
            )}
          </TouchableOpacity>

          {expanded.blockages && (
            <View style={styles.accordionBody}>
              {missingDigits.map((digit) => {
                const trait = NUMBER_TRAITS[digit];
                return (
                  <Txt key={digit} variant="body" style={{ color: '#7F1D1D', fontSize: 13, lineHeight: 19 }}>
                    • <Txt variant="body" style={{ fontWeight: '700', color: '#7F1D1D' }}>Number {digit} (Missing):</Txt> {trait?.missingImpact || 'Latent potential waiting to be harmonized.'}
                  </Txt>
                );
              })}

              {!explored.blockages && (
                <TouchableOpacity
                  style={styles.readButtonRed}
                  onPress={() => markExplored('blockages')}
                >
                  <Txt variant="caption" style={{ color: '#991B1B', fontWeight: '700' }}>
                    ✅ I've explored my blockages
                  </Txt>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>

        {/* Insight Payoff & Next Step CTA (Appears ONLY when both are explored) */}
        {allExplored && (
          <View style={{ gap: spacing.md }}>
            <Card style={styles.insightCard}>
              <Txt variant="body" style={{ color: '#854D0E', fontSize: 13, lineHeight: 20 }}>
                💡 <Txt variant="body" style={{ fontWeight: '700', color: '#713F12' }}>INSIGHT:</Txt> Your missing numbers pinpoint exactly where life feels recurrently exhausting. But missing numbers are not permanent deficits—they are dormant codes waiting to be balanced.
              </Txt>
            </Card>

            <View style={{ marginTop: spacing.xs }}>
              <Button
                label="View Complete Energetic Audit (SWOT) →"
                onPress={() => router.push('/onboarding/swot-audit')}
              />
            </View>
          </View>
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
  gridContainer: {
    padding: 16,
    alignItems: 'center',
  },
  grid: {
    width: 250,
    height: 250,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell: {
    width: 74,
    height: 74,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  cardStrengths: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    padding: 16,
  },
  cardBlockages: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
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
  insightCard: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
    borderLeftWidth: 4,
    borderLeftColor: '#EAB308',
  },
});