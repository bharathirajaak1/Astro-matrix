import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, View } from 'react-native';

import { useProfileStore } from '@/features/profile/store';
import { Card, Screen, SectionHeader, Txt } from '@/ui/components';
import { radius, spacing, useTheme } from '@/ui/theme';

/**
 * Explore tab. Step 2: the Birth Chart Report card now navigates to its
 * real entry screen (app/explore/birth-chart.tsx), which owns the actual
 * report generation/share flow - nothing report-related happens here.
 * Profile Matching and Question-Focused Reports are unchanged from step 1:
 * still no implementation anywhere in the app, so tapping either only
 * explains that, via the same `Alert.alert` pattern already used in
 * Settings - never a payment prompt.
 */
export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);

  const showComingSoon = (title: string) => {
    Alert.alert(title, 'This feature is planned but not available yet.');
  };

  if (!profile) {
    return (
      <Screen>
        <Txt variant="heading" center>
          Explore
        </Txt>
        <Txt variant="body" color="textMuted" center>
          {hydrated
            ? 'Complete onboarding to explore deeper reports and insights.'
            : 'Loading your matrix…'}
        </Txt>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Txt variant="title">Explore</Txt>
        <Txt variant="body" color="textMuted">
          Deeper, optional reports built on your existing numerology and Lo Shu patterns.
        </Txt>
      </View>

      <SectionHeader title="Discover" subtitle="More ways to understand your matrix" />

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: spacing.md,
        }}
      >
        <View style={{ width: '48%' }}>
          <Card
            style={{ minHeight: 192, justifyContent: 'space-between' }}
            onPress={() => router.push('/explore/birth-chart')}
            accessibilityLabel="Birth Chart Report"
            accessibilityHint="Opens the Birth Chart Report screen"
          >
            <View style={{ gap: spacing.xs }}>
              <FontAwesome name="file-pdf-o" size={22} color={theme.colors.primary} />
              <Txt variant="heading">Birth Chart Report</Txt>
              <Txt variant="caption" color="textMuted">
                A downloadable PDF of your Core Numbers, Lo Shu Grid, Planes of Expression, and
                Personal Pattern Review.
              </Txt>
            </View>
            <Txt variant="caption" color="primary" style={{ marginTop: spacing.sm }}>
              View details →
            </Txt>
          </Card>
        </View>

        <View style={{ width: '48%' }}>
          <Card
            style={{ minHeight: 192, justifyContent: 'space-between' }}
            onPress={() => showComingSoon('Profile Matching')}
            accessibilityLabel="Profile Matching"
            accessibilityHint="Coming soon. Opens a short explanation."
          >
            <View style={{ gap: spacing.xs }}>
              <FontAwesome name="users" size={22} color={theme.colors.primary} />
              <Txt variant="heading">Profile Matching</Txt>
              <Txt variant="caption" color="textMuted">
                Compare numerology and Lo Shu patterns between two saved profiles.
              </Txt>
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: theme.colors.accentSoft,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                marginTop: spacing.sm,
              }}
            >
              <Txt variant="caption" color="accent">
                Coming Soon
              </Txt>
            </View>
          </Card>
        </View>

        <View style={{ width: '48%' }}>
          <Card
            style={{ minHeight: 192, justifyContent: 'space-between' }}
            onPress={() => showComingSoon('Question-Focused Reports')}
            accessibilityLabel="Question-Focused Reports"
            accessibilityHint="Coming soon. Opens a short explanation."
          >
            <View style={{ gap: spacing.xs }}>
              <FontAwesome name="question-circle-o" size={22} color={theme.colors.primary} />
              <Txt variant="heading">Question-Focused Reports</Txt>
              <Txt variant="caption" color="textMuted">
                A report built around a specific question you're sitting with right now.
              </Txt>
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: theme.colors.accentSoft,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                marginTop: spacing.sm,
              }}
            >
              <Txt variant="caption" color="accent">
                Coming Soon
              </Txt>
            </View>
          </Card>
        </View>
      </View>
    </Screen>
  );
}
