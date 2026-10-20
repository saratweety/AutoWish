import React, { useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLottie } from '../components/AppLottie';
import { BounceButton } from '../components/BounceButton';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootScreenProps } from '../navigation/types';
import { autoSendStatus, openAccessibilitySettings, openExactAlarmSettings } from '../services/autoSend';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, type } from '../theme';

// Google Play requires apps that use Accessibility to explain clearly what it does
// and get the person's agreement before switching it on.
const DISCLOSURE = [
  'At the time you schedule, AutoWish opens the WhatsApp chat with your wish and taps Send for you.',
  "To do this it uses Android's Accessibility service. It only works inside WhatsApp, and only for wishes you scheduled.",
  "It doesn't read, save or share your chats or anything else on your screen. Nothing leaves your phone.",
  "Wishes only send automatically when your phone is unlocked. If it's locked at the send time, you'll get a notification instead. Tap it to send the wish yourself, or just unlock your phone.",
];

/**
 * Auto-send: read what it does, agree, and it switches itself on.
 *
 * Android will not let any app turn on its own Accessibility service, so agreeing
 * opens that one switch. The screen finishes the rest by itself as soon as the
 * person comes back: no steps to follow, no test to run, nothing to tap twice.
 */
export default function AutoSendSetupScreen({ navigation }: RootScreenProps<'AutoSendSetup'>) {
  const { settings, updateSettings } = useApp();
  const [status, setStatus] = useState(autoSendStatus);

  // Check again whenever the person comes back, so the screen catches up on its own.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setStatus(autoSendStatus());
    });
    return () => subscription.remove();
  }, []);

  const agree = () => {
    updateSettings({ autoSend: true });
    openAccessibilitySettings();
  };

  let body: React.ReactNode;

  if (!status) {
    body = <Text style={type.bodyMuted}>Auto-send works only on Android, in the AutoWish app (not in Expo Go).</Text>;
  } else if (!settings.autoSend) {
    body = (
      <>
        <View style={styles.card}>
          <Text style={type.h3}>How auto-send works</Text>
          {DISCLOSURE.map((line) => (
            <View key={line} style={styles.row}>
              <Text style={styles.dot}>•</Text>
              <Text style={[type.body, styles.flex]}>{line}</Text>
            </View>
          ))}
        </View>
        <BounceButton title="I agree, turn it on" onPress={agree} />
        <BounceButton title="Not now" variant="text" onPress={() => navigation.goBack()} />
      </>
    );
  } else if (!status.serviceOn) {
    // Agreed, but Android's own switch isn't on yet. One tap puts them back on it.
    body = (
      <View style={styles.card}>
        <Text style={type.h3}>Almost there</Text>
        <Text style={type.bodyMuted}>
          {'Android only lets you turn this on yourself. Find "AutoWish auto-send" in the list, switch it on, and come back. Everything else is already done.'}
        </Text>
        <BounceButton title="Open the switch" onPress={openAccessibilitySettings} style={styles.stretch} />
      </View>
    );
  } else if (!status.exactTiming) {
    // Rare: Android is holding back exact timing, which would make wishes arrive late.
    body = (
      <View style={styles.card}>
        <Text style={type.h3}>One last thing</Text>
        <Text style={type.bodyMuted}>
          {'Android needs to let AutoWish act at an exact time, or wishes may go out late. Turn on "Allow setting alarms and reminders", then come back.'}
        </Text>
        <BounceButton title="Allow exact timing" onPress={openExactAlarmSettings} style={styles.stretch} />
      </View>
    );
  } else {
    body = (
      <View style={[styles.card, styles.center]}>
        <AppLottie source={require('../../assets/animations/autowish_success.json')} style={styles.success} />
        <Text style={[type.h2, styles.textCenter]}>Auto-send is on!</Text>
        <Text style={[type.bodyMuted, styles.textCenter]}>
          {"Your scheduled wishes will go out on WhatsApp by themselves. If your phone is locked at that time, you'll get a notification to tap instead."}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeader title="WhatsApp auto-send" showBack />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {body}
        {status && !status.whatsAppInstalled && (
          <Text style={styles.warning}>WhatsApp isn&apos;t installed on this phone, so wishes can&apos;t be sent.</Text>
        )}
        {status && settings.autoSend && (
          <BounceButton
            title="Turn off auto-send"
            variant="text"
            onPress={() => {
              updateSettings({ autoSend: false });
              navigation.goBack();
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: screenPadding + spacing.xs },
  content: { padding: screenPadding + spacing.xs, paddingTop: spacing.xs, gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.cardLarge, padding: spacing.lg, gap: spacing.sm },
  center: { alignItems: 'center' },
  textCenter: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: { ...type.body, color: colors.heart },
  flex: { flex: 1 },
  success: { width: 140, height: 140 },
  warning: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral, textAlign: 'center' },
});
