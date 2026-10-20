import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { occasionName } from '../data/labels';
import { daysUntil, formatShortDate, formatTime, nextOccurrence } from '../services/dates';
import { displayStatus, wishForNextDate } from '../services/wishes';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';
import { Avatar } from './Avatar';
import { CountdownBadge } from './CountdownBadge';
import { SlideUpSheet } from './SlideUpSheet';

type Props = { visible: boolean; onClose: () => void };

/** A person in the list, with the wish they already have (if any). */
type Row = {
  id: string;
  name: string;
  photoUri?: string;
  photoUrl?: string;
  line: string;
  daysLeft: number;
  /** Set when a wish is already written and waiting to go out. */
  ready?: { wishId: string; when: string };
};

// One of the two headings, or a person.
type Item = { kind: 'header'; title: string } | ({ kind: 'person' } & Row);

/**
 * "Who is this wish for?": picks the person a new wish is for. People who still
 * need a wish come first; anyone already sorted is listed below so their wish can
 * be edited rather than written twice.
 *
 * Render it at the screen's root, outside the ScrollView.
 */
export function WishForSheet({ visible, onClose }: Props) {
  const navigation = useNavigation();
  const { specialDays, wishes } = useApp();
  const { height } = useWindowDimensions();
  const [search, setSearch] = useState('');

  const close = () => {
    setSearch('');
    onClose();
  };

  const rows: Row[] = specialDays
    .map((day) => {
      const wish = wishForNextDate(day, wishes);
      // Only a wish still waiting to go out counts as "already ready".
      const waiting = wish && displayStatus(wish) === 'scheduled' ? wish : undefined;
      const date = nextOccurrence(day);
      return {
        id: day.id,
        name: day.name,
        photoUri: day.photoUri,
        photoUrl: day.photoUrl,
        line: waiting
          ? `Wish ready · ${formatShortDate(new Date(waiting.sendAt))}, ${formatTime(new Date(waiting.sendAt))}`
          : `${occasionName(day)} · ${formatShortDate(date)}`,
        daysLeft: daysUntil(day),
        ready: waiting ? { wishId: waiting.id, when: waiting.sendAt } : undefined,
      };
    })
    .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const needs = rows.filter((r) => !r.ready);
  const ready = rows.filter((r) => r.ready);

  const items: Item[] = [
    ...(needs.length ? [{ kind: 'header' as const, title: 'NEEDS A WISH' }] : []),
    ...needs.map((r) => ({ kind: 'person' as const, ...r })),
    ...(ready.length ? [{ kind: 'header' as const, title: 'WISH ALREADY READY' }] : []),
    ...ready.map((r) => ({ kind: 'person' as const, ...r })),
  ];

  const openWish = (row: Row) => {
    close();
    navigation.navigate('WriteWish', { specialDayId: row.id, wishId: row.ready?.wishId });
  };

  const addSomeone = () => {
    close();
    navigation.navigate('AddSpecialDay');
  };

  return (
    <SlideUpSheet visible={visible} onClose={close} dragAnywhere={false}>
      <View style={styles.body}>
        <Text style={type.h2} accessibilityRole="header">
          Who is this wish for?
        </Text>

        <View style={styles.search}>
          <Feather name="search" size={20} color={colors.greyBlue} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name"
            placeholderTextColor={colors.greyBlue}
            accessibilityLabel="Search name"
            autoCorrect={false}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={items}
          keyExtractor={(it, i) => (it.kind === 'header' ? `h${i}` : it.id)}
          keyboardShouldPersistTaps="handled"
          // Leaves room for the heading, search box and the button underneath.
          style={{ maxHeight: height * 0.45 }}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[type.bodyMuted, styles.empty]}>
              {specialDays.length === 0 ? "You haven't saved anyone yet." : 'Nobody matches that name.'}
            </Text>
          }
          renderItem={({ item }) => {
            if (item.kind === 'header') return <Text style={styles.sectionTitle}>{item.title}</Text>;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.name}. ${item.line}. ${item.ready ? 'Edit the wish' : 'Write a wish'}`}
                onPress={() => openWish(item)}
                style={({ pressed }) => [styles.row, item.ready ? styles.rowReady : styles.rowNeeds, pressed && styles.pressed]}
              >
                <Avatar name={item.name} photoUri={item.photoUri} photoUrl={item.photoUrl} size={48} />
                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={item.ready ? styles.readyLine : type.bodyMuted} numberOfLines={1}>
                    {item.line}
                  </Text>
                </View>
                {item.ready ? <Text style={styles.edit}>Edit</Text> : <CountdownBadge days={item.daysLeft} />}
              </Pressable>
            );
          }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Someone new? Add a special day"
          onPress={addSomeone}
          style={({ pressed }) => [styles.addNew, pressed && styles.pressed]}
        >
          <Feather name="plus" size={20} color={colors.text} />
          <Text style={styles.addNewText}>Someone new? Add a special day</Text>
        </Pressable>
      </View>
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
  body: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.xs },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 52,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text, paddingVertical: spacing.xs },
  list: { gap: spacing.sm, paddingBottom: spacing.xs },
  sectionTitle: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm,
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.card, padding: spacing.sm },
  rowNeeds: { backgroundColor: colors.yellowPale },
  rowReady: { backgroundColor: colors.surfaceMuted },
  pressed: { transform: [{ scale: 0.98 }] },
  rowText: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.lg, color: colors.text },
  readyLine: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.blueDark },
  edit: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.blueDark, paddingHorizontal: spacing.xs },
  empty: { textAlign: 'center', paddingVertical: spacing.xl },
  addNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 56,
    borderRadius: radius.cardLarge,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outline,
  },
  addNewText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.md, color: colors.text },
});
