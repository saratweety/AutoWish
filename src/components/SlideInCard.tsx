import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { easings, motion } from '../theme/motion';

type Props = {
  /** Position in the list. Card 0 starts first, each next one 0.1 s later. */
  index?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/** Slides up and fades in, one card after another. */
export function SlideInCard({ index = 0, style, children }: Props) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const delay = Math.min(index, motion.maxStaggered) * motion.stagger;
    progress.set(withDelay(
      delay,
      withTiming(1, { duration: motion.cardEnter.duration, easing: easings.outBack }),
    ));
    // run once when the card mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 1.6),
    transform: [{ translateY: (1 - progress.value) * motion.cardEnter.distance }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
