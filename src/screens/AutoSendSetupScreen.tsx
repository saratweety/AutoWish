import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLottie } from '../components/AppLottie';
import { BounceButton } from '../components/BounceButton';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootScreenProps } from '../navigation/types';
import {
  autoSendStatus,
  openAccessibilitySettings,
  openAppInfo,
  openBatterySettings,
  openExactAlarmSettings,
  sendAutoSendTest,
  TEST_DELAY_SECONDS,
} from '../services/autoSend';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, type } from '../theme';

// Google Play requires apps that use Accessibility to explain clearly what it does
// and get the person's agreement *before* sending them to Accessibility settings.
const DISCLOSURE = [
  'At the time you schedule, AutoWish opens the WhatsApp chat with your wish and taps Send for you.',
  "To do this it uses Android's Accessibility service. It only works inside WhatsApp, and only for wishes you scheduled.",
  "It doesn't read, save or share your chats or anything else on your screen. Nothing leaves your phone.",
  "Wishes only send automatically when your phone is unlocked. If it's locked at the send time, you'll get a notification instead. Tap it to send the wish yourself, or just unlock your phone.",
];

/** A numbered list of short instructions. */
function Steps({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <View key={line} style={styles.row}>
          <Text style={styles.number}>{i + 1}</Text>
          <Text style={[type.body, styles.flex]}>{line}</Text>
        </View>
      ))}
    </>
  );
}

/** A checklist line: number (or a tick when done) and the step's title. */
function ChecklistRow({ number, title, done }: { number: number; title: string; done: boolean }) {
  return (
    <View style={styles.checkRow}>
      {done ? (
        <Feather name="check-circle" size={26} color={colors.blue} />
      ) : (
        <Text style={[styles.number, styles.bigNumber]}>{number}</Text>
      )}
      <Text style={[type.h3, styles.flex, done && styles.doneTitle]}>{title}</Text>
      {done && <Text style={styles.doneLabel}>Done</Text>}
    </View>
  );
}

/**
 * Auto-send in two steps: agree, switch AutoWish on in Accessibility, and allow exact
 * timing (usually already allowed). The battery tip is an optional extra once it works.
 */
export default function AutoSendSetupScreen({ navigation }: RootScreenProps<'AutoSendSetup'>) {
  const { settings, updateSettings } = useApp();
  const [status, setStatus] = useState(autoSendStatus);
  // True once the person has been sent to Accessibility, to spot when something blocks them.
  const [triedSettings, setTriedSettings] = useState(false);
  const [testNote, setTestNote] = useState<string | null>(null);

  // Check again each time the person comes back from a settings page.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setStatus(autoSendStatus());
    });
    return () => subscription.remove();
  }, []);

  const openSettings = () => {
    setTriedSettings(true);
    openAccessibilitySettings();
  };

  const sendTest = () => {
    if (!settings.userPhone) {
      setTestNote('Add your WhatsApp number in Your profile first, so the test has somewhere to go.');
      return;
    }
    setTestNote(
      sendAutoSendTest(settings.userPhone)
        ? `Keep your phone unlocked. In ${TEST_DELAY_SECONDS} seconds WhatsApp will open and send a test message to you.`
        : "The test couldn't be started. Please try again.",
    );
  };

  let body: React.ReactNode;

  if (!status) {
    body = <Text style={type.bodyMuted}>Auto-send works only on Android, in the AutoWish app (not in Expo Go).</Text>;
  } else if (!settings.autoSend) {
    // Explain first, then agreeing takes them straight to the one setting.
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
        <BounceButton
          title="I agree, open settings"
          onPress={() => {
            updateSettings({ autoSend: true });
            openSettings();
          }}
        />
        <BounceButton title="Not now" variant="text" onPress={() => navigation.goBack()} />
      </>
    );
  } else if (!status.serviceOn || !status.exactTiming) {
    // Two steps, shown as a checklist. Step 2 usually ticks itself (Android allows exact timing for reminder apps).
    const onStep1 = !status.serviceOn;
    body = (
      <>
        <View style={styles.card}>
          <ChecklistRow number={1} title="Turn on AutoWish" done={status.serviceOn} />
          {onStep1 && (
            <>
              <Steps
                lines={[
                  'Tap "Open settings" below.',
                  'Tap "AutoWish auto-send" (often under "Downloaded apps").',
                  'Turn it on, tap Allow, then come back here.',
                ]}
              />
              <BounceButton title="Open settings" onPress={openSettings} />
            </>
          )}

          <View style={styles.divider} />

          <ChecklistRow number={2} title="Send at the exact time" done={status.exactTiming} />
          {!onStep1 && !status.exactTiming && (
            <>
              <Steps lines={['Tap the button below.', 'Turn on "Allow setting alarms and reminders", then come back here.']} />
              <BounceButton title="Allow exact timing" onPress={openExactAlarmSettings} />
            </>
          )}
        </View>

        {/* Came back and it's still off: almost always Android's "Restricted setting". */}
        {onStep1 && triedSettings && (
          <View style={[styles.card, styles.helpCard]}>
            <Text style={type.h3}>Can&apos;t turn it on?</Text>
            <Steps
              lines={[
                'Tap "Open App info" below.',
                'Tap ⋮ at the top right, then "Allow restricted settings".',
                'Come back and tap "Open settings" again.',
              ]}
            />
            <BounceButton title="Open App info" variant="link" onPress={openAppInfo} />
          </View>
        )}
      </>
    );
  } else {
    // Working. The battery tip only if it would help.
    const extras = !status.batteryUnrestricted;
    body = (
      <>
        <View style={[styles.card, styles.center]}>
          <AppLottie source={require('../../assets/animations/autowish_success.json')} style={styles.success} />
          <Text style={[type.h2, styles.textCenter]}>Auto-send is on!</Text>
          <Text style={[type.bodyMuted, styles.textCenter]}>
            {"Your scheduled wishes will go out on WhatsApp by themselves. If your phone is locked at that time, you'll get a notification to tap instead."}
          </Text>
          <BounceButton title="Send a test to myself" onPress={sendTest} style={styles.stretch} />
          {testNote && <Text style={[type.caption, styles.textCenter]}>{testNote}</Text>}
        </View>

        {extras && (
          <View style={styles.card}>
            <Text style={type.h3}>Optional: if a wish ever arrives late</Text>
            <Text style={type.bodyMuted}>Some phones&apos; battery saver can hold apps back. This keeps AutoWish on time.</Text>
            <BounceButton title="Stop battery saver delaying it" variant="link" onPress={openBatterySettings} style={styles.left} />
          </View>
        )}
      </>
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
  helpCard: { backgroundColor: colors.blueMist },
  center: { alignItems: 'center' },
  textCenter: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch' },
  left: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: { ...type.body, color: colors.heart },
  number: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.orange,
    color: colors.text,
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  flex: { flex: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bigNumber: { width: 26, height: 26, borderRadius: 13, lineHeight: 26 },
  doneTitle: { color: colors.textMuted },
  doneLabel: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.blueDark },
  divider: { height: 1, backgroundColor: colors.outline, marginVertical: spacing.xs },
  success: { width: 140, height: 140 },
  warning: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral, textAlign: 'center' },
});
