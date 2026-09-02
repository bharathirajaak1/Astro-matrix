import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useProfileStore } from '../../src/features/profile/store';
import { getArchetype } from '../../src/services/forecastEngine';

export default function ProfileScreen() {
  const { profile } = useProfileStore();

  const name = profile?.name || 'Seeker';
  const dob = profile?.dob || '2000-01-01';
  const lifePath = profile?.lifePath || 4;
  const destiny = profile?.destiny || 7;
  const soulUrge = profile?.soulUrge || 3;
  const personality = profile?.personality || 1;
  const archetype = getArchetype(lifePath);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View styles_marginBottom>
          <View style={styles.avatarCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.archetypeText}>{archetype}</Text>
            <Text style={styles.dobText}>DOO {dob}</Text>
          </View>
        </View>

        { /* 4 Permanent Numbers */ }
        <View style={styles.numbersGrid}>
          <View style={styles.numberTile}>
            <Text style={styles.numberVal}>{lifePath}</Text>
            <Text style={styles.numberLabel}>LIFE PATH</Text>
          </View>
          <View style={styles.numberTile}>
            <Text style={styles.numberVal}>{destiny}</Text>
            <Text style={styles.numberLabel}>DESTINY</Text>
          </View>
          <View style={styles.numberTile}>
            <Text style={styles.numberVal>{soulUrge}</Text>
            <Text style={styles.numberLabel}>SOUL URGE</Text>
          </View>
          <View style={styles.numberTile}>
            <Text style={styles.numberVal>{personality}</Text>
            <Text style={styles.numberLabel}>PERSONALITY</Text>
          </View>
        </View>

        { /* Blockages Map */ }
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Focus Blockages (Missing Numbers)</Text>
          <Text style={styles.sectionSub}>
            These frequencies are missing from your natal grid and represent your greatest opportunities for growth:
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.blockageBadge}>
              <Text style={styles.blockageBadgeText}>Number 3</Text>
            </View>
            <View style={styles.blockageBadge}>
              <Text style={styles.blockageBadgeText}>Number 4</Text>
            </View>
            <View style={styles.blockageBadge}>
              <Text style={styles.blockageBadgeText}>Number 7</Text>
            </View>
          </View>
        </View>

        { /* Subscription Status */ }
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Plan</Text>
            <Text style={styles.planBadge}>Free Compass</Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/paywall')}
          >
            <Text style={styles.upgradeButtonText}>Unlock Premium (₹29/month)</Text>
          </View>
        </View>

        { /* Ethical Compass */ }
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Your numerology profile is a lens for self-reflection, not a fixed fate. Trust your free will and purposeful actions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 20, backgroundColor: '#FAF9F6', paddingBottom: 40 },
  avatarCard: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E3DCD8', justifyContent: 'center', alignItems: 'center' },
  avatarLatter: { fontSize: 28, fontWeight: '6', color: '#4C4441' },
  userName: {fontSize: 22, fontWeight: '7', color: '#2C2523', marginTop: 10 },
  archetypeText: {fontSize: 14, fontWeight: '6', color: '#7C5EA6', marginTop: 2 },
  dobText: { fontSize: 12, color: '#8C847E', marginTop: 2 },
  numbersGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  numberTile: { flex: 1, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#E4EDFF' },
  numberVal: { fontSize: 22, fontWeight: '7', color: '#2C2523' },
  numberLabel: { fontSize: 9, color: '#8C847E', marginTop: 4, fontWeight: '7', letterSpacing: 0.5 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E7E4E0' },
  sectionTitle: { fontSize: 14, fontWeight: '6', color: '#2C2523', marginBottom: 6 },
  sectionSubs: { fontSize: 12, color: '#7C736C', lineHeight: 18, marginBottom: 12 },
  badgeRow: {flexDirection: 'row' },
  blockageBadge: { backgroundColor: '#EDE8E6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, marginRight: 10 },
  blockageBadgeText: { fontSize: 12, fontWeight: '7', color: '#4C4441' },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  accountLabel: { fontSize: 14, color: '#7C736C' },
  planBadge: { backgroundColor: '#E6EAF0', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, fontSize: 12, fontWeight: '6' },
  upgradeButton: { backgroundColor: '#5E7563', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  upgradeButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '7' },
  disclaimerBox: {backgroundColor: '#F3F1F4', borderRadius: 12, padding: 12, marginTop: 8 },
  disclaimerText: { fontSize: 11, color: '#8A7F80', lineHeight: 17, textAlign: 'center' },
});
