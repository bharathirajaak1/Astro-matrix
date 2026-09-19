import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function SystemChoiceScreen() {
  const [selectedSystem, setSelectedSystem] = useState<'Pythagorean' | 'Chaldean'>('Pythagorean');
  const router = useRouter();

  const handleNext = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/onboarding/details',
      params: { system: selectedSystem },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.step}>Step 3 of 4</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>🔢</Text>
        <Text style={styles.title}>Select Your Numerology System</Text>
        <Text style={styles.subtitle}>
          Astro-Matrix adapts calculations to match your preferred traditional school.
        </Text>

        <TouchableOpacity
          style={[styles.card, selectedSystem === 'Pythagorean' && styles.cardActive]}
          onPress={() => setSelectedSystem('Pythagorean')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pythagorean (Western)</Text>
            {selectedSystem === 'Pythagorean' && <Text style={styles.check}>✓ Active</Text>}
          </View>
          <Text style={styles.cardBody}>
            The modern standard based on numbers 1–9. Excellent for Life Path, core soul purpose, and Lo Shu grid alignment.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, selectedSystem === 'Chaldean' && styles.cardActive]}
          onPress={() => setSelectedSystem('Chaldean')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Chaldean (Babylonian)</Text>
            {selectedSystem === 'Chaldean' && <Text style={styles.check}>✓ Active</Text>}
          </View>
          <Text style={styles.cardBody}>
            Ancient sound-vibrational system (1–8). Highly focused on name vibrations, karmic numbers, and destiny.
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Continue to Details →</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#57715E',
  },
  step: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A8A29E',
  },
  content: {
    gap: 12,
  },
  icon: {
    fontSize: 42,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E7E5E4',
  },
  cardActive: {
    borderColor: '#57715E',
    backgroundColor: '#F7FBF8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  check: {
    fontSize: 12,
    fontWeight: '700',
    color: '#57715E',
  },
  cardBody: {
    fontSize: 12,
    color: '#57534E',
    lineHeight: 17,
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