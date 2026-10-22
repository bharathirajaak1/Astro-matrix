import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { profileRepo } from '@/features/profile/repo';
import { describeSwitchFailure, formatDob } from '@/features/profile/profileScreenMessages';
import { useProfileStore } from '@/features/profile/store';
import type { Profile } from '@/core/types';

type ListState =
  | { status: 'loading' }
  | { status: 'ok'; profiles: Profile[] }
  | { status: 'malformed' }
  | { status: 'read_failure' };

export default function ProfileSwitchScreen() {
  const router = useRouter();
  const hydrated = useProfileStore((s) => s.hydrated);
  const activeProfile = useProfileStore((s) => s.profile);
  const profileResolution = useProfileStore((s) => s.profileResolution);
  const switchActiveProfile = useProfileStore((s) => s.switchActiveProfile);

  const [listState, setListState] = useState<ListState>({ status: 'loading' });
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setListState({ status: 'loading' });
    const result = await profileRepo.getAll();
    if (result.status === 'ok') {
      setListState({ status: 'ok', profiles: result.value });
    } else if (result.status === 'absent') {
      setListState({ status: 'ok', profiles: [] });
    } else if (result.status === 'malformed') {
      setListState({ status: 'malformed' });
    } else {
      setListState({ status: 'read_failure' });
    }
  }, []);

  // Re-loads every time this screen regains focus - including returning
  // from `profile/create` after a successful creation - without needing to
  // remount the screen or touch navigation history.
  useFocusEffect(
    useCallback(() => {
      void loadProfiles();
    }, [loadProfiles]),
  );

  const degraded = profileResolution === 'degraded';

  const handleSwitch = async (target: Profile) => {
    if (switchingId !== null || degraded) return;
    void Haptics.selectionAsync();
    setSwitchError(null);
    setSwitchingId(target.id);
    try {
      const result = await switchActiveProfile(target.id);
      if (result.status !== 'activated') {
        setSwitchError(describeSwitchFailure(result));
      }
    } finally {
      setSwitchingId(null);
    }
  };

  if (!hydrated) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerSub}>SAVED PROFILES</Text>
        <Text style={styles.headerTitle}>Your Profiles</Text>

        {profileResolution === 'degraded' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningTitle}>Profile storage couldn't be fully verified</Text>
            <Text style={styles.warningText}>
              Switching is disabled until this is resolved. The profile shown below is your existing saved
              profile, but it is not confirmed as your registry's active selection.
            </Text>
          </View>
        )}

        {profileResolution === 'legacy' && activeProfile !== null && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              No profile has been confirmed as active yet. You're currently using the existing saved profile
              below.
            </Text>
          </View>
        )}

        {switchError !== null && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{switchError}</Text>
          </View>
        )}

        {listState.status === 'loading' && (
          <View style={styles.centeredBox}>
            <ActivityIndicator color="#5E7563" />
          </View>
        )}

        {(listState.status === 'malformed' || listState.status === 'read_failure') && (
          <View style={styles.card}>
            <Text style={styles.rowHintTitle}>Couldn't load your saved profiles</Text>
            <Text style={styles.rowSubtitle}>
              {listState.status === 'malformed'
                ? 'Your saved profiles could not be verified.'
                : 'Your saved profiles could not be read right now.'}{' '}
              Nothing has been changed or reset.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadProfiles()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {listState.status === 'ok' && listState.profiles.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.rowSubtitle}>No saved profiles yet.</Text>
          </View>
        )}

        {listState.status === 'ok' &&
          listState.profiles.map((item) => {
            const isConfirmedActive = profileResolution === 'resolved' && activeProfile?.id === item.id;
            const isCurrentlyInUse = !isConfirmedActive && activeProfile?.id === item.id;
            const isSwitchingThis = switchingId === item.id;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.profileRow}>
                  <View style={styles.textBox}>
                    <Text style={styles.rowHintTitle}>{item.fullName}</Text>
                    <Text style={styles.rowSubtitle}>{formatDob(item.dob)}</Text>
                  </View>
                  {isConfirmedActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                  {isCurrentlyInUse && (
                    <View style={styles.inUseBadge}>
                      <Text style={styles.inUseBadgeText}>Currently in use</Text>
                    </View>
                  )}
                </View>
                {!isConfirmedActive && !isCurrentlyInUse && (
                  <TouchableOpacity
                    style={[styles.switchButton, (switchingId !== null || degraded) && styles.switchButtonDisabled]}
                    onPress={() => void handleSwitch(item)}
                    disabled={switchingId !== null || degraded}
                    accessibilityRole="button"
                    accessibilityLabel={`Switch to ${item.fullName}`}
                  >
                    {isSwitchingThis ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.switchButtonText}>Switch</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            void Haptics.selectionAsync();
            router.push('/profile/create');
          }}
          accessibilityRole="button"
        >
          <Text style={styles.createButtonText}>Create another profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 20, backgroundColor: '#FAF9F6', paddingBottom: 45 },
  headerSub: { fontSize: 11, color: '#888077', fontWeight: '600', letterSpacing: 1.5 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#2C2523', marginTop: 4, marginBottom: 18 },
  centeredBox: { paddingVertical: 24, alignItems: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E7E4E0',
  },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textBox: { flex: 1, paddingRight: 12 },
  rowHintTitle: { fontSize: 14, fontWeight: '600', color: '#2C2523' },
  rowSubtitle: { fontSize: 11, color: '#7C736C', marginTop: 2, lineHeight: 16 },
  activeBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  inUseBadge: { backgroundColor: '#EEEBE6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  inUseBadgeText: { fontSize: 11, fontWeight: '700', color: '#7C736C' },
  switchButton: {
    backgroundColor: '#5E7563',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  switchButtonDisabled: { backgroundColor: '#B9C4BA' },
  switchButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  createButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5E7563',
    marginTop: 4,
  },
  createButtonText: { color: '#5E7563', fontSize: 14, fontWeight: '700' },
  warningBanner: {
    backgroundColor: '#FDF2F2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3D6D6',
  },
  warningTitle: { fontSize: 13, fontWeight: '700', color: '#8C4444', marginBottom: 4 },
  warningText: { fontSize: 12, color: '#8C4444', lineHeight: 17 },
  infoBanner: {
    backgroundColor: '#F4F1F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  infoText: { fontSize: 12, color: '#7C736C', lineHeight: 17 },
  retryButton: {
    backgroundColor: '#EEEBE6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  retryButtonText: { fontSize: 13, fontWeight: '700', color: '#2C2523' },
});
