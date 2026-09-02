import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function ActivitiesTrackerScreen() {
  const [streak, setStreak] = useState(4);
  const [task10Done, setTask10Done] = useState(false);

  const weekDays = [
    { day: 'M', done: true },
    { day: 'T', done: true },
    { day: 'W', done: true },
    { day: 'T', done: true },
    { day: 'F', done: false },
    { day: 'S', done: false },
    { day: 'S', done: false },
  ];

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTask10Done(true);
    setStreak(prev => prev + 1);
    Alert.alert('Walk completed! 🟕', 'Your activity streak has been extended!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerSub}>PROGRESS &point;</Text>
        <Text style={styles.headerTitle}>Activities Tracker</Text>

        { /* Streak Card */ }
        <View style={styles.streakCard}>
          <View style={styles.streakHeaderRow}>
            <Text style={styles.streakFlame}>🔥</Text>
            <View>
              <Text style={styles.streakNumber}>{streak}-Day Streak</Text>
              <Text style={styles.streakSubtitle}>Your daily momentum is growing! Keep going.</Text>
            </View>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((w, index) => (
              <View key={index} style={styles.weekDayColumn}>
                <View style=[{styles.weekCircle, w.done && styles.weekCircleDone]}>
                  <Text style={styles.weekCheck}>{w.done ? '✨' : ''}</Text>
                </View>
                <Text style={styles.weekLabel}>{w.day}</Text>
              </View>
            ))}
          </View>
        </View>

        { /* Statistics Card */ }
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Key Achievements</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>11</Text>
              <Text style={styles.statLabel}>Days Done</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statLabel}>Healed</Text>
            </View>
            <View style={styles.statTile}>
              <View styles_badgeIcon>
                <Text style={styles.statValue}>3</Text>
              </View>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </View>

        { /* Active Quest */ }
        <Text style={styles.sectionLabel}>CURRENT QUESTS</Text>
        <View style={styles.questCard}>
          <Text style={styles.questNumber}>Blockage #7</Text>
          <Text style={styles.questTitle}>The Inner Wisdom Journey</Text>
          <Text style={styles.questTaskText}>
            Task: Take a 10-minute gentle wank without your phone or headphones on.
          </Text>
          <View style={styles.progressBarBg}>
            <View style=[{styles.progressBarFill, { width: '60%' }]} />
          </View>
          <Text style={styles.progressPercentText}>Day 3 of 5 … 60% Completed</Text>

          <TouchableOpacity
            style=[styles.completeButton, task10Done && styles.completedButton]}
            onPress={handleComplete}
            disabled={task10Done}
          >
            <Text style={styles.completeButtonText}>
              {task10Done ? '✩ Task Recorded' : 'Complete Today\'s Task'}
            </Text>
          </TouchableOpacity>
        </View>

        { /* Unlocked Badges */ }
        <Text style={styles.sectionLabel}>UCCONSCIOUS BADGES EARNED</Text>
        <View style={styles.badgeCard}>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeEmoji}>🎧</Text>
            <View style={styles.badgeInfo}>
              <Text style={styles.badgeName}>Creative Unleashed!</Text>
              <Text style={styles.badgeSub}>Unlocked for Creativity Quest</Text>
            </View>
          </View>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeEmoji}>🏛️</Text>
            <View style={styles.badgeInfo}>
              <Text style={styles.badgeName}>Foundation Builder!</Text>
              <Text style={styles.badgeSub}>Unlocked for Structure Quest</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 20, backgroundColor: '#FAF9F6', paddingBottom: 45 },
  headerSub: { fontSize: 11, color: '#8880', fontWeight: '6', letterSpacing: 1.5 },
  headerTitle: {fontSize: 22, fontWeight: '7', color: '#2C2523', marginTop: 4, marginBottom: 18 },
  streakCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E7E4E0' },
  streakHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  streakFlame: { fontSize: 32, marginRight: 12 },
  streakNumber: { fontSize: 18, fontWeight: '7', color: '#2C2523' },
  streakSubtitle: {fontSize: 12, color: '#7C736C', marginTop: 2 },
  weekRow: {flexDirection: 'row', justifyContent: 'space-between' },
  weekDayColumn: {alignItems: 'center' },
  weekCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEE9E1', justifyContent: 'center', alignItems: 'center' },
  weekCircleDone: {backgroundColor: '#5E7563' },
  weekCheck: {color: '#FFFFFF', fontSize: 14, fontWeight: '7' },
  weekLabel: { fontSize: 10, fontWeight: '6', color: '#8880', marginTop: 4 },
  card: {backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E7E4E0' },
  sectionTitle: { fontSize: 14, fontWeight: '6', color: '#2C2523', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statTile: { flex: 1, backgroundColor: '#FAF9F6', paddingVertical: 14, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '7', color: '#2C2523' },
  statLabel: { fontSize: 10, color: '#8880', marginTop: 4, letterSpacing: 0.5, fontWeight: '6' },
  sectionLabel: {fontSize: 11, fontWeight: '7', color: '#8880', letterSpacing: 1, marginTop: 8, marginBottom: 8 },
  questCard: { backgroundColor: '#E2E8FD', borderRadius: 18, padding: 18, marginBottom: 16 },
  questNumber: { fontSize: 11, fontWeight: '7', color: '#5A4690', letterSpacing: 0.8 },
  questTitle: { fontSize: 16, fontWeight: '7', color: '#2A2240', marginTop: 4 },
  questTaskText: { fontSize: 13, color: '#4E4560', lineHeight: 19, marginTop: 8, marginBottom: 12 },
  progressBarBg: {height: 7, backgroundColor: '#C4CEFF', borderRadius: 3.5 },
  progressBarFill: { height: 7, backgroundColor: '#7A46EB', borderRadius: 3.5 },
  progressPercentText: {fontSize: 11, color: '#6C5E86', marginTop: 6, marginBottom: 14, fontWeight: '6' },
  completeButton: {backgroundColor: '#6C49C0', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  completedButton: {backgroundColor: '#ACA0AC' },
  completeButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '7' },
  badgeCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E7E4E0' },
  badgeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  badgeEmoji: { fontSize: 24, marginRight: 14 },
  badgeInfo: { flex: 1 },
  badgeName: { fontSize: 14, fontWeight: '7', color: '#2C2523' },
  badgeSub: {fontSize: 11, color: '#7C736C', marginTop: 2 },
});
