import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

const FILLS = [colors.pink, colors.pinkLight, colors.blueMist, colors.yellow, colors.blueLight];

/** "Ammi and Abbu" -> "AA", "Sara" -> "S". */
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter((w) => w.toLowerCase() !== 'and');
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

/** Same name always gets the same soft colour. */
function fillFor(name: string) {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return FILLS[sum % FILLS.length];
}

type Props = { name: string; photoUri?: string; size?: number };

export function Avatar({ name, photoUri, size = 52 }: Props) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (photoUri) return <Image source={{ uri: photoUri }} style={shape} accessibilityLabel={name} />;

  return (
    <View style={[styles.circle, shape, { backgroundColor: fillFor(name) }]} accessibilityLabel={name}>
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.headingSemiBold, color: colors.text },
});
