import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLottie } from '../components/AppLottie';
import { BounceButton } from '../components/BounceButton';
import type { RootScreenProps } from '../navigation/types';
import { formatShortDate, formatTime } from '../services/dates';
import { colors, screenPadding, spacing, type } from '../theme';

export default function SuccessScreen({ navigation, route }: RootScreenProps<'Success'>) {
  const { name } = route.params;
  const sendAt = new Date(route.params.sendAt);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        {/* Plays once and stays on the last frame (tick + confetti). */}
        <AppLottie source={require('../../assets/animations/autowish_success.json')} style={styles.animation} />
        <Text style={styles.title} accessibilityRole="header">
          Wish scheduled!
        </Text>
        <Text style={styles.text}>
          {`We'll remind you to send it to ${name} on WhatsApp at ${formatTime(sendAt)}, ${formatShortDate(sendAt)}.`}
        </Text>
      </View>
      <View style={styles.footer}>
        <BounceButton title="Back to Home" onPress={() => navigation.popTo('Main', { screen: 'Home' })} />
        <BounceButton
          title="View scheduled wishes"
          variant="link"
          onPress={() => navigation.popTo('Main', { screen: 'Wishes' })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  animation: { width: 320, height: 320 },
  title: { ...type.h1, fontSize: 30, textAlign: 'center', marginBottom: spacing.xs },
  text: { ...type.bodyMuted, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  footer: { paddingHorizontal: screenPadding + spacing.xs, paddingBottom: spacing.xs, gap: spacing.xxs },
});
