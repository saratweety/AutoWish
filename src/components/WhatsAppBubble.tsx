import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';

type Props = { text: string; time: string; name: string };

/** Shows the message the way it will look in the WhatsApp chat. */
export function WhatsAppBubble({ text, time, name }: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.bubble}>
        <Text style={[type.body, !text && styles.placeholder]}>{text || 'Your wish will appear here'}</Text>
        <View style={styles.meta}>
          <Text style={styles.time}>{time}</Text>
          <Ionicons name="checkmark-done" size={16} color={colors.blue} />
        </View>
      </View>
      <Text style={styles.caption}>{name} will see it like this on WhatsApp</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.blueMist, borderRadius: radius.cardLarge, padding: spacing.lg, gap: spacing.md },
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  placeholder: { color: colors.greyBlue },
  meta: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: spacing.xxs },
  time: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.textMuted },
  caption: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center' },
});
