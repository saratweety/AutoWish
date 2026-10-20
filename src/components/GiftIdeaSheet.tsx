import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { GIFT_REMIND_CHOICES, GIFT_REMIND_LABELS, occasionWord } from '../data/labels';
import { formatShortDate, nextOccurrence, subDaysFrom } from '../services/dates';
import { isLink, linkUrl } from '../services/links';
import { newId } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';
import type { GiftIdea, GiftIdeaInput, GiftRemindDays, GiftStatus, SpecialDay } from '../types';
import { BounceButton } from './BounceButton';
import { Chip, ChipRow } from './Chip';
import { FieldBox, FieldLabel, fieldStyles } from './Field';
import { SlideUpSheet } from './SlideUpSheet';

/** What the money boxes show in front of a price. */
export const CURRENCY = 'Rs';

const DEFAULT_REMIND_BEFORE: GiftRemindDays = 5;

type Props = {
  visible: boolean;
  onClose: () => void;
  day: SpecialDay;
  /** The idea being changed, or undefined to add a new one. */
  editing?: GiftIdea;
  onSave: (idea: GiftIdeaInput) => void;
  onDelete?: (id: string) => void;
};

/** Turns a tag like "Chocolate" into something you could actually buy. */
function tagSuggestion(tag: string) {
  const t = tag.trim();
  if (!t) return '';
  return /gift|box|set|mug|gear|kit/i.test(t) ? t : `${t} gift`;
}

/**
 * "Add a gift idea": the bottom sheet for writing down something to give someone,
 * what it costs, where to get it, and whether to be nudged to buy it in time.
 */
export function GiftIdeaSheet({ visible, onClose, day, editing, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [where, setWhere] = useState('');
  const [status, setStatus] = useState<GiftStatus>('idea');
  const [remind, setRemind] = useState(true);
  const [remindDays, setRemindDays] = useState<GiftRemindDays>(DEFAULT_REMIND_BEFORE);
  const [error, setError] = useState<string | null>(null);
  // A new key each time the sheet opens, so the boxes start from the right values.
  const [openedWith, setOpenedWith] = useState<string | null>(null);

  // Fill the boxes the first time this opening renders (editing an idea, or a fresh one).
  const key = visible ? (editing?.id ?? 'new') : null;
  if (key !== openedWith) {
    setOpenedWith(key);
    setTitle(editing?.title ?? '');
    setPrice(editing?.price ? String(editing.price) : '');
    setWhere(editing?.where ?? '');
    setStatus(editing?.status ?? 'idea');
    setRemind(editing ? editing.remindToBuy : true);
    setRemindDays(editing?.remindDaysBefore ?? DEFAULT_REMIND_BEFORE);
    setError(null);
  }

  const date = nextOccurrence(day);
  const remindOn = subDaysFrom(date, remindDays);
  const suggestions = (day.likes ?? []).map(tagSuggestion).filter(Boolean).slice(0, 4);

  /** Is this suggestion already part of the gift's name? */
  const hasPart = (text: string, part: string) =>
    text
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .includes(part.toLowerCase());

  /** Tapping a suggestion adds it to the name, or takes it back out. */
  const togglePart = (part: string) => {
    const parts = title.split(',').map((x) => x.trim()).filter(Boolean);
    const without = parts.filter((x) => x.toLowerCase() !== part.toLowerCase());
    setTitle((without.length === parts.length ? [...parts, part] : without).join(', '));
  };

  const save = () => {
    const name = title.trim();
    if (!name) return setError('Please write what the gift is.');
    const digits = price.replace(/[^\d]/g, '');
    onSave({
      id: editing?.id ?? newId(),
      specialDayId: day.id,
      title: name,
      price: digits ? Number(digits) : undefined,
      where: where.trim() || undefined,
      status,
      boughtAt: status === 'idea' ? undefined : (editing?.boughtAt ?? new Date().toISOString()),
      // Moving it to "given" records the year, so it shows under "Given before".
      givenYear: status === 'given' ? (editing?.givenYear ?? new Date().getFullYear()) : undefined,
      // Once it's bought or given there is nothing left to nudge about.
      remindToBuy: remind && status === 'idea',
      remindDaysBefore: remindDays,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    });
    onClose();
  };

  return (
    <SlideUpSheet visible={visible} onClose={onClose} dragAnywhere={false}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.titleRow}>
          <Image source={require('../../assets/icon.png')} style={styles.gift} accessibilityIgnoresInvertColors />
          <View style={styles.flex}>
            <Text style={type.h2} accessibilityRole="header">
              {editing ? 'Edit gift idea' : 'Add a gift idea'}
            </Text>
            <Text style={type.bodyMuted}>{`For ${day.name}'s ${occasionWord(day)} · ${formatShortDate(date)}`}</Text>
          </View>
        </View>

        <FieldLabel>Gift</FieldLabel>
        <FieldBox>
          <TextInput
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              setError(null);
            }}
            placeholder="Watch, navy strap"
            placeholderTextColor={colors.greyBlue}
            accessibilityLabel="What the gift is"
            style={fieldStyles.input}
          />
        </FieldBox>

        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            <Text style={type.caption}>{`From ${day.name}'s tags:`}</Text>
            <ChipRow>
              {suggestions.map((sug) => (
                <Chip key={sug} compact label={sug} selected={hasPart(title, sug)} onPress={() => togglePart(sug)} />
              ))}
            </ChipRow>
          </View>
        )}

        <View style={styles.twoUp}>
          <View style={styles.flex}>
            <FieldLabel>Price (optional)</FieldLabel>
            <FieldBox>
              <Text style={styles.currency}>{CURRENCY}</Text>
              <TextInput
                value={price}
                onChangeText={(t) => setPrice(t.replace(/[^\d]/g, ''))}
                placeholder="6000"
                placeholderTextColor={colors.greyBlue}
                keyboardType="number-pad"
                accessibilityLabel="Price"
                style={fieldStyles.input}
              />
            </FieldBox>
          </View>
          <View style={styles.flex}>
            <FieldLabel>Where to buy (optional)</FieldLabel>
            <FieldBox>
              <TextInput
                value={where}
                onChangeText={setWhere}
                placeholder="Shop or link"
                placeholderTextColor={colors.greyBlue}
                autoCapitalize="none"
                accessibilityLabel="Where to buy"
                style={fieldStyles.input}
              />
              {/* A pasted link can be checked before the idea is saved. */}
              {isLink(where) && (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Open this link"
                  onPress={() => Linking.openURL(linkUrl(where)).catch(() => {})}
                  hitSlop={8}
                >
                  <Feather name="external-link" size={20} color={colors.blueDark} />
                </Pressable>
              )}
            </FieldBox>
          </View>
        </View>

        <FieldLabel>Status</FieldLabel>
        <ChipRow>
          <Chip label="Just an idea" selected={status === 'idea'} onPress={() => setStatus('idea')} />
          <Chip label="Already bought" selected={status === 'bought'} onPress={() => setStatus('bought')} />
          <Chip label="Given" selected={status === 'given'} onPress={() => setStatus('given')} />
        </ChipRow>

        {/* Nothing to nudge about once it's bought or given, so the row steps aside. */}
        {status === 'idea' && (
          <View style={styles.remindCard}>
            <View style={styles.remindRow}>
              <Feather name="bell" size={22} color={colors.text} />
              <View style={styles.flex}>
                <Text style={styles.remindTitle}>Remind me to buy it</Text>
                <Text style={type.bodyMuted}>
                  {remind ? `${GIFT_REMIND_LABELS[remindDays]} before · ${formatShortDate(remindOn)}` : 'No reminder'}
                </Text>
              </View>
              <Switch
                value={remind}
                onValueChange={setRemind}
                trackColor={{ true: colors.orange, false: colors.outline }}
                thumbColor={colors.surface}
                accessibilityLabel="Remind me to buy it"
              />
            </View>
            {remind && (
              <ChipRow>
                {GIFT_REMIND_CHOICES.map((d) => (
                  <Chip key={d} compact label={GIFT_REMIND_LABELS[d]} selected={remindDays === d} onPress={() => setRemindDays(d)} />
                ))}
              </ChipRow>
            )}
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        <BounceButton title={editing ? 'Save changes' : 'Save gift idea'} onPress={save} style={styles.stretch} />
        {editing && onDelete && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove this gift idea"
            onPress={() => {
              onDelete(editing.id);
              onClose();
            }}
            style={styles.remove}
          >
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        )}
        <BounceButton title="Cancel" variant="text" onPress={onClose} />
      </ScrollView>
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { alignSelf: 'stretch', maxHeight: 560 },
  body: { gap: spacing.xs, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  gift: { width: 64, height: 64 },
  flex: { flex: 1 },
  suggestions: { gap: spacing.xxs, marginTop: spacing.xxs },
  twoUp: { flexDirection: 'row', gap: spacing.sm },
  currency: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.textMuted },
  remindCard: { backgroundColor: colors.yellowPale, borderRadius: radius.card, padding: spacing.md, gap: spacing.sm, marginTop: spacing.xs },
  remindRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  remindTitle: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.lg, color: colors.text },
  stretch: { alignSelf: 'stretch', marginTop: spacing.xs },
  remove: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
  removeText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.danger },
  error: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral, textAlign: 'center' },
});
