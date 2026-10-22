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
        <Text style={styles.step}>Step 1 of 4</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>🧭</Text>
        <Text style={styles.title}>The Universe Speaks in Numbers</Text>
        <Text style={styles.description}>
          Discover the patterns within your name and date of birth.
        </Text>

        <Text style={styles.journeyHeading}>Your AstroMatrix journey</Text>

        <View style={styles.perks}>
          <View style={styles.featureItem}>
            <View style={styles.featureTitleRow}>
              <Text style={styles.perkIcon}>✦</Text>
              <Text style={styles.featureTitle}>Your Personal Blueprint</Text>
            </View>
            <Text style={styles.featureDescription}>
              Explore the key number patterns in your name and birth date.
            </Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureTitleRow}>
              <Text style={styles.perkIcon}>✦</Text>
              <Text style={styles.featureTitle}>Your Personal Forecast</Text>
            </View>
            <Text style={styles.featureDescription}>
              Explore the flow of your Core Numbers through time.
            </Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureTitleRow}>
              <Text style={styles.perkIcon}>✦</Text>
              <Text style={styles.featureTitle}>Daily Activations</Text>
            </View>
            <Text style={styles.featureDescription}>
              Turn your personal focus into simple daily practices.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Explore AstroMatrix →</Text>
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
  // A section heading for the three feature items below - stronger than
  // `description` (secondary subtitle) but clearly subordinate to `title`
  // (the main heading), so the hierarchy stays title > journeyHeading >
  // featureTitle > description/featureDescription.
  journeyHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'center',
    marginBottom: 14,
  },
  perks: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    gap: 14,
  },
  featureItem: {
    gap: 4,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkIcon: {
    fontSize: 14,
    color: '#57715E',
  },
  // Stronger than `featureDescription` so each item's title reads as the
  // primary label, matching the rest of the app's body-text weight for
  // emphasis (e.g. bold feature/section titles elsewhere).
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },
  // Normal readable body-text contrast, matching the color already used
  // for explanatory body text on the adjoining onboarding screens (e.g.
  // onboarding/hook.tsx's `bodyText`), not the muted secondary tone used
  // for `description` above.
  featureDescription: {
    fontSize: 13,
    color: '#44403C',
    lineHeight: 18,
    marginLeft: 24,
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