import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '../theme';
import { AppLottie } from './AppLottie';

/** "Getting your special days…" with the gift, while a just-logged-in phone downloads the account. */
export function GettingReady({ overlay }: { overlay?: boolean }) {
  return (
    <View style={[styles.center, overlay && styles.overlay]} accessibilityLiveRegion="polite">
      <AppLottie source={require('../../assets/animations/autowish_today_gift.json')} loop style={styles.animation} />
      <Text style={styles.text}>Getting your special days…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: colors.background },
  animation: { width: 140, height: 140 },
  text: { ...type.h3, textAlign: 'center' },
});
