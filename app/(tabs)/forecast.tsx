import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/features/profile/store';
import { useTheme } from '@/ui/theme';
import { buildNumerologyReport } from '@/core/numerology';
import {
  buildAnnualForecast,
  buildForecast,
  buildMonthlyForecast,
  buildWeeklyForecast,
  dayWatchFor,
  personalDayBreakdown,
  personalMonthBreakdown,
  personalNumbers,
  personalWeek,
  personalWeekBreakdown,
  personalYearBreakdown,
  weekBounds,
} from '@/core/forecast';
import {
  FOCUS_COPY,
  explainDayCalculation,
  explainMonthCalculation,
  explainPersonalNumber,
  explainWeekCalculation,
  explainYearCalculation,
  themeClauseFor,
} from '@/data/interpretations';
import { forecastBlueprintContext } from '@/data/forecastContext';
import { formatDateRange, formatMonthYear, formatUSDate, formatYearOnly } from '@/lib/date';

type ForecastTab = 'day' | 'week' | 'month' | 'year';

export default function ForecastScreen() {
  const theme = useTheme();
  const profileStore = useProfileStore();
  const profile = (profileStore as any).profile;

  const [activeTab, setActiveTab] = useState<ForecastTab>('day');
  const [dayCalcExpanded, setDayCalcExpanded] = useState(false);
  const [weekCalcExpanded, setWeekCalcExpanded] = useState(false);
  const [monthCalcExpanded, setMonthCalcExpanded] = useState(false);
  const [yearCalcExpanded, setYearCalcExpanded] = useState(false);

  const activeDob = profile?.dob || '1995-02-18';
  const activeName = profile?.fullName || profile?.name || 'Seeker';
  const activeSystem = profile?.system || 'chaldean';

  // Today's ISO date (YYYY-MM-DD)
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const forecastData = useMemo(() => {
    try {
      const activeProfile = {
        id: profile?.id || 'temp',
        fullName: activeName,
        dob: activeDob,
        system: activeSystem,
        createdAt: profile?.createdAt || new Date().toISOString(),
      };

      const cycles = personalNumbers(activeDob, todayIso);
      const weekDigit = personalWeek(activeDob, todayIso);
      const { weekStart, weekEnd } = weekBounds(todayIso);

      const day = buildForecast(activeProfile, todayIso);
      const watchFor = dayWatchFor(activeProfile, todayIso);
      const week = buildWeeklyForecast(activeProfile, todayIso);
      const month = buildMonthlyForecast(activeProfile, todayIso);
      const year = buildAnnualForecast(activeProfile, todayIso);

      return { cycles, weekDigit, weekStart, weekEnd, day, watchFor, week, month, year };
    } catch {
      return null;
    }
  }, [profile, activeName, activeDob, activeSystem, todayIso]);

  // Canonical NumerologyReport, built the same way every other screen
  // (Blueprint, Home, SWOT) already does - never recalculated here, and
  // `null` (not a fabricated fallback) when there's no real profile yet.
  const report = useMemo(
    () => (profile ? buildNumerologyReport(profile) : null),
    [profile],
  );
  const todaySoulUrgeContext = useMemo(
    () => forecastBlueprintContext(report, 'day'),
    [report],
  );
  const weekPersonalityContext = useMemo(
    () => forecastBlueprintContext(report, 'week'),
    [report],
  );
  const monthDestinyContext = useMemo(
    () => forecastBlueprintContext(report, 'month'),
    [report],
  );
  const yearLifePathContext = useMemo(
    () => forecastBlueprintContext(report, 'year'),
    [report],
  );

  const cycles = forecastData?.cycles;
  const weekDigit = forecastData?.weekDigit ?? 1;
  const weekStart = forecastData?.weekStart ?? todayIso;
  const weekEnd = forecastData?.weekEnd ?? todayIso;
  const day = forecastData?.day;
  const watchFor = forecastData?.watchFor;
  const week = forecastData?.week;
  const month = forecastData?.month;
  const year = forecastData?.year;

  const selectTab = (tab: ForecastTab) => {
    void Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const dayExplanation = explainPersonalNumber('day', cycles?.personalDay ?? 1);
  const weekExplanation = explainPersonalNumber('week', weekDigit);
  const monthExplanation = explainPersonalNumber('month', cycles?.personalMonth ?? 1);
  const yearExplanation = explainPersonalNumber('year', cycles?.personalYear ?? 1);

  const dayCalculation = explainDayCalculation(personalDayBreakdown(activeDob, todayIso));
  const weekCalculation = explainWeekCalculation(personalWeekBreakdown(activeDob, todayIso));
  const monthCalculation = explainMonthCalculation(personalMonthBreakdown(activeDob, todayIso));
  const yearCalculation = explainYearCalculation(personalYearBreakdown(activeDob, todayIso));

  const luckyNumber = day?.luckyNumber ?? 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>PERSONAL FORECAST</Text>
          <Text style={styles.headerTitle}>Your Personal Forecast</Text>
          <Text style={styles.headerDate}>
            {activeName} • Born {formatUSDate(activeDob)}
          </Text>
          <Text style={styles.headerDate}>
            Based on today's date — {formatUSDate(todayIso)}, your personal forecast periods are shown below.
          </Text>
        </View>

        {/* Period Cards */}
        <View style={styles.cyclesRow}>
          <TouchableOpacity
            style={[styles.cycleCard, activeTab === 'day' && styles.cycleCardActive]}
            onPress={() => selectTab('day')}
          >
            <Text style={styles.cycleLabel}>TODAY</Text>
            <Text style={styles.cycleValue}>{cycles?.personalDay ?? 1}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cycleCard, activeTab === 'week' && styles.cycleCardActive]}
            onPress={() => selectTab('week')}
          >
            <Text style={styles.cycleLabel}>THIS WEEK</Text>
            <Text style={styles.cycleValue}>{weekDigit}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cycleCard, activeTab === 'month' && styles.cycleCardActive]}
            onPress={() => selectTab('month')}
          >
            <Text style={styles.cycleLabel}>THIS MONTH</Text>
            <Text style={styles.cycleValue}>{cycles?.personalMonth ?? 1}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cycleCard, activeTab === 'year' && styles.cycleCardActive]}
            onPress={() => selectTab('year')}
          >
            <Text style={styles.cycleLabel}>THIS YEAR</Text>
            <Text style={styles.cycleValue}>{cycles?.personalYear ?? 1}</Text>
          </TouchableOpacity>
        </View>

        {/* Period Switcher */}
        <View style={styles.switcher}>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'day' && styles.switchTabActive]}
            onPress={() => selectTab('day')}
          >
            <Text style={[styles.switchText, activeTab === 'day' && styles.switchTextActive]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'week' && styles.switchTabActive]}
            onPress={() => selectTab('week')}
          >
            <Text style={[styles.switchText, activeTab === 'week' && styles.switchTextActive]}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'month' && styles.switchTabActive]}
            onPress={() => selectTab('month')}
          >
            <Text style={[styles.switchText, activeTab === 'month' && styles.switchTextActive]}>This Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'year' && styles.switchTabActive]}
            onPress={() => selectTab('year')}
          >
            <Text style={[styles.switchText, activeTab === 'year' && styles.switchTextActive]}>This Year</Text>
          </TouchableOpacity>
        </View>

        {/* TODAY'S FORECAST */}
        {activeTab === 'day' && (
          <View style={styles.card}>
            <Text style={styles.periodTitle}>TODAY'S FORECAST</Text>
            <Text style={styles.periodDate}>{formatUSDate(todayIso)}</Text>

            <View style={styles.divider} />

            <Text style={styles.numberStatement}>{dayExplanation.numberStatement}</Text>
            <Text style={styles.cardBody}>{dayExplanation.represents}</Text>
            <Text style={styles.explanationLine}>{dayExplanation.whyRelevant}</Text>
            {todaySoulUrgeContext && (
              <Text style={styles.explanationLine}>{todaySoulUrgeContext}</Text>
            )}

            <TouchableOpacity
              style={styles.expandRow}
              onPress={() => {
                void Haptics.selectionAsync();
                setDayCalcExpanded((prev) => !prev);
              }}
            >
              <Text style={[styles.expandLabel, { color: theme.colors.primary }]}>
                {dayCalcExpanded ? '▲ Hide' : '▼ How is this calculated?'}
              </Text>
            </TouchableOpacity>
            {dayCalcExpanded && (
              <Text style={styles.cardBody}>{dayCalculation}</Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.guidelinesTitle}>Your Day Ahead</Text>
            <Text style={[styles.cardTheme, { color: theme.colors.primary }]}>{day?.headline}</Text>
            <Text style={styles.cardBody}>{day?.body}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>What to Watch For</Text>
            <Text style={[styles.cardTheme, { color: theme.colors.primary }]}>{watchFor?.headline}</Text>
            <Text style={styles.cardBody}>{watchFor?.body}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>
              Your Focus Today: {FOCUS_COPY[day?.focus ?? 'plan']?.label}
            </Text>
            <Text style={styles.cardBody}>{FOCUS_COPY[day?.focus ?? 'plan']?.hint}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>Today's Recommendations</Text>
            <View style={styles.guideRow}>
              <Text style={styles.guideBullet}>•</Text>
              <Text style={styles.guideText}>
                Check the Remedies tab for today's recommended practice, especially during the morning.
              </Text>
            </View>
            <View style={styles.guideRow}>
              <Text style={styles.guideBullet}>•</Text>
              <Text style={styles.guideText}>
                Use today's focus as a guide for your priorities rather than a fixed rule.
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.secondaryLabel}>A Number to Reflect On: {luckyNumber}</Text>
            <Text style={styles.secondaryText}>
              You can use {luckyNumber} as a simple personal reminder today — for example, choose {luckyNumber}{' '}
              {luckyNumber === 1 ? 'priority' : 'priorities'}, take {luckyNumber} {luckyNumber === 1 ? 'minute' : 'minutes'} to
              reflect, or notice moments involving {themeClauseFor(luckyNumber)}.
            </Text>
          </View>
        )}

        {/* WEEKLY FORECAST */}
        {activeTab === 'week' && (
          <View style={styles.card}>
            <Text style={styles.periodTitle}>WEEKLY FORECAST</Text>
            <Text style={styles.periodDate}>{formatDateRange(weekStart, weekEnd)}</Text>

            <View style={styles.divider} />

            <Text style={styles.numberStatement}>{weekExplanation.numberStatement}</Text>
            <Text style={styles.cardBody}>{weekExplanation.represents}</Text>
            <Text style={styles.explanationLine}>{weekExplanation.whyRelevant}</Text>
            {weekPersonalityContext && (
              <Text style={styles.explanationLine}>{weekPersonalityContext}</Text>
            )}

            <TouchableOpacity
              style={styles.expandRow}
              onPress={() => {
                void Haptics.selectionAsync();
                setWeekCalcExpanded((prev) => !prev);
              }}
            >
              <Text style={[styles.expandLabel, { color: theme.colors.primary }]}>
                {weekCalcExpanded ? '▲ Hide' : '▼ How is this calculated?'}
              </Text>
            </TouchableOpacity>
            {weekCalcExpanded && (
              <Text style={styles.cardBody}>{weekCalculation}</Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.guidelinesTitle}>Your Week Ahead</Text>
            <Text style={[styles.cardTheme, { color: theme.colors.primary }]}>{week?.headline}</Text>
            <Text style={styles.cardBody}>{week?.body}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>Key Themes This Week</Text>
            <Text style={[styles.cardTheme, { color: theme.colors.primary }]}>{week?.themeHeadline}</Text>
            <Text style={styles.cardBody}>{week?.themeBody}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>
              Your Focus This Week: {FOCUS_COPY[week?.focus ?? 'plan']?.label}
            </Text>
            <Text style={styles.cardBody}>{FOCUS_COPY[week?.focus ?? 'plan']?.hint}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>Weekly Recommendations</Text>
            <View style={styles.guideRow}>
              <Text style={styles.guideBullet}>•</Text>
              <Text style={styles.guideText}>
                Look back at this week's theme as you plan your priorities for the days ahead.
              </Text>
            </View>
            <View style={styles.guideRow}>
              <Text style={styles.guideBullet}>•</Text>
              <Text style={styles.guideText}>
                Notice which day feels most aligned with the week's focus, and build around it.
              </Text>
            </View>
          </View>
        )}

        {/* MONTHLY FORECAST */}
        {activeTab === 'month' && (
          <View style={styles.card}>
            <Text style={styles.periodTitle}>MONTHLY FORECAST</Text>
            <Text style={styles.periodDate}>{formatMonthYear(todayIso).toUpperCase()}</Text>

            <View style={styles.divider} />

            <Text style={styles.numberStatement}>{monthExplanation.numberStatement}</Text>
            <Text style={styles.cardBody}>{monthExplanation.represents}</Text>
            <Text style={styles.explanationLine}>{monthExplanation.whyRelevant}</Text>
            {monthDestinyContext && (
              <Text style={styles.explanationLine}>{monthDestinyContext}</Text>
            )}

            <TouchableOpacity
              style={styles.expandRow}
              onPress={() => {
                void Haptics.selectionAsync();
                setMonthCalcExpanded((prev) => !prev);
              }}
            >
              <Text style={[styles.expandLabel, { color: theme.colors.primary }]}>
                {monthCalcExpanded ? '▲ Hide' : '▼ How is this calculated?'}
              </Text>
            </TouchableOpacity>
            {monthCalcExpanded && (
              <Text style={styles.cardBody}>{monthCalculation}</Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.guidelinesTitle}>Your Month Ahead</Text>
            <Text style={[styles.cardTheme, { color: theme.colors.primary }]}>{month?.headline}</Text>
            <Text style={styles.cardBody}>{month?.body}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>Key Themes This Month</Text>
            <Text style={[styles.cardTheme, { color: theme.colors.primary }]}>{month?.themeHeadline}</Text>
            <Text style={styles.cardBody}>{month?.themeBody}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>
              Your Focus This Month: {FOCUS_COPY[month?.focus ?? 'plan']?.label}
            </Text>
            <Text style={styles.cardBody}>{FOCUS_COPY[month?.focus ?? 'plan']?.hint}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>Monthly Recommendations</Text>
            <View style={styles.guideRow}>
              <Text style={styles.guideBullet}>•</Text>
              <Text style={styles.guideText}>
                Use this month's theme to guide bigger decisions rather than day-to-day details.
              </Text>
            </View>
            <View style={styles.guideRow}>
              <Text style={styles.guideBullet}>•</Text>
              <Text style={styles.guideText}>
                Revisit your goals partway through the month to see how they're tracking against this theme.
              </Text>
            </View>
          </View>
        )}

        {/* ANNUAL FORECAST */}
        {activeTab === 'year' && (
          <View style={styles.card}>
            <Text style={styles.periodTitle}>ANNUAL FORECAST</Text>
            <Text style={styles.periodDate}>{formatYearOnly(todayIso)}</Text>

            <View style={styles.divider} />

            <Text style={styles.numberStatement}>{yearExplanation.numberStatement}</Text>
            <Text style={styles.cardBody}>{yearExplanation.represents}</Text>
            <Text style={styles.explanationLine}>{yearExplanation.whyRelevant}</Text>
            {yearLifePathContext && (
              <Text style={styles.explanationLine}>{yearLifePathContext}</Text>
            )}

            <TouchableOpacity
              style={styles.expandRow}
              onPress={() => {
                void Haptics.selectionAsync();
                setYearCalcExpanded((prev) => !prev);
              }}
            >
              <Text style={[styles.expandLabel, { color: theme.colors.primary }]}>
                {yearCalcExpanded ? '▲ Hide' : '▼ How is this calculated?'}
              </Text>
            </TouchableOpacity>
            {yearCalcExpanded && (
              <Text style={styles.cardBody}>{yearCalculation}</Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.guidelinesTitle}>Your Year Ahead</Text>
            <Text style={[styles.cardTheme, { color: theme.colors.primary }]}>{year?.headline}</Text>
            <Text style={styles.cardBody}>{year?.body}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>Key Themes This Year</Text>
            <Text style={[styles.cardTheme, { color: theme.colors.primary }]}>{year?.themeHeadline}</Text>
            <Text style={styles.cardBody}>{year?.themeBody}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>
              Your Focus This Year: {FOCUS_COPY[year?.focus ?? 'plan']?.label}
            </Text>
            <Text style={styles.cardBody}>{FOCUS_COPY[year?.focus ?? 'plan']?.hint}</Text>

            <Text style={[styles.guidelinesTitle, { marginTop: 14 }]}>Annual Recommendations</Text>
            <View style={styles.guideRow}>
              <Text style={styles.guideBullet}>•</Text>
              <Text style={styles.guideText}>
                Let this year's theme inform your longer-term plans rather than daily choices.
              </Text>
            </View>
            <View style={styles.guideRow}>
              <Text style={styles.guideBullet}>•</Text>
              <Text style={styles.guideText}>
                Revisit this theme at the start of each new month to stay oriented.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  container: { padding: 20, paddingBottom: 60 },
  header: { marginBottom: 18 },
  headerSub: { fontSize: 11, fontWeight: '800', color: '#77706A', letterSpacing: 0.8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#2C2523', marginTop: 4 },
  headerDate: { fontSize: 12, color: '#5F5A55', marginTop: 4 },
  cyclesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  cycleCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDEBE6',
  },
  cycleCardActive: { borderColor: '#5E7563', backgroundColor: '#F3F8F4' },
  cycleLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8C847E',
    letterSpacing: 0.5,
    lineHeight: 11,
    minHeight: 22,
    textAlign: 'center',
  },
  cycleValue: { fontSize: 24, fontWeight: '800', color: '#2C2523', marginTop: 4 },
  switcher: {
    flexDirection: 'row',
    backgroundColor: '#EFEBE4',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  switchTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  switchTabActive: { backgroundColor: '#FFFFFF' },
  switchText: { fontSize: 12, fontWeight: '700', color: '#7C736C' },
  switchTextActive: { color: '#2C2523' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EDEBE6',
  },
  periodTitle: { fontSize: 11, fontWeight: '800', color: '#77706A', letterSpacing: 0.8 },
  periodDate: { fontSize: 18, fontWeight: '800', color: '#2C2523', marginTop: 4 },
  numberStatement: { fontSize: 15, fontWeight: '800', color: '#2C2523', marginBottom: 6 },
  explanationLine: { fontSize: 12, color: '#5F5A55', lineHeight: 18, marginTop: 6 },
  cardTheme: { fontSize: 13, fontWeight: '800', color: '#2C2523', marginBottom: 8, marginTop: 2 },
  cardBody: { fontSize: 13, color: '#5F5A55', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#F0ECE6', marginVertical: 14 },
  expandRow: { marginTop: 10 },
  expandLabel: { fontSize: 12, fontWeight: '700' },
  guidelinesTitle: { fontSize: 14, fontWeight: '800', color: '#2C2523', marginBottom: 10 },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4 },
  guideBullet: { fontSize: 14, color: '#5E7563', marginRight: 8, lineHeight: 18 },
  guideText: { fontSize: 12, color: '#5F5A55', lineHeight: 18, flex: 1 },
  secondaryLabel: { fontSize: 12, fontWeight: '700', color: '#77706A' },
  secondaryText: { fontSize: 11, color: '#5F5A55', lineHeight: 17, marginTop: 4 },
});
