import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Haptics from 'expo-haptics';
import {
  VoiceReflection,
  getAllReflections,
  getReflectionByDate,
  saveReflection,
  deleteReflection,
} from '@/services/voiceStorage';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Audio: any = null;
if (!isExpoGo) {
  try {
    Audio = require('expo-av')?.Audio;
  } catch {
    Audio = null;
  }
}

interface VoiceRecorderProps {
  currentAffirmation?: string;
  onRecordingSaved?: (reflection: VoiceReflection) => void;
}

const DEFAULT_AFFIRMATION =
  'I will greet the day with purpose, grounded in structure and inner clarity.';

export default function VoiceRecorder({
  currentAffirmation = DEFAULT_AFFIRMATION,
  onRecordingSaved,
}: VoiceRecorderProps) {
  const [loading, setLoading] = useState(true);
  const [todayReflection, setTodayReflection] = useState<VoiceReflection | null>(null);
  const [pastReflections, setPastReflections] = useState<VoiceReflection[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [recording, setRecording] = useState<any>(null);
  const [sound, setSound] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const todayIso = new Date().toISOString().split('T')[0];

  // Load existing reflections on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [todayItem, allItems] = await Promise.all([
          getReflectionByDate(todayIso),
          getAllReflections(),
        ]);
        if (isMounted) {
          setTodayReflection(todayItem);
          setPastReflections(allItems);
        }
      } catch (err) {
        console.warn('Error loading recordings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync?.();
      }
    };
  }, [todayIso]);

  // Duration timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!Audio) {
      setIsRecording(true);
      return;
    }

    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Please grant microphone access to record voice reflections.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const options =
        Audio.RecordingOptionsPresets?.HIGH_QUALITY ||
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY;
      const { recording: newRecording } = await Audio.Recording.createAsync(options);

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.warn('Failed to start recording', err);
      setIsRecording(true);
    }
  };

  const stopRecording = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRecording(false);

    let finalUri = 'simulated-reflection-recording';
    const recDuration = duration || 5;

    if (Audio && recording) {
      try {
        await recording.stopAndUnloadAsync();
        finalUri = recording.getURI() || finalUri;
        setRecording(null);
      } catch (err) {
        console.warn('Failed to unload recording cleanly:', err);
      }
    }

    const saved = await saveReflection({
      date: todayIso,
      affirmationText: currentAffirmation,
      recordingUri: finalUri,
      duration: recDuration,
    });

    setTodayReflection(saved);
    const refreshed = await getAllReflections();
    setPastReflections(refreshed);
    if (onRecordingSaved) onRecordingSaved(saved);
  };

  const playAudioUri = async (id: string, uri: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (playingId === id) {
      if (sound) await sound.stopAsync();
      setPlayingId(null);
      return;
    }

    if (!Audio || uri.startsWith('simulated')) {
      setPlayingId(id);
      setTimeout(() => setPlayingId(null), 2500);
      return;
    }

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingId(id);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (err) {
      console.warn('Audio playback corrupted or inaccessible:', err);
      Alert.alert('Playback Notice', 'Recording file is inaccessible or unavailable.');
      setPlayingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sound && playingId === id) {
      await sound.unloadAsync?.();
      setPlayingId(null);
    }
    const updated = await deleteReflection(id);
    setPastReflections(updated);
    if (todayReflection?.id === id) {
      setTodayReflection(null);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#57715E" />
        <Text style={styles.loadingText}>Loading Voice Journal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>🎙️ Voice Reflection</Text>
          <Text style={styles.subtitle}>
            Speak your intention or reflect on today's micro-ritual.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowHistory(!showHistory)}
          style={styles.historyToggle}
        >
          <Text style={styles.historyToggleText}>
            {showHistory ? 'Hide Journal' : `Journal (${pastReflections.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Day Active Status */}
      {isRecording ? (
        <View style={styles.recordingBox}>
          <Text style={styles.timer}>🔴 Recording: {formatTimer(duration)}</Text>
          <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
            <Text style={styles.stopButtonText}>⏹ Stop & Save</Text>
          </TouchableOpacity>
        </View>
      ) : todayReflection ? (
        <View style={styles.recordedBox}>
          <View style={styles.reflectionInfo}>
            <Text style={styles.affirmationHeading}>TODAY'S AFFIRMATION</Text>
            <Text style={styles.affirmationBody}>"{todayReflection.affirmationText}"</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.listenButton,
                playingId === todayReflection.id && styles.playingButton,
              ]}
              onPress={() => playAudioUri(todayReflection.id, todayReflection.recordingUri)}
            >
              <Text style={styles.listenButtonText}>
                {playingId === todayReflection.id
                  ? '🔊 Playing Today’s Reflection...'
                  : '▶ Listen to Today’s Affirmation'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reRecordButton}
              onPress={startRecording}
            >
              <Text style={styles.reRecordText}>🔄 Re-record</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyPromptBox}>
          <Text style={styles.emptyPromptAffirmation}>"{currentAffirmation}"</Text>
          <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
            <Text style={styles.recordButtonText}>🎙 Record Your Voice</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expandable Voice Journal Section */}
      {showHistory && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>PAST VOICE REFLECTIONS</Text>
          {pastReflections.length === 0 ? (
            <Text style={styles.noHistoryText}>No past recordings saved yet.</Text>
          ) : (
            pastReflections.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>📅 {item.date}</Text>
                  <Text style={styles.historyDuration}>{formatTimer(item.duration)}</Text>
                </View>

                <Text style={styles.historyAffirmation}>"{item.affirmationText}"</Text>

                <View style={styles.historyActions}>
                  <TouchableOpacity
                    style={[
                      styles.historyPlayBtn,
                      playingId === item.id && styles.playingButton,
                    ]}
                    onPress={() => playAudioUri(item.id, item.recordingUri)}
                  >
                    <Text style={styles.historyPlayText}>
                      {playingId === item.id ? '🔊 Playing' : '▶ Play'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.historyDeleteBtn}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={styles.historyDeleteText}>🗑 Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginTop: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  subtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
    maxWidth: 220,
  },
  historyToggle: {
    backgroundColor: '#F5F5F4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  historyToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#57715E',
  },
  recordingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timer: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  stopButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stopButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  recordedBox: {
    gap: 10,
  },
  reflectionInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  affirmationHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  affirmationBody: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#334155',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  listenButton: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  listenButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  playingButton: {
    backgroundColor: '#A7F3D0',
  },
  reRecordButton: {
    backgroundColor: '#F5F5F4',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  reRecordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#57534E',
  },
  emptyPromptBox: {
    gap: 8,
  },
  emptyPromptAffirmation: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 4,
  },
  recordButton: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7E22CE',
  },
  historySection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
    paddingTop: 12,
    gap: 8,
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 0.8,
  },
  noHistoryText: {
    fontSize: 12,
    color: '#A8A29E',
    fontStyle: 'italic',
  },
  historyCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    gap: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1917',
  },
  historyDuration: {
    fontSize: 11,
    color: '#78716C',
  },
  historyAffirmation: {
    fontSize: 12,
    color: '#57534E',
    fontStyle: 'italic',
  },
  historyActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  historyPlayBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  historyPlayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  historyDeleteBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  historyDeleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});