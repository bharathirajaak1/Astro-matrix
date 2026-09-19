import { useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useProfileStore } from '@/features/profile/store';
import { buildNumerologyReport } from '@/core/numerology';
import {
  LIFE_PATH_ARCHETYPES,
  DESTINY_ARCHETYPES,
  SOUL_URGE_ARCHETYPES,
} from '@/core/archetypes';
import { Screen, Txt, Card, Button } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

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

  const firstName = profile?.fullName?.trim().split(' ')[0] || 'Seeker';

  const lp = (report?.lifePath ?? 9) as number;
  const dest = (report?.destiny ?? 3) as number;
  const su = (report?.soulUrge ?? 3) as number;

  const lifePathInfo = LIFE_PATH_ARCHETYPES[lp] || LIFE_PATH_ARCHETYPES[9];
  const destinyInfo = DESTINY_ARCHETYPES[dest] || DESTINY_ARCHETYPES[3];
  const soulUrgeInfo = SOUL_URGE_ARCHETYPES[su] || SOUL_URGE_ARCHETYPES[3];

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
            STEP 1 OF 3: YOUR BLUEPRINT
          </Txt>
          <Txt variant="heading">Core Identity Revealed</Txt>
        </View>

        {/* Dynamic High-Impact Hook */}
        <Card style={styles.darkCard}>
          <Txt variant="label" color="textMuted" style={{ color: '#A5B4FC' }}>
            10-SECOND BLUEPRINT • {firstName} ✨
          </Txt>
          <Txt variant="body" style={{ color: '#FFFFFF', marginTop: spacing.xs, lineHeight: 22 }}>
            You lead with <Txt variant="body" style={{ color: '#FCD34D', fontWeight: '700' }}>{lifePathInfo.archetype}</Txt> wisdom (Life Path {lp}) and are driven by <Txt variant="body" style={{ color: '#FCD34D', fontWeight: '700' }}>{soulUrgeInfo.archetype}</Txt> yearning (Soul Urge {su}).
          </Txt>
          <Txt variant="caption" style={{ color: '#C7D2FE', marginTop: spacing.xs }}>
            {destinyInfo.title}: Guided toward authentic self-mastery.
          </Txt>
        </Card>

        {/* Numbers Row */}
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

        {/* WHAT YOUR CORE NUMBERS MEAN */}
        <Card style={{ gap: spacing.md }}>
          <Txt variant="label" color="textMuted">
            WHAT YOUR CORE NUMBERS MEAN
          </Txt>

          {/* Life Path */}
          <View style={{ gap: 4, marginVertical: 2 }}>
            <Txt variant="heading" style={{ fontSize: 16, lineHeight: 24 }}>
              🧭 LIFE PATH {lp}: {lifePathInfo.title}
            </Txt>
            <Txt variant="body" color="textMuted" style={{ fontSize: 13, lineHeight: 20 }}>
              {lifePathInfo.description}
            </Txt>
          </View>

          <View style={{ height: 1, backgroundColor: theme.colors.border }} />

          {/* Destiny */}
          <View style={{ gap: 4, marginVertical: 2 }}>
            <Txt variant="heading" style={{ fontSize: 16, lineHeight: 24 }}>
              🎯 DESTINY {dest}: {destinyInfo.title}
            </Txt>
            <Txt variant="body" color="textMuted" style={{ fontSize: 13, lineHeight: 20 }}>
              {destinyInfo.description}
            </Txt>
          </View>

          <View style={{ height: 1, backgroundColor: theme.colors.border }} />

          {/* Soul Urge */}
          <View style={{ gap: 4, marginVertical: 2 }}>
            <Txt variant="heading" style={{ fontSize: 16, lineHeight: 24 }}>
              💖 SOUL URGE {su}: {soulUrgeInfo.title}
            </Txt>
            <Txt variant="body" color="textMuted" style={{ fontSize: 13, lineHeight: 20 }}>
              {soulUrgeInfo.description}
            </Txt>
          </View>
        </Card>
        {/* Transition to Grid */}
        <Card style={styles.darkCard}>
          <Txt variant="label" color="textMuted" style={{ color: '#A5B4FC' }}>
            ANCIENT SACRED MATRIX
          </Txt>
          <Txt variant="heading" style={{ color: '#FFFFFF', marginTop: spacing.xs }}>
            Your Matrix Has Been Unlocked
          </Txt>
          <Txt variant="body" style={{ color: '#C7D2FE', lineHeight: 20, marginTop: spacing.xs }}>
            Your numbers reveal who you are. The 3,000-year-old Chinese Lo Shu Matrix reveals where your energy is blocked. We have calculated it for you — free.
          </Txt>
          <View style={{ marginTop: spacing.md }}>
            <Button
              label="See My Lo Shu Grid →"
              onPress={() => router.push('/onboarding/loshu-reveal')}
            />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  darkCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: '#1E1B4B',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});