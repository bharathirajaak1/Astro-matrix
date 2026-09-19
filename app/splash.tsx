import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { checkHasOnboarded } from '@/features/profile/profileStore';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    let timer: any;
    async function determineRoute() {
      const hasOnboarded = await checkHasOnboarded();
      timer = setTimeout(() => {
        if (hasOnboarded) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      }, 2000);
    }
    determineRoute();
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>✦</Text>
        <Text style={styles.title}>ASTRO-MATRIX</Text>
        <Text style={styles.tagline}>Cosmic Numerology & Alignment</Text>
      </View>
      <ActivityIndicator size="small" color="#57715E" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 52,
    color: '#57715E',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#1C1917',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    color: '#78716C',
    letterSpacing: 0.5,
  },
  spinner: {
    position: 'absolute',
    bottom: 60,
  },
});