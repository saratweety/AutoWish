import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';
import type { SpecialDay } from '../types';
import { BounceButton } from './BounceButton';
import { CURRENCY } from './GiftIdeaSheet';
import { FieldBox, FieldLabel, fieldStyles } from './Field';
import { SlideUpSheet } from './SlideUpSheet';

// Offered on a person with nothing saved yet, just to get started.
const STARTERS = ['Chocolate', 'Coffee', 'Books', 'Cricket', 'Perfume', 'Flowers', 'Music', 'Skincare'];
const MAX_TAGS = 12;

type Props = {
  visible: boolean;
  onClose: () => void;
  day: SpecialDay;
  onSave: (changes: Pick<SpecialDay, 'likes' | 'notes' | 'giftBudget'>) => void;
};

/**
 * "Things Ahmad loves": the tags, free notes and gift budget that make choosing a
 * present easier next time round.
 */
export function LikesSheet({ visible, onClose, day, onSave }: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [typed, setTyped] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [openedWith, setOpenedWith] = useState<string | null>(null);

  // Fill the boxes the first time this opening renders.
  const key = visible ? day.id : null;
  if (key !== openedWith) {
    setOpenedWith(key);
    setTags(day.likes ?? []);
    setNotes(day.notes ?? '');
    setBudget(day.giftBudget ? String(day.giftBudget) : '');
    setTyped('');
  }

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/\s+/g, ' ');
    // Quietly ignore a blank, a repeat (whatever the capitals) or one too many.
    if (!tag || tags.length >= MAX_TAGS || tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return setTyped('');
    setTags([...tags, tag]);
    setTyped('');
  };

  const save = () => {
    const digits = budget.replace(/[^\d]/g, '');
    onSave({
      likes: tags.length > 0 ? tags : undefined,
      notes: notes.trim() || undefined,
      giftBudget: digits ? Number(digits) : undefined,
    });
    onClose();
  };

  const starters = STARTERS.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())).slice(0, 5);

  return (
    <SlideUpSheet visible={visible} onClose={onClose} dragAnywhere={false}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={type.h2} accessibilityRole="header">{`Things ${day.name} loves`}</Text>
        <Text style={type.bodyMuted}>A few words each. They turn into gift ideas later.</Text>

        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <Pressable
                key={tag}
                accessibilityRole="button"
                accessibilityLabel={`${tag}, tap to remove`}
                onPress={() => setTags(tags.filter((t) => t !== tag))}
                style={styles.tag}
              >
                <Text style={styles.tagText}>{tag}</Text>
                <Feather name="x" size={14} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}

        <FieldBox>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            onSubmitEditing={() => addTag(typed)}
            placeholder="Chocolate"
            placeholderTextColor={colors.greyBlue}
            returnKeyType="done"
            accessibilityLabel="Add something they love"
            style={fieldStyles.input}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Add" onPress={() => addTag(typed)} hitSlop={8}>
            <Feather name="plus-circle" size={24} color={typed.trim() ? colors.orange : colors.greyBlue} />
          </Pressable>
        </FieldBox>

        {starters.length > 0 && (
          <View style={styles.starters}>
            {starters.map((s) => (
              <Pressable
                key={s}
                accessibilityRole="button"
                accessibilityLabel={`Add ${s}`}
                onPress={() => addTag(s)}
                style={styles.starter}
              >
                <Text style={styles.starterText}>{`+ ${s}`}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <FieldLabel>Notes</FieldLabel>
        <View style={styles.notesBox}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Sizes, allergies, favourite colour..."
            placeholderTextColor={colors.greyBlue}
            multiline
            accessibilityLabel="Notes"
            style={styles.notesInput}
          />
        </View>

        <FieldLabel>Gift budget (optional)</FieldLabel>
        <FieldBox>
          <Text style={styles.currency}>{CURRENCY}</Text>
          <TextInput
            value={budget}
            onChangeText={(t) => setBudget(t.replace(/[^\d]/g, ''))}
            placeholder="8000"
            placeholderTextColor={colors.greyBlue}
            keyboardType="number-pad"
            accessibilityLabel="Gift budget"
            style={fieldStyles.input}
          />
        </FieldBox>

        <BounceButton title="Save" onPress={save} style={styles.stretch} />
        <BounceButton title="Cancel" variant="text" onPress={onClose} />
      </ScrollView>
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { alignSelf: 'stretch', maxHeight: 540 },
  body: { gap: spacing.xs, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.pinkLight,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  tagText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.text },
  starters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  starter: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outline,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
    justifyContent: 'center',
  },
  starterText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.textMuted },
  notesBox: { backgroundColor: colors.surfaceMuted, borderRadius: radius.card, padding: spacing.md, minHeight: 88 },
  notesInput: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.text, minHeight: 60, textAlignVertical: 'top' },
  currency: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.textMuted },
  stretch: { alignSelf: 'stretch', marginTop: spacing.xs },
});
