import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppLottie } from '../components/AppLottie';
import type { RootScreenProps } from '../navigation/types';
import { useApp } from '../state/AppContext';
import { colors, radius, spacing, type } from '../theme';

const SPLASH_MS = 2500;
const DOTS = [colors.heart, colors.pink, colors.blueLight, colors.yellow];

export default function SplashScreen({ navigation }: RootScreenProps<'Splash'>) {
  const { ready, settings } = useApp();
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPlayed(true), SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // Once the animation has played and saved data is loaded:
  // first launch goes to Onboarding, otherwise straight to Home.
  useEffect(() => {
    if (!played || !ready) return;
    navigation.reset({ index: 0, routes: [{ name: settings.onboardingDone ? 'Main' : 'Onboarding' }] });
  }, [played, ready, settings.onboardingDone, navigation]);

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <AppLottie source={require('../../assets/animations/autowish_splash.json')} style={styles.animation} />
        <Text style={styles.wordmark} accessibilityRole="header">
          Auto<Text style={styles.wordmarkWish}>Wish</Text>
        </Text>
        <Text style={styles.tagline}>Never miss a special day</Text>
      </View>
      <View style={styles.dots}>
        {DOTS.map((c) => (
          <View key={c} style={[styles.dot, { backgroundColor: c }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  animation: { width: 260, height: 260 },
  wordmark: { ...type.h1, fontSize: 48, marginTop: -spacing.lg },
  wordmarkWish: { color: colors.wordmarkCoral },
  tagline: { ...type.bodyMuted, fontFamily: type.label.fontFamily, fontSize: 17 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, paddingBottom: 120 },
  dot: { width: 11, height: 11, borderRadius: radius.pill },
});
