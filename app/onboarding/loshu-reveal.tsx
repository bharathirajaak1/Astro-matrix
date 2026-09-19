import { useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView } from 'react-native';
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
        <View style={{ gap: spacing.xs }}>
          <Txt variant="label" color="textMuted">
            STEP 2 OF 3: SACRED MATRIX
          </Txt>
          <Txt variant="heading">Your Energy Distribution</Txt>
        </View>

        {/* 3x3 Grid */}
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

        {/* What This Means Breakdown */}
        <Card style={{ gap: spacing.md }}>
          <Txt variant="label" color="textMuted">
            WHAT THIS MEANS FOR YOU
          </Txt>
          <Txt variant="body" style={{ lineHeight: 20 }}>
            Your grid reveals {activeDigits.length} active energy streams and {missingDigits.length} missing elements.
          </Txt>

          {/* Active Strengths */}
          <View style={{ gap: spacing.xs }}>
            <Txt variant="heading" style={{ color: '#2E7D32', fontSize: 15, marginBottom: 4 }}>
              ✅ YOUR NATURAL STRENGTHS:
            </Txt>
            {activeDigits.map((digit) => {
              const trait = NUMBER_TRAITS[digit];
              return (
                <View key={digit} style={{ marginBottom: 8 }}>
                  <Txt variant="body" style={{ fontSize: 13, lineHeight: 19 }}>
                    <Txt variant="body" style={{ fontWeight: '700', color: '#1B5E20' }}>
                      • Number {digit} ({counts[digit]}x):{' '}
                    </Txt>
                    <Txt variant="body" color="textMuted">
                      {trait?.activeTrait}
                    </Txt>
                  </Txt>
                </View>
              );
            })}
          </View>

          <View style={{ height: 1, backgroundColor: theme.colors.border }} />

          {/* Missing Blockages */}
          <View style={{ gap: spacing.xs }}>
            <Txt variant="heading" style={{ color: '#C2410C', fontSize: 15, marginBottom: 4 }}>
              ⚠️ YOUR ENERGY BLOCKAGES:
            </Txt>
            {missingDigits.map((digit) => {
              const trait = NUMBER_TRAITS[digit];
              return (
                <View key={digit} style={{ marginBottom: 8 }}>
                  <Txt variant="body" style={{ fontSize: 13, lineHeight: 19 }}>
                    <Txt variant="body" style={{ fontWeight: '700', color: '#9A3412' }}>
                      • Number {digit} (Missing):{' '}
                    </Txt>
                    <Txt variant="body" color="textMuted">
                      {trait?.missingImpact}
                    </Txt>
                  </Txt>
                </View>
              );
            })}
          </View>

          <View style={{ height: 1, backgroundColor: theme.colors.border }} />

          {/* Emotional Insight */}
          <View
            style={{
              backgroundColor: '#FEF3C7',
              padding: spacing.sm,
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: '#F59E0B',
            }}
          >
            <Txt variant="caption" style={{ color: '#92400E', lineHeight: 18 }}>
              💡 <Txt variant="caption" style={{ fontWeight: '700', color: '#92400E' }}>INSIGHT:</Txt> Your missing numbers pinpoint exactly where life feels recurrently exhausting. But missing numbers are not permanent deficits—they are dormant codes waiting to be balanced.
            </Txt>
          </View>
        </Card>

        {/* Next Step CTA */}
        <Button
          label="View Complete Energetic Audit (SWOT) →"
          onPress={() => router.push('/onboarding/swot-audit')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  grid: {
    width: '100%',
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '31%',
    height: '31%',
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
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
  bulletRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
});