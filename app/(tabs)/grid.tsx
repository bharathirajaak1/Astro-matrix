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
import { buildLoShuGrid } from '@/core/loShu';

interface PlaneInfo {
  name: string;
  numbers: number[];
  theme: string;
  desc: string;
}

const PLANES: PlaneInfo[] = [
  { name: 'Mental Plane', numbers: [4, 9, 2], theme: 'Intellect & Memory', desc: 'Governs analytical thinking, memory retention, and mental agility.' },
  { name: 'Emotional Plane', numbers: [3, 5, 7], theme: 'Heart & Intuition', desc: 'Governs empathy, spiritual attunement, feelings, and emotional resilience.' },
  { name: 'Practical Plane', numbers: [8, 1, 6], theme: 'Execution & Grounding', desc: 'Governs physical stamina, discipline, material mastery, and everyday habits.' },
  { name: 'Thought Plane', numbers: [4, 3, 8], theme: 'Vision & Planning', desc: 'Governs initial conception, long-range planning, and structuring ideas.' },
  { name: 'Will Plane', numbers: [9, 5, 1], theme: 'Determination & Drive', desc: 'Governs inner persistence, executive focus, and grit to complete objectives.' },
  { name: 'Action Plane', numbers: [2, 7, 6], theme: 'Manifestation', desc: 'Governs physical realization, decisive movement, and tangible execution.' },
];

export default function LoShuScreen() {
  const profile = useProfileStore((s) => s.profile);
  const activeDob = profile?.dob || '1995-02-18';

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  const loShu = useMemo(() => {
    try {
      return buildLoShuGrid(activeDob);
    } catch {
      return { counts: {} as Record<number, number> };
    }
  }, [activeDob]);

  const getCount = (num: number) => (loShu.counts as any)?.[num] || 0;

  // 3x3 Traditional Lo Shu layout
  const gridRows = [
    [4, 9, 2],
    [3, 5, 7],
    [8, 1, 6],
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>CHINESE SACRED MATRIX</Text>
          <Text style={styles.headerTitle}>Lo Shu Natal Grid</Text>
          <Text style={styles.headerDate}>
            DOB: {activeDob} • {profile?.fullName || 'Seeker'}
          </Text>
        </View>

        {/* 3x3 Matrix Card */}
        <View style={styles.gridCard}>
          {gridRows.map((row, rIdx) => (
            <View key={rIdx} style={styles.gridRow}>
              {row.map((num) => {
                const count = getCount(num);
                const isPresent = count > 0;
                const isSelected = selectedNumber === num;

                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.cell,
                      isPresent ? styles.cellPresent : styles.cellMissing,
                      isSelected && styles.cellSelected,
                    ]}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedNumber(selectedNumber === num ? null : num);
                    }}
                  >
                    <Text
                      style={[
                        styles.cellNumber,
                        isPresent ? styles.cellNumberPresent : styles.cellNumberMissing,
                      ]}
                    >
                      {num}
                    </Text>
                    <Text
                      style={[
                        styles.cellCount,
                        isPresent ? styles.cellCountPresent : styles.cellCountMissing,
                      ]}
                    >
                      {isPresent ? `${count}x` : 'Missing'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Selected Number Details */}
        {selectedNumber !== null && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>
              Number {selectedNumber}: {getCount(selectedNumber) > 0 ? 'Present Energy' : 'Missing Frequency (Blockage)'}
            </Text>
            <Text style={styles.detailBody}>
              {getCount(selectedNumber) > 0
                ? `You possess ${getCount(selectedNumber)} occurrence(s) of Number ${selectedNumber} in your natal grid, contributing active strength to your energetic matrix.`
                : `Number ${selectedNumber} does not appear in your birth date (${activeDob}). This is a designated growth area addressed in the Remedies tab.`}
            </Text>
          </View>
        )}

        {/* Planes Analysis */}
        <Text style={styles.sectionHeader}>Planes of Expression</Text>
        {PLANES.map((plane) => {
          const presentCount = plane.numbers.filter((n) => getCount(n) > 0).length;
          const isComplete = presentCount === 3;
          const percent = Math.round((presentCount / 3) * 100);

          return (
            <View key={plane.name} style={styles.planeCard}>
              <View style={styles.planeTop}>
                <View>
                  <Text style={styles.planeName}>{plane.name}</Text>
                  <Text style={styles.planeTheme}>{plane.theme}</Text>
                </View>
                <View style={[styles.statusPill, isComplete ? styles.pillComplete : styles.pillPartial]}>
                  <Text style={[styles.statusText, isComplete ? styles.textComplete : styles.textPartial]}>
                    {isComplete ? 'Complete' : `${presentCount}/3 Active`}
                  </Text>
                </View>
              </View>

              <Text style={styles.planeDesc}>{plane.desc}</Text>

              {/* Mini progress track */}
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${percent}%` }]} />
              </View>

              {/* Number tags */}
              <View style={styles.tagRow}>
                {plane.numbers.map((n) => {
                  const present = getCount(n) > 0;
                  return (
                    <View key={n} style={[styles.numTag, present && styles.numTagPresent]}>
                      <Text style={[styles.numTagText, present && styles.numTagTextPresent]}>
                        {n} {present ? '✓' : '—'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
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
  header: { marginBottom: 20 },
  headerSub: { fontSize: 11, fontWeight: '800', color: '#77706A', letterSpacing: 0.8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#2C2523', marginTop: 4 },
  headerDate: { fontSize: 12, color: '#8C847E', marginTop: 4 },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE6',
    marginBottom: 18,
  },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cell: {
    flex: 1,
    height: 80,
    borderRadius: 14,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  cellPresent: { backgroundColor: '#F3F8F4', borderColor: '#CDE5D2' },
  cellMissing: { backgroundColor: '#FAF9F6', borderColor: '#E5E0D8', borderStyle: 'dashed' },
  cellSelected: { borderColor: '#E0A96D', borderWidth: 2 },
  cellNumber: { fontSize: 24, fontWeight: '800' },
  cellNumberPresent: { color: '#2E7D32' },
  cellNumberMissing: { color: '#B3AAA2' },
  cellCount: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  cellCountPresent: { color: '#4E8657' },
  cellCountMissing: { color: '#A39990' },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E0A96D',
  },
  detailTitle: { fontSize: 13, fontWeight: '800', color: '#2C2523', marginBottom: 4 },
  detailBody: { fontSize: 12, color: '#6A625B', lineHeight: 18 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#2C2523', marginBottom: 12, marginTop: 6 },
  planeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDEBE6',
  },
  planeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planeName: { fontSize: 14, fontWeight: '800', color: '#2C2523' },
  planeTheme: { fontSize: 11, color: '#77706A', marginTop: 2, fontWeight: '600' },
  statusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  pillComplete: { backgroundColor: '#E8F5E9' },
  pillPartial: { backgroundColor: '#F4F0EB' },
  statusText: { fontSize: 10, fontWeight: '800' },
  textComplete: { color: '#2E7D32' },
  textPartial: { color: '#7C736C' },
  planeDesc: { fontSize: 12, color: '#77706A', lineHeight: 17, marginTop: 8 },
  track: { height: 5, backgroundColor: '#EFEBE4', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#5E7563', borderRadius: 3 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  numTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F5F2EC',
  },
  numTagPresent: { backgroundColor: '#E8F5E9' },
  numTagText: { fontSize: 10, fontWeight: '700', color: '#A39990' },
  numTagTextPresent: { color: '#2E7D32' },
});