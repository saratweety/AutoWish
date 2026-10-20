import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius, spacing, touchTarget } from '../theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Slightly smaller, for rows that should fit on one line (filters). */
  compact?: boolean;
  /** How many people are behind this chip, shown after the label (filter chips). */
  count?: number;
};

/** Rounded choice chip. Selected = blue fill, white text. */
export function Chip({ label, selected, onPress, compact, count }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, compact && styles.compact, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={[styles.label, compact && styles.compactLabel, selected && styles.selectedLabel]}>{label}</Text>
      {count !== undefined && (
        <Text style={[styles.count, compact && styles.compactLabel, selected && styles.selectedCount]}>{count}</Text>
      )}
    </Pressable>
  );
}

/** A row of chips that wraps onto new lines. */
export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

/**
 * Chips on one line that slide sideways when they don't all fit.
 * `edge` is the screen's side padding, so the row can run to the screen edges
 * while the first chip still lines up with everything above it.
 */
export function ChipScrollRow({ children, edge }: { children: React.ReactNode; edge: number }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={{ marginHorizontal: -edge }}
      contentContainerStyle={[styles.scrollRow, { paddingHorizontal: edge }]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.blueMist,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs + 2,
  },
  compact: { paddingHorizontal: spacing.md },
  selected: { backgroundColor: colors.blue },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.text },
  selectedLabel: { color: colors.surface },
  count: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.textMuted },
  selectedCount: { color: colors.blueMist },
  compactLabel: { fontSize: fontSizes.sm + 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  scrollRow: { gap: spacing.xs },
});
