import { Feather } from '@expo/vector-icons';
import { getYear } from 'date-fns';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { BounceButton } from '../components/BounceButton';
import { CountdownBadge } from '../components/CountdownBadge';
import { milestone, occasionName, remindSummary, RELATIONSHIP_LABELS } from '../data/labels';
import { daysUntil, formatClock, formatLongDate, formatTime, nextOccurrence } from '../services/dates';
import { displayStatus, wishForNextDate } from '../services/wishes';
import type { RootScreenProps } from '../navigation/types';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, type } from '../theme';
import type { Wish } from '../types';

/**
 * Everything about one person on a single page: when their day is, the wish waiting
 * for it, when they'll be reminded, and the wishes sent in earlier years.
 */
export default function PersonScreen({ navigation, route }: RootScreenProps<'Person'>) {
  const { specialDays, wishes, settings } = useApp();
  const day = specialDays.find((d) => d.id === route.params.specialDayId);

  // Deleting someone from the edit screen comes back here for a moment.
  if (!day) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.gone}>
          <Text style={type.h2}>This person was removed</Text>
          <BounceButton title="Back to Home" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const date = nextOccurrence(day);
  const wish = wishForNextDate(day, wishes);
  const status = wish && displayStatus(wish);
  // The time a new wish for this person goes out at, so the empty card can promise it.
  const sendTime = day.sendTime ?? settings.defaultSendTime;
  const remindAt = day.reminderTime ?? settings.reminderTimeOfDay;

  // "turns 26" / "25th anniversary", only when the year is known.
  const ageLine = milestone(day, date);

  // Wishes already sent, newest first, grouped under the year they went out in.
  const past = wishes
    .filter((w) => w.specialDayId === day.id && w.status === 'sent' && w.id !== wish?.id)
    .sort((a, b) => (b.sentAt ?? b.sendAt).localeCompare(a.sentAt ?? a.sendAt));

  const writeWish = () => navigation.navigate('WriteWish', { specialDayId: day.id, wishId: wish?.id });
  const editDetails = () => navigation.navigate('AddSpecialDay', { specialDayId: day.id });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.roundButton}
        >
          <Feather name="chevron-left" size={26} color={colors.text} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit details" onPress={editDetails} style={styles.editButton}>
          <Text style={styles.editText}>Edit details</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <Avatar name={day.name} photoUri={day.photoUri} photoUrl={day.photoUrl} size={188} />
          <Text style={styles.name} accessibilityRole="header">
            {day.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {occasionName(day)} · {formatLongDate(date)}
              {ageLine ? ` · ${ageLine}` : ''}
            </Text>
            <Text style={styles.relation}>{RELATIONSHIP_LABELS[day.relationship]}</Text>
          </View>
          <CountdownBadge days={daysUntil(day)} />
        </View>

        <View style={[styles.wishCard, !wish && styles.wishCardEmpty]}>
          <Text style={styles.sectionLabel}>{"THIS YEAR'S WISH"}</Text>
          {!wish ? (
            <>
              <Text style={type.h2}>No wish yet</Text>
              <Text style={type.bodyMuted}>
                {`Write it now while you're free. We'll open WhatsApp with it ready on ${formatLongDate(date)} at ${formatClock(sendTime)}.`}
              </Text>
              <BounceButton
                title="Write wish"
                icon={<Feather name="edit-2" size={18} color={colors.text} />}
                onPress={writeWish}
                style={styles.stretch}
              />
            </>
          ) : (
            <>
              <Text style={type.h2}>
                {status === 'sent' ? 'Wish sent' : status === 'not_sent' ? 'Not sent yet' : 'Wish ready'}
              </Text>
              <Text style={styles.quote} numberOfLines={4}>
                {`"${wish.text}"`}
              </Text>
              <Text style={type.bodyMuted}>
                {status === 'sent'
                  ? `Sent on ${formatLongDate(new Date(wish.sentAt ?? wish.sendAt))}.`
                  : `Goes out on ${formatLongDate(new Date(wish.sendAt))} at ${formatTime(new Date(wish.sendAt))}.`}
              </Text>
              <BounceButton
                title={status === 'sent' ? 'Write another' : 'Edit wish'}
                variant="secondary"
                onPress={writeWish}
                style={styles.stretch}
              />
            </>
          )}
        </View>

        <View style={styles.reminderCard}>
          <Feather name="bell" size={22} color={colors.text} />
          <View style={styles.reminderText}>
            <Text style={styles.reminderTitle}>{day.remindDaysBefore.length > 1 ? 'Reminders' : 'Reminder'}</Text>
            <Text style={type.bodyMuted}>{`${remindSummary(day.remindDaysBefore)}, at ${formatClock(remindAt)}`}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Change the reminder" onPress={editDetails} hitSlop={8}>
            <Text style={styles.change}>Change</Text>
          </Pressable>
        </View>

        {past.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>PAST WISHES</Text>
            {past.map((w) => (
              <PastWish key={w.id} wish={w} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** One earlier year's wish: the year, a blue "Sent" tick and the start of the message. */
function PastWish({ wish }: { wish: Wish }) {
  const when = new Date(wish.sentAt ?? wish.sendAt);
  return (
    <View style={styles.pastCard}>
      <View style={styles.pastTop}>
        <Text style={styles.pastYear}>{getYear(when)}</Text>
        <View style={styles.sentRow}>
          <Feather name="check" size={16} color={colors.blue} />
          <Text style={styles.sentText}>Sent</Text>
        </View>
      </View>
      <Text style={styles.quote} numberOfLines={2}>
        {`"${wish.text}"`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  gone: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: screenPadding },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenPadding + spacing.xs,
    paddingVertical: spacing.xs,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  editText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.md, color: colors.text },
  content: { padding: screenPadding + spacing.xs, paddingTop: spacing.xs, gap: spacing.sm, paddingBottom: spacing.xxl },
  identity: { alignItems: 'center', gap: spacing.xs },
  name: { ...type.h1, fontSize: 34, marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap', justifyContent: 'center' },
  meta: { ...type.bodyMuted, fontSize: fontSizes.lg },
  relation: {
    backgroundColor: colors.blueMist,
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm,
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  wishCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  // Dashed orange outline while nothing has been written yet, as a gentle nudge.
  wishCardEmpty: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.orange },
  stretch: { alignSelf: 'stretch', marginTop: spacing.xs },
  quote: { ...type.body, fontSize: fontSizes.lg, color: colors.text },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    padding: spacing.md,
  },
  reminderText: { flex: 1, gap: 2 },
  reminderTitle: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.lg, color: colors.text },
  change: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.md, color: colors.blueDark },
  pastCard: { backgroundColor: colors.surface, borderRadius: radius.cardLarge, padding: spacing.md, gap: spacing.xs },
  pastTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pastYear: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.lg, color: colors.text },
  sentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  sentText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.md, color: colors.blueDark },
});
