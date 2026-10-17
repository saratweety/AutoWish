import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts, fontSizes, radius, spacing } from '../theme';

/** A small grey label above a form control. */
export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

/** White rounded box that holds an input or a tappable value. */
export function FieldBox({ children }: { children: React.ReactNode }) {
  return <View style={styles.box}>{children}</View>;
}

/** Plain text input in a white rounded box. */
export function TextField(props: TextInputProps) {
  return (
    <FieldBox>
      <TextInput placeholderTextColor={colors.greyBlue} {...props} style={[styles.input, props.style]} />
    </FieldBox>
  );
}

export const fieldStyles = StyleSheet.create({
  input: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text, paddingVertical: spacing.sm },
});

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: spacing.xs },
  box: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: fieldStyles.input,
});
