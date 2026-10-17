import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { motion } from '../theme/motion';
import { radius, spacing, touchTarget } from '../theme/spacing';
import { fonts, fontSizes } from '../theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  title: string;
  onPress?: () => void;
  /** primary = orange pill (Write Wish, Schedule Wish); text = quiet grey button; link = blue text button */
  variant?: 'primary' | 'text' | 'link';
  /** small = compact pill, e.g. the "Allow" buttons */
  size?: 'regular' | 'small';
  disabled?: boolean;
  /** What screen readers say. Defaults to the title. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Shrinks to 95% when pressed and springs back with a tiny bounce. */
export function BounceButton({ title, onPress, variant = 'primary', size = 'regular', disabled, accessibilityLabel, style }: Props) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (!reduceMotion) scale.set(withSpring(motion.press.scale, motion.press.down));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, motion.press.up));
      }}
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : styles.text,
        size === 'small' && styles.small,
        disabled && styles.disabled,
        style,
        animatedStyle,
      ]}
    >
      <Text style={[styles[`${variant}Label`], size === 'small' && styles.smallLabel]}>{title}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.orange },
  text: { backgroundColor: 'transparent', minHeight: touchTarget },
  small: { minHeight: touchTarget, paddingHorizontal: spacing.lg },
  disabled: { opacity: 0.5 },
  primaryLabel: { color: colors.text, fontSize: fontSizes.md, fontFamily: fonts.bodyExtraBold },
  textLabel: { color: colors.textMuted, fontSize: fontSizes.md, fontFamily: fonts.bodyBold },
  linkLabel: { color: colors.blueDark, fontSize: fontSizes.md, fontFamily: fonts.bodyExtraBold },
  smallLabel: { fontSize: fontSizes.sm },
});
