import React, { useEffect, useMemo } from 'react';
import { PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';
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
  /**
   * False when the sheet holds its own scrolling list. The drag then works only on
   * the handle at the top, so swiping the list still scrolls it. Anywhere else,
   * leave this alone: the whole sheet can be dragged down.
   */
  dragAnywhere?: boolean;
};

// How far down the sheet must be dragged before letting go closes it...
const CLOSE_DISTANCE = 110;
// ...or how fast it is flicked, for a short, quick swipe.
const CLOSE_VELOCITY = 0.7;
// A finger moves a few pixels during an ordinary tap; more than this is a drag.
const DRAG_SLOP = 8;

/**
 * Bottom sheet for the reminder pop-up (#4). It slides up with a soft spring.
 * Start autowish_reminder_gift.json about 300 ms after `visible` turns true,
 * so the gift drops in once the sheet has arrived.
 *
 * Closing it: drag the sheet down from anywhere on it, or tap the dark area behind
 * it. Dragging the dark area does nothing, so a stray swipe never throws away what
 * is on the sheet.
 */
export function SlideUpSheet({ visible, onClose, children, dragAnywhere = true }: Props) {
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

  // Drag the sheet itself down to close it. A clear downward swipe starts the drag;
  // anything shorter or sideways is left alone, so buttons still take their taps.
  const wantsDrag = (g: { dy: number; dx: number }) => g.dy > DRAG_SLOP && g.dy > Math.abs(g.dx);
  const drag = useMemo(
    () =>
      PanResponder.create({
        // Capturing means the drag works over buttons and cards too, not just the
        // handle. Sheets with a scrolling list pass dragAnywhere={false} instead,
        // so the list keeps its own swipes.
        onMoveShouldSetPanResponderCapture: (_e, g) => dragAnywhere && wantsDrag(g),
        onMoveShouldSetPanResponder: (_e, g) => wantsDrag(g),
        onPanResponderMove: (_e, g) => {
          // Only downwards: pulling up does nothing.
          y.set(Math.max(0, g.dy));
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) onClose();
          else y.set(withSpring(0, motion.sheet));
        },
        onPanResponderTerminate: () => {
          y.set(withSpring(0, motion.sheet));
        },
      }),
    [y, onClose, dragAnywhere],
  );

  // The dark area behind: a tap closes, a drag is ignored.
  const scrimTap = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderRelease: (_e, g) => {
          if (Math.abs(g.dx) < DRAG_SLOP && Math.abs(g.dy) < DRAG_SLOP) onClose();
        },
      }),
    [onClose],
  );

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  return (
    <>
      <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
        <View
          accessibilityRole="button"
          accessibilityLabel="Close"
          onAccessibilityTap={onClose}
          style={StyleSheet.absoluteFill}
          {...scrimTap.panHandlers}
        />
      </Animated.View>
      <Animated.View
        style={[styles.sheet, { paddingBottom: 32 + bottom }, sheetStyle]}
        accessibilityViewIsModal={visible}
        {...(dragAnywhere ? drag.panHandlers : {})}
      >
        <View style={styles.grabArea} {...(dragAnywhere ? {} : drag.panHandlers)}>
          <View style={styles.grab} />
        </View>
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
  // A wide, easy target around the little bar, so the drag is simple to start.
  grabArea: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 6, marginTop: -6 },
  grab: { width: 44, height: 5, borderRadius: 9, backgroundColor: colors.outline },
});
