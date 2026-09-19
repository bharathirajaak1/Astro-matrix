import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

type SystemChoice = 'pythagorean' | 'chaldean';

export default function SystemChoiceScreen() {
  const router = useRouter();
  const [selectedSystem, setSelectedSystem] = useState<SystemChoice>('pythagorean');

  const handleSelect = (sys: SystemChoice) => {
    void Haptics.selectionAsync();
    setSelectedSystem(sys);
  };

  const handleContinue = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/details');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.step}>Step 4 of 5</Text>
        </View>

        {/* Title Block */}
        <View style={styles.centerHeader}>
          <Text style={styles.icon}>🔢</Text>
          <Text style={styles.title}>Select Your Numerology System</Text>
          <Text style={styles.subTitle}>
            Both are accurate — think of this as choosing between a telescope and a microscope. You can switch anytime in Settings.
          </Text>
        </View>

        {/* Options */}
        <View style={styles.cardContainer}>
          {/* Pythagorean Option */}
          <TouchableOpacity
            style={[
              styles.choiceCard,
              selectedSystem === 'pythagorean' && styles.choiceCardSelected,
            ]}
            activeOpacity={0.8}
            onPress={() => handleSelect('pythagorean')}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Pythagorean (Western) — The Modern Master
              </Text>
              {selectedSystem === 'pythagorean' && (
                <Text style={styles.badge}>✓ Active</Text>
              )}
            </View>
            <Text style={styles.cardDescription}>
              The modern standard based on numbers 1–9. Excellent for Life Path, core soul purpose, and Lo Shu grid alignment.
            </Text>
          </TouchableOpacity>

          {/* Chaldean Option */}
          <TouchableOpacity
            style={[
              styles.choiceCard,
              selectedSystem === 'chaldean' && styles.choiceCardSelected,
            ]}
            activeOpacity={0.8}
            onPress={() => handleSelect('chaldean')}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Chaldean (Babylonian) — The Ancient Sage
              </Text>
              {selectedSystem === 'chaldean' && (
                <Text style={styles.badge}>✓ Active</Text>
              )}
            </View>
            <Text style={styles.cardDescription}>
              Ancient sound-vibrational system (1–8). Highly focused on name vibrations, karmic numbers, and destiny.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Action */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={handleContinue}
        >
          <Text style={styles.primaryButtonText}>Continue to Details →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  backLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#57715E',
  },
  step: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A8A29E',
  },
  centerHeader: {
    alignItems: 'center',
    marginVertical: 4,
  },
  icon: {
    fontSize: 46,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 14,
    color: '#57534E',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  cardContainer: {
    gap: 14,
  },
  choiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E7E5E4',
    gap: 8,
  },
  choiceCardSelected: {
    borderColor: '#57715E',
    backgroundColor: '#F7FAF8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#57715E',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#57534E',
    lineHeight: 19,
  },
  primaryButton: {
    backgroundColor: '#57715E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});