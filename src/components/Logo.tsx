import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '../theme';

type Props = {
  /** Height of the gift; the name scales with it. */
  size?: number;
};

/** The AutoWish gift with the wordmark: "Auto" in navy, "Wish" in coral. */
export function Logo({ size = 40 }: Props) {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="AutoWish">
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: size, height: size, borderRadius: size / 4 }}
        accessibilityIgnoresInvertColors
      />
      <Text style={[styles.wordmark, { fontSize: size * 0.6 }]}>
        Auto<Text style={styles.wish}>Wish</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  wordmark: { ...type.h1 },
  wish: { color: colors.wordmarkCoral },
});
