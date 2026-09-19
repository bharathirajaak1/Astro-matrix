import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Txt, Card } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';
import { SoundFrequency } from '@/features/remedies/soundTherapy';

// Safely require expo-av to prevent bundler hard-crashes
let AudioModule: typeof import('expo-av').Audio | null = null;
try {
  AudioModule = require('expo-av').Audio;
} catch {
  AudioModule = null;
}

interface Props {
  sound: SoundFrequency;
}

export function FrequencyPlayer({ sound }: Props) {
  const theme = useTheme();
  const [playbackInstance, setPlaybackInstance] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (playbackInstance) {
        playbackInstance.unloadAsync().catch(() => {});
      }
    };
  }, [playbackInstance]);

  const togglePlay = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!AudioModule) {
      alert('Audio playback requires expo-av to be installed and rebuilt.');
      return;
    }

    if (isLoading) return;

    if (playbackInstance) {
      if (isPlaying) {
        await playbackInstance.pauseAsync();
        setIsPlaying(false);
      } else {
        await playbackInstance.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    try {
      setIsLoading(true);
      await AudioModule.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound: newSound } = await AudioModule.Sound.createAsync(
        { uri: sound.toneUrl },
        { shouldPlay: true, isLooping: true },
        (status: any) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
          }
        }
      );

      setPlaybackInstance(newSound);
      setIsPlaying(true);
    } catch (err) {
      console.warn('Audio playback error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card alt style={styles.card}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
          onPress={togglePlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <FontAwesome
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color="#FFFFFF"
              style={!isPlaying ? { marginLeft: 3 } : undefined}
            />
          )}
        </TouchableOpacity>

        <View style={styles.meta}>
          <Txt variant="label" color="textMuted">
            FREQUENCY THERAPY • {sound.frequency} HZ
          </Txt>
          <Txt variant="heading">{sound.name}</Txt>
          <Txt variant="caption" color="textMuted">
            {sound.purpose}
          </Txt>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
});