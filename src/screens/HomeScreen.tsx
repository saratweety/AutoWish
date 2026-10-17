import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLottie } from '../components/AppLottie';
import { Avatar } from '../components/Avatar';
import { CountdownBadge } from '../components/CountdownBadge';
import { HomeHeader } from '../components/HomeHeader';
import { SlideInCard } from '../components/SlideInCard';
import { occasionName, possessiveOccasion, RELATIONSHIP_LABELS } from '../data/labels';
import { daysUntil, formatTime } from '../services/dates';
import { displayStatus } from '../services/wishes';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, type } from '../theme';
import HomeEmptyScreen from './HomeEmptyScreen';

// Days whose pop-up was already shown since the app opened, so it appears only once.
const shownReminders = new Set<string>();

export default function HomeScreen() {
  const navigation = useNavigation();
  const { specialDays, wishes } = useApp();

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

  // A new user has nothing saved yet, so they see the empty state first.
  if (specialDays.length === 0) return <HomeEmptyScreen />;

  // Soonest first.
  const days = specialDays.map((d) => ({ ...d, daysLeft: daysUntil(d) })).sort((a, b) => a.daysLeft - b.daysLeft);
  const today = days.filter((d) => d.daysLeft === 0);
  const upcoming = days.filter((d) => d.daysLeft > 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <HomeHeader />

        {today.map((day) => {
          const wish = wishes.find((w) => w.specialDayId === day.id && w.status !== 'sent');
          const status = wish && displayStatus(wish);
          return (
            <Pressable
              key={day.id}
              accessibilityRole="button"
              accessibilityLabel={`Today is ${possessiveOccasion(day)}. Write a wish`}
              onPress={() => navigation.navigate('WriteWish', { specialDayId: day.id, wishId: wish?.id })}
            >
              <SlideInCard style={styles.todayCard}>
                <View style={styles.todayText}>
                  <Text style={styles.todayChip}>TODAY</Text>
                  {/* Always one line, like the design; long names shrink a little to fit. */}
                  <Text style={styles.todayTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {possessiveOccasion(day)}
                  </Text>
                  <View style={styles.statusRow}>
                    <Feather name="clock" size={16} color={colors.text} />
                    <Text style={styles.statusText}>
                      {!wish
                        ? 'Tap to write a wish'
                        : status === 'scheduled'
                          ? `Wish scheduled for ${formatTime(new Date(wish.sendAt))}`
                          : 'Wish not sent yet'}
                    </Text>
                  </View>
                </View>
                <AppLottie source={require('../../assets/animations/autowish_today_gift.json')} loop style={styles.todayGift} />
              </SlideInCard>
            </Pressable>
          );
        })}

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Upcoming
        </Text>
        {upcoming.map((day, index) => (
          <Pressable
            key={day.id}
            accessibilityRole="button"
            accessibilityLabel={`${day.name}, ${occasionName(day)}, edit`}
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
              </View>
              <CountdownBadge days={day.daysLeft} />
            </SlideInCard>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add special day"
        onPress={() => navigation.navigate('AddSpecialDay')}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Feather name="plus" size={32} color={colors.text} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: screenPadding + spacing.xs, paddingTop: spacing.xs, gap: spacing.sm, paddingBottom: 110 },
  todayCard: {
    backgroundColor: colors.pink,
    borderRadius: radius.cardLarge,
    padding: spacing.lg,
    paddingRight: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayText: { flex: 1, gap: spacing.xs },
  todayChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.yellow,
    color: colors.text,
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.xs,
    letterSpacing: 0.8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  todayTitle: { ...type.h2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.text, flexShrink: 1 },
  todayGift: { width: 112, height: 112 },
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
