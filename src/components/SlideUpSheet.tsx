import React, { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { motion } from '../theme/motion';
import { radius } from '../theme/spacing';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Bottom sheet for the reminder pop-up (#4). It slides up with a soft spring.
 * Start autowish_reminder_gift.json about 300 ms after `visible` turns true,
 * so the gift drops in once the sheet has arrived.
 */
export function SlideUpSheet({ visible, onClose, children }: Props) {
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  // Keep the buttons above the phone's own bottom bar.
  const { bottom } = useSafeAreaInsets();
  const y = useSharedValue(height);
  const scrim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      y.set(reduceMotion ? 0 : withSpring(0, motion.sheet));
      scrim.set(withTiming(1, { duration: reduceMotion ? 0 : 250 }));
    } else {
      y.set(withTiming(height, { duration: reduceMotion ? 0 : 220 }));
      scrim.set(withTiming(0, { duration: reduceMotion ? 0 : 200 }));
    }
  }, [visible, height, reduceMotion, y, scrim]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  return (
    <>
      <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
        <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { paddingBottom: 32 + bottom }, sheetStyle]} accessibilityViewIsModal={visible}>
        <Animated.View style={styles.grab} />
        {children}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    alignItems: 'center',
  },
  grab: { width: 44, height: 5, borderRadius: 9, backgroundColor: colors.outline, marginBottom: 4 },
});
