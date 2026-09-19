import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  getUserProfile,
  calculateSwot,
  SwotBlueprint,
  SAMPLE_PROFILE,
} from '@/features/profile/profileStore';

export default function SwotBlueprintScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(SAMPLE_PROFILE);
  const [swot, setSwot] = useState<SwotBlueprint | null>(null);

  useEffect(() => {
    async function load() {
      const p = await getUserProfile();
      const current = p || SAMPLE_PROFILE;
      setProfile(current);
      setSwot(calculateSwot(current.dob, current.fullName));
    }
    load();
  }, []);

  const handleStartQuest = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)/remedies');
  };

  const handleExploreDashboard = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  };

  if (!swot) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>✨ YOUR ENERGETIC BLUEPRINT</Text>
        <TouchableOpacity onPress={handleExploreDashboard}>
          <Text style={styles.skipCross}>Skip ✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subheading}>
        Calculated from {profile.dob} • {profile.fullName}
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CARD 1: SUPERPOWER */}
        <View style={[styles.card, styles.superpowerCard]}>
          <View style={styles.cardTop}>
            <Text style={styles.cardHeader}>⚡ SUPERPOWER (Strengths)</Text>
            <Text style={styles.badgeGold}>{swot.superpower.tag}</Text>
          </View>
          <Text style={styles.cardTitle}>"{swot.superpower.title}"</Text>
          {swot.superpower.description.map((line, idx) => (
            <Text key={idx} style={styles.bulletPoint}>• {line}</Text>
          ))}
        </View>

        {/* CARD 2: BLIND SPOT */}
        <View style={[styles.card, styles.blindSpotCard]}>
          <View style={styles.cardTop}>
            <Text style={styles.cardHeader}>🌒 BLIND SPOT (Challenge)</Text>
            <Text style={styles.badgeIndigo}>{swot.blindSpot.tag}</Text>
          </View>
          <Text style={styles.cardTitle}>"{swot.blindSpot.title}"</Text>
          {swot.blindSpot.description.map((line, idx) => (
            <Text key={idx} style={styles.bulletPoint}>• {line}</Text>
          ))}
        </View>

        {/* CARD 3: GOLDEN TICKET */}
        <View style={[styles.card, styles.goldenTicketCard]}>
          <View style={styles.cardTop}>
            <Text style={styles.cardHeader}>🎫 GOLDEN TICKET (Dharma)</Text>
            <Text style={styles.badgeEmerald}>{swot.goldenTicket.tag}</Text>
          </View>
          <Text style={styles.cardTitle}>"{swot.goldenTicket.title}"</Text>
          {swot.goldenTicket.description.map((line, idx) => (
            <Text key={idx} style={styles.bulletPoint}>• {line}</Text>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleStartQuest}>
          <Text style={styles.primaryButtonText}>✨ BEGIN MY FOUNDATION QUEST →</Text>
          <Text style={styles.primaryButtonSub}>7-Day Alignment Plan Tailored to You</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryLink} onPress={handleExploreDashboard}>
          <Text style={styles.secondaryLinkText}>Explore Dashboard First →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#57715E',
    letterSpacing: 1,
  },
  skipCross: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78716C',
  },
  subheading: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 16,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
  },
  superpowerCard: {
    backgroundColor: '#FFFDF9',
    borderColor: '#F59E0B',
  },
  blindSpotCard: {
    backgroundColor: '#FBFBFE',
    borderColor: '#6366F1',
  },
  goldenTicketCard: {
    backgroundColor: '#F7FDF9',
    borderColor: '#10B981',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#44403C',
  },
  badgeGold: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeIndigo: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeEmerald: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 12,
    color: '#57534E',
    lineHeight: 18,
    marginBottom: 4,
  },
  footer: {
    gap: 10,
    paddingTop: 8,
  },
  primaryButton: {
    backgroundColor: '#57715E',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButtonSub: {
    color: '#D1FAE5',
    fontSize: 11,
    marginTop: 2,
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  secondaryLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716C',
  },
});