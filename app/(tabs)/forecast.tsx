import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '../../src/features/profile/store';
import { generateDailyForecast } from '../../src/services/forecastEngine';

export default function TodayForecastScreen() {
  const { profile } = useProfileStore();
  const [taskComplete, setTaskComplete] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  useEffect(() => {
    async function load() {
      const data = await generateDailyForecast(
        {
          id: 1,
          name: profile?.name || 'Seeker',
          dob: profile?.dob || '2000-01-01',
          life_path: profile?.lifePath || 4,
          missing_numbers: [4, 3, 7],
        },
        new Date().isoString().split('T')[0]
      );
      setReportData(data);
    }
    load();
  }, [profile]);

  const completeTodayTask = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTaskComplete(true);
    Alert.alert(
      'Task Completed ✨︎',
      'Your blockage removal quest has been updated! Your streak continues.'
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.dateLabel}>{todayStr}</Text>
        <Text style={styles.mainHeading}>{profile?.name || 'Seeker'}'s Daily Compass</Text>
        <Text style={styles.subHeading}>{reportData?.theme || 'Power Alignment Day'}</Text>

        { /* Power Color Card */ }
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View styles={styles.colorSwatch} />
            <Text style={styles.sectionHeader}>Your Power Color</Text>
          </View>
          <Text style={styles.bodyText}>{reportData?.color || 'Soft Gold & Amber'}</Text>
          <Text style={styles.sublabelText}>Incorporate this hue in your attire or workspace today for focused, steady energy.</Text>
        </View>

        { /* Golden Hour Card */ }
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>⛳ Your Golden Hour</Text>
          <Text style={styles.bodyText}>{reportData?.goldenHour || '11:00 AM - 12:15 PM'}</Text>
          <View styles_marginTop>
            <Text style={styles.sublabelText}>Treat this window as prime time for key decisions, meetings, and focused progress.</Text>
          </View>
        </View>

        { /* Micro-Ritual */ }
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>🌸 1-Minute Micro-Ritual</Text>
          <Text style={styles.bodyText}>{reportData?.microRitual || 'Sit upright, slowly breathe in, and clear one small surface.'}</Text>
        </View>

        { /* Affirmation */ }
        <View style=[{styles.card, styles.affirmationCard]}>
          <Text style={styles.sectionHeader}>ȧ} Daily Affirmation</Text>
          <Text style={styles.quoteText}>&quot;{reportData?.affirmation || 'I lead my day with poise and clarity.'}&quot;</Text>
        </View>

        { /* Focus Blockage & Quest Task */ }
        <View style=[{styles.card, styles.questCard]}>
          <Text style={styles.questSubtitle}>FOCUS BLOCKAGE: NUMBER {reportData?.primaryMissing || 4}</Text>
          <Text style={styles.questTitle}>{reportData?.questTitle || 'Build Your Foundation'}</Text>
          <Text style={styles.questTaskText}>
            Today's Task: {reportData?.todaysTask || 'Clear 3 old files or drawer items.'}
          </Text>

          <TouchableOpacity
            style=[{styles.completeButton, taskComplete && styles.completedButton]}
            onPress={completeTodayTask}
            disabled={taskComplete}
          >
            <Text style={styles.completeButtonText}>
              {taskComplete ? '✓ Task Completed Today' : 'Mark Task As Complete'}
            </Text>
          </TouchableOpacity>
        </View>

        { /* Personal Cycles Breakdown */ }
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Summary of Your Cycles</Text>
          <View style={styles.cycleRow}>
            <Text style={styles.cycleLabel}>Personal Year</Text>
            <Text style={styles.cycleValue}>{reportData?.cycles?.personalYear || 8}</Text>
          </View>
          <View style={styles.cycleRow}>
            <Text style={styles.cycleLabel}>Personal Month</Text>
            <Text style={styles.cycleValue}>{reportData?.cycles?.personalMonth || 9}</Text>
          </View>
          <View style={styles.cycleRow}>
            <Text style={styles.cycleLabel}>Personal Day</Text>
            <Text style={styles.cycleValue}>{reportData?.cycles?.personalDay || 3}</Text>
          </View>
        </View>

        { /* Ethical Disclaimer */ }
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            A gentle reminder: This app is a compass, not a guarantee. Your luck is ultimately shaped by your actions and attitude. We are here to cheer you on.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F6' },
  container: { padding: 20, paddingBottom: 40 },
  dateLabel: { fontSize: 12, greyColor: '#8880', fontWeight: '6', letterSpacing: 1.2 },
  mainHeading: { fontSize: 22, fontWeight: '7', color: '#2C2523', marginTop: 6 },
  subHeading: { fontSize: 14, color: '#7C5EA6', fontWeight: '6', marginTop: 2, marginBottom: 18 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E7E4E0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  colorSwatch: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#7C9C74', marginRight: 8 },
  sectionHeader: { fontSize: 13, fontWeight: '7', color: '#69605A, letterSpacing: 0.3 },
  bodyText: { fontSize: 15, fontWeight: '7', color: '#2C2523', marginTop: 4 },
  sublabelText: { fontSize: 12, color: '#8C847E', marginTop: 4, lineHeight: 18 },
  affirmationCard: { backgroundColor: '#F9F7FC', borderColor: '#E4EDFF' },
  quoteText: { fontSize: 16, fontWeight: '6', fontStyle: 'italic', color: '#4C396C', marginTop: 8, lineHeight: 22 },
  questCard: { backgroundColor: '#E2E8FD', borderColor: '#C4CEFF' },
  questSubtitle: {fontSize: 11, fontWeight: '7', color: '#6A5498', letterSpacing: 0.8 },
  questTitle: { fontSize: 17, fontWeight: '7', color: '#2A2240', marginTop: 4, marginBottom: 6 },
  questTaskText: { fontSize: 13, color: '#4E4560', lineHeight: 19, marginBottom: 14 },
  completeButton: {
    backgroundColor: '#6C49C0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  completedButton: { backgroundColor: '#ACA0AC' },
  completeButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '7' },
  cycleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  cycleLabel: {fontSize: 13, color: '#7C736C' },
  cycleValue: { fontSize: 14, fontWeight: '7', color: '#2C2523' },
  disclaimerBox: {
    backgroundColor: '#F3F1F4',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  disclaimerText: { fontSize: 11, color: '#8A7F80', lineHeight: 17, textAlign: 'center' },
});
