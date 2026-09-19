import { useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView } from 'react-native';
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
            STEP 3 OF 3: ENERGETIC AUDIT
          </Txt>
          <Txt variant="heading">Your Personal SWOT</Txt>
        </View>

        {/* Synthesis Summary */}
        <Card style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
          <Txt variant="body" style={{ lineHeight: 22 }}>
            💡 <Txt variant="body" style={{ fontWeight: '700' }}>SUMMARY:</Txt> You carry the soul blueprint of {lpInfo.archetype}. Your greatest growth area lies in harmonizing the energy gaps left by your missing numbers ({missingDigits.join(', ')}).
          </Txt>
        </Card>

        {/* Stacked Clean SWOT Sections */}
        <View style={{ gap: spacing.sm }}>
          {/* STRENGTHS */}
          <Card style={styles.cardStrengths}>
            <View style={{ gap: spacing.xs }}>
              <View style={styles.rowBetween}>
                <Txt variant="heading" style={{ color: '#166534', fontSize: 16 }}>
                  ⚡ STRENGTHS
                </Txt>
                <Txt variant="caption" style={{ color: '#15803D', fontWeight: '600' }}>
                  Your Core Power
                </Txt>
              </View>
              {activeDigits.map((d) => (
                <Txt key={d} variant="body" style={{ color: '#14532D', fontSize: 13, lineHeight: 18 }}>
                  • <Txt variant="body" style={{ fontWeight: '700', color: '#14532D' }}>Number {d} ({counts[d]}x):</Txt> {NUMBER_TRAITS[d]?.activeTrait}
                </Txt>
              ))}
            </View>
          </Card>

          {/* WEAKNESSES */}
          <Card style={styles.cardWeaknesses}>
            <View style={{ gap: spacing.xs }}>
              <View style={styles.rowBetween}>
                <Txt variant="heading" style={{ color: '#991B1B', fontSize: 16 }}>
                  🌒 WEAKNESSES
                </Txt>
                <Txt variant="caption" style={{ color: '#B91C1C', fontWeight: '600' }}>
                  Your Energy Voids
                </Txt>
              </View>
              {missingDigits.map((d) => (
                <Txt key={d} variant="body" style={{ color: '#7F1D1D', fontSize: 13, lineHeight: 18 }}>
                  • <Txt variant="body" style={{ fontWeight: '700', color: '#7F1D1D' }}>Number {d} (Missing):</Txt> {NUMBER_TRAITS[d]?.missingImpact}
                </Txt>
              ))}
            </View>
          </Card>

          {/* OPPORTUNITIES */}
          <Card style={styles.cardOpportunities}>
            <View style={{ gap: spacing.xs }}>
              <View style={styles.rowBetween}>
                <Txt variant="heading" style={{ color: '#1E40AF', fontSize: 16 }}>
                  🎯 OPPORTUNITIES
                </Txt>
                <Txt variant="caption" style={{ color: '#2563EB', fontWeight: '600' }}>
                  When Activated
                </Txt>
              </View>

              <View style={{ gap: 8, marginVertical: 6 }}>
                {missingDigits.slice(0, 3).map((d) => (
                  <View key={d} style={{ marginBottom: 4 }}>
                    <Txt variant="body" style={{ color: '#1E3A8A', fontSize: 13, lineHeight: 19 }}>
                      <Txt variant="body" style={{ fontWeight: '700', color: '#1E3A8A' }}>
                        • Number {d}:{' '}
                      </Txt>
                      {NUMBER_TRAITS[d]?.unlockOpportunity}
                    </Txt>
                  </View>
                ))}
              </View>

              <Txt variant="caption" style={{ color: '#1E40AF', fontStyle: 'italic', marginTop: 8, lineHeight: 18 }}>
                Bridging these unlocks steady momentum.
              </Txt>
            </View>
          </Card>

          {/* BLIND SPOT */}
          <Card style={styles.cardBlindSpot}>
            <View style={{ gap: spacing.xs }}>
              <View style={styles.rowBetween}>
                <Txt variant="heading" style={{ color: '#92400E', fontSize: 16 }}>
                  ⚠️ BLIND SPOT
                </Txt>
                <Txt variant="caption" style={{ color: '#B45309', fontWeight: '600' }}>
                  Hidden Pattern
                </Txt>
              </View>
              <Txt variant="body" style={{ color: '#78350F', fontSize: 13, lineHeight: 19 }}>
                You start endeavors with immense vision and intuitive spark, but struggle with the repetitive daily routines needed to carry them through.
              </Txt>
              <Txt variant="caption" style={{ color: '#92400E', fontWeight: '700', marginTop: 2 }}>
                This isn’t a personal flaw—it’s simply a missing frequency you can harmonize.
              </Txt>
            </View>
          </Card>
        </View>

        {/* Personalized High-Converting Paywall Bridge */}
        <Card style={styles.darkCard}>
          <View style={{ gap: spacing.xs }}>
            <Txt variant="label" color="textMuted" style={{ color: '#FCD34D' }}>
              ⚡ CLOSE YOUR ENERGY GAPS
            </Txt>
            <Txt variant="title" style={{ color: '#FFFFFF' }}>
              From Insight to Transformation
            </Txt>
            <Txt variant="body" style={{ color: '#E0E7FF', lineHeight: 21 }}>
              You now understand your core identity (<Txt variant="body" style={{ color: '#FCD34D', fontWeight: '700' }}>Life Path {lp}</Txt>) and exactly where your energetic leaks occur (<Txt variant="body" style={{ color: '#FCD34D', fontWeight: '700' }}>Missing {missingDigits.join(', ')}</Txt>).
            </Txt>
            <Txt variant="body" style={{ color: '#C7D2FE', lineHeight: 20 }}>
              Knowing your gaps changes nothing without alignment. Your personalized Remedy Engine provides tailored daily frequencies, grounding colors, and micro-rituals to harmonize each missing number.
            </Txt>
          </View>

          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            <Button
              label="Unlock My Tailored Remedies →"
              onPress={() => router.push('/paywall')}
            />
            <Button
              label="Continue with free daily forecast"
              variant="ghost"
              onPress={() => router.replace('/(tabs)/forecast')}
            />
          </View>
        </Card>

        <Txt variant="caption" color="textMuted" center style={{ marginTop: spacing.xs }}>
          Join 10,000+ seekers who’ve balanced their energetic matrix
        </Txt>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardStrengths: {
    backgroundColor: '#F0FDF4',
    padding: spacing.md,
  },
  cardWeaknesses: {
    backgroundColor: '#FEF2F2',
    padding: spacing.md,
  },
  cardOpportunities: {
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
  },
  cardBlindSpot: {
    backgroundColor: '#FFFBEB',
    padding: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  darkCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: '#1E1B4B',
  },
});