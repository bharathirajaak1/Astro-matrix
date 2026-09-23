import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNotificationsStore } from '@/features/notifications';
import { useProfileStore } from '@/features/profile/store';

export default function SettingsScreen() {
  const profile = useProfileStore((s) => s.profile);
  const reminderEnabled = useNotificationsStore((s) => s.enabled);
  const reminderPermission = useNotificationsStore((s) => s.permission);
  const reminderHydrated = useNotificationsStore((s) => s.hydrated);
  const setReminderEnabled = useNotificationsStore((s) => s.setEnabled);
  const [togglingReminder, setTogglingReminder] = useState(false);

  const [traditionalRem, setTraditionalRem] = useState(true);
  const [modernRem, setModernRem] = useState(true);

  const toggleSwitch = (setter: React.Dispatch<React.SetStateAction<boolean>>, val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(!val);
  };

  const handleToggleReminder = async (next: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTogglingReminder(true);
    try {
      await setReminderEnabled(next, profile);
    } finally {
      setTogglingReminder(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerSub}>CUSTOMIZATION & CONTROLS</Text>
        <Text style={styles.headerTitle}>Settings & Preferences</Text>

        <Text style={styles.sectionLabel}>SMART REMINDERS</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.textBox}>
              <Text style={styles.rowHintTitle}>Daily Forecast Reminder</Text>
              <Text style={styles.rowSubtitle}>Get your personalized daily forecast at 8:00 AM.</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              disabled={!reminderHydrated || togglingReminder}
              trackColor={{ false: '#DEEDEE', true: '#5E7563' }}
            />
          </View>
          {reminderPermission === 'denied' && (
            <Text style={styles.permissionHint}>
              Notifications are disabled. Enable notification permission in your device settings to receive the daily forecast.
            </Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>REMEDY PREFERENCES</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.textBox}>
              <Text style={styles.rowHintTitle}>Traditional Remedies</Text>
              <Text style={styles.rowSubtitle}>Classic colors, gemstones, and foods</Text>
            </View>
            <Switch
              value={traditionalRem}
              onValueChange={() => toggleSwitch(setTraditionalRem, traditionalRem)}
              trackColor={{ false: '#DEEDEE', true: '#5E7563' }}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.textBox}>
              <Text style={styles.rowHintTitle}>Modern Micro-Quests</Text>
              <Text style={styles.rowSubtitle}>Actionable habit shifts</Text>
            </View>
            <Switch
              value={modernRem}
              onValueChange={() => toggleSwitch(setModernRem, modernRem)}
              trackColor={{ false: '#DEEDEE', true: '#5E7563' }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.rowHintTitle}>Plan Status</Text>
          <Text style={styles.rowSubtitle}>Free Compass (Life Path + Blockage Map)</Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => Alert.alert('Premium Access', 'Manage subscription settings')}
          >
            <Text style={styles.upgradeButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>A Gentle Reminder</Text>
          <Text style={styles.disclaimerText}>
            This app is a compass, not a guarantee. Small positive nudges help you face each day with intention.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 20, backgroundColor: '#FAF9F6', paddingBottom: 45 },
  headerSub: { fontSize: 11, color: '#888077', fontWeight: '600', letterSpacing: 1.5 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#2C2523', marginTop: 4, marginBottom: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#888077', letterSpacing: 1, marginTop: 6, marginBottom: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E7E4E0' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  textBox: { flex: 1, paddingRight: 12 },
  rowHintTitle: { fontSize: 14, fontWeight: '600', color: '#2C2523' },
  rowSubtitle: { fontSize: 11, color: '#7C736C', marginTop: 2, lineHeight: 16 },
  permissionHint: { fontSize: 11, color: '#8C7A5C', marginTop: 10, lineHeight: 16 },
  upgradeButton: { backgroundColor: '#5E7563', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  upgradeButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  disclaimerBox: { backgroundColor: '#F4F1F0', borderRadius: 12, padding: 14, marginTop: 8 },
  disclaimerTitle: { fontSize: 12, fontWeight: '700', color: '#7C6744', marginBottom: 4 },
  disclaimerText: { fontSize: 11, color: '#8C7A5C', lineHeight: 17, textAlign: 'center' },
});
