import { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { buildForecast } from '@/core/forecast';
import { buildLoShuGrid } from '@/core/loShu';
import { buildNumerologyReport } from '@/core/numerology';
import { useEntitlement } from '@/features/entitlements';
import { useProfileStore } from '@/features/profile/store';
import { useRitualStore } from '@/features/remedies/ritualStore';
import { todayISO } from '@/lib/date';
import { Card, Screen, SectionHeader, Txt } from '@/ui/components';
import { spacing } from '@/ui/theme';

/**
 * Dashboard foundation step 1: a read-only composition of the existing
 * canonical sources (profile, numerology, Lo Shu, forecast, ritual journey,
 * entitlement). Not yet wired into navigation - this screen introduces no
 * new state of its own.
 */
export default function HomeScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);

  const questDay = useRitualStore((s) => s.questDay);
  const streakDays = useRitualStore((s) => s.streakDays);
  const dailyPackCompleted = useRitualStore((s) => s.dailyPackCompleted);

  const remediesUnlocked = useEntitlement((s) => s.remediesUnlocked);

  const report = useMemo(
    () => (profile ? buildNumerologyReport(profile) : null),
    [profile],
  );
  const loShu = useMemo(
    () => (profile ? buildLoShuGrid(profile.dob) : null),
    [profile],
  );
  const forecast = useMemo(
    () => (profile ? buildForecast(profile, todayISO()) : null),
    [profile],
  );

  if (!profile || !report || !loShu || !forecast) {
    return (
      <Screen>
        <Txt variant="heading" center>
          Welcome to AstroMatrix
        </Txt>
        <Txt variant="body" color="textMuted" center>
          {hydrated
            ? 'Complete onboarding to see your personal dashboard.'
            : 'Loading your matrix…'}
        </Txt>
      </Screen>
    );
  }

  const firstName = profile.fullName.trim().split(' ')[0] || profile.fullName;

  const [dobYear, dobMonth, dobDay] = profile.dob.split('-').map(Number);
  const dobFormatted = new Date(dobYear, dobMonth - 1, dobDay).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Txt variant="title">Welcome back, {firstName}</Txt>
        <Txt variant="caption" color="textMuted">
          {remediesUnlocked ? 'AstroMatrix Plus' : 'Free Compass'}
        </Txt>
        <View style={{ gap: 2, marginTop: spacing.xs }}>
          <Txt variant="caption" color="textMuted">
            {profile.fullName}
          </Txt>
          <Txt variant="caption" color="textMuted">
            Born {dobFormatted} • {profile.system === 'chaldean' ? 'Chaldean' : 'Pythagorean'} system
          </Txt>
        </View>
      </View>

      <SectionHeader title="Core Numbers" subtitle="Your blueprint at a glance" />
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md }}>
          <View style={{ width: '30%', alignItems: 'center', gap: spacing.xs }}>
            <Txt variant="title" color="primary">
              {report.lifePath}
            </Txt>
            <Txt variant="caption" color="textMuted">
              Life Path
            </Txt>
          </View>
          <View style={{ width: '30%', alignItems: 'center', gap: spacing.xs }}>
            <Txt variant="title" color="primary">
              {report.birthday}
            </Txt>
            <Txt variant="caption" color="textMuted">
              Birthday
            </Txt>
          </View>
          <View style={{ width: '30%', alignItems: 'center', gap: spacing.xs }}>
            <Txt variant="title" color="primary">
              {report.destiny}
            </Txt>
            <Txt variant="caption" color="textMuted">
              Destiny
            </Txt>
          </View>
          <View style={{ width: '30%', alignItems: 'center', gap: spacing.xs }}>
            <Txt variant="title" color="primary">
              {report.soulUrge}
            </Txt>
            <Txt variant="caption" color="textMuted">
              Soul Urge
            </Txt>
          </View>
          <View style={{ width: '30%', alignItems: 'center', gap: spacing.xs }}>
            <Txt variant="title" color="primary">
              {report.personality}
            </Txt>
            <Txt variant="caption" color="textMuted">
              Personality
            </Txt>
          </View>
        </View>
      </Card>

      <SectionHeader title="Sacred Matrix" subtitle="Lo Shu grid summary" />
      <Card>
        <Txt variant="body">
          Missing: {loShu.missing.length > 0 ? loShu.missing.join(', ') : 'None'}
        </Txt>
        <Txt variant="body">
          Repeated: {loShu.repeated.length > 0 ? loShu.repeated.join(', ') : 'None'}
        </Txt>
        <Txt variant="caption" color="textMuted">
          Missing numbers show qualities you may want to develop.
        </Txt>
        <Txt variant="caption" color="textMuted">
          Repeated numbers show qualities that appear more strongly in your birth date.
        </Txt>
      </Card>

      <SectionHeader title="Today's Guidance" subtitle={`Personal Day ${forecast.personalDay}`} />
      <Card onPress={() => router.push('/(tabs)/forecast')} accessibilityLabel="Open Forecast">
        <Txt variant="heading" color="primary">{forecast.headline}</Txt>
        <Txt variant="body" color="textMuted">
          {forecast.body}
        </Txt>
        <Txt variant="caption" color="textMuted">
          A number to reflect on: {forecast.luckyNumber}
        </Txt>
        <Txt variant="caption" color="primary">View full forecast →</Txt>
      </Card>

      <SectionHeader title="Your Journey" subtitle="Ritual streak and quest progress" />
      <Card>
        <Txt variant="body">Quest Day {questDay} of 7</Txt>
        <Txt variant="body">{streakDays}-day ritual streak</Txt>
        <Txt variant="caption" color="textMuted">
          {dailyPackCompleted ? "Today's ritual pack is complete" : "Today's ritual pack is not complete"}
        </Txt>
      </Card>
    </Screen>
  );
}
