import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function DisclaimerScreen() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const handleToggle = () => {
    void Haptics.selectionAsync();
    setAccepted((prev) => !prev);
  };

  const handleContinue = () => {
    if (!accepted) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/system-choice');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Navigation */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.step}>Step 3 of 5</Text>
        </View>

        {/* Center Header */}
        <View style={styles.centerHeader}>
          <Text style={styles.icon}>⚖️</Text>
          <Text style={styles.title}>A Gentle Note Before We Begin...</Text>
        </View>

        {/* Disclaimer Card */}
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            Astro-Matrix is a reflective self-discovery and mindfulness tool grounded in ancient Lo Shu numerological traditions.
          </Text>

          <Text style={styles.bodyText}>
            The insights, forecasts, and energetic remedies presented are intended solely for self-reflection, mindfulness, and personal growth.
          </Text>

          <Text style={[styles.bodyText, { marginBottom: 0 }]}>
            Astro-Matrix does not provide medical, legal, mental health, or financial counseling. All life decisions remain fully your own sovereign choice.
          </Text>
        </View>

        {/* Agreement Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          activeOpacity={0.8}
          onPress={handleToggle}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I understand and accept this guidance as a self-reflection tool.
          </Text>
        </TouchableOpacity>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.primaryButton, !accepted && styles.buttonDisabled]}
          disabled={!accepted}
          activeOpacity={0.8}
          onPress={handleContinue}
        >
          <Text style={styles.primaryButtonText}>Accept & Continue →</Text>
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#78716C',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#57715E',
    borderColor: '#57715E',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#44403C',
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#57715E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#D6D3D1',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});