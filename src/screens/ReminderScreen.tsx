import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppLottie } from '../components/AppLottie';
import { BounceButton } from '../components/BounceButton';
import { SlideUpSheet } from '../components/SlideUpSheet';
import { milestone, possessiveOccasion } from '../data/labels';
import type { RootScreenProps } from '../navigation/types';
import { nextOccurrence } from '../services/dates';
import { useApp } from '../state/AppContext';
import { colors, spacing, type } from '../theme';

// How long the sheet takes to slide away (matches SlideUpSheet) before the screen closes.
const CLOSE_MS = 220;

// A see-through screen that holds the reminder bottom sheet, so a notification
// tap (milestone 6) can open it from anywhere in the app.
export default function ReminderScreen({ navigation, route }: RootScreenProps<'Reminder'>) {
  const [visible, setVisible] = useState(true);
  const { specialDays, remindLater } = useApp();
  const day = specialDays.find((d) => d.id === route.params.specialDayId);

  // The day was deleted: nothing to remind about.
  useEffect(() => {
    if (!day) navigation.goBack();
  }, [day, navigation]);

  const closeThen = (next: () => void) => {
    setVisible(false);
    setTimeout(next, CLOSE_MS);
  };

  if (!day) return null;

  return (
    <View style={styles.screen}>
      <SlideUpSheet visible={visible} onClose={() => closeThen(() => navigation.goBack())}>
        <View style={styles.content}>
          <View style={styles.circle}>
            {/* The gift drops in once the sheet has arrived. */}
            <AppLottie source={require('../../assets/animations/autowish_reminder_gift.json')} delayMs={300} style={styles.gift} />
          </View>
          <Text style={[styles.title, styles.center]}>
            {milestone(day, nextOccurrence(day)) && day.occasion === 'birthday'
              ? `${day.name} ${milestone(day, nextOccurrence(day))} tomorrow!`
              : `${possessiveOccasion(day)} is tomorrow!`}
          </Text>
          <Text style={[type.bodyMuted, styles.subtitle, styles.center]}>Busy? Schedule your wish now.</Text>
          <BounceButton
            title="Write Wish"
            onPress={() => closeThen(() => navigation.replace('WriteWish', { specialDayId: day.id }))}
          />
          <BounceButton
            title="Remind me later"
            variant="text"
            onPress={() => {
              // Reminds again on the day at the reminder time (10:00 AM).
              remindLater(day.id);
              closeThen(() => navigation.goBack());
            }}
          />
        </View>
      </SlideUpSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignSelf: 'stretch', gap: spacing.xs, paddingTop: spacing.md },
  circle: {
    alignSelf: 'center',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  gift: { width: 180, height: 180 },
  title: { ...type.h2, fontSize: 24 },
  subtitle: { fontSize: 17, marginBottom: spacing.lg },
  center: { textAlign: 'center' },
});
