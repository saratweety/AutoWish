import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSyncStatus } from '../api/sync';
import { useSyncRefresh } from '../api/useSyncRefresh';
import { Avatar } from '../components/Avatar';
import { CountdownBadge } from '../components/CountdownBadge';
import { HomeHeader } from '../components/HomeHeader';
import { SlideInCard } from '../components/SlideInCard';
import { TodayCard, todayTextColor } from '../components/TodayCard';
import { DailyGameCard } from '../components/DailyGameCard';
import { GettingReady } from '../components/GettingReady';
import { WelcomeBackToast } from '../components/WelcomeBackToast';
import { occasionName, possessiveOccasion, RELATIONSHIP_LABELS } from '../data/labels';
import { daysUntil, formatTime } from '../services/dates';
import { displayStatus, wishForNextDate } from '../services/wishes';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, type } from '../theme';
import HomeEmptyScreen from './HomeEmptyScreen';

// Days whose pop-up was already shown since the app opened, so it appears only once.
const shownReminders = new Set<string>();

export default function HomeScreen() {
  const navigation = useNavigation();
  const { specialDays, wishes, gift } = useApp();
  const todayText = todayTextColor(gift.equipped);
  const refreshControl = useSyncRefresh();
  const { downloading } = useSyncStatus();

  // Anything tomorrow without a wish yet? Show the reminder pop-up (once per app open).
  useFocusEffect(
    useCallback(() => {
      const due = specialDays.find(
        (d) =>
          daysUntil(d) === 1 &&
          !shownReminders.has(d.id) &&
          !wishes.some((w) => w.specialDayId === d.id && w.status === 'scheduled'),
      );
      if (!due) return;
      shownReminders.add(due.id);
      navigation.navigate('Reminder', { specialDayId: due.id });
    }, [specialDays, wishes, navigation]),
  );

  // Just logged in: the account's special days are on their way.
  if (downloading && specialDays.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <GettingReady />
      </SafeAreaView>
    );
  }

  // A new user has nothing saved yet, so they see the empty state first.
  if (specialDays.length === 0) return <HomeEmptyScreen />;

  // Soonest first.
  const days = specialDays.map((d) => ({ ...d, daysLeft: daysUntil(d) })).sort((a, b) => a.daysLeft - b.daysLeft);
  const today = days.filter((d) => d.daysLeft === 0);
  const upcoming = days.filter((d) => d.daysLeft > 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={refreshControl}>
        <HomeHeader />

        {today.map((day) => {
          const wish = wishForNextDate(day, wishes);
          const status = wish && displayStatus(wish);
          return (
            <Pressable
              key={day.id}
              accessibilityRole="button"
              accessibilityLabel={`Today is ${possessiveOccasion(day)}. ${status === 'sent' ? 'Wish sent' : 'Write a wish'}`}
              onPress={() => navigation.navigate('WriteWish', { specialDayId: day.id, wishId: wish?.id })}
            >
              <SlideInCard>
                <TodayCard
                  equipped={gift.equipped}
                  title={possessiveOccasion(day)}
                  status={
                    status === 'sent' ? (
                      <SentLine />
                    ) : (
                      <View style={styles.statusRow}>
                        <Feather name="clock" size={16} color={todayText} />
                        <Text style={[styles.statusText, { color: todayText }]}>
                          {!wish
                            ? 'Tap to write a wish'
                            : status === 'scheduled'
                              ? `Wish scheduled for ${formatTime(new Date(wish.sendAt))}`
                              : 'Wish not sent yet'}
                        </Text>
                      </View>
                    )
                  }
                />
              </SlideInCard>
            </Pressable>
          );
        })}

        <DailyGameCard />

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Upcoming
        </Text>
        {upcoming.map((day, index) => {
          const sent = wishForNextDate(day, wishes)?.status === 'sent';
          return (
            <Pressable
              key={day.id}
              accessibilityRole="button"
              accessibilityLabel={`${day.name}, ${occasionName(day)}${sent ? ', wish sent' : ''}, edit`}
              onPress={() => navigation.navigate('AddSpecialDay', { specialDayId: day.id })}
            >
              <SlideInCard index={index + today.length} style={styles.card}>
                <Avatar name={day.name} photoUri={day.photoUri} />
                <View style={styles.cardText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {day.name}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={type.bodyMuted}>{occasionName(day)}</Text>
                    <Text style={styles.relation}>{RELATIONSHIP_LABELS[day.relationship]}</Text>
                  </View>
                  {sent && <SentLine />}
                </View>
                <CountdownBadge days={day.daysLeft} />
              </SlideInCard>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add special day"
        onPress={() => navigation.navigate('AddSpecialDay')}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Feather name="plus" size={32} color={colors.text} />
      </Pressable>
      <WelcomeBackToast />
    </SafeAreaView>
  );
}

/** Blue tick + "Wish sent", shown once the wish for this date has gone out. */
function SentLine() {
  return (
    <View style={styles.sentRow}>
      <View style={styles.sentTick}>
        <Feather name="check" size={13} color={colors.surface} />
      </View>
      <Text style={styles.sentText}>Wish sent</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: screenPadding + spacing.xs, paddingTop: spacing.xs, gap: spacing.sm, paddingBottom: 110 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.text, flexShrink: 1 },
  sentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sentTick: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  sentText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.blueDark },
  sectionTitle: { ...type.h2, marginTop: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardText: { flex: 1, gap: spacing.xxs },
  name: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.lg, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  relation: {
    backgroundColor: colors.blueMist,
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    right: screenPadding + spacing.xs,
    bottom: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },
});
