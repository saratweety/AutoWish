import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Image, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDeleteAccount, useLogOut } from '../components/AccountCard';
import { BounceButton } from '../components/BounceButton';
import { Chip, ChipRow } from '../components/Chip';
import { useClockSheet } from '../components/ClockSheet';
import { SlideUpSheet } from '../components/SlideUpSheet';
import { REMIND_CHOICES, REMIND_LABELS, remindSummary } from '../data/labels';
import { makeSampleData } from '../data/sample';
import { autoSendStatus, autoSendSupported } from '../services/autoSend';
import { formatClock } from '../services/dates';
import { sendTestNotification } from '../services/notifications';
import { forgetAccount } from '../api/sync';
import { useAccount } from '../auth/AccountProvider';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, touchTarget, type } from '../theme';


type RowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
};

function Row({ label, value, onPress, last }: RowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowLine, pressed && styles.rowPressed]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Feather name="chevron-right" size={22} color={colors.greyBlue} />}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { specialDays, settings, addMany, resetAll, updateSettings } = useApp();
  const [note, setNote] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [choosingReminder, setChoosingReminder] = useState(false);
  const clock = useClockSheet();
  const deleteAccount = useDeleteAccount();
  const logOut = useLogOut();
  const { signedIn, signOut } = useAccount();

  // Auto-send status, checked again whenever Settings is shown or the app returns from a settings page.
  const [autoStatus, setAutoStatus] = useState(autoSendStatus);
  useFocusEffect(useCallback(() => setAutoStatus(autoSendStatus()), []));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setAutoStatus(autoSendStatus());
    });
    return () => subscription.remove();
  }, []);
  // Plain words for the card, no technical terms.
  // Two things are needed: AutoWish switched on in Accessibility, and exact timing.
  const stepsLeft = autoStatus ? [autoStatus.serviceOn, autoStatus.exactTiming].filter((done) => !done).length : 0;
  const autoNeedsSetup = settings.autoSend && stepsLeft > 0;
  const autoReady = settings.autoSend && !autoNeedsSetup;
  const autoMessage = !settings.autoSend
    ? "Off. You'll get a reminder to send each wish yourself."
    : autoNeedsSetup
      ? `Almost done! Tap here to finish (${stepsLeft} ${stepsLeft === 1 ? 'step' : 'steps'} left).`
      : 'Your wishes will be sent on WhatsApp automatically.';
  const autoLabel = autoReady ? 'On' : autoNeedsSetup ? 'almost done' : 'Off';


  const testNotification = async () => {
    const result = await sendTestNotification().catch(() => 'not_allowed' as const);
    setNote(
      result === 'sent'
        ? 'A test notification will arrive in 5 seconds.'
        : result === 'unavailable'
          ? "Notifications can't run in Expo Go on Android. We'll set up a test build for them in milestone 6."
          : 'Notifications are off. Tap "Notification preferences" to turn them on.',
    );
  };

  const addSamples = () => {
    const { days, wishes } = makeSampleData();
    addMany(days, wishes);
    navigation.navigate('Main', { screen: 'Home' });
  };

  const previewReminder = () => {
    const day = specialDays[0];
    if (day) navigation.navigate('Reminder', { specialDayId: day.id });
    else setNote('Add a special day first to preview the reminder.');
  };

  // Wipes everything and replays the first launch: Splash, Onboarding, then the empty Home.
  const startFresh = async () => {
    setConfirmReset(false);
    // Also logs out (the account's data on the server is kept).
    await forgetAccount();
    await resetAll();
    await signOut().catch(() => {});
    navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Settings
        </Text>


        {autoSendSupported && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`WhatsApp auto-send, ${autoLabel}. Open setup`}
            onPress={() => navigation.navigate('AutoSendSetup')}
            style={styles.autoCard}
          >
            <View style={styles.flex}>
              <View style={styles.autoTitleRow}>
                <Text style={type.h3}>WhatsApp auto-send</Text>
                {autoReady && <Text style={styles.autoPill}>On</Text>}
              </View>
              <Text style={[styles.autoMessage, autoNeedsSetup && styles.autoMessageWarn]}>{autoMessage}</Text>
            </View>
            <Switch
              // Shows on only when auto-send really works. Agreeing in the app is not
              // enough: until Android's own switch is on, nothing would be sent.
              value={autoReady}
              onValueChange={(on) => (on ? navigation.navigate('AutoSendSetup') : updateSettings({ autoSend: false }))}
              trackColor={{ true: colors.blue, false: colors.outline }}
              thumbColor={colors.surface}
              accessibilityLabel="WhatsApp auto-send"
            />
          </Pressable>
        )}


        <View style={styles.privacyCard}>
          <Image source={require('../../assets/icon.png')} style={styles.gift} accessibilityIgnoresInvertColors />
          <View style={styles.privacyText}>
            {signedIn ? (
              <>
                <Text style={type.h3}>Saved privately</Text>
                <Text style={styles.privacyBody}>Your special days are saved privately to your account so you never lose them.</Text>
              </>
            ) : (
              <>
                <Text style={type.h3}>Everything stays on your phone</Text>
                <Text style={styles.privacyBody}>No account, no server. Your dates and wishes never leave this phone.</Text>
              </>
            )}
          </View>
        </View>

        <Section title="DEFAULTS">
          <Row
            label="Default send time"
            value={formatClock(settings.defaultSendTime)}
            onPress={() =>
              clock.open({
                title: 'Wishes go out at',
                value: settings.defaultSendTime,
                wishHint: true,
                onDone: (t) => updateSettings({ defaultSendTime: t }),
              })
            }
          />
          <Row
            label="Default reminder"
            value={remindSummary(settings.defaultRemindDaysBefore)}
            onPress={() => setChoosingReminder(true)}
          />
          <Row
            label="Reminder time"
            value={formatClock(settings.reminderTimeOfDay)}
            onPress={() =>
              clock.open({
                title: "We'll remind you at",
                value: settings.reminderTimeOfDay,
                onDone: (t) => updateSettings({ reminderTimeOfDay: t }),
              })
            }
            last
          />
        </Section>
        <Text style={styles.hint}>
          New wishes and special days start with these. Changing the reminder time moves all your reminders.
        </Text>

        <Section title="GENERAL">
          <Row label="Your profile" value={settings.userName} onPress={() => navigation.navigate('AboutYou', { editing: true })} />
          <Row label="Notification preferences" onPress={() => Linking.openSettings()} />
          <Row label="Test a notification" onPress={testNotification} last />
        </Section>
        {note && <Text style={styles.note}>{note}</Text>}

        {/* Only while developing (__DEV__): hidden in the app you share with others. */}
        {__DEV__ && (
          <Section title="TESTING (WHILE BUILDING)">
            <Row label="Add sample people" onPress={addSamples} />
            <Row label="Preview reminder pop-up" onPress={previewReminder} />
            {/* Look at the login screen while staying signed in. Don't sign in as someone
                else from here: this phone's data would be saved to that account. */}
            <Row label="Preview login screen" onPress={() => navigation.navigate('Login', { preview: true })} />
            <Row label="Start fresh (delete everything)" onPress={() => setConfirmReset(true)} last />
          </Section>
        )}

        {logOut.button}
        {deleteAccount.button}
      </ScrollView>

      <SlideUpSheet visible={choosingReminder} onClose={() => setChoosingReminder(false)}>
        <View style={styles.sheet}>
          <Text style={[type.h2, styles.center]}>Default reminder</Text>
          <Text style={[type.bodyMuted, styles.center]}>
            How early new special days remind you. Pick as many as you like.
          </Text>
          <View style={styles.choices}>
            <ChipRow>
              {REMIND_CHOICES.map((r) => (
                <Chip
                  key={r}
                  label={REMIND_LABELS[r]}
                  selected={settings.defaultRemindDaysBefore.includes(r)}
                  onPress={() => {
                    // The sheet stays open, because picking several is the point.
                    // The last one can't be removed: something has to remind you.
                    const current = settings.defaultRemindDaysBefore;
                    const next = current.includes(r)
                      ? current.length === 1
                        ? current
                        : current.filter((x) => x !== r)
                      : [...current, r];
                    updateSettings({ defaultRemindDaysBefore: next });
                  }}
                />
              ))}
            </ChipRow>
          </View>
          <BounceButton title="Done" onPress={() => setChoosingReminder(false)} />
        </View>
      </SlideUpSheet>

      <SlideUpSheet visible={confirmReset} onClose={() => setConfirmReset(false)}>
        <View style={styles.sheet}>
          <Text style={[type.h2, styles.center]}>Delete everything?</Text>
          <Text style={[type.bodyMuted, styles.center]}>
            All special days and wishes are removed and the app starts like it was just installed.
          </Text>
          <BounceButton title="Delete everything" onPress={startFresh} style={styles.danger} />
          <BounceButton title="Cancel" variant="text" onPress={() => setConfirmReset(false)} />
        </View>
      </SlideUpSheet>
      {clock.sheet}
      {logOut.sheet}
      {deleteAccount.sheet}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: screenPadding + spacing.xs, paddingTop: spacing.xs, gap: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...type.h1, fontSize: 30 },
  flex: { flex: 1, gap: spacing.xs },
  autoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  autoPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blueMist,
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  autoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  autoMessage: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.textMuted },
  autoMessageWarn: { fontFamily: fonts.bodyBold, color: colors.wordmarkCoral },
  privacyCard: {
    backgroundColor: colors.yellow,
    borderRadius: radius.cardLarge,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gift: { width: 64, height: 64, borderRadius: radius.card },
  privacyText: { flex: 1, gap: 2 },
  privacyBody: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.text },
  section: { gap: spacing.xs },
  sectionTitle: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.textMuted, letterSpacing: 0.6 },
  group: { backgroundColor: colors.surface, borderRadius: radius.cardLarge, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: touchTarget + spacing.md, gap: spacing.xs },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.outline },
  rowPressed: { opacity: 0.6 },
  rowLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.text },
  rowValue: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.textMuted },
  note: { ...type.caption, textAlign: 'center' },
  hint: { ...type.caption, marginTop: -spacing.sm, paddingHorizontal: spacing.xxs },
  choices: { alignItems: 'center', marginVertical: spacing.xs },
  sheet: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.md },
  center: { textAlign: 'center' },
  danger: { backgroundColor: colors.danger },
});
