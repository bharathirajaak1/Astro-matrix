import React, { useEffect, useMemo, useState } from 'react';
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
import { useRitualStore } from '../src/features/remedies/ritualStore';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useProfileStore } from '../src/features/profile/store';
import { buildNumerologyReport } from '../src/core/numerology';
import { buildLoShuGrid } from '../src/core/loShu';
import { generateDailyForecast } from '../src/services/forecastEngine';

export default function DashboardScreen() {
  const profileStore = useProfileStore();
  const profile = (profileStore as any).profile;
  const [forecast, setForecast] = useState<any>(null);

  const activeDob = profile?.dob || '1995-02-18';
  const activeName = profile?.fullName || profile?.name || 'Seeker';
  const activeSystem = profile?.system || 'chaldean';

  const report = useMemo(() => {
    try {
      return buildNumerologyReport({
        id: profile?.id || 'default',
        fullName: activeName,
        dob: activeDob,
        system: activeSystem,
        createdAt: profile?.createdAt || new Date().toISOString(),
      });
    } catch {
      return null;
    }
  }, [profile, activeName, activeDob, activeSystem]);

  const loShuGrid = useMemo(() => {
    try {
      return buildLoShuGrid(activeDob);
    } catch {
      return { missing: [3] };
    }
  }, [activeDob]);

  const primaryMissing = loShuGrid.missing?.[0] ?? 3;

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const user = {
          name: activeName,
          dob: activeDob,
          life_path: report?.lifePath ?? 8,
          destiny: report?.destiny ?? 4,
        };
        const res = await generateDailyForecast(user as any);
        if (mounted) {
          setForecast(res);
        }
      } catch (err) {
        console.warn('Could not generate forecast:', err);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [activeName, activeDob, report]);

  const triggerNav = (path: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  const streakDays = useRitualStore((s) => s.streakDays);
const questDay = useRitualStore((s) => s.questDay);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top App Bar with Profile, Streak, and Settings */}
        <View style={styles.topAppBar}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => triggerNav('/profile/edit')}
            accessibilityLabel="Edit Profile"
          >
            <Text style={styles.iconSymbol}>👤</Text>
          </TouchableOpacity>

          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streakDays}-Day Streak</Text>
          </View>

          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => triggerNav('/settings')}
            accessibilityLabel="Settings"
          >
            <Text style={styles.iconSymbol}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Header Titles */}
        <View style={styles.titleSection}>
          <Text style={styles.headerSub}>ASTRO-MATRIX COMPASS</Text>
          <Text style={styles.greeting}>Good Morning, {activeName}!</Text>
        </View>

        {/* Energetic Snapshot Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>TODAY'S ENERGETIC SNAPSHOT</Text>
          <View style={styles.snapshotGrid}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>POWER COLOR</Text>
              <Text style={styles.snapshotValue}>
                {forecast?.color || 'Yellow, Saffron'}
              </Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>GOLDEN HOUR</Text>
              <Text style={styles.snapshotValue}>
                {forecast?.goldenHour || '10:00 AM - 11:30 AM'}
              </Text>
            </View>
          </View>

          <View style={[styles.snapshotGrid, { marginTop: 14 }]}>
            <TouchableOpacity
              style={styles.snapshotItem}
              onPress={() => triggerNav('/(tabs)/remedies')}
            >
              <Text style={styles.snapshotLabel}>FOCUS BLOCKAGE</Text>
              <Text style={[styles.snapshotValue, { color: '#5E7563' }]}>
                Number {primaryMissing} →
              </Text>
            </TouchableOpacity>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>CURRENT STREAK</Text>
              <Text style={styles.snapshotValue}>{streakDays} Days</Text>
            </View>
          </View>
        </View>

        {/* Forecast Navigation Pill Buttons (Week, Month, Year) */}
        <View style={styles.forecastRow}>
          <TouchableOpacity
            style={styles.forecastPill}
            onPress={() => triggerNav('/(tabs)/forecast')}
          >
            <Text style={styles.pillTitle}>WEEK</Text>
            <Text style={styles.pillSub}>7 Days</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forecastPill}
            onPress={() => triggerNav('/(tabs)/forecast')}
          >
            <Text style={styles.pillTitle}>MONTH</Text>
            <Text style={styles.pillSub}>30 Days</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forecastPill}
            onPress={() => triggerNav('/(tabs)/forecast')}
          >
            <Text style={styles.pillTitle}>YEAR</Text>
            <Text style={styles.pillSub}>Annual</Text>
          </TouchableOpacity>
        </View>

        {/* Active Blockage Quest Card */}
        <TouchableOpacity
          style={styles.questCard}
          onPress={() => triggerNav('/(tabs)/remedies')}
          activeOpacity={0.9}
        >
          <Text style={styles.questTag}>ACTIVE BLOCKAGE QUEST</Text>
          <Text style={styles.questHeading}>
            {forecast?.questTitle || 'Find Your Authentic Voice'}
          </Text>
          <Text style={styles.questBody}>
            Today: {forecast?.todaysTask || 'Write 3 honest thoughts in a journal without editing.'}
          </Text>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '40%' }]} />
          </View>
         <Text style={styles.progressText}>Day {questDay} of 7 - {Math.round((questDay / 7) * 100)}% Complete</Text>
        </TouchableOpacity>

        {/* Main Remedies Navigation Button */}
        <TouchableOpacity
          style={styles.remediesButton}
          onPress={() => triggerNav('/(tabs)/remedies')}
        >
          <Text style={styles.remediesButtonText}>View All Fortune Remedies</Text>
        </TouchableOpacity>

        {/* Direct Lo Shu & Numerology Quick Links */}
        <View style={styles.quickLinksRow}>
          <TouchableOpacity
            style={styles.quickLinkPill}
            onPress={() => triggerNav('/(tabs)/grid')}
          >
            <Text style={styles.quickLinkText}>📊 Lo Shu Grid</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLinkPill}
            onPress={() => triggerNav('/(tabs)/numerology')}
          >
            <Text style={styles.quickLinkText}>🔢 Core Numbers</Text>
          </TouchableOpacity>
        </View>

        {/* Compass Reminder Box */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Compass Reminder</Text>
          <Text style={styles.disclaimerBody}>
            Numerology is a mindful lens for your free will. Small intentional actions shape your day.
          </Text>
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
  container: { padding: 20, paddingBottom: 150 },
  topAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEE9E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSymbol: { fontSize: 18 },
  streakBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  streakText: { fontSize: 12, fontWeight: '800', color: '#E65100' },
  titleSection: { marginBottom: 16 },
  headerSub: { fontSize: 11, fontWeight: '700', color: '#888077', letterSpacing: 1.2 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#2C2523', marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDEBE6',
    marginBottom: 16,
  },
  cardSectionTitle: { fontSize: 11, fontWeight: '800', color: '#77706A', letterSpacing: 0.8, marginBottom: 12 },
  snapshotGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  snapshotItem: { flex: 1 },
  snapshotLabel: { fontSize: 10, fontWeight: '700', color: '#8C847E', letterSpacing: 0.5 },
  snapshotValue: { fontSize: 15, fontWeight: '800', color: '#2C2523', marginTop: 3 },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  forecastPill: {
    flex: 1,
    backgroundColor: '#EFEBE4',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  pillTitle: { fontSize: 11, fontWeight: '800', color: '#2C2523' },
  pillSub: { fontSize: 10, color: '#7C736C', marginTop: 2, fontWeight: '600' },
  questCard: {
    backgroundColor: '#F3EBF9',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E7D8F2',
  },
  questTag: { fontSize: 10, fontWeight: '800', color: '#6B4F82', letterSpacing: 0.8 },
  questHeading: { fontSize: 16, fontWeight: '800', color: '#2C2523', marginTop: 4, marginBottom: 4 },
  questBody: { fontSize: 13, color: '#554C5B', lineHeight: 18, marginBottom: 12 },
  progressBarTrack: { height: 6, backgroundColor: '#DFD0EC', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#7E57C2', borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '700', color: '#6B4F82', marginTop: 6 },
  remediesButton: {
    backgroundColor: '#5E7563',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  remediesButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  quickLinksRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  quickLinkPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDEBE6',
  },
  quickLinkText: { fontSize: 12, fontWeight: '700', color: '#2C2523' },
  disclaimerCard: {
    backgroundColor: '#F5F2EC',
    borderRadius: 14,
    padding: 14,
  },
  disclaimerTitle: { fontSize: 12, fontWeight: '800', color: '#5C544D', marginBottom: 4 },
  disclaimerBody: { fontSize: 11, color: '#7C736C', lineHeight: 16 },
});