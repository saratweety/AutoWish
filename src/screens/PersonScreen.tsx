import { Feather } from '@expo/vector-icons';
import { getYear } from 'date-fns';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { BounceButton } from '../components/BounceButton';
import { CountdownBadge } from '../components/CountdownBadge';
import { CURRENCY, GiftIdeaSheet } from '../components/GiftIdeaSheet';
import { LikesSheet } from '../components/LikesSheet';
import { GIFT_REMIND_LABELS, milestone, occasionName, remindSummary, RELATIONSHIP_LABELS } from '../data/labels';
import { daysUntil, formatClock, formatLongDate, formatShortDate, formatTime, nextOccurrence, subDaysFrom } from '../services/dates';
import { isLink, linkLabel, linkUrl } from '../services/links';
import { displayStatus, wishForNextDate } from '../services/wishes';
import type { RootScreenProps } from '../navigation/types';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, type } from '../theme';
import type { GiftIdea, Wish } from '../types';

/**
 * Everything about one person on a single page: when their day is, the wish waiting
 * for it, when they'll be reminded, and the wishes sent in earlier years.
 */
export default function PersonScreen({ navigation, route }: RootScreenProps<'Person'>) {
  const { specialDays, wishes, settings, giftIdeas, saveGiftIdea, deleteGiftIdea, saveDay } = useApp();
  const [addingGift, setAddingGift] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftIdea | undefined>();
  const [editingLikes, setEditingLikes] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
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

  // This time's gifts, and the ones already handed over in earlier years.
  const theirGifts = giftIdeas.filter((g) => g.specialDayId === day.id);
  const thisTime = theirGifts.filter((g) => g.status !== 'given');
  const givenBefore = theirGifts.filter((g) => g.status === 'given').sort((a, b) => (b.givenYear ?? 0) - (a.givenYear ?? 0));
  const spent = thisTime.filter((g) => g.status === 'bought').reduce((sum, g) => sum + (g.price ?? 0), 0);
  // The nudge belongs to the first gift still to be bought.
  const nextToBuy = thisTime.find((g) => g.status === 'idea');

  /** Ticking the circle flips an idea to bought, and back again. */
  const toggleBought = (g: GiftIdea) =>
    saveGiftIdea({
      ...g,
      status: g.status === 'bought' ? 'idea' : 'bought',
      boughtAt: g.status === 'bought' ? undefined : new Date().toISOString(),
      remindToBuy: g.status === 'bought' ? g.remindToBuy : false,
    });

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

        {/* Things they love: tags and notes that make choosing a gift easier. */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={type.h3}>{`Things ${day.name} loves`}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit what they love" onPress={() => setEditingLikes(true)} hitSlop={8}>
              <Text style={styles.link}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.tags}>
            {(day.likes ?? []).map((tag, i) => (
              <Text key={tag} style={[styles.tag, TAG_FILLS[i % TAG_FILLS.length]]}>
                {tag}
              </Text>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add something they love"
              onPress={() => setEditingLikes(true)}
              style={styles.addTag}
            >
              <Text style={styles.addTagText}>+ Add</Text>
            </Pressable>
          </View>
          {day.notes ? (
            <View style={styles.notes}>
              <Text style={type.body}>{day.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Gift ideas: what to give, what it costs, what's already bought. */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={type.h3}>Gift ideas</Text>
            {day.giftBudget ? (
              <Text style={styles.budget}>{`Budget · ${CURRENCY} ${day.giftBudget.toLocaleString()}`}</Text>
            ) : null}
          </View>

          {thisTime.map((g, i) => (
            <View key={g.id} style={[styles.giftRow, i > 0 && styles.giftRowDivided]}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: g.status === 'bought' }}
                accessibilityLabel={`${g.title}, ${g.status === 'bought' ? 'bought' : 'still an idea'}`}
                onPress={() => toggleBought(g)}
                hitSlop={6}
                style={[styles.tick, g.status === 'bought' && styles.tickOn]}
              >
                {g.status === 'bought' && <Feather name="check" size={18} color={colors.text} />}
              </Pressable>
              <Pressable style={styles.flex} accessibilityRole="button" accessibilityLabel={`Edit ${g.title}`} onPress={() => setEditingGift(g)}>
                <Text style={styles.giftName} numberOfLines={1}>
                  {g.title}
                </Text>
                <Text style={type.bodyMuted} numberOfLines={1}>
                  {[
                    g.price ? `${CURRENCY} ${g.price.toLocaleString()}` : null,
                    g.status === 'bought' && g.boughtAt ? `Bought on ${formatShortDate(new Date(g.boughtAt))}` : 'Idea',
                    // A shop name reads here; a link gets its own tappable row below.
                    isLink(g.where) ? null : g.where,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </Pressable>
              {g.status === 'bought' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${g.title} as given`}
                  onPress={() => saveGiftIdea({ ...g, status: 'given', givenYear: new Date().getFullYear(), remindToBuy: false })}
                  hitSlop={6}
                >
                  <Text style={[styles.statusPill, styles.pillBought]}>Bought</Text>
                </Pressable>
              ) : (
                <Text style={[styles.statusPill, styles.pillIdea]}>Idea</Text>
              )}
            </View>
          ))}

          {/* Shop links sit on their own line, so they are easy to hit. */}
          {thisTime.filter((g) => isLink(g.where)).map((g) => (
            <Pressable
              key={`link-${g.id}`}
              accessibilityRole="link"
              accessibilityLabel={`Open ${linkLabel(g.where!)} for ${g.title}`}
              onPress={() => Linking.openURL(linkUrl(g.where!)).catch(() => setLinkError("That link couldn't be opened. Check it in the gift idea."))}
              style={styles.linkRow}
            >
              <Feather name="external-link" size={16} color={colors.blueDark} />
              <Text style={styles.linkRowText} numberOfLines={1}>
                {linkLabel(g.where!)}
              </Text>
            </Pressable>
          ))}
          {linkError && <Text style={styles.linkError}>{linkError}</Text>}

          {thisTime.some((g) => g.status === 'bought') && (
            <Text style={type.caption}>Tap &quot;Bought&quot; once you&apos;ve handed it over, to keep it as a record.</Text>
          )}

          {spent > 0 && day.giftBudget ? (
            <Text style={type.caption}>{`Spent ${CURRENCY} ${spent.toLocaleString()} of ${CURRENCY} ${day.giftBudget.toLocaleString()}.`}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a gift idea"
            onPress={() => setAddingGift(true)}
            style={styles.addGift}
          >
            <Feather name="plus" size={20} color={colors.text} />
            <Text style={styles.addGiftText}>Add gift idea</Text>
          </Pressable>

          {nextToBuy && (
            <View style={styles.giftReminder}>
              <Feather name="bell" size={20} color={colors.text} />
              <View style={styles.flex}>
                <Text style={styles.reminderTitle}>Gift reminder</Text>
                <Text style={type.bodyMuted}>
                  {nextToBuy.remindToBuy
                    ? `${GIFT_REMIND_LABELS[nextToBuy.remindDaysBefore]} before · ${formatShortDate(subDaysFrom(date, nextToBuy.remindDaysBefore))}`
                    : `Off. Tap ${nextToBuy.title} to choose when.`}
                </Text>
              </View>
              <Switch
                value={nextToBuy.remindToBuy}
                onValueChange={(on) => saveGiftIdea({ ...nextToBuy, remindToBuy: on })}
                trackColor={{ true: colors.orange, false: colors.outline }}
                thumbColor={colors.surface}
                accessibilityLabel="Gift reminder"
              />
            </View>
          )}
        </View>

        {givenBefore.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>GIVEN BEFORE</Text>
            {givenBefore.map((g) => (
              <View key={g.id} style={styles.givenRow}>
                <Text style={type.body}>{`${g.givenYear} · ${g.title}`}</Text>
                <View style={styles.givenTag}>
                  <Feather name="check" size={14} color={colors.blueDark} />
                  <Text style={styles.givenText}>Given</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {past.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>PAST WISHES</Text>
            {past.map((w) => (
              <PastWish key={w.id} wish={w} />
            ))}
          </>
        )}
      </ScrollView>

      <GiftIdeaSheet
        visible={addingGift || editingGift !== undefined}
        onClose={() => {
          setAddingGift(false);
          setEditingGift(undefined);
        }}
        day={day}
        editing={editingGift}
        onSave={saveGiftIdea}
        onDelete={deleteGiftIdea}
      />
      <LikesSheet
        visible={editingLikes}
        onClose={() => setEditingLikes(false)}
        day={day}
        onSave={(changes) => saveDay({ ...day, ...changes })}
      />
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

// Tags cycle through three soft fills, as in the design.
const TAG_FILLS = [{ backgroundColor: colors.pinkLight }, { backgroundColor: colors.blueMist }, { backgroundColor: colors.yellowPale }];

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
  card: { backgroundColor: colors.surface, borderRadius: radius.cardLarge, padding: spacing.md, gap: spacing.sm, marginTop: spacing.xs },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  link: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.md, color: colors.blueDark },
  budget: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.textMuted },
  flex: { flex: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.md,
    color: colors.text,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  addTag: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.greyBlue,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  addTagText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.md, color: colors.textMuted },
  notes: { backgroundColor: colors.surfaceMuted, borderRadius: radius.card, padding: spacing.md },
  giftRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  giftRowDivided: { borderTopWidth: 1, borderTopColor: colors.outline, paddingTop: spacing.sm },
  tick: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  giftName: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.lg, color: colors.text },
  statusPill: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.xs,
    color: colors.text,
    borderRadius: radius.pill,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  pillIdea: { backgroundColor: colors.surfaceMuted },
  pillBought: { backgroundColor: colors.yellow },
  addGift: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 52,
    borderRadius: radius.card,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outline,
  },
  addGiftText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.md, color: colors.text },
  giftReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.yellowPale,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 40 },
  linkRowText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.blueDark, flexShrink: 1 },
  linkError: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral },
  givenRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  givenTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  givenText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.blueDark },
  pastCard: { backgroundColor: colors.surface, borderRadius: radius.cardLarge, padding: spacing.md, gap: spacing.xs },
  pastTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pastYear: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.lg, color: colors.text },
  sentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  sentText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.md, color: colors.blueDark },
});
