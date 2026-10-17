import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatClock } from '../services/dates';
import { colors, fonts, fontSizes, radius, spacing } from '../theme';
import { BounceButton } from './BounceButton';
import { FieldBox } from './Field';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  /** What the time is for, read by screen readers, e.g. "Reminder time". */
  label: string;
  /** This person's own time ("HH:mm"), or undefined to use the default. */
  value: string | undefined;
  defaultValue: string;
  /** Opens a time picker. */
  onPress: () => void;
  /** Goes back to the default. */
  onReset: () => void;
};

/** "at 10:00 AM  [Default]" row. Tap to pick a time just for this person. */
export function TimeField({ icon, label, value, defaultValue, onPress, onReset }: Props) {
  const shown = formatClock(value ?? defaultValue);
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${shown}. Change`} onPress={onPress}>
        <FieldBox>
          <Feather name={icon} size={22} color={colors.blue} />
          <Text style={styles.time}>at {shown}</Text>
          {value === undefined ? (
            <Text style={styles.defaultTag}>Default</Text>
          ) : (
            <Feather name="chevron-right" size={22} color={colors.greyBlue} />
          )}
        </FieldBox>
      </Pressable>
      {value !== undefined && (
        <BounceButton
          title={`Use default (${formatClock(defaultValue)})`}
          variant="link"
          size="small"
          onPress={onReset}
          style={styles.reset}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  time: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text },
  defaultTag: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.text,
    backgroundColor: colors.blueMist,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  reset: { alignSelf: 'flex-start', paddingHorizontal: spacing.xxs },
});
