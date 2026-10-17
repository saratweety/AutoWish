import { Feather } from '@expo/vector-icons';
import { getDaysInMonth } from 'date-fns';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';
import { FieldBox } from './Field';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A date that may be half filled in: day and year as text ('' = not set), month is 1-12. */
export type DateParts = { day: string; month?: number; year: string };

export const emptyDateParts: DateParts = { day: '', year: '' };

export function toDateParts(d?: { day: number; month: number; year?: number }): DateParts {
  if (!d) return emptyDateParts;
  return { day: String(d.day), month: d.month, year: d.year ? String(d.year) : '' };
}

/**
 * Checks the date and returns it as numbers, or an error message to show.
 * The year is optional. Without one, 29 February is still allowed (leap-year birthdays).
 */
export function readDateParts(parts: DateParts): { day: number; month: number; year?: number } | { error: string } {
  const day = Number(parts.day);
  const year = parts.year ? Number(parts.year) : undefined;
  if (!parts.day || !parts.month) return { error: 'Please choose a date.' };
  // 2000 was a leap year, so 29 Feb counts as a real date when no year is given.
  const maxDay = getDaysInMonth(new Date(year ?? 2000, parts.month - 1, 1));
  if (day < 1 || day > maxDay) return { error: `${MONTHS[parts.month - 1]} has ${maxDay} days. Please check the day.` };
  return { day, month: parts.month, year };
}

type Props = { value: DateParts; onPress: () => void };

/** A date field. Tapping it opens the calendar sheet (see useCalendarSheet). */
export function DateFields({ value, onPress }: Props) {
  const label = value.day && value.month ? `${value.day} ${MONTHS[value.month - 1]}${value.year ? ` ${value.year}` : ''}` : null;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label ? `Date, ${label}. Change` : 'Choose a date'} onPress={onPress}>
      <FieldBox>
        <Text style={[styles.value, !label && styles.placeholder]}>{label ?? 'Pick a date'}</Text>
        <Feather name="calendar" size={22} color={colors.blue} />
      </FieldBox>
    </Pressable>
  );
}

/** The picked date as numbers, ready to open the calendar sheet on. */
export function datePartsForCalendar(parts: DateParts) {
  return {
    day: parts.day ? Number(parts.day) : undefined,
    month: parts.month,
    year: parts.year ? Number(parts.year) : undefined,
  };
}

const styles = StyleSheet.create({
  value: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text },
  placeholder: { color: colors.greyBlue },
});
