import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/features/profile/store';
import { buildNumerologyReport } from '@/core/numerology';
import { personalNumbers, buildForecast } from '@/core/forecast';

type ForecastTab = 'day' | 'month' | 'year';

export default function ForecastScreen() {
  const profileStore = useProfileStore();
  const profile = (profileStore as any).profile;

  const [activeTab, setActiveTab] = useState<ForecastTab>('day');

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

      const report = buildNumerologyReport(activeProfile);
      const cycles = personalNumbers(activeDob, todayIso);
      const forecast = buildForecast(activeProfile, todayIso);

      return {
        report,
        cycles,
        forecast,
      };
    } catch {
      return null;
    }
  }, [profile, activeName, activeDob, activeSystem, todayIso]);

  const cycles = forecastData?.cycles;
  const forecast = forecastData?.forecast;
  const report = forecastData?.report;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>TEMPORAL MATRIX</Text>
          <Text style={styles.headerTitle}>Personal Cycles & Forecast</Text>
          <Text style={styles.headerDate}>
            {activeName} • DOB: {activeDob}
          </Text>
        </View>

        {/* Cycle Numbers Grid */}
        <View style={styles.cyclesRow}>
          <View style={[styles.cycleCard, activeTab === 'day' && styles.cycleCardActive]}>
            <Text style={styles.cycleLabel}>PERSONAL DAY</Text>
            <Text style={styles.cycleValue}>{cycles?.personalDay ?? 1}</Text>
          </View>
          <View style={[styles.cycleCard, activeTab === 'month' && styles.cycleCardActive]}>
            <Text style={styles.cycleLabel}>PERSONAL MONTH</Text>
            <Text style={styles.cycleValue}>{cycles?.personalMonth ?? 3}</Text>
          </View>
          <View style={[styles.cycleCard, activeTab === 'year' && styles.cycleCardActive]}>
            <Text style={styles.cycleLabel}>PERSONAL YEAR</Text>
            <Text style={styles.cycleValue}>{cycles?.personalYear ?? 8}</Text>
          </View>
        </View>

        {/* Time Horizon Segment Switcher */}
        <View style={styles.switcher}>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'day' && styles.switchTabActive]}
            onPress={() => {
              void Haptics.selectionAsync();
              setActiveTab('day');
            }}
          >
            <Text style={[styles.switchText, activeTab === 'day' && styles.switchTextActive]}>
              Today's Flow
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'month' && styles.switchTabActive]}
            onPress={() => {
              void Haptics.selectionAsync();
              setActiveTab('month');
            }}
          >
            <Text style={[styles.switchText, activeTab === 'month' && styles.switchTextActive]}>
              Monthly Focus
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'year' && styles.switchTabActive]}
            onPress={() => {
              void Haptics.selectionAsync();
              setActiveTab('year');
            }}
          >
            <Text style={[styles.switchText, activeTab === 'year' && styles.switchTextActive]}>
              Annual Arch
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Context Card */}
        {activeTab === 'day' && (
          <View style={styles.card}>
            <Text style={styles.cardTheme}>
              Personal Day {cycles?.personalDay ?? 1}: Energetic Alignment
            </Text>
            <Text style={styles.cardBody}>
              {forecast?.theme ||
                `Today carries the vibrational frequency of Personal Day ${cycles?.personalDay}. Align your highest priorities with deliberate focus, minimizing scattered reactions.`}
            </Text>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Life Path Transit</Text>
              <Text style={styles.metaVal}>Number {report?.lifePath ?? 8}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Destiny Resonance</Text>
              <Text style={styles.metaVal}>Number {report?.destiny ?? 4}</Text>
            </View>
          </View>
        )}

        {activeTab === 'month' && (
          <View style={styles.card}>
            <Text style={styles.cardTheme}>
              Personal Month {cycles?.personalMonth ?? 3}: Monthly Theme
            </Text>
            <Text style={styles.cardBody}>
              This month operates under the {cycles?.personalMonth} vibration within your broader Year {cycles?.personalYear} cycle. It serves as an opportune window to harmonize projects, balance communication, and work with your active Lo Shu remedies.
            </Text>
          </View>
        )}

        {activeTab === 'year' && (
          <View style={styles.card}>
            <Text style={styles.cardTheme}>
              Personal Year {cycles?.personalYear ?? 8}: Master Direction
            </Text>
            <Text style={styles.cardBody}>
              A Personal Year {cycles?.personalYear} marks a major epoch in your 9-year cycle. This is a season for stepping into authority, establishing structure, and addressing long-standing blockages with disciplined daily rituals.
            </Text>
          </View>
        )}

        {/* Action Guidelines */}
        <View style={styles.card}>
          <Text style={styles.guidelinesTitle}>Energetic Recommendations</Text>
          <View style={styles.guideRow}>
            <Text style={styles.guideBullet}>•</Text>
            <Text style={styles.guideText}>
              Leverage your active remedy quest in the Remedies tab during optimal morning hours.
            </Text>
          </View>
          <View style={styles.guideRow}>
            <Text style={styles.guideBullet}>•</Text>
            <Text style={styles.guideText}>
              Align agreements and decisions when your Personal Day and Life Path frequencies harmonize.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  container: { padding: 20, paddingBottom: 60 },
  header: { marginBottom: 18 },
  headerSub: { fontSize: 11, fontWeight: '800', color: '#77706A', letterSpacing: 0.8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#2C2523', marginTop: 4 },
  headerDate: { fontSize: 12, color: '#8C847E', marginTop: 4 },
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
  cycleLabel: { fontSize: 8, fontWeight: '800', color: '#8C847E', letterSpacing: 0.5 },
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
  cardTheme: { fontSize: 15, fontWeight: '800', color: '#2C2523', marginBottom: 8 },
  cardBody: { fontSize: 13, color: '#6A625B', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#F0ECE6', marginVertical: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  metaLabel: { fontSize: 12, color: '#8C847E' },
  metaVal: { fontSize: 12, fontWeight: '700', color: '#2C2523' },
  guidelinesTitle: { fontSize: 14, fontWeight: '800', color: '#2C2523', marginBottom: 10 },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4 },
  guideBullet: { fontSize: 14, color: '#5E7563', marginRight: 8, lineHeight: 18 },
  guideText: { fontSize: 12, color: '#6A625B', lineHeight: 18, flex: 1 },
});