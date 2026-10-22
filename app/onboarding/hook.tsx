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
          <Text style={styles.step}>Step 2 of 4</Text>
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
            Every name and date of birth carries a unique set of numbers that can be explored through numerology. These numbers offer a way to reflect on your natural tendencies, strengths, and areas of focus.
          </Text>

          <Text style={styles.subsectionHeading}>The Ancient Wisdom of Numbers</Text>

          <Text style={styles.bodyText}>
            The roots of the Pythagorean tradition reach back to ancient Greece, more than 2,500 years ago. Pythagorean thinkers explored the idea that numbers could reveal patterns, relationships, and harmony in the world around us.
          </Text>

          <Text style={styles.bodyText}>
            Over the centuries, these ideas influenced philosophical and mathematical traditions and inspired continued exploration of the deeper significance of numbers.
          </Text>

          <Text style={[styles.bodyText, styles.bodyTextBold]}>
            AstroMatrix brings this tradition into a modern, personal experience.
          </Text>

          <Text style={styles.bodyText}>
            Using the <Text style={styles.bodyTextBold}>Pythagorean numerology system</Text>, AstroMatrix explores the numbers associated with your name and date of birth to create your personal blueprint, understand your core numbers, and identify areas for self-reflection and personal growth.
          </Text>

          <Text style={[styles.bodyText, { marginBottom: 0 }]}>
            Your numbers are not a fixed destiny. They are a starting point for understanding yourself, gaining perspective, and making more conscious choices.
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
    fontSize: 68,
    lineHeight: 78,
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
  // A subsection heading within the existing Narrative Card (not a separate
  // card) - stronger/darker than `bodyText` so it reads as a distinct
  // heading, but clearly smaller than `title` so the main heading stays
  // the strongest element on the screen.
  subsectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  // Weight-only override, layered on top of `bodyText` (or inline within
  // it) to bold a sentence/phrase without changing size, color, or
  // line-height.
  bodyTextBold: {
    fontWeight: '700',
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