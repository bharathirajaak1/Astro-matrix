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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { isValidDob, isValidFullName } from '@/features/profile/validation';
import { describeCreateFailure } from '@/features/profile/profileScreenMessages';
import { useProfileStore } from '@/features/profile/store';

/**
 * Deliberately a standalone copy of the day/month/year picker pattern from
 * `app/onboarding/details.tsx` - not imported or shared, so this screen has
 * zero coupling to (and cannot change the behavior of) the onboarding flow.
 */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CURRENT_YEAR = new Date().getFullYear();

const getDaysInMonth = (month: number, year: number): number => new Date(year, month, 0).getDate();

type DobField = 'day' | 'month' | 'year';

export default function ProfileCreateScreen() {
  // AstroMatrix currently uses the Pythagorean system exclusively (matching
  // `app/onboarding/details.tsx`'s own fixed value) - not a route param here
  // either.
  const system = 'pythagorean' as const;

  const [fullName, setFullName] = useState('');
  const [dobDay, setDobDay] = useState<number | null>(null);
  const [dobMonth, setDobMonth] = useState<number | null>(null);
  const [dobYear, setDobYear] = useState<number | null>(null);
  const [activePicker, setActivePicker] = useState<DobField | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createAdditionalProfile = useProfileStore((s) => s.createAdditionalProfile);

  const buildDobString = (day: number, month: number, year: number): string =>
    `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const daysInSelectedMonth = dobMonth ? getDaysInMonth(dobMonth, dobYear ?? CURRENT_YEAR) : 31;

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

  const handleCreate = async () => {
    if (submitting) return;

    const trimmedName = fullName.trim();
    if (!isValidFullName(trimmedName)) {
      Alert.alert('Name Required', 'Please enter a full or preferred name.');
      return;
    }

    if (!dobDay || !dobMonth || !dobYear) {
      Alert.alert('Date of Birth Required', 'Please select day, month, and year of birth.');
      return;
    }

    const dob = buildDobString(dobDay, dobMonth, dobYear);
    if (!isValidDob(dob)) {
      Alert.alert('Invalid Date of Birth', 'Please enter a valid date of birth that is not in the future.');
      return;
    }

    setSubmitting(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // `createAdditionalProfile` only ever adds a new registry entry - it
      // never activates it, never touches `profile.current`, and never
      // changes the currently-displayed profile. Switching to it (if
      // desired) is a separate, explicit action on the Profiles screen.
      const result = await createAdditionalProfile({ fullName: trimmedName, dob, system });
      if (result.status === 'created') {
        router.back();
      } else {
        Alert.alert('Could Not Create Profile', describeCreateFailure(result));
      }
    } finally {
      setSubmitting(false);
    }
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
        <View style={styles.content}>
          <Text style={styles.title}>Create Another Profile</Text>
          <Text style={styles.subtitle}>
            Enter a name and date of birth to create a new saved profile.
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
              editable={!submitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DATE OF BIRTH</Text>
            <View style={styles.dobRow}>
              <TouchableOpacity
                style={styles.dobSelector}
                onPress={() => setActivePicker('day')}
                disabled={submitting}
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
                disabled={submitting}
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
                disabled={submitting}
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
            <Text style={styles.privacyNoteText}>
              This creates a separate saved profile - it does not change your currently active one. You can
              switch to it afterward from the Profiles screen.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={() => void handleCreate()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Profile</Text>
            )}
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
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  content: { gap: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#1C1917', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#78716C', textAlign: 'center', lineHeight: 18, marginBottom: 8 },
  inputGroup: { gap: 6 },
  label: { fontSize: 11, fontWeight: '800', color: '#1C1917', letterSpacing: 0.8 },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1C1917',
  },
  dobRow: { flexDirection: 'row', gap: 10 },
  dobSelector: {
    flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  dobSelectorMonth: { flex: 1.4 },
  dobSelectorValue: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  dobSelectorPlaceholder: { fontSize: 15, color: '#A8A29E' },
  privacyNote: { marginTop: 2 },
  privacyNoteText: { fontSize: 12, color: '#78716C', lineHeight: 17 },
  footer: { gap: 12, marginTop: 20 },
  primaryButton: { backgroundColor: '#57715E', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryButtonDisabled: { backgroundColor: '#9AAB9D' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(28, 25, 23, 0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 18, paddingHorizontal: 20, paddingBottom: 32, maxHeight: '60%',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1C1917', textAlign: 'center', marginBottom: 10 },
  modalList: { maxHeight: 320 },
  modalOption: { paddingVertical: 14, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center' },
  modalOptionSelected: { backgroundColor: '#EEF1EC' },
  modalOptionText: { fontSize: 16, color: '#1C1917' },
  modalOptionTextSelected: { fontWeight: '800', color: '#57715E' },
});
