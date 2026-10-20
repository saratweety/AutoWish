import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BounceButton } from './BounceButton';
import { SlideUpSheet } from './SlideUpSheet';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Write a wish for someone already saved. */
  onWriteWish: () => void;
  /** Add a new special day from scratch. */
  onAddDay: () => void;
  /** Add someone by picking them out of the phone's contacts. */
  onPickContact: () => void;
};

type Action = {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  text: string;
  fill: string;
  onPress: () => void;
};

/**
 * The sheet behind the "+" button on Home: the three things worth doing from here.
 * Render it at the screen's root, outside the ScrollView.
 */
export function QuickActionSheet({ visible, onClose, onWriteWish, onAddDay, onPickContact }: Props) {
  const actions: Action[] = [
    {
      key: 'wish',
      icon: 'edit-2',
      title: 'Write a wish',
      text: "Free now? Write it early, we'll bring it back on the day",
      fill: colors.pinkLight,
      onPress: onWriteWish,
    },
    {
      key: 'day',
      icon: 'calendar',
      title: 'Add a special day',
      text: "Birthday, anniversary, Mother's or Father's Day",
      fill: colors.blueMist,
      onPress: onAddDay,
    },
    {
      key: 'contact',
      icon: 'user-plus',
      title: 'Pick from contacts',
      text: 'Add someone from your phone',
      fill: colors.surfaceMuted,
      onPress: onPickContact,
    },
  ];

  return (
    <SlideUpSheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        <Text style={type.h2} accessibilityRole="header">
          What would you like to do?
        </Text>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            accessibilityRole="button"
            accessibilityLabel={`${a.title}. ${a.text}`}
            onPress={a.onPress}
            style={({ pressed }) => [styles.card, { backgroundColor: a.fill }, pressed && styles.pressed]}
          >
            <View style={styles.iconBox}>
              <Feather name={a.icon} size={22} color={colors.text} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.title}>{a.title}</Text>
              <Text style={type.bodyMuted}>{a.text}</Text>
            </View>
          </Pressable>
        ))}
        <BounceButton title="Cancel" variant="text" onPress={onClose} />
      </View>
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
  body: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.cardLarge,
    padding: spacing.md,
    // The three cards match whether their text runs to one line or two, so
    // "Pick from contacts" doesn't look like the smaller, lesser choice.
    minHeight: 100,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.card - 4,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: spacing.xxs },
  title: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.lg, color: colors.text },
});
