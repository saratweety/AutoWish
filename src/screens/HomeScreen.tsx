import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSyncStatus } from '../api/sync';
import { useSyncRefresh } from '../api/useSyncRefresh';
import { Avatar } from '../components/Avatar';
import { Chip, ChipScrollRow } from '../components/Chip';
import { CountdownBadge } from '../components/CountdownBadge';
import { HomeHeader } from '../components/HomeHeader';
import { SlideInCard } from '../components/SlideInCard';
import { TodayCard, todayTextColor } from '../components/TodayCard';
import { DailyGameCard } from '../components/DailyGameCard';
import { ContactPickerSheet } from '../components/ContactPickerSheet';
import { GettingReady } from '../components/GettingReady';
import { QuickActionSheet } from '../components/QuickActionSheet';
import { WishForSheet } from '../components/WishForSheet';
import { WelcomeBackToast } from '../components/WelcomeBackToast';
import { occasionName, possessiveOccasion, RELATIONSHIP_LABELS, RELATIONSHIPS } from '../data/labels';
import { dialOf } from '../data/countries';
import { daysUntil, formatShortDate, formatTime, nextOccurrence } from '../services/dates';
import {
  ALL_FILTER,
  filterLabel,
  matchesFilter,
  readFilter,
  relFilter,
  type HomeFilter,
} from '../services/homeFilter';
import { displayStatus, wishForNextDate } from '../services/wishes';
import { useApp } from '../state/AppContext';
import { storage } from '../storage';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, type } from '../theme';
import HomeEmptyScreen from './HomeEmptyScreen';

// Days whose pop-up was already shown since the app opened, so it appears only once.
const shownReminders = new Set<string>();

export default function HomeScreen() {
  const navigation = useNavigation();
  const { specialDays, wishes, gift, settings } = useApp();
  // The "+" button opens a choice of three things; two of them open a sheet of their own.
  const [choosing, setChoosing] = useState(false);
  const [pickingPerson, setPickingPerson] = useState(false);
  const [pickingContact, setPickingContact] = useState(false);
  // The filter chip under "Upcoming". Remembered on this phone between app opens.
  const [filter, setFilter] = useState<HomeFilter>(ALL_FILTER);
  const todayText = todayTextColor(gift.equipped);
  const refreshControl = useSyncRefresh();
  const { downloading } = useSyncStatus();

  // Read back the filter picked last time, once when Home first appears.
  useEffect(() => {
    storage.loadHomeFilter().then((saved) => setFilter(readFilter(saved)));
  }, []);

  /** Taps on a chip: show it now and remember it for next time. */
  const pickFilter = (next: HomeFilter) => {
    setFilter(next);
    storage.saveHomeFilter(next).catch(() => {});
  };

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

  // How many upcoming people sit behind each relationship chip. A chip with none is hidden.
  const relationshipCounts = RELATIONSHIPS.map((r) => ({
    relationship: r,
    count: upcoming.filter((d) => d.relationship === r).length,
  })).filter((r) => r.count > 0);

  // The picked filter may have nothing behind it any more (that person was deleted or
  // changed). Fall back to All, without forgetting what was picked.
  const canFilter = filter === ALL_FILTER || upcoming.some((d) => matchesFilter(d, filter));
  const active = canFilter ? filter : ALL_FILTER;
  const shown = upcoming.filter((d) => matchesFilter(d, active));

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
              accessibilityLabel={`Today is ${possessiveOccasion(day)}. ${status === 'sent' ? 'Wish sent' : 'No wish yet'}. Open their page`}
              // Opens their page, the same as every other card on this screen.
              onPress={() => navigation.navigate('Person', { specialDayId: day.id })}
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
                            ? 'No wish yet'
                            : status === 'scheduled'
                              ? `Wish ready · ${formatTime(new Date(wish.sendAt))}`
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

        {/* Filter chips. One line that slides sideways when they don't all fit. */}
        <ChipScrollRow edge={screenPadding + spacing.xs}>
          <Chip compact label="All" count={upcoming.length} selected={active === ALL_FILTER} onPress={() => pickFilter(ALL_FILTER)} />
          {relationshipCounts.map(({ relationship, count }) => (
            <Chip
              key={relationship}
              compact
              label={RELATIONSHIP_LABELS[relationship]}
              count={count}
              selected={active === relFilter(relationship)}
              onPress={() => pickFilter(relFilter(relationship))}
            />
          ))}
        </ChipScrollRow>

        {shown.map((day, index) => {
          const sent = wishForNextDate(day, wishes)?.status === 'sent';
          // Occasion on its own line, date and relationship under it, so a long
          // name or occasion never cuts the date off.
          const occasion = occasionName(day);
          const detail = `${formatShortDate(nextOccurrence(day))} · ${RELATIONSHIP_LABELS[day.relationship]}`;
          return (
            <Pressable
              key={day.id}
              accessibilityRole="button"
              accessibilityLabel={`${day.name}, ${occasion} · ${detail}${sent ? ', wish sent' : ''}`}
              onPress={() => navigation.navigate('Person', { specialDayId: day.id })}
            >
              <SlideInCard index={index + today.length} style={styles.card}>
                <Avatar name={day.name} photoUri={day.photoUri} photoUrl={day.photoUrl} />
                <View style={styles.cardText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {day.name}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {occasion}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {detail}
                  </Text>
                  {sent && <SentLine />}
                </View>
                <CountdownBadge days={day.daysLeft} />
              </SlideInCard>
            </Pressable>
          );
        })}

        {/* Only while a filter is on: what's hidden, and a way back to everyone. */}
        {active !== ALL_FILTER && (
          <Text style={styles.filterNote}>
            {`Showing ${filterLabel(active)} · ${shown.length} of ${upcoming.length} · `}
            <Text
              style={styles.showAll}
              accessibilityRole="button"
              accessibilityLabel="Show all"
              onPress={() => pickFilter(ALL_FILTER)}
            >
              Show all
            </Text>
          </Text>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a wish or a special day"
        onPress={() => setChoosing(true)}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Feather name="plus" size={32} color={colors.text} />
      </Pressable>
      <WelcomeBackToast />

      {/* The sheets live outside the ScrollView, so their own lists can scroll. */}
      <QuickActionSheet
        visible={choosing}
        onClose={() => setChoosing(false)}
        onWriteWish={() => {
          setChoosing(false);
          setPickingPerson(true);
        }}
        onAddDay={() => {
          setChoosing(false);
          navigation.navigate('AddSpecialDay');
        }}
        onPickContact={() => {
          setChoosing(false);
          setPickingContact(true);
        }}
      />
      <WishForSheet visible={pickingPerson} onClose={() => setPickingPerson(false)} />
      <ContactPickerSheet
        visible={pickingContact}
        onClose={() => setPickingContact(false)}
        countryCode={dialOf(settings.defaultCountry)}
        onPick={(contact) => {
          setPickingContact(false);
          navigation.navigate('AddSpecialDay', { prefill: contact });
        }}
      />
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
  filterNote: { ...type.caption, textAlign: 'center', paddingVertical: spacing.xs },
  showAll: { fontFamily: fonts.bodyExtraBold, color: colors.blueDark },
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
  // "Birthday · 23 Oct · Family": one line, so it stays readable on a narrow phone.
  subtitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.textMuted },
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
