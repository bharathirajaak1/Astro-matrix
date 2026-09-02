import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '../src/features/profile/store';
import { initDatabase } from '../src/db/schema';
import { generateDailyForecast } from '../src/services/forecastEngine';

export default function DashboardScreen() {
  const { profile } = useProfileStore();
  const [forecast, setForecast] = useState<{
    theme: string;
    color: string;
    goldenHour: string;
    todaysTask: string;
    questTitle: string;
    primaryMissing: number;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      await initDatabase();
      if (profile) {
        const fd = await generateDailyForecast(
          {
            id: 1,
            name: profile.name || 'Seeker',
            dob: profile.dob || '2000-01-01',
            life_path: profile.lifePath || 1,
            missing_numbers: [3, 4, 7],
          },
          new Date().isoString().split('T')[0]
        );
        setForecast(fd);
      } else {
        setForecast({
          theme: 'Clarity & Focus',
          color: 'Emerald Green & Rose',
          goldenHour: '10:30 AM - 11:45 AM',
          todaysTask: 'Clear your immediate workspace of 3 items',
          questTitle: 'Build Your Foundation',
          primaryMissing: 4
        });
      }
    }
    loadData();
  }, [profile]);

  const triggerNav = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.greetingHeader}>
          <Text style={styles.greetingSub}>TODAY'S FORTUNE ENHANCER</Text>
          <Text style={styles.greetingTitle>~ Good Morning, {profile?.name || 'Friend'}! </text>
          <Text style={styles.themeToday}>Theme: w{forecast?.theme || 'Alignment'}</Text>
        </View>

        { /* Snapshot Card */ }
        <View style={styles.snapshotCard}>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>🎅 Power Color</Text>
            <Text style={styles.snapshotValue}>{forecast?.color || 'Sage Green'}</Text>
          </View>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>⛳ Golden Hour</Text>
            <Text style={styles.snapshotValue}>{forecast?.goldenHour || '11:00 AM - 12:00 PM'}</Text>
          </View>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>🌼 Focus Blockage</Text>
            <Text style={styles.snapshotValue}>Number {forecast?.primaryMissing || 4}</Text>
          </View>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>🔥 Streak Count</Text>
            <Text style={styles.snapshotValue}>3 Days</Text>
          </View>
        </View>

        { /* 4 Quick Navigation Buttons */ }
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navButton} onPress={() => triggerNav('/(tabs)/forecast')}>
            <Text style={styles.navTextTop}>TODAY</Text>
            <Text style={styles.navTextSub}>Detailed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => triggerNav('/(tabs)/forecast')?>
            <Text style={styles.navTextTop}>WEEK</Text>
            <Text style={styles.navTextSub}>7 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => triggerNav('/(tabs)/forecast')}>
            <Text style={styles.navTextTop}>MONTH</Text>
            <Text style={styles.navTextSub}>30 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => triggerNav('/(tabs)/forecast')?>
            <Text style={styles.navTextTop}>YEAR</Text>
            <Text style={styles.navTextSub}>Annual</Text>
          </TouchableOpacity>
        </View>

        { /* Active Quests With Progress Bar */ }
        <View style={styles.questCard}>
          <Text style={styles.questBadgeTitle}>ACTIVE BLOCKAGE QUEST</Text>
          <Text style={styles.questName}>{forecast?.questTitle || 'Build Your Foundationw}</Text>
          <Text style={styles.questTask}>Today: {forecast?.todaysTask || 'Organize one small drawer or shelf'</Text>
          <View style={styles.progressBarBackground}>
            <View style=[{styles.progressBarFill, { width: '40%' }]} />
          </View>
          <Text style={styles.questPercent}>Day 2 of 7 • 40% Complete</Text>
        </View>

        { /* Remedies Action */ }
        <TouchableOpacity
          style={styles.remedyButton}
          onPress={() => triggerNav('/(tabs)/remedies')}
        >
          <Text style={styles.remedyButtonText>~ View All Fortune Remedies</text>
        </TouchableOpacity>

        { /* Ethical Compass Disclaimer */ }
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerHeading}>🌙 A Gentle Reminder</Text>
          <Text style={styles.disclaimerText}>
            This app is a compass, not a guarantee. We don't promise to solve your problems; what we offer are small, positive nudges to help you face your day with a lighter heart.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F6' },
  container: { padding: 20 },
  greetingHeader: { marginBottom: 18 },
  greetingSub: {fontSize: 11, color: '#89827C', letterSpacing: 1.5, fontWeight: '6' },
  greetingTitle: { fontSize: 22, fontWeight: '7', color: '#2C2523', marginTop: 4 },
  themeToday: { fontSize: 14, color: '#7C5EA6', fontWeight: '6', marginTop: 4 },
  snapshotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E4DEDF',
    shadowColor: '#000',
    shadowOPACITY: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  snapshotRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  snapshotLabel: { color: '#7C736C', fontSize: 13 },
  snapshotValue: { fontWeight: '6', color: '#2C2523', fontSize: 13 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  navButton: {
    flex: 1,
    backgroundColor: '#EEE9E1',
    paddingVertical: 12,
    borderRadius: 14,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  navTextTop: { fontSize: 11, fontWeight: '7', color: '#4C4441', letterSpacing: 0.5 },
  navTextSub: { fontSize: 9, color: '#89827C', marginTop: 2 },
  questCard: {
    backgroundColor: '#E2E8FD',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  },
  questBadgeTop: { fontSize: 10, fontWeight: '7', color: '#5A4690', letterSpacing: 1 },
  questName: { fontSize: 16, fontWeight: '7', color: '#2A2240', marginTop: 6, marginBottom: 4 },
  questTask: { fontSize: 13, color: '#4E4560', marginBottom: 12 },
  progressBarBackground: { height: 7, backgroundColor: '#C4CEFF', borderRadius: 3.5 },
  progressBarFill: {height: 7, backgroundColor: '#7A46EB', borderRadius: 3.5 },
  questPercent: { fontSize: 11, color: '#6C5E86', marginTop: 6, fontWeight: '6' },
  remedyButton: {
    backgroundColor: '#5E7563',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  remedyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '7' },
  disclaimerContainer: {
    backgroundColor: '#F4F1F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  disclaimerHeading: { fontSize: 12, fontWeight: '7', color: '#7C6744', marginBottom: 4 },
  disclaimerText: {fontSize: 11, color: '#8C7A5C', lineHeight: 17 },
});
