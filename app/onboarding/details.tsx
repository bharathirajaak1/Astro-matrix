import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/features/profile/store';

export default function DetailsEntryScreen() {
  const router = useRouter();
  const setProfile = useProfileStore((s) => s.setProfile);

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');

  const formatDobInput = (text: string) => {
    // Keep only numbers
    const cleaned = text.replace(/\D/g, '').slice(0, 8);
    let formatted = cleaned;

    if (cleaned.length > 4 && cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    } else if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6)}`;
    }
    setDob(formatted);
  };

  const handleCalculate = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full birth name.');
      return;
    }
    if (dob.length !== 10) {
      Alert.alert(
        'Invalid Birth Date',
        'Please enter your date of birth in YYYY-MM-DD format.'
      );
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProfile({
      id: 'default',
      name: name.trim(),
      birthDate: dob,
      system: 'pythagorean',
      updatedAt: new Date().toISOString(),
    });

    router.push('/onboarding/blueprint-result');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.step}>Step 5 of 5</Text>
        </View>

        {/* Title Block */}
        <View style={styles.centerHeader}>
          <Text style={styles.icon}>✍️</Text>
          <Text style={styles.title}>The Gateway to Your Stars</Text>
          <Text style={styles.subTitle}>
            Enter your details exactly as they appear on your birth certificate for the most accurate reading.
          </Text>
        </View>

        {/* Input Form Card */}
        <View style={styles.formCard}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Johnathan Alexander Doe"
              placeholderTextColor="#A8A29E"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>DATE OF BIRTH (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#A8A29E"
              value={dob}
              onChangeText={formatDobInput}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={handleCalculate}
        >
          <Text style={styles.primaryButtonText}>
            Calculate My Blueprint →
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
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
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
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1C1917',
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