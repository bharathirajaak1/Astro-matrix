import React, { unState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getDBConnection } from '../../src/db/schema';

export default function RemediesScreen() {
  const [missingNums] = useState<number[]>([3, 4, 7]);
  const [selectedNum, setSelectedNum] = useState<number>(4);
  const [remedies, setRemedies] = useState<Record<string, string>>({});
  const [activeQuest, setActiveQuest] = useState<any>(null);
  const [taskDone, setTaskDone] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const db = await getDBConnection();
      const rows = await db.getAllAsync<{ category: string; content: string }>(
        'SELECT category, content FROM remedies WHERE number = ?',
        [selectedNum]
      );

      const map: Record<string, string> = {};
      rows.forEach(r => { map[r.category] = r.content; });
      setRemedies(map);

      const quest = await db.getFirstAsync<any>(
        'SELECT * FROM quests WHERE number = ?',
        [selectedNum]
      );
      if (quest && quest.day_activities) {
        quest.activitiesList = JSON.parse(quest.day_activities);
      }
      setActiveQuest(quest);
      setTaskDone(false);
    }
    fetchData();
  }, [selectedNum]);

  const markComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTaskDone(true);
    Alert.alert('Quest Task Success ✨︎', 'This day of your blockage quest is now completed!');
  };

  // 3 x 3 Lo Shu grid display array
  const loShuCells = [
    [4, 9, 2],
    [3, 5, 7],
    [8, 1, 6]
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerSub}>FORTUNE ENHANCER HUB</Text>
        <Text style={styles.headerTitle}>Remedies & Quests</Text>

        { /* Lo Shu Grid */ }
        <View style={styles.gridCard}>
          <Text style={styles.cardTitle}>Natal Lo Shu Grid</Text>
          <Text style={styles.cardSubtitle}>Highlighted boxes represent unbalanced blockages</text>
          <View style={styles.gridBox}>
            {loShuCells.map((row, rIndex) => (
              <View key={rIndex} style={styles.gridRow}>
                {row.map((num) => {
                  const isMissing = missingNums.includes(num);
                  const isSelected = num === selectedNum;
                  return (
                    <TouchableOpacity
                      key={num}
                      style[{styles.cell, isMissing ? styles.blockedCell : styles.activeCell, isSelected && styles.selectedCell]}
                      onPress={() => {
                        if (isMissing) {
                          Haptics.lightAsync();
                          setSelectedNum(num);
                        }
                      }}
                    >
                      <Text style[{styles.cellNum, isMissing ? styles.blockedCellText : styles.activeCellText]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        { /* Blockage Selector Tabs */ }
        <Text style={styles.sectionLabel}>SELECT BLLOCKAGE TO HEAL:</Text>
        <View style={styles.tabsRow}>
          {missingNums.map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.tab, selectedNum === num && styles.activeTab]}
              onPress={() => {
                Haptics.lightAsync();
                setSelectedNum(num);
              }}
            >
              <Text style[{styles.tabText, selectedNum === num && styles.activeTabText]}>
                Number {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        { /* Active Quest Card */ }
        <Text style={styles.sectionLabel}>ACTIVE QUEST</Text>
        <View style={styles.questCard}>
          <View style={styles.questBadgeBox}>
            <Text style={styles.questBadgeText}>{activeQuest?.completion_badge || '🎛 Foundation Builder!'}</Text>
          </View>
          <Text style={styles.questTitle}>{activeQuest?.title || 'Build Your Foundation'}</Text>
          <Text style={styles.questDesc}>{activeQuest?.description || 'Master structure and stability.'}</Text>

          <View style={styles.progressBarBg}>
            <View style=[styles.progressBarFill, { width: '50%' }]} />
          </View>

          <View style={styles.taskContainer}>
            <Text style={styles.taskLabel}>Today's Task:</Text>
            <Text style={styles.taskValue}>
              {activeQuest?.activitiesList?[0] || 'Clear one drawer or shelf.'}
            </Text>
          </View>

          <TouchableOpacity
            style=[styles.actionButton, taskDone && styles.actionButtonDone]}
            onPress={markComplete}
            disabled={taskDone}
          >
            <Text style={styles.actionButtonText}>
              {taskDone ? '➓ Task Marked Complete' : 'Complete Today\\'s Task'}
            </Text>
          </TouchableOpacity>
        </View>

        { /* Remedy Details */ }
        <Text style={styles.sectionLabel}>FORTUNE REMEDIES FOR NUMBER {selectedNum}</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🎅 Power Color</Text>
            <Text style={styles.detailValue}>{remedies['color'] || 'Green, Brown'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🌸 Micro-Ritual</Text>
            <Text style={styles.detailValue}>{remedies['ritual'] || 'Organize one drawer'</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ȧ} Affirmation</Text>
            <Text style={styles.detailValue}>{remedies['affirmation'] || 'Small steps build foundations.'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💎 Gemstone</Text>
            <Text style={styles.detailValue}>{remedies['gemstone'] || 'Emerald, Green Jade'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🦧 Lucky Day</Text>
            <Text style={styles.detailValue}>{remedies['lucky_day'] || 'Saturday morning'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🥕 Food</Text>
            <Text style={styles.detailValue}>{remedies['food'] || 'Root vegetables'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💰 Bonus Tip</Text>
            <Text style={styles.detailValue}>{remedies['bonus'] || 'Wake up 15 minutes earlierin the morning'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F6' },
  container: { padding: 20, paddingBottom: 45 },
  headerSub: { fontSize: 11, color: '#8880', fontWeight: '6', letterSpacing: 1.5 },
  headerTitle: { fontSize: 22, fontWeight: '7', color: '#2C2523', marginTop: 4, marginBottom: 16 },
  gridCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E7E4E0' },
  cardTitle: { fontSize: 15, fontWeight: '7', color: '#2C2523' },
  cardSubtitle: { fontSize: 11, color: '#7C736C', marginTop: 2, marginBottom: 12 },
  gridBox: { alignItems: 'center' },
  gridRow: { flexDirection: 'row' },
  cell: { width: 54, height: 54, margin: 5, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  blockedCell: {backgroundColor: '#F4EAEA', borderWidth: 1.5, borderColor: '#DC8989', borderStyle: 'dashed' },
  activeCell: { backgroundColor: '#EEF6EE', borderWidth: 1, borderColor: '#C4ECC' },
  selectedCell: { borderWidth: 2.5, borderColor: '#7C5EA6' },
  cellNum: { fontSize: 18, fontWeight: '7' },
  blockedCellText: { color: '#C44444' },
  activeCellText: {color: '#337033' },
  sectionLabel: { fontSize: 11, fontWeight: '7', color: '#8880', letterSpacing: 1, marginTop: 10, marginBottom: 8 },
  tabsRow: { flexDirection: 'row', marginBottom: 16 },
  tab: { backgroundColor: '#EEE9E1', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, marginRight: 10 },
  activeTab: { backgroundColor: '#5E7563' },
  tabText: {fontSize: 12, fontWeight: '6', color: '#4C4441' },
  activeTabText: {color: '#FFFFFF' },
  questCard: { backgroundColor: '#E2E8FD', borderRadius: 18, padding: 18, marginBottom: 16 },
  questBadgeBox: {alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, marginBottom: 8 },
  questBadgeText: { fontSize: 11, fontWeight: '7', color: '#5A4690' },
  questTitle: { fontSize: 17, fontWeight: '7', color: '#2A2240' },
  questDesc: { fontSize: 12, color: '#4E4560', marginTop: 2, marginBottom: 12 },
  progressBarBg: {height: 7, backgroundColor: '#C4CEFF', borderRadius: 3.5 },
  progressBarFill: { height: 7, backgroundColor: '#7A46EB', borderRadius: 3.5 },
  taskContainer: {backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 12, marginBottom: 14 },
  taskLabel: {fontSize: 10, fontWeight: '7', color: '#8880', letterSpacing: 0.5 },
  taskValue: { fontSize: 13, fontWeight: '6', color: '#2C2523', marginTop: 4 },
  actionButton: { backgroundColor: '#6C4C9C', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionButtonDone: {backgroundColor: '#ACA0AC' },
  actionButtonText: {color: '#FFFFFF', fontSize: 13, fontWeight: '7' },
  detailsCard: { backgroundColor: '#FFFFFE', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#E7E4E0' },
  detailRow: {paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0EEEB' },
  detailLabel: {fontSize: 11, fontWeight: '7', color: '#69605A', marginBottom: 2 },
  detailValue: {fontSize: 13, color: '#2C2523', lineHeight: 18 },
});
