import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { setUserProfile, SAMPLE_PROFILE } from '@/features/profile/profileStore';
import { useProfileStore } from '@/features/profile/store';
import { useProgressStore } from '@/features/remedies/progressStore';

export default function DetailsEntryScreen() {
  const params = useLocalSearchParams();
  const system = (params.system as any) || 'Pythagorean';

  const formatDobInput = (text: string): string => {
    if (text.endsWith('-') && text.length !== 5 && text.length !== 8) {
      text = text.slice(0, -1);
    }

    const cleaned = text.replace(/\D/g, '').slice(0, 8);

    if (cleaned.length < 4) return cleaned;
    if (cleaned.length === 4) return `${cleaned}-`;
    if (cleaned.length < 6) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    if (cleaned.length === 6) return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  };

  const isValidDob = (dobStr: string): { valid: boolean; message?: string } => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
      return { valid: false, message: 'Please enter a complete date in YYYY-MM-DD format.' };
    }

    const [year, month, day] = dobStr.split('-').map(Number);
    const currentYear = new Date().getFullYear();

    if (year < 1900 || year > currentYear) {
      return { valid: false, message: `Year must be between 1900 and ${currentYear}.` };
    }

    if (month < 1 || month > 12) {
      return { valid: false, message: 'Month must be between 01 and 12.' };
    }

    const dateObj = new Date(year, month - 1, day);
    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
    ) {
      return { valid: false, message: 'Please enter a valid calendar day for this month.' };
    }

    if (dateObj > new Date()) {
      return { valid: false, message: 'Date of birth cannot be in the future.' };
    }

    return { valid: true };
  };

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const router = useRouter();

  const handleGenerate = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter your full or preferred name.');
      return;
    }
    const dobValidation = isValidDob(dob);
    if (!dobValidation.valid) {
      Alert.alert('Invalid Date of Birth', dobValidation.message);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setUserProfile({
      fullName: fullName.trim(),
      dob,
      system,
      isSampleUser: false,
      hasAcceptedDisclaimer: true,
    });
    await (useProfileStore.getState() as any).save({
      fullName: fullName.trim(),
      dob,
      system,
    } as any);
    useProfileStore.getState().updateFlags({ blueprintCalculated: true });
    useProgressStore.getState().resetProgress();
    router.push('/onboarding/blueprint-result' as any);
  };

  const handleSkipToSample = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setUserProfile(SAMPLE_PROFILE);
    await (useProfileStore.getState() as any).save({
      fullName: SAMPLE_PROFILE.fullName,
      dob: SAMPLE_PROFILE.dob,
      system: SAMPLE_PROFILE.system,
    } as any);
    useProfileStore.getState().updateFlags({ blueprintCalculated: true });
    router.push('/onboarding/blueprint-result' as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.step}>Step 4 of 4</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.icon}>✍️</Text>
          <Text style={styles.title}>Your Natal Details</Text>
          <Text style={styles.subtitle}>
            Your date of birth anchors your Lo Shu matrix, daily golden hours, and personal day numbers.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Priya Sharma"
              placeholderTextColor="#A8A29E"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DATE OF BIRTH (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#A8A29E"
              value={dob}
              onChangeText={(text) => setDob(formatDobInput(text))}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGenerate}>
            <Text style={styles.primaryButtonText}>Calculate My Blueprint →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkipToSample}>
            <Text style={styles.skipButtonText}>Explore with Sample Profile →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    gap: 16,
  },
  icon: {
    fontSize: 42,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78716C',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1C1917',
  },
  footer: {
    gap: 12,
    marginTop: 20,
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
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716C',
  },
});