import React from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useProfileStore } from '@/features/profile/store';
import { buildLoShuGrid } from '@/core/loShu';
import { Screen, Txt, Card, Button } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

const GRID_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];

export default function LoShuRevealScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);

  const dob = (profile as any)?.dob || (profile as any)?.birthDate || '2000-01-01';
  const counts: Record<number, number> = buildLoShuGrid(dob).counts;

  const activeDigits = GRID_ORDER.filter((d) => (counts[d] || 0) > 0);
  const missingDigits = GRID_ORDER.filter((d) => !counts[d] || counts[d] === 0);

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

        {/* Energy Balance */}
        <Card style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', gap: spacing.xs }}>
          <Txt variant="label" style={{ color: '#3730A3', fontWeight: '800' }}>
            ENERGY BALANCE
          </Txt>
          <Txt variant="body" style={{ color: '#4338CA', fontSize: 13, lineHeight: 18 }}>
            Active: {activeDigits.length} | Missing: {missingDigits.length}
          </Txt>
        </Card>

        {/* Concise interpretation */}
        <Txt variant="body" color="textMuted" style={{ fontSize: 13, lineHeight: 19 }}>
          Your Sacred Matrix shows {activeDigits.length} active energy patterns and {missingDigits.length} areas to explore.
        </Txt>

        {/* Insight & Next Step CTA */}
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
  insightCard: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
    borderLeftWidth: 4,
    borderLeftColor: '#EAB308',
  },
});