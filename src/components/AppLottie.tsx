import LottieView, { AnimationObject } from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

type Props = {
  source: AnimationObject;
  loop?: boolean;
  /** Wait this long before playing, e.g. until a sheet has slid up. */
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Plays an AutoWish Lottie animation. One-off animations stop on their last frame.
 * With "reduce motion" switched on in the phone's settings it shows the finished
 * still frame instead of moving.
 *
 * It uses Lottie's own autoPlay, which starts only once the animation has loaded.
 * (Calling play() ourselves straight away is ignored on Android if the file isn't ready yet.)
 */
export function AppLottie({ source, loop = false, delayMs = 0, style }: Props) {
  const reduceMotion = useReducedMotion();
  const [started, setStarted] = useState(delayMs === 0);

  useEffect(() => {
    if (started || reduceMotion) return;
    const timer = setTimeout(() => setStarted(true), delayMs);
    return () => clearTimeout(timer);
  }, [started, reduceMotion, delayMs]);

  if (reduceMotion) return <LottieView source={source} progress={1} style={style} />;
  // Before the delay is over, hold the first frame; then swap in a fresh, auto-playing view.
  if (!started) return <LottieView key="waiting" source={source} progress={0} style={style} />;
  return <LottieView key="playing" source={source} autoPlay loop={loop} style={style} />;
}
