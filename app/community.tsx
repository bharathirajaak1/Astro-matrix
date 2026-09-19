import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Guard expo-av to prevent crash in Expo Go SDK 57
import Constants, { ExecutionEnvironment } from 'expo-constants';

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

interface WinItem {
  id: number;
  name: string;
  text: string;
  cheers: number;
}

export default function CommunityScreen() {
  const [recording, setRecording] = useState<any>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [wins, setWins] = useState<WinItem[]>([
    { id: 1, name: 'Aditya K.', text: 'Completed my 5-day inner silence quest and feel so much more centered.', cheers: 5 },
    { id: 2, name: 'Meera R.', text: 'Cleared my desk and prepared for the new week!', cheers: 9 },
  ]);
  const [newWin, setNewWin] = useState('');

  const startRecording = async () => {
    if (!Audio) {
      Alert.alert('Notice', 'Audio recording is not supported in this environment.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Microphone access is required to record affirmations.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
    } catch {
      Alert.alert('Error', 'Could not start audio recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      setIsRecording(false);
    } catch {
      setIsRecording(false);
    }
  };

  const playBack = async () => {
    if (!recordingUri || !Audio) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      await sound.playAsync();
    } catch {
      Alert.alert('Error', 'Could not play back recording.');
    }
  };

  const postWin = () => {
    if (!newWin.trim()) return;

    const win: WinItem = {
      id: Date.now(),
      name: 'You',
      text: newWin.trim(),
      cheers: 0,
    };

    setWins([win, ...wins]);
    setNewWin('');
  };

  const handleCheer = (id: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWins(
      wins.map((w) => (w.id === id ? { ...w, cheers: w.cheers + 1 } : w))
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerSub}>SOUND & CONNECTION</Text>
        <Text style={styles.headerTitle}>Voice & Community</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Voice Affirmation</Text>
          <Text style={styles.cardSub}>Speak your daily affirmation aloud to deepen its resonance.</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordingActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? 'Stop Recording' : 'Record Voice'}
              </Text>
            </TouchableOpacity>

            {recordingUri && (
              <TouchableOpacity style={styles.playButton} onPress={playBack}>
                <Text style={styles.playButtonText}>Listen</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.sectionLabel}>COMMUNITY WELL</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Share Your Daily Win</Text>
          <TextInput
            style={styles.input}
            placeholder="Completed a quest or meditation today?"
            placeholderTextColor="#999"
            value={newWin}
            onChangeText={setNewWin}
          />
          <TouchableOpacity style={styles.postButton} onPress={postWin}>
            <Text style={styles.postButtonText}>Post Win</Text>
          </TouchableOpacity>
        </View>

        {wins.map((win) => (
          <View key={win.id} style={styles.winCard}>
            <View style={styles.winHeader}>
              <Text style={styles.winName}>{win.name}</Text>
              <TouchableOpacity
                style={styles.cheerButton}
                onPress={() => handleCheer(win.id)}
              >
                <Text style={styles.cheerText}>Cheer {win.cheers}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.winText}>{win.text}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6F2',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A827A',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2C2523',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ECE6DF',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2523',
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: '#6E6761',
    lineHeight: 18,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordButton: {
    backgroundColor: '#2C2523',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  recordingActive: {
    backgroundColor: '#C53030',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  playButton: {
    backgroundColor: '#EAE6E1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  playButtonText: {
    color: '#2C2523',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A827A',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2DCD5',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#2C2523',
    marginBottom: 12,
    backgroundColor: '#FAFAF8',
  },
  postButton: {
    backgroundColor: '#5E7563',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  winCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEAE4',
  },
  winHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  winName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#2C2523',
  },
  cheerButton: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cheerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5E7563',
  },
  winText: {
    fontSize: 13,
    color: '#524B45',
    lineHeight: 18,
  },
});