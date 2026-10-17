import React, { useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';
import { BounceButton } from './BounceButton';
import { SlideUpSheet } from './SlideUpSheet';

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const MINUTE_TICKS = Array.from({ length: 60 }, (_, i) => i);
const BUBBLE = 46;
const pad = (n: number) => String(n).padStart(2, '0');

/** A friendly line about when a wish arrives. */
function wishHint(hours24: number, minutes: number) {
  if (hours24 === 0 && minutes === 0) return 'Right at midnight. Be the first to wish!';
  if (hours24 < 5) return "Late night. They'll see it when they wake up.";
  if (hours24 < 12) return 'A morning wish to start their day.';
  if (hours24 < 17) return 'An afternoon wish to brighten their day.';
  if (hours24 < 21) return 'An evening wish to end their day happy.';
  return 'A late evening wish before the day ends.';
}

export type ClockOptions = {
  /** The line at the top, e.g. "Ahmed will get your wish at". */
  title: string;
  /** "HH:mm" */
  value: string;
  /** Show a friendly line about when a wish arrives (not for reminders). */
  wishHint?: boolean;
  onDone: (hhmm: string) => void;
};

type PickerProps = Omit<ClockOptions, 'onDone'> & { onDone: (hhmm: string) => void; onCancel: () => void };

/**
 * The AutoWish clock: big hour and minutes, AM / PM, and a round clock face.
 * Pick the hour first (tap or drag), then it moves on to the minutes.
 */
export function ClockPicker({ title, value, wishHint: showHint, onDone, onCancel }: PickerProps) {
  const { width, height } = useWindowDimensions();
  const [h, m] = value.split(':').map(Number);
  const [hour, setHour] = useState(h % 12 === 0 ? 12 : h % 12); // 1-12
  const [minute, setMinute] = useState(m || 0);
  const [pm, setPm] = useState(h >= 12);
  const [step, setStep] = useState<'hour' | 'minute'>('hour');

  const hours24 = (hour % 12) + (pm ? 12 : 0);
  // The face shrinks on short phones so Set time and Cancel always fit on screen
  // (everything else in the sheet takes about 480 points).
  const size = Math.max(180, Math.min(width - 96, 280, height - 480));
  const center = size / 2;
  const reach = center - 34; // distance from the middle to the numbers

  // Where on the face the hand points, in degrees clockwise from 12.
  const handAngle = step === 'hour' ? (hour % 12) * 30 : minute * 6;
  const tickAt = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    const r = center - 8; // close to the edge, outside the numbers
    return { left: center + r * Math.sin(rad) - 2, top: center - r * Math.cos(rad) - 2 };
  };
  const at = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { left: center + reach * Math.sin(rad) - BUBBLE / 2, top: center - reach * Math.cos(rad) - BUBBLE / 2 };
  };

  // Turns a touch on the face into an hour, or any minute (each minute is 6 degrees).
  const touch = (e: GestureResponderEvent) => {
    const dx = e.nativeEvent.locationX - center;
    const dy = e.nativeEvent.locationY - center;
    const deg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    if (step === 'hour') {
      const slot = Math.round(deg / 30) % 12;
      setHour(slot === 0 ? 12 : slot);
    } else {
      setMinute(Math.round(deg / 6) % 60);
    }
  };

  const nudge = (by: number) => {
    if (step === 'hour') setHour(((hour - 1 + by + 12) % 12) + 1);
    else setMinute((minute + by + 60) % 60);
  };

  const labels = step === 'hour' ? HOURS : MINUTES;
  const picked = step === 'hour' ? hour : minute;
  const spoken = `${hour}:${pad(minute)} ${pm ? 'PM' : 'AM'}`;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.timeRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Hour, ${hour}`}
          accessibilityState={{ selected: step === 'hour' }}
          onPress={() => setStep('hour')}
          style={[styles.digits, step === 'hour' && styles.digitsOn]}
        >
          <Text style={styles.digitsText}>{pad(hour)}</Text>
        </Pressable>
        <Text style={styles.colon}>:</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Minutes, ${pad(minute)}`}
          accessibilityState={{ selected: step === 'minute' }}
          onPress={() => setStep('minute')}
          style={[styles.digits, step === 'minute' && styles.digitsOn]}
        >
          <Text style={styles.digitsText}>{pad(minute)}</Text>
        </Pressable>
        <View style={styles.ampm}>
          {(['AM', 'PM'] as const).map((p) => {
            const on = (p === 'PM') === pm;
            return (
              <Pressable
                key={p}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setPm(p === 'PM')}
                style={[styles.ampmPill, on && styles.ampmPillOn]}
              >
                <Text style={[styles.ampmText, on && styles.ampmTextOn]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {showHint && <Text style={styles.hint}>{wishHint(hours24, minute)}</Text>}

      <View style={[styles.ring, { width: size + 16, height: size + 16, borderRadius: (size + 16) / 2 }]}>
        <View
          // box-only: touches land on the face itself, so the position is measured from its corner.
          pointerEvents="box-only"
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={touch}
          onResponderMove={touch}
          // After the hour, move on to the minutes, like a phone's own clock.
          onResponderRelease={() => step === 'hour' && setStep('minute')}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={step === 'hour' ? 'Clock, pick the hour' : 'Clock, pick the minutes'}
          accessibilityValue={{ text: spoken }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
          style={[styles.face, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <View
            style={[
              styles.hand,
              { height: reach, left: center - 1.5, top: center - reach, transform: [{ rotate: `${handAngle}deg` }] },
            ]}
          />
          {/* A small tick for every minute, so 1, 2, 3, 4 ... can be picked, not only 5, 10. */}
          {step === 'minute' &&
            MINUTE_TICKS.map((n) => <View key={n} style={[styles.tick, tickAt(n * 6), n % 5 === 0 && styles.tickFive]} />)}
          <View style={[styles.bubble, at(handAngle)]} />
          {labels.map((n, i) => {
            const on = n === picked;
            return (
              <View key={n} style={[styles.number, at(i * 30)]}>
                <Text style={[styles.numberText, on && styles.numberTextOn]}>{step === 'hour' ? n : pad(n)}</Text>
              </View>
            );
          })}
          {/* A minute between the numbers shows in the bubble itself. */}
          {step === 'minute' && minute % 5 !== 0 && (
            <View style={[styles.number, at(handAngle)]}>
              <Text style={[styles.numberText, styles.numberTextOn]}>{pad(minute)}</Text>
            </View>
          )}
          <View style={[styles.hub, { left: center - 11, top: center - 11 }]}>
            <View style={styles.hubDot} />
          </View>
        </View>
      </View>

      <Text style={styles.caption}>{step === 'hour' ? 'Pick the hour' : 'Pick the minutes'}</Text>

      <BounceButton title="Set time" onPress={() => onDone(`${pad(hours24)}:${pad(minute)}`)} style={styles.button} />
      <BounceButton title="Cancel" variant="text" onPress={onCancel} style={styles.button} />
    </View>
  );
}

/**
 * The clock in its own bottom sheet.
 * Usage: const clock = useClockSheet(); clock.open({ title, value, onDone }); and render {clock.sheet} at the end of the screen.
 */
export function useClockSheet() {
  const [options, setOptions] = useState<ClockOptions | null>(null);
  const [visible, setVisible] = useState(false);
  // A new key each time, so every opening starts from the value passed in.
  const [opened, setOpened] = useState(0);

  const open = (o: ClockOptions) => {
    setOptions(o);
    setOpened((n) => n + 1);
    setVisible(true);
  };
  const close = () => setVisible(false);

  const sheet = options && (
    <SlideUpSheet visible={visible} onClose={close}>
      <ClockPicker
        key={opened}
        {...options}
        onDone={(hhmm) => {
          options.onDone(hhmm);
          close();
        }}
        onCancel={close}
      />
    </SlideUpSheet>
  );
  return { open, sheet };
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  title: { ...type.bodyMuted, fontSize: fontSizes.lg },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  digits: { borderRadius: radius.card, paddingHorizontal: spacing.xs },
  digitsOn: { backgroundColor: colors.pinkLight },
  digitsText: { fontFamily: fonts.heading, fontSize: 64, color: colors.text },
  colon: { fontFamily: fonts.heading, fontSize: 48, color: colors.text, marginBottom: spacing.xs },
  ampm: { gap: spacing.xs, marginLeft: spacing.lg },
  ampmPill: {
    minWidth: 64,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmPillOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  ampmText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.md, color: colors.text },
  ampmTextOn: { color: colors.surface },
  hint: { ...type.bodyMuted, fontFamily: fonts.bodySemiBold, textAlign: 'center' },
  ring: { borderWidth: 1.5, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  face: { backgroundColor: colors.pinkLight },
  hand: { position: 'absolute', width: 3, borderRadius: 2, backgroundColor: colors.heart, transformOrigin: 'bottom' },
  bubble: { position: 'absolute', width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2, backgroundColor: colors.heart },
  tick: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: colors.greyBlue, opacity: 0.6 },
  tickFive: { backgroundColor: colors.text, opacity: 1 },
  number: { position: 'absolute', width: BUBBLE, height: BUBBLE, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontFamily: fonts.heading, fontSize: fontSizes.lg, color: colors.text },
  numberTextOn: { color: colors.surface },
  hub: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.heart },
  caption: { ...type.bodyMuted, fontFamily: fonts.bodySemiBold },
  button: { alignSelf: 'stretch' },
});
