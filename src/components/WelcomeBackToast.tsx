import { Feather } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { clearWelcomeBack, useSyncStatus } from '../api/sync';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, screenPadding, spacing } from '../theme';

const SHOW_MS = 3500;

/** "Welcome back, Sara. Your special days are here." shown once after logging in. */
export function WelcomeBackToast() {
  const { welcomeBack } = useSyncStatus();
  const { settings } = useApp();

  useEffect(() => {
    if (!welcomeBack) return;
    const timer = setTimeout(clearWelcomeBack, SHOW_MS);
    return () => clearTimeout(timer);
  }, [welcomeBack]);

  if (!welcomeBack) return null;
  const hello = settings.userName ? `Welcome back, ${settings.userName}.` : 'Welcome back.';
  return (
    // Fades in and out; reanimated keeps it still when "reduce motion" is on.
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOutDown.duration(250)} style={styles.toast} accessibilityLiveRegion="polite">
      <Feather name="check-circle" size={18} color={colors.blue} />
      <Text style={styles.text}>{hello} Your special days are here.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: screenPadding + spacing.xs,
    right: screenPadding + spacing.xs,
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  text: { flex: 1, fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.text },
});
