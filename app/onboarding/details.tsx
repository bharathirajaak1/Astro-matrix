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
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/features/profile/store';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CURRENT_YEAR = new Date().getFullYear();

const getDaysInMonth = (month: number, year: number): number => new Date(year, month, 0).getDate();

type DobField = 'day' | 'month' | 'year';

export default function DetailsEntryScreen() {
  // AstroMatrix now uses the Pythagorean numerology system exclusively -
  // there is no longer a system-selection step, so this is a fixed value
  // rather than a route param. Matches the lowercase `NumerologySystem`
  // literal type (`'pythagorean' | 'chaldean'`) in src/core/types.ts.
  const system = 'pythagorean';

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
  const [dobDay, setDobDay] = useState<number | null>(null);
  const [dobMonth, setDobMonth] = useState<number | null>(null);
  const [dobYear, setDobYear] = useState<number | null>(null);
  const [activePicker, setActivePicker] = useState<DobField | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // The existing numerology engine and `isValidDob` both expect DOB as a
  // 'YYYY-MM-DD' string, so the three selected values are combined into
  // that exact internal representation right before it is used/saved.
  const buildDobString = (day: number, month: number, year: number): string =>
    `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const daysInSelectedMonth = dobMonth
    ? getDaysInMonth(dobMonth, dobYear ?? CURRENT_YEAR)
    : 31;

  const selectDay = (day: number) => {
    void Haptics.selectionAsync();
    setDobDay(day);
    setActivePicker(null);
  };

  const selectMonth = (month: number) => {
    void Haptics.selectionAsync();
    setDobMonth(month);
    if (dobDay && dobDay > getDaysInMonth(month, dobYear ?? CURRENT_YEAR)) {
      setDobDay(null);
    }
    setActivePicker(null);
  };

  const selectYear = (year: number) => {
    void Haptics.selectionAsync();
    setDobYear(year);
    if (dobMonth && dobDay && dobDay > getDaysInMonth(dobMonth, year)) {
      setDobDay(null);
    }
    setActivePicker(null);
  };

  const handleGenerate = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter your full or preferred name.');
      return;
    }

    if (!dobDay || !dobMonth || !dobYear) {
      Alert.alert('Date of Birth Required', 'Please select your day, month, and year of birth.');
      return;
    }

    const dob = buildDobString(dobDay, dobMonth, dobYear);
    const dobValidation = isValidDob(dob);
    if (!dobValidation.valid) {
      Alert.alert('Invalid Date of Birth', dobValidation.message);
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await (useProfileStore.getState() as any).save({
      fullName: fullName.trim(),
      dob,
      system,
    } as any);

    router.push('/onboarding/blueprint-result' as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 28 + insets.bottom }]}
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
          <Text style={styles.title}>The Gateway to Your Blueprint</Text>
          <Text style={styles.subtitle}>
            Enter your full name and date of birth to create your personal AstroMatrix blueprint.
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
            <Text style={styles.label}>DATE OF BIRTH</Text>
            <View style={styles.dobRow}>
              <TouchableOpacity
                style={styles.dobSelector}
                onPress={() => setActivePicker('day')}
                accessibilityRole="button"
                accessibilityLabel={dobDay ? `Day of birth, ${dobDay}` : 'Select day of birth'}
              >
                <Text style={dobDay ? styles.dobSelectorValue : styles.dobSelectorPlaceholder}>
                  {dobDay ?? 'Day'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dobSelector, styles.dobSelectorMonth]}
                onPress={() => setActivePicker('month')}
                accessibilityRole="button"
                accessibilityLabel={dobMonth ? `Month of birth, ${MONTH_NAMES[dobMonth - 1]}` : 'Select month of birth'}
              >
                <Text style={dobMonth ? styles.dobSelectorValue : styles.dobSelectorPlaceholder}>
                  {dobMonth ? MONTH_NAMES[dobMonth - 1] : 'Month'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dobSelector}
                onPress={() => setActivePicker('year')}
                accessibilityRole="button"
                accessibilityLabel={dobYear ? `Year of birth, ${dobYear}` : 'Select year of birth'}
              >
                <Text style={dobYear ? styles.dobSelectorValue : styles.dobSelectorPlaceholder}>
                  {dobYear ?? 'Year'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyNoteHeading}>Your information stays on this device.</Text>
            <Text style={styles.privacyNoteText}>
              Your name and date of birth are stored locally on your device to create and personalize your AstroMatrix experience.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGenerate}>
            <Text style={styles.primaryButtonText}>Calculate My Blueprint →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={activePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActivePicker(null)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>
              {activePicker === 'day' ? 'Select Day' : activePicker === 'month' ? 'Select Month' : 'Select Year'}
            </Text>
            <FlatList
              data={
                activePicker === 'day'
                  ? Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1)
                  : activePicker === 'month'
                    ? MONTH_NAMES.map((_, i) => i + 1)
                    : Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i)
              }
              keyExtractor={(item) => String(item)}
              style={styles.modalList}
              renderItem={({ item }) => {
                const isSelected =
                  (activePicker === 'day' && item === dobDay) ||
                  (activePicker === 'month' && item === dobMonth) ||
                  (activePicker === 'year' && item === dobYear);
                return (
                  <TouchableOpacity
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => {
                      if (activePicker === 'day') selectDay(item);
                      else if (activePicker === 'month') selectMonth(item);
                      else if (activePicker === 'year') selectYear(item);
                    }}
                    accessibilityRole="menuitem"
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                      {activePicker === 'month' ? MONTH_NAMES[item - 1] : item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
    color: '#1C1917',
    letterSpacing: 0.8,
  },
  privacyNote: {
    gap: 2,
    marginTop: 2,
  },
  privacyNoteHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#44403C',
    lineHeight: 17,
  },
  privacyNoteText: {
    fontSize: 12,
    color: '#78716C',
    lineHeight: 17,
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
  dobRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dobSelector: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dobSelectorMonth: {
    flex: 1.4,
  },
  dobSelectorValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
  },
  dobSelectorPlaceholder: {
    fontSize: 15,
    color: '#A8A29E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalList: {
    maxHeight: 320,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalOptionSelected: {
    backgroundColor: '#EEF1EC',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1C1917',
  },
  modalOptionTextSelected: {
    fontWeight: '800',
    color: '#57715E',
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
});