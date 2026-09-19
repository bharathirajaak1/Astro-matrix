import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function OnboardingWelcomeScreen() {
  const router = useRouter();

  const handleNext = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/hook');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 1 of 5</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>🧭</Text>
        <Text style={styles.title}>The Universe Speaks in Numbers</Text>
        <Text style={styles.description}>
          Decode your destiny. Unlock your potential.
        </Text>

        <View style={styles.perks}>
          <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>✦</Text>
            <Text style={styles.perkText}>Precision Lo Shu 3x3 Matrix Calculations</Text>
          </View>
          <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>✦</Text>
            <Text style={styles.perkText}>Daily Personal Luck Snapshot & Golden Hour</Text>
          </View>
          <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>✦</Text>
            <Text style={styles.perkText}>7-Day Foundational Micro-Rituals & Voice Journal</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Yes, Show Me My Matrix →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  header: {
    alignItems: 'flex-end',
  },
  step: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A8A29E',
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 54,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  description: {
    fontSize: 14,
    color: '#57534E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  perks: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    gap: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkIcon: {
    fontSize: 14,
    color: '#57715E',
  },
  perkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#292524',
  },
  footer: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#57715E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});