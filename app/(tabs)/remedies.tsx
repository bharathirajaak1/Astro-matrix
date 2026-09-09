import { useRitualStore } from '../../src/features/remedies/ritualStore';
import { buildLoShuGrid } from '../../src/core/loShu';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useProfileStore } from '@/features/profile/store';
import { EXPANDED_REMEDIES } from '@/data/expandedRemedies';
import { computeQuestHierarchy, generateDailyRitualPack } from '@/services/questEngine';

export default function RemediesScreen() {
  const profile = useProfileStore((s: any) => s.profile);

  // Dynamically calculate blockages fro  m profile DOB
  const activeDob = profile?.dob || profile?.birthDate || '1995-02-18';
  const loShu = buildLoShuGrid(activeDob);
  const presentDigits = Object.keys(loShu.counts || {}).map(Number).filter((d) => (loShu.counts as any)[d] > 0);
  const missingNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !presentDigits.includes(d));
  const completedNumbers = useRitualStore((s) => s.completedNumbers);
const questDay = useRitualStore((s) => s.questDay);
const streakDays = useRitualStore((s) => s.streakDays);
const completeActiveQuest = useRitualStore((s) => s.completeActiveQuest);
const completeDailyPack = useRitualStore((s) => s.completeDailyPack);
const dailyPackItems = useRitualStore((s) => s.dailyPackItems);
const dailyPackCompleted = useRitualStore((s) => s.dailyPackCompleted);
const togglePackItem = useRitualStore((s) => s.togglePackItem);

const [selectedTab, setSelectedTab] = useState<'quest' | 'dailyPack' | 'journey'>('quest');
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Animation values
  const celebrationAnim = useRef(new Animated.Value(0)).current;

  const hierarchy = computeQuestHierarchy(missingNumbers, completedNumbers);
  const activeRemedy = EXPANDED_REMEDIES[hierarchy.activeNumber] || EXPANDED_REMEDIES[3];
  const dailyPack = generateDailyRitualPack(missingNumbers, completedNumbers);

  const triggerCelebration = (title: string, message: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowCelebration(true);
    Animated.sequence([
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(celebrationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowCelebration(false));

    Alert.alert(title, message);
  };

  const handleMarkTaskComplete = () => {
    void completeActiveQuest(hierarchy.activeNumber);
    triggerCelebration(
      '🌟 Amazing!',
      `You just completed Day ${questDay} of your journey! You have harmonized Number ${hierarchy.activeNumber} energy.`
    );
  };

  const handleCompleteMyDay = () => {
    void completeDailyPack();
    triggerCelebration(
      '🌟 Day Fully Complete!',
      'Amazing! You completed all morning, midday, and evening rituals today.'
    );
  };

  const toggleRecording = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRecording) {
      setIsRecording(false);
      setHasRecording(true);
      Alert.alert('Recording Saved 🎙️', 'Your sacred voice affirmation is saved and ready to replay.');
    } else {
      setIsRecording(true);
    }
  };

  const playRecording = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Playing Affirmation 🔊', `"${activeRemedy.affirmation}"`);
  };

  const renderLoShuCell = (num: number) => {
    const isMissing = missingNumbers.includes(num);
    const isHealed = completedNumbers.includes(num);
    const isActiveQuest = hierarchy.activeNumber === num;

    let cellStyle = styles.cellNormal;
    let textStyle = styles.cellTextNormal;

    if (isMissing && !isHealed) {
      cellStyle = isActiveQuest ? styles.cellActiveBlockage : styles.cellUpcomingBlockage;
      textStyle = styles.cellTextBlocked;
    } else if (isHealed) {
      cellStyle = styles.cellHealed;
      textStyle = styles.cellTextHealed;
    }

    return (
      <TouchableOpacity
        key={num}
        style={[styles.gridCell, cellStyle]}
        onPress={() => {
          void Haptics.selectionAsync();
          Alert.alert(
            `Number ${num}: ${EXPANDED_REMEDIES[num]?.title || 'Core Energy'}`,
            isMissing
              ? isHealed
                ? '✨ Harmonized & Glowing! You cleared this blockage.'
                : isActiveQuest
                ? '⚡ Active Focus: Current priority quest.'
                : '⏳ Upcoming: Next in your healing sequence.'
              : '🌱 Naturally Balanced in your natal chart.'
          );
        }}
      >
        <Text style={[styles.cellNumber, textStyle]}>{num}</Text>
        <Text style={styles.cellBadge}>
          {isHealed ? '✨ Healed' : isMissing ? (isActiveQuest ? '⚡ Active' : '⏳ Queued') : 'Balanced'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Celebration Overlay */}
        {showCelebration && (
          <Animated.View
            style={[
              styles.celebrationBanner,
              {
                opacity: celebrationAnim,
                transform: [
                  {
                    scale: celebrationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.celebrationTitle}>✨ 🌟 ✨</Text>
            <Text style={styles.celebrationSub}>Ritual Complete • Energy Harmonized!</Text>
          </Animated.View>
        )}

        {/* Top Header */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Dashboard</Text>
          </TouchableOpacity>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streakDays}-Day Streak</Text>
          </View>
        </View>

        <Text style={styles.title}>Remedies & Quests</Text>

        {/* Natal Lo Shu Grid Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Natal Lo Shu Grid</Text>
          <Text style={styles.cardSubtitle}>
            Gold borders show active quests. Emerald green cells light up once harmonized.
          </Text>

          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>{[4, 9, 2].map(renderLoShuCell)}</View>
            <View style={styles.gridRow}>{[3, 5, 7].map(renderLoShuCell)}</View>
            <View style={styles.gridRow}>{[8, 1, 6].map(renderLoShuCell)}</View>
          </View>
        </View>

        {/* Tab Buttons */}
          <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'quest' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('quest')}
          >
            <Text style={[styles.tabText, selectedTab === 'quest' && styles.tabTextActive]}>
              Active Quest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'dailyPack' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('dailyPack')}
          >
            <Text style={[styles.tabText, selectedTab === 'dailyPack' && styles.tabTextActive]}>
              Daily Pack
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'journey' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('journey')}
          >
            <Text style={[styles.tabText, selectedTab === 'journey' && styles.tabTextActive]}>
              Healing Journey
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: ACTIVE QUEST */}
        {selectedTab === 'quest' && (
          <View>
            <View style={styles.questHeader}>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>PRIORITY FOCUS: NUMBER {hierarchy.activeNumber}</Text>
              </View>
              {hierarchy.upcomingNumbers.length > 0 && (
                <Text style={styles.upcomingNote}>
                  Queued next: {hierarchy.upcomingNumbers.map((n) => `Number ${n}`).join(', ')}
                </Text>
              )}
            </View>

            <View style={styles.questCard}>
              <Text style={styles.questTitle}>{activeRemedy.microRitual.title}</Text>
              <Text style={styles.questKeyword}>
                Theme: {activeRemedy.keyword} • {activeRemedy.title}
              </Text>

              {/* Day 2 of 7 Quest Progress Bar */}
              <View style={styles.questProgressContainer}>
                <View style={styles.questProgressLabels}>
                  <Text style={styles.questDayLabel}>Progress</Text>
                  <Text style={styles.questDayCount}>Day {questDay} of 7</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${(questDay / 7) * 100}%` }]} />
                </View>
              </View>

              <View style={styles.ritualSection}>
                <Text style={styles.sectionHeading}>1. What to Do</Text>
                <Text style={styles.bodyText}>{activeRemedy.microRitual.whatToDo}</Text>
              </View>

              <View style={styles.ritualSection}>
                <Text style={styles.sectionHeading}>2. How to Do It</Text>
                <Text style={styles.bodyText}>{activeRemedy.microRitual.howToDoIt}</Text>
              </View>

              <View style={styles.ritualSection}>
                <Text style={styles.sectionHeading}>3. Why It Works</Text>
                <Text style={styles.bodyText}>{activeRemedy.microRitual.whyItWorks}</Text>
              </View>

              <View style={styles.ritualSection}>
                <Text style={styles.sectionHeading}>4. What to Expect</Text>
                <Text style={styles.bodyText}>{activeRemedy.microRitual.whatToExp}</Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity style={styles.completeButton} onPress={handleMarkTaskComplete}>
                <Text style={styles.completeButtonText}>
                  {completedNumbers.includes(hierarchy.activeNumber)
                    ? "✓ Mark Today's Task Complete"
                    : "Mark Today's Task Complete"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Energetic Enhancers & Voice Recording */}
            <View style={styles.detailsCard}>
              <Text style={styles.cardTitle}>Energetic Enhancers for Number {hierarchy.activeNumber}</Text>

              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Power Color:</Text>
                <Text style={styles.specValue}>{activeRemedy.powerColor.name}</Text>
              </View>
              <Text style={styles.subText}>{activeRemedy.powerColor.description}</Text>

              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Nourishment Practice (Food Ritual):</Text>
              </View>
              <Text style={styles.subText}>{activeRemedy.food}</Text>

              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Gemstone:</Text>
                <Text style={styles.specValue}>
                  {activeRemedy.gemstone.primary} (Alt: {activeRemedy.gemstone.alternative})
                </Text>
              </View>
              <Text style={styles.subText}>{activeRemedy.gemstone.ritual}</Text>

              {/* Sacred Affirmation with Voice Recording */}
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Sacred Affirmation:</Text>
              </View>
              <Text style={styles.affirmationBox}>"{activeRemedy.affirmation}"</Text>

              {/* Voice Action Buttons */}
              <View style={styles.audioRow}>
                <TouchableOpacity
                  style={[styles.audioButton, isRecording && styles.audioButtonRecording]}
                  onPress={toggleRecording}
                >
                  <Text style={styles.audioButtonText}>
                    {isRecording ? '⏹️ Stop Recording' : '🎙️ Record Your Voice'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.audioButton, !hasRecording && styles.audioButtonDisabled]}
                  onPress={playRecording}
                  disabled={!hasRecording}
                >
                  <Text style={styles.audioButtonText}>🔊 Listen</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
{/* TAB 2: CONSOLIDATED DAILY RITUAL PACK */}
        {selectedTab === 'dailyPack' && (
          <View>
            <View style={styles.packCard}>
              <Text style={styles.cardTitle}>Consolidated Daily Ritual Pack</Text>
              <Text style={styles.cardSubtitle}>
                A single daily sequence weaving your missing energies seamlessly through the day.
              </Text>

              {/* MORNING */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => void togglePackItem('morning')}
                style={[styles.packItem, dailyPackItems?.morning && styles.packItemCompleted]}
              >
                <View style={styles.packItemHeader}>
                  <Text style={styles.packTime}>🌅 MORNING ACTIVATION</Text>
                  <Text style={styles.checkBadge}>
                    {dailyPackItems?.morning ? '✓ Done' : 'Tap to Complete'}
                  </Text>
                </View>
                <Text style={[styles.packItemTitle, dailyPackItems?.morning && styles.completedText]}>
                  {dailyPack.morning.title}
                </Text>
                <Text style={styles.bodyText}>{dailyPack.morning.text}</Text>
              </TouchableOpacity>

              {/* MIDDAY */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => void togglePackItem('midday')}
                style={[styles.packItem, dailyPackItems?.midday && styles.packItemCompleted]}
              >
                <View style={styles.packItemHeader}>
                  <Text style={styles.packTime}>☀️ MIDDAY MINI-RITUAL</Text>
                  <Text style={styles.checkBadge}>
                    {dailyPackItems?.midday ? '✓ Done' : 'Tap to Complete'}
                  </Text>
                </View>
                <Text style={[styles.packItemTitle, dailyPackItems?.midday && styles.completedText]}>
                  {dailyPack.midday.title}
                </Text>
                <Text style={styles.bodyText}>{dailyPack.midday.text}</Text>
              </TouchableOpacity>

              {/* EVENING */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => void togglePackItem('evening')}
                style={[styles.packItem, dailyPackItems?.evening && styles.packItemCompleted]}
              >
                <View style={styles.packItemHeader}>
                  <Text style={styles.packTime}>🌙 EVENING WIND-DOWN</Text>
                  <Text style={styles.checkBadge}>
                    {dailyPackItems?.evening ? '✓ Done' : 'Tap to Complete'}
                  </Text>
                </View>
                <Text style={[styles.packItemTitle, dailyPackItems?.evening && styles.completedText]}>
                  {dailyPack.evening.title}
                </Text>
                <Text style={styles.bodyText}>{dailyPack.evening.text}</Text>
              </TouchableOpacity>

              {/* SUBMIT BUTTON */}
              {(() => {
                const allCardsDone = Boolean(dailyPackItems?.morning && dailyPackItems?.midday && dailyPackItems?.evening);
                const isEnabled = allCardsDone && !dailyPackCompleted;

                return (
                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      dailyPackCompleted && styles.completeButtonDone,
                      !isEnabled && !dailyPackCompleted && styles.completeButtonDisabled,
                    ]}
                    onPress={handleCompleteMyDay}
                    disabled={!isEnabled}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.completeButtonText,
                        !isEnabled && !dailyPackCompleted && styles.completeButtonDisabledText,
                      ]}
                    >
                      {dailyPackCompleted
                        ? '✓ Day Fully Completed!'
                        : allCardsDone
                        ? '✨ Submit All Rituals'
                        : 'Complete all 3 rituals above'}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>
        )}
        {/* TAB 3: HEALING JOURNEY DASHBOARD */}
        {selectedTab === 'journey' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Healing Journey Dashboard</Text>
              <Text style={styles.cardSubtitle}>
                Every small ritual balances your natal compass.
              </Text>

              {/* Encouraging Day-Based Header */}
              <View style={styles.journeyHeaderBox}>
                <Text style={styles.journeyDayTitle}>Day {questDay} of Your Journey</Text>
                <Text style={styles.journeyMotivation}>
                  "Consistency shapes the matrix. You are building quiet strength."
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.max(15, (completedNumbers.length / missingNumbers.length) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {completedNumbers.length} of {missingNumbers.length} Blockages Harmonized
              </Text>

              {/* Badges with Clear Locked vs Unlocked status */}
              <Text style={[styles.sectionHeading, { marginTop: 22 }]}>Badges & Achievements</Text>
              <View style={styles.badgeRow}>
                {/* First Step: Unlocked */}
                <View style={[styles.badgePill, styles.badgeUnlocked]}>
                  <Text style={styles.badgeEmoji}>🌱</Text>
                  <Text style={styles.badgeTitle}>First Step</Text>
                  <Text style={styles.badgeStatusText}>🔓 Unlocked</Text>
                </View>

                {/* 5-Day Streak: Unlocked */}
                <View style={[styles.badgePill, styles.badgeUnlocked]}>
                  <Text style={styles.badgeEmoji}>🔥</Text>
                  <Text style={styles.badgeTitle}>5-Day Flame</Text>
                  <Text style={styles.badgeStatusText}>🔓 Unlocked</Text>
                </View>

                {/* Grid Master: Locked */}
                <View
                  style={[
                    styles.badgePill,
                    completedNumbers.length === missingNumbers.length
                      ? styles.badgeUnlocked
                      : styles.badgeLocked,
                  ]}
                >
                  <Text style={styles.badgeEmoji}>👑</Text>
                  <Text style={styles.badgeTitle}>Grid Master</Text>
                  <Text style={styles.badgeStatusText}>
                    {completedNumbers.length === missingNumbers.length ? '🔓 Unlocked' : '🔒 Locked'}
                  </Text>
                </View>
              </View>

              {/* Sequence Timeline */}
              <Text style={[styles.sectionHeading, { marginTop: 22 }]}>Blockage Healing Queue</Text>
              {missingNumbers.map((num) => {
                const isDone = completedNumbers.includes(num);
                const isActive = hierarchy.activeNumber === num;
                return (
                  <View key={num} style={styles.timelineItem}>
                    <Text style={styles.timelineNumber}>Number {num} ({EXPANDED_REMEDIES[num]?.keyword})</Text>
                    <Text style={isDone ? styles.statusHealed : isActive ? styles.statusActive : styles.statusQueued}>
                      {isDone ? '✨ Healed' : isActive ? '⚡ In Progress' : '🔒 Queued'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Ethical Compass Reminder */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>Compass Reminder</Text>
          <Text style={styles.disclaimerText}>
            A gentle reminder: This app is a compass, not a guarantee. We do not promise to solve your
            problems—life does not work that way. What we offer are small, positive nudges to help you remove
            mental blocks and face your day with a lighter heart. Your luck is ultimately shaped by your actions
            and attitude. We are just here to cheer you on.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  container: { padding: 20, paddingBottom: 60 },
  celebrationBanner: {
    backgroundColor: '#5E7563',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  celebrationTitle: { fontSize: 24, color: '#FFFFFF', fontWeight: '800' },
  celebrationSub: { fontSize: 13, color: '#FFFFFF', fontWeight: '700', marginTop: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  backButton: { paddingVertical: 4 },
  backButtonText: { fontSize: 14, color: '#5E7563', fontWeight: '700' },
  streakBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FFE0B2' },
  streakText: { fontSize: 12, fontWeight: '800', color: '#E65100' },
  title: { fontSize: 24, fontWeight: '800', color: '#2C2523', marginBottom: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#EDEBE6' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C2523', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: '#77706A', marginBottom: 16 },
  gridContainer: { alignItems: 'center', marginVertical: 8 },
  gridRow: { flexDirection: 'row' },
  gridCell: {
    width: 82,
    height: 82,
    margin: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  cellNormal: { backgroundColor: '#F3F8F4', borderColor: '#C8E6C9' },
  cellTextNormal: { color: '#2E7D32' },
  cellActiveBlockage: { backgroundColor: '#FFFDF0', borderColor: '#E5A93C', borderWidth: 2 },
  cellUpcomingBlockage: { backgroundColor: '#F8F6F4', borderColor: '#D3C5B4', borderStyle: 'dashed' },
  cellTextBlocked: { color: '#8A5D25' },
  cellHealed: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32', borderWidth: 2 },
  cellTextHealed: { color: '#1B5E20' },
  cellNumber: { fontSize: 22, fontWeight: '800' },
  cellBadge: { fontSize: 9, fontWeight: '700', color: '#77706A', marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#EEE9E1', borderRadius: 12, padding: 3, marginBottom: 16 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabButtonActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#77706A' },
  tabTextActive: { color: '#2C2523', fontWeight: '700' },
  questHeader: { marginBottom: 10 },
  priorityBadge: { alignSelf: 'flex-start', backgroundColor: '#5E7563', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  priorityText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  upcomingNote: { fontSize: 11, color: '#888077', marginTop: 4 },
  questCard: { backgroundColor: '#F4F2FF', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#DCD4FD' },
  questTitle: { fontSize: 18, fontWeight: '800', color: '#2C2523' },
  questKeyword: { fontSize: 12, color: '#5A459D', fontWeight: '700', marginBottom: 12 },
  questProgressContainer: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, marginBottom: 14 },
  questProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  questDayLabel: { fontSize: 12, fontWeight: '700', color: '#5A459D' },
  questDayCount: { fontSize: 12, fontWeight: '800', color: '#2C2523' },
  progressBarTrack: { height: 8, backgroundColor: '#EBE6FD', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#5A459D', borderRadius: 4 },
  ritualSection: { marginBottom: 12 },
  sectionHeading: { fontSize: 12, fontWeight: '800', color: '#2C2523', textTransform: 'uppercase', marginBottom: 2 },
  bodyText: { fontSize: 13, color: '#4E4844', lineHeight: 19 },
  completeButton: { backgroundColor: '#5E7563', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  completeButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  detailsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#EDEBE6' },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  specLabel: { fontSize: 12, fontWeight: '700', color: '#2C2523' },
  specValue: { fontSize: 12, fontWeight: '700', color: '#5E7563' },
  subText: { fontSize: 12, color: '#6A645F', marginTop: 2, marginBottom: 8, lineHeight: 17 },
  affirmationBox: { backgroundColor: '#FAF9F6', padding: 12, borderRadius: 8, fontStyle: 'italic', color: '#2C2523', fontSize: 13, marginVertical: 6 },
  audioRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  audioButton: { flex: 1, backgroundColor: '#EEE9E1', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  audioButtonRecording: { backgroundColor: '#FFCDD2' },
  audioButtonDisabled: { opacity: 0.4 },
  audioButtonText: { fontSize: 12, fontWeight: '700', color: '#2C2523' },
  packCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EDEBE6' },
  packItem: { backgroundColor: '#FAF9F6', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F0EEEA' },
  packTime: { fontSize: 10, fontWeight: '800', color: '#888077', letterSpacing: 1 },
  packItemTitle: { fontSize: 14, fontWeight: '700', color: '#2C2523', marginVertical: 4 },
  packItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  packItemCompleted: {
    backgroundColor: '#F0F9F4',
    borderColor: '#5B7A68',
    borderWidth: 1,
  },
  checkBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B7A68',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#5B7A68',
  },
  completeButtonDone: {
    backgroundColor: '#3D5445',
    opacity: 0.9,
  },
  completeButtonDisabled: {
    backgroundColor: '#E5E2DA',
    borderColor: '#D8D4CA',
    borderWidth: 1,
  },
  completeButtonDisabledText: {
    color: '#9C968B',
  },
  journeyHeaderBox: { backgroundColor: '#FAF9F6', padding: 14, borderRadius: 12, marginBottom: 12 },
  journeyDayTitle: { fontSize: 15, fontWeight: '800', color: '#2C2523' },
  journeyMotivation: { fontSize: 12, fontStyle: 'italic', color: '#77706A', marginTop: 3 },
  progressContainer: { height: 10, backgroundColor: '#EEE9E1', borderRadius: 5, overflow: 'hidden', marginVertical: 8 },
  progressBar: { height: '100%', backgroundColor: '#5E7563' },
  progressLabel: { fontSize: 12, fontWeight: '700', color: '#5E7563', textAlign: 'right' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  badgePill: { flex: 1, marginHorizontal: 3, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1 },
  badgeUnlocked: { backgroundColor: '#F3F8F4', borderColor: '#81C784' },
  badgeLocked: { backgroundColor: '#F8F6F4', borderColor: '#D3C5B4', opacity: 0.6 },
  badgeEmoji: { fontSize: 22 },
  badgeTitle: { fontSize: 10, fontWeight: '700', color: '#2C2523', marginTop: 4 },
  badgeStatusText: { fontSize: 9, fontWeight: '700', color: '#555', marginTop: 2 },
  timelineItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FAF9F6' },
  timelineNumber: { fontSize: 13, fontWeight: '700', color: '#2C2523' },
  statusHealed: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  statusActive: { fontSize: 12, fontWeight: '700', color: '#E65100' },
  statusQueued: { fontSize: 12, fontWeight: '600', color: '#888077' },
  disclaimerBox: { backgroundColor: '#F5F3EF', borderRadius: 14, padding: 14, marginTop: 12 },
  disclaimerTitle: { fontSize: 12, fontWeight: '800', color: '#77706A', marginBottom: 4 },
  disclaimerText: { fontSize: 11, color: '#888077', lineHeight: 16 },
});