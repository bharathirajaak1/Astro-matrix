import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { buildForecast, buildForecastRange } from '@/core/forecast';
import { FOCUS_COPY } from '@/data/interpretations';
import { formatLongDate, formatShortDate, todayISO } from '@/lib/date';
import { useProfileStore } from '@/features/profile/store';
import { Card, Chip, NumberBadge, Screen, SectionHeader, Txt } from '@/ui/components';
import { radius, spacing, useTheme } from '@/ui/theme';

export default function ForecastScreen() {
  const theme = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const today = todayISO();

  const [selected, setSelected] = useState(today);

  const week = useMemo(
    () => (profile ? buildForecastRange(profile, today, 7) : []),
    [profile, today],
  );
  const forecast = useMemo(
    () => (profile ? buildForecast(profile, selected) : null),
    [profile, selected],
  );

  if (!profile || !forecast) {
    return <Redirect href="/" />;
  }

  const focus = FOCUS_COPY[forecast.focus];

  return (
    <Screen>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
      >
        {week.map((day) => {
          const active = day.date === selected;
          return (
            <Pressable
              key={day.date}
              onPress={() => setSelected(day.date)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${formatShortDate(day.date)}, personal day ${day.personalDay}`}
              style={{
                width: 68,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                alignItems: 'center',
                gap: spacing.xs,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
              }}
            >
              <Txt variant="caption" color="textMuted">
                {formatShortDate(day.date).split(' ')[0]}
              </Txt>
              <Txt variant="heading" color={active ? 'primary' : 'text'}>
                {day.personalDay}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      <Card>
        <Txt variant="caption" color="textMuted">
          {selected === today ? 'TODAY' : formatShortDate(selected).toUpperCase()}
        </Txt>
        <Txt variant="title">{forecast.headline}</Txt>
        <Txt variant="body" color="textMuted">
          {formatLongDate(selected)}
        </Txt>
        <Txt variant="body" style={{ marginTop: spacing.xs }}>
          {forecast.body}
        </Txt>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <Chip label={`Focus: ${focus?.label ?? forecast.focus}`} tone="primary" />
          <Chip label={`Lucky number ${forecast.luckyNumber}`} tone="accent" />
        </View>
        {focus ? (
          <Txt variant="caption" color="textMuted">
            {focus.hint}
          </Txt>
        ) : null}
      </Card>

      <SectionHeader title="Your cycles for this day" />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          {(
            [
              ['Year', forecast.personalYear],
              ['Month', forecast.personalMonth],
              ['Day', forecast.personalDay],
            ] as const
          ).map(([label, value]) => (
            <View key={label} style={{ alignItems: 'center', gap: spacing.xs }}>
              <NumberBadge value={value} size="sm" label={`Personal ${label.toLowerCase()} ${value}`} />
              <Txt variant="caption" color="textMuted">
                Personal {label}
              </Txt>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
