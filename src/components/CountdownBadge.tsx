import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { countdownLabel } from '../services/dates';
import { colors, fonts, fontSizes, radius, spacing } from '../theme';

/** Orange pill: "Today", "Tomorrow", "3 days". */
export function CountdownBadge({ days }: { days: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{countdownLabel(days)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
  },
  text: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.text },
});
