import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/features/profile/store';
import { SummaryBanner } from '@/ui/components/SummaryBanner';
import { getTimeOfDayGreeting, generateLoShuSummary } from '@/core/summaryGenerator';

interface PlaneInfo {
  friendlyName: string;
  subtitle: string;
  icon: string;
  description: string;
  numbers: number[];
}

const FRIENDLY_PLANES: PlaneInfo[] = [
  {
    friendlyName: 'Mind & Logic',
    subtitle: 'Intellect & Memory',
    icon: '🧠',
    description: 'Your analytical thinking, memory, and cognitive agility.',
    numbers: [4, 9, 2],
  },
  {
    friendlyName: 'Heart & Intuition',
    subtitle: 'Empathy & Feelings',
    icon: '💖',
    description: 'Your empathy, spiritual attunement, feelings, and emotional resilience.',
    numbers: [3, 5, 7],
  },
  {
    friendlyName: 'Action & Grounding',
    subtitle: 'Execution & Discipline',
    icon: '🌱',
    description: 'Your physical endurance, discipline, material mastery, and everyday habits.',
    numbers: [8, 1, 6],
  },
  {
    friendlyName: 'Vision & Planning',
    subtitle: 'Conception & Strategy',
    icon: '🔭',
    description: 'Your ability to conceive, plan, and structure ideas.',
    numbers: [4, 3, 8],
  },
  {
    friendlyName: 'Drive & Persistence',
    subtitle: 'Focus & Resolve',
    icon: '⚡',
    description: 'Your inner persistence, focus, and grit to complete objectives.',
    numbers: [9, 5, 1],
  },
  {
    friendlyName: 'Manifestation',
    subtitle: 'Decisive Movement',
    icon: '🏃',
    description: 'Your physical realization, decisive movement, and tangible execution.',
    numbers: [2, 7, 6],
  },
];

export default function LoShuScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile) as any;

  // Extract digits from user birth date
  const rawDob = profile?.dob || profile?.birthDate || '1970-09-20';
const birthDateDigits = rawDob
  .replace(/\D/g, '')
  .split('')
  .map((d: string) => Number(d));

  const digitCounts: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) {
    digitCounts[i] = 0;
  }
  birthDateDigits.forEach((d: number) => {
    if (d >= 1 && d <= 9) {
      digitCounts[d] = (digitCounts[d] || 0) + 1;
    }
  });

  const getStatusText = (active: number, total: number) => {
    if (active === 0) return '🌱 Awakening';
    if (active === total) return '✨ Harmonized';
    return `🌿 ${active}/${total} Active`;
  };

  const renderCell = (num: number) => {
    const count = digitCounts[num] || 0;
    const isMissing = count === 0;

    return (
      <View
        key={num}
        style={[
          styles.gridCell,
          isMissing ? styles.cellMissing : styles.cellPresent,
        ]}
      >
        <Text
          style={[
            styles.cellNumber,
            isMissing ? styles.cellNumberMissing : styles.cellNumberPresent,
          ]}
        >
          {num}
        </Text>
        <Text
          style={[
            styles.cellCount,
            isMissing ? styles.cellCountMissing : styles.cellCountPresent,
          ]}
        >
          {isMissing ? 'Missing' : `${count}x`}
        </Text>
      </View>
    );
  };
  const greeting = getTimeOfDayGreeting(profile?.fullName);
  const loShuSummary = generateLoShuSummary(profile?.dob || '');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>CHINESE SACRED MATRIX</Text>
         <Text style={styles.headerMeta}>
            DOB: {profile?.dob || profile?.birthDate || '1970-09-20'} • {profile?.fullName || profile?.name || 'User'}
          </Text>
        </View>
        <SummaryBanner
          greeting={greeting}
          summaryText={loShuSummary}
          badgeText="MATRIX SUMMARY"
        />
        {/* 3x3 Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {[4, 9, 2].map((num) => renderCell(num))}
          </View>
          <View style={styles.gridRow}>
            {[3, 5, 7].map((num) => renderCell(num))}
          </View>
          <View style={styles.gridRow}>
            {[8, 1, 6].map((num) => renderCell(num))}
          </View>
        </View>

        {/* Planes of Expression */}
        <Text style={styles.planesSectionTitle}>Planes of Expression</Text>

        {FRIENDLY_PLANES.map((plane, index) => {
          const activeCount = plane.numbers.filter(
            (num) => (digitCounts[num] || 0) > 0
          ).length;
          const status = getStatusText(activeCount, plane.numbers.length);

          return (
            <View key={index} style={styles.planeCard}>
              <View style={styles.planeHeader}>
                <View style={styles.planeTitleRow}>
                  <Text style={styles.planeIcon}>{plane.icon}</Text>
                  <View>
                    <Text style={styles.planeFriendlyName}>{plane.friendlyName}</Text>
                    <Text style={styles.planeSubtitle}>{plane.subtitle}</Text>
                  </View>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{status}</Text>
                </View>
              </View>

              <Text style={styles.planeDesc}>{plane.description}</Text>

              {/* Progress Bar for Plane */}
              <View style={styles.planeTrack}>
                <View
                  style={[
                    styles.planeFill,
                    {
                      width: `${(activeCount / plane.numbers.length) * 100}%`,
                      backgroundColor: activeCount === plane.numbers.length ? '#059669' : '#57715E',
                    },
                  ]}
                />
              </View>

              {/* Number Badges */}
              <View style={styles.planeNumbersRow}>
                {plane.numbers.map((num) => {
                  const present = (digitCounts[num] || 0) > 0;
                  return (
                    <View
                      key={num}
                      style={[
                        styles.numBadge,
                        present ? styles.numBadgePresent : styles.numBadgeMissing,
                      ]}
                    >
                      <Text
                        style={[
                          styles.numBadgeText,
                          present ? styles.numBadgeTextPresent : styles.numBadgeTextMissing,
                        ]}
                      >
                        {num} {present ? '✓' : '—'}
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
  safeArea: { flex: 1, backgroundColor: '#FAF8F5' },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 18 },
  headerSub: { fontSize: 11, fontWeight: '800', color: '#A8A29E', letterSpacing: 1 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1C1917', marginTop: 4 },
  headerMeta: { fontSize: 13, color: '#78716C', marginTop: 4 },
  gridContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginBottom: 24,
    gap: 10,
  },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  gridCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellPresent: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  cellMissing: {
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderStyle: 'dashed',
  },
  cellNumber: { fontSize: 24, fontWeight: '800' },
  cellNumberPresent: { color: '#047857' },
  cellNumberMissing: { color: '#A8A29E' },
  cellCount: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  cellCountPresent: { color: '#059669' },
  cellCountMissing: { color: '#A8A29E' },
  planesSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 14,
  },
  planeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginBottom: 14,
  },
  planeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planeIcon: { fontSize: 22 },
  planeFriendlyName: { fontSize: 15, fontWeight: '800', color: '#1C1917' },
  planeSubtitle: { fontSize: 12, color: '#78716C' },
  statusPill: {
    backgroundColor: '#F5F5F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: { fontSize: 12, fontWeight: '700', color: '#44403C' },
  planeDesc: { fontSize: 13, color: '#57534E', lineHeight: 18, marginBottom: 12 },
  planeTrack: {
    height: 6,
    backgroundColor: '#F5F5F4',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  planeFill: { height: '100%', borderRadius: 3 },
  planeNumbersRow: { flexDirection: 'row', gap: 8 },
  numBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  numBadgePresent: { backgroundColor: '#ECFDF5' },
  numBadgeMissing: { backgroundColor: '#F5F5F4' },
  numBadgeText: { fontSize: 12, fontWeight: '700' },
  numBadgeTextPresent: { color: '#047857' },
  numBadgeTextMissing: { color: '#A8A29E' },
});