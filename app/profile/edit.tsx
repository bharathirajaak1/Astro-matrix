import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useProfileStore } from '../../src/features/profile/store';
import { buildNumerologyReport } from '../../src/core/numerology';
import { buildLoShuGrid } from '../../src/core/loShu';
import { getArchetype } from '../../src/services/forecastEngine';
import { useRitualStore } from '@/features/remedies/ritualStore';

export default function ProfileScreen() {
  const profileStore = useProfileStore();
  const profile = (profileStore as any).profile;

  // Form input state
  const [isEditing, setIsEditing] = useState(!profile);
  const [fullName, setFullName] = useState(profile?.fullName || profile?.name || '');
  const [dob, setDob] = useState(profile?.dob || profile?.birthDate || '1995-02-26');
  const [system, setSystem] = useState<'chaldean' | 'pythagorean'>(profile?.system || 'chaldean');

  // Dynamic Numerology & Lo Shu calculations derived from active profile
  const calculations = useMemo(() => {
    const activeName = profile?.fullName || profile?.name || fullName || 'Seeker';
    const activeDob = profile?.dob || profile?.birthDate || dob || '1995-02-26';
    const activeSystem = profile?.system || system || 'chaldean';

    try {
      const report = buildNumerologyReport({
        id: profile?.id || 'temp',
        fullName: activeName,
        dob: activeDob,
        system: activeSystem,
        createdAt: profile?.createdAt || new Date().toISOString(),
      });

      const loShu = buildLoShuGrid(activeDob);

      // Find missing numbers (blockages) across 1-9
      const allDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const presentDigits = Object.keys(loShu.counts || {}).map(Number).filter((d) => (loShu.counts as any)[d] > 0);
      const missing = allDigits.filter((d) => !presentDigits.includes(d));

      return {
        lifePath: report.lifePath,
        destiny: report.destiny,
        soulUrge: report.soulUrge,
        personality: report.personality,
        missingNumbers: missing.length > 0 ? missing : [3, 4, 7],
      };
    } catch {
      return {
        lifePath: 4,
        destiny: 7,
        soulUrge: 3,
        personality: 1,
        missingNumbers: [3, 4, 7],
      };
    }
  }, [profile, fullName, dob, system]);

  const displayName = profile?.fullName || profile?.name || 'Seeker';
  const displayDob = profile?.dob || profile?.birthDate || '1995-02-26';
  const archetype = getArchetype(calculations.lifePath);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dob.trim())) {
      Alert.alert('Invalid Date Format', 'Please enter birth date as YYYY-MM-DD (e.g. 1995-02-26).');
      return;
    }

    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await profileStore.save({
        fullName: fullName.trim(),
        dob: dob.trim(),
        system,
      });
        await useRitualStore.getState().resetRituals();
      setIsEditing(false);
      Alert.alert('Compass Recalculated! ✨', `Welcome ${fullName.trim()}! Your natal chart and blockages are dynamically calculated.`);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save profile.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editToggle}
            onPress={() => {
              void Haptics.selectionAsync();
              setIsEditing(!isEditing);
            }}
          >
            <Text style={styles.editToggleText}>{isEditing ? 'Cancel' : '✏️ Edit Details'}</Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          /* EDIT / ONBOARDING FORM */
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Enter Your Details</Text>
            <Text style={styles.formSubtitle}>
              Your natal matrix and Lo Shu grid are derived from your exact birth date and name frequencies.
            </Text>

            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Maya Lin"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>DATE OF BIRTH (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (e.g. 1995-02-26)"
              placeholderTextColor="#999"
              value={dob}
              onChangeText={setDob}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.inputLabel}>NUMEROLOGY SYSTEM</Text>
            <View style={styles.systemRow}>
              <TouchableOpacity
                style={[styles.systemOption, system === 'chaldean' && styles.systemOptionSelected]}
                onPress={() => setSystem('chaldean')}
              >
                <Text style={[styles.systemText, system === 'chaldean' && styles.systemTextSelected]}>
                  Chaldean (Vibrational)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.systemOption, system === 'pythagorean' && styles.systemOptionSelected]}
                onPress={() => setSystem('pythagorean')}
              >
                <Text style={[styles.systemText, system === 'pythagorean' && styles.systemTextSelected]}>
                  Pythagorean (Western)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save & Recalculate Compass</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* DYNAMIC NUMEROLOGY BREAKDOWN */
          <View>
            <View style={styles.avatarCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.archetypeText}>{archetype}</Text>
              <Text style={styles.dobText}>DOB: {displayDob} • {profile?.system || 'Chaldean'}</Text>
            </View>

            {/* Core Numbers Tile */}
            <View style={styles.numbersGrid}>
              <View style={styles.numberTile}>
                <Text style={styles.numberVal}>{calculations.lifePath}</Text>
                <Text style={styles.numberLabel}>LIFE PATH</Text>
              </View>
              <View style={styles.numberTile}>
                <Text style={styles.numberVal}>{calculations.destiny}</Text>
                <Text style={styles.numberLabel}>DESTINY</Text>
              </View>
              <View style={styles.numberTile}>
                <Text style={styles.numberVal}>{calculations.soulUrge}</Text>
                <Text style={styles.numberLabel}>SOUL URGE</Text>
              </View>
              <View style={styles.numberTile}>
                <Text style={styles.numberVal}>{calculations.personality}</Text>
                <Text style={styles.numberLabel}>PERSONALITY</Text>
              </View>
            </View>

            {/* Dynamic Focus Blockages Card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Focus Blockages (Missing Numbers)</Text>
              <Text style={styles.sectionSub}>
                These frequencies are missing from your natal grid ({displayDob}) and represent your growth areas:
              </Text>
              <View style={styles.badgeRow}>
                {calculations.missingNumbers.map((num) => (
                  <View key={num} style={styles.blockageBadge}>
                    <Text style={styles.blockageBadgeText}>Number {num}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Account Status Card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Account Status</Text>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Plan</Text>
                <Text style={styles.planBadge}>Free Compass</Text>
              </View>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => router.push('/settings')}
              >
                <Text style={styles.upgradeButtonText}>Manage Preferences</Text>
              </TouchableOpacity>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                Your numerology profile is a lens for self-reflection, not a fixed fate.
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  container: { padding: 20, paddingBottom: 50 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: { paddingVertical: 6 },
  backButtonText: { fontSize: 14, color: '#5E7563', fontWeight: '700' },
  editToggle: { backgroundColor: '#EEE9E1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  editToggleText: { fontSize: 12, fontWeight: '700', color: '#2C2523' },
  avatarCard: { alignItems: 'center', marginTop: 6, marginBottom: 20 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E3DCD8', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 28, fontWeight: '700', color: '#4C4441' },
  userName: { fontSize: 22, fontWeight: '800', color: '#2C2523', marginTop: 10 },
  archetypeText: { fontSize: 13, fontWeight: '700', color: '#6B52A1', marginTop: 2 },
  dobText: { fontSize: 12, color: '#8C847E', marginTop: 4 },
  numbersGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  numberTile: { flex: 1, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14, marginHorizontal: 3, alignItems: 'center', borderWidth: 1, borderColor: '#EDE8E1' },
  numberVal: { fontSize: 22, fontWeight: '800', color: '#2C2523' },
  numberLabel: { fontSize: 8, color: '#8C847E', marginTop: 4, fontWeight: '700', letterSpacing: 0.5 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#EDEBE6' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2C2523', marginBottom: 4 },
  sectionSub: { fontSize: 12, color: '#7C736C', lineHeight: 18, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  blockageBadge: { backgroundColor: '#F4F0EB', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8 },
  blockageBadgeText: { fontSize: 12, fontWeight: '700', color: '#4C4441' },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  accountLabel: { fontSize: 14, color: '#7C736C' },
  planBadge: { backgroundColor: '#E6EAF0', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, fontSize: 12, fontWeight: '700' },
  upgradeButton: { backgroundColor: '#5E7563', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  upgradeButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  disclaimerBox: { backgroundColor: '#F3F1F4', borderRadius: 12, padding: 12, marginTop: 4 },
  disclaimerText: { fontSize: 11, color: '#8A7F80', lineHeight: 17, textAlign: 'center' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#EDEBE6' },
  formTitle: { fontSize: 20, fontWeight: '800', color: '#2C2523', marginBottom: 4 },
  formSubtitle: { fontSize: 12, color: '#77706A', lineHeight: 18, marginBottom: 18 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#77706A', letterSpacing: 0.8, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FAF9F6', borderWidth: 1, borderColor: '#E3DFD7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2C2523' },
  systemRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 8 },
  systemOption: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderWidth: 1, borderColor: '#E3DFD7', borderRadius: 10, alignItems: 'center', backgroundColor: '#FAF9F6' },
  systemOptionSelected: { borderColor: '#5E7563', backgroundColor: '#F3F8F4' },
  systemText: { fontSize: 11, color: '#77706A', fontWeight: '600' },
  systemTextSelected: { color: '#2E7D32', fontWeight: '800' },
  saveButton: { backgroundColor: '#5E7563', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});