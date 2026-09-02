import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

export default function CommunityScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [wins, setWins] = useState([
    { id: 1, name: 'Aditya K.', text: 'Completed my 5-day inner silence quest and feel so much more centered.', cheers: 5 },
    { id: 2, name: 'Meera R.', text: 'Cleared my desk and prepared for the new week ✨︎', cheers: 9 }
  ]);
  const [newWin, setNewWin] = useState('');

  const startRecording = async () => {
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
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGHOUCITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Error', 'Unable to start audio recording.');
    }
  };

  const stopRecording = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getUri();
      setRecordingUri(uri);
      setRecording(null);
      setIsRecording(false);
      Alert.alert('Affirmation Saved!', 'Your voice affirmation has been recorded successfully.');
    } catch (err) {
      Alert.alert('Error', 'Unable to process recording.');
    }
  };

  const playBack = async () => {
    if (!recordingUri) return;
    const { sound } = await Audio.Sound.createAsync(
      { uri: recordingUri },
      { shouldPlay: true }
    );
    await sound.playAsync();
  };

  const handleCheer = (id: number) => {
    Haptics.lightAsync();
    setWins(prev => prev.map(w => w.id === id ? { ...w, cheers: w.cheers + 1 } : w));
  };


  const postWin = () => {
    if (!newWin.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWins(prev => [
      { id: Date.now(), name: 'You', text: newWin.trim(), cheers: 1 },
      ...prev
    ]);
    setNewWin('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerSub}>SOUND & CONNECTION</Text>
        <Text style={styles.headerTitle}>Voice & Community</Text>

        { /* Voice Affirmation Recorder */ }
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎙 Voice Affirmation</Text>
          <Text style={styles.cardSub}>Speak your daily affirmation aloud to deepen its resonance.</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style+[{styles.recordButton, isRecording && styles.recording Active]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? '⟹ Stop Recording' : '🎙 Record Voice'}
              </Text>
            </TouchableOpacity>

            {recordingUri && (
              <TouchableOpacity style={styles.playButton} onPress={playBack}>
                <Text style={styles.playButtonText}>▶ Listen</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        { /* Share a Win */ }
        <Text style={styles.sectionLabel}>COMMUNITY WELL</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Share Your Daily Win ✨</Text>
          <TextInput
            style={styles.input}
            placeholder='Completed a quest or meditation today?'
            value={newWin}
            onChangeText={setNewWin}
          />
          <TouchableOpacity style={styles.postButton} onPress={postWin}>
            <Text style={styles.postButtonText}>Post Win</Text>
          </TouchableOpacity>
        </View>

        { /* Community Wins Feed */ }
        {wins.map((win) => (
          <View key={win.id} style={styles.winCard}>
            <View style={styles.winHeader}>
              <Text style={styles.winName}>{win.name}</Text>
              <TouchableOpacity
                style={styles.cheerButton}
                onPress={() => handleCheer(win.id)}
              >
                <Text style={styles.cheerText}>🌼 {win.cheers}</Text>
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
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 20, backgroundColor: '#FFF9F6', paddingBottom: 45 },
  headerSub: {fontSize: 11, color: '#8880', fontWeight: '6', letterSpacing: 1.5 },
  headerTitle: { fontSize: 22, fontWeight: '7', color: '#2C2523', marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E7E4E0' },
  cardTitle: {fontSize: 15, fontWeight: '7', color: '#2C2523' },
  cardSub: {fontSize: 12, color: '#7C736C', marginTop: 2, marginBottom: 14, lineHeight: 18 },
  buttonRow: {flexDirection: 'row', justifyContent: 'space-between' },
  recordButton: { flex: 1, backgroundColor: '#5E7563', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  recordingActive: {backgroundColor: '#C95252' },
  recordButtonText: {color: '#FFFFFF', fontSize: 13, fontWeight: '7' },
  playButton: {backgroundColor: '#EEE9E1', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, marginLeft: 10 },
  playButtonText: { color: '#2C2523', fontSize: 13, fontWeight: '7' },
  sectionLabel: { fontSize: 11, fontWeight: '7', color: '#8880', letterSpacing: 1, marginTop: 6, marginBottom: 8 },
  input: { backgroundColor: '#FAF9F6', borderRadius: 12, padding: 12, fontSize: 13, marginTop: 10, marginBottom: 12, borderWidth: 1, borderColor: '#E7E4E0' },
  postButton: {backgroundColor: '#6C49C0', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  postButtonText: {color: '#FFFFFF', fontSize: 13, fontWeight: '7' },
  winCard: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E7E4E0' },
  winHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  winName: { fontSize: 14, fontWeight: '7', color: '#2C2523' },
  cheerButton: {backgroundColor: '#FAEEEE', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  cheerText: {fontSize: 12, color: '#C95252', fontWeight: '7' },
  winText: {fontSize: 13, color: '#7C736C', lineHeight: 18 },
});
