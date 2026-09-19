import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StreakCelebrationProps {
  visible: boolean;
  streak: number;
  onClose: () => void;
}

const STREAK_MESSAGES: Record<number, string> = {
  3: "Three days in alignment! Your rhythm is building! 🌱",
  7: "A full week of cosmic consistency! 🌟",
  14: "Two full weeks of alignment! Your foundation is rock solid! ✨",
  21: "Three weeks! You've formed a true energetic habit! 🧘",
  30: "A full month of transformation! Outstanding mastery! 👑",
};

const CONFETTI_COLORS = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6', '#EF4444'];

export default function StreakCelebration({
  visible,
  streak,
  onClose,
}: StreakCelebrationProps) {
  const message =
    STREAK_MESSAGES[streak] ||
    `Amazing ${streak}-day streak! You are harmonizing your energy beautifully!`;

  // Confetti particles using built-in Animated
  const confettiAnimations = useRef(
    Array.from({ length: 24 }).map(() => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      xOffset: (Math.random() - 0.5) * SCREEN_WIDTH * 0.8,
      yTarget: SCREEN_HEIGHT * 0.6 + Math.random() * 200,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 8,
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      confettiAnimations.forEach((item) => {
        item.translateY.setValue(0);
        item.translateX.setValue(0);
        item.rotate.setValue(0);
        item.opacity.setValue(1);

        Animated.parallel([
          Animated.timing(item.translateY, {
            toValue: item.yTarget,
            duration: 1800 + Math.random() * 600,
            useNativeDriver: true,
          }),
          Animated.timing(item.translateX, {
            toValue: item.xOffset,
            duration: 1800 + Math.random() * 600,
            useNativeDriver: true,
          }),
          Animated.timing(item.rotate, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(1200),
            Animated.timing(item.opacity, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    }
  }, [visible]);

  const handleShare = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `🔥 I'm on a ${streak}-day cosmic alignment streak on Astro-Matrix! Practicing daily numerological micro-rituals. ✨`,
      });
    } catch (error) {
      console.warn('Sharing error:', error);
    }
  };

  const handleClose = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Confetti Particles Layer */}
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiAnimations.map((c, i) => {
            const spin = c.rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.confettiParticle,
                  {
                    width: c.size,
                    height: c.size * 1.5,
                    backgroundColor: c.color,
                    opacity: c.opacity,
                    transform: [
                      { translateX: c.translateX },
                      { translateY: c.translateY },
                      { rotate: spin },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Modal Card */}
        <View style={styles.card}>
          <Text style={styles.emoji}>🔥</Text>
          <Text style={styles.title}>{streak}-Day Streak!</Text>
          <Text style={styles.subtitle}>{message}</Text>

          {/* Share Milestone Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>📤 Share Milestone</Text>
          </TouchableOpacity>

          {/* Continue Button */}
          <TouchableOpacity style={styles.button} onPress={handleClose}>
            <Text style={styles.buttonText}>Keep Going →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confettiContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiParticle: {
    position: 'absolute',
    borderRadius: 2,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  emoji: {
    fontSize: 54,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#57534E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: '#F5F5F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  shareButtonText: {
    color: '#1C1917',
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#57715E',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});