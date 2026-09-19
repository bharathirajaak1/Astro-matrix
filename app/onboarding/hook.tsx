import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function OnboardingHookScreen() {
  const router = useRouter();

  const handleNext = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/disclaimer');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* This line hides the extra top bar */}
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Navigation */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.step}>Step 2 of 5</Text>
        </View>

        {/* Narrative Header */}
        <View style={styles.centerHeader}>
          <Text style={styles.icon}>📖</Text>
          <Text style={styles.title}>
            Your Life is a Story. Numbers are the Chapters.
          </Text>
        </View>

        {/* Narrative Card */}
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            From ancient Greek philosophers to Indian sages, numbers have always been the bridge between the cosmos and the individual. Your Name and Date of Birth aren't random—they are a unique vibrational fingerprint.
          </Text>

          <Text style={styles.bodyText}>
            Inside you lies 50% of your ultimate potential. The other 50% is about understanding the unseen patterns—your hidden strengths, your blind spots, and the opportunities knocking at your door.
          </Text>

          <Text style={[styles.bodyText, { marginBottom: 0 }]}>
            Astro-Matrix doesn't just give you numbers; it gives you a roadmap to turn your blockers into stepping stones. Are you ready to see what the cosmos has written for you?
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={handleNext}
        >
          <Text style={styles.primaryButtonText}>
            Yes, Show Me My Matrix →
          </Text>
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
    gap: 18,
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
    marginVertical: 6,
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  bodyText: {
    fontSize: 14,
    color: '#44403C',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#57715E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});