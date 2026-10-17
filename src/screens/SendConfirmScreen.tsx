import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BounceButton } from '../components/BounceButton';
import { SlideUpSheet } from '../components/SlideUpSheet';
import type { RootScreenProps } from '../navigation/types';
import { useApp } from '../state/AppContext';
import { useSendWish } from '../state/useSendWish';
import { spacing, type } from '../theme';

const CLOSE_MS = 220;

// Bottom sheet shown after WhatsApp was opened: "Did you send it?"
// Or, if WhatsApp couldn't be opened, a friendly message with "Try again".
export default function SendConfirmScreen({ navigation, route }: RootScreenProps<'SendConfirm'>) {
  const { wishId, failed } = route.params;
  const { wishes, specialDays, markWishSent } = useApp();
  const sendWish = useSendWish();
  const [visible, setVisible] = useState(true);
  const wish = wishes.find((w) => w.id === wishId);
  const day = specialDays.find((d) => d.id === wish?.specialDayId);

  useEffect(() => {
    if (!wish || !day) navigation.goBack();
  }, [wish, day, navigation]);

  const closeThen = (next: () => void) => {
    setVisible(false);
    setTimeout(next, CLOSE_MS);
  };

  if (!wish || !day) return null;

  return (
    <View style={styles.screen}>
      <SlideUpSheet visible={visible} onClose={() => closeThen(() => navigation.goBack())}>
        {failed ? (
          <View style={styles.content}>
            <Text style={[type.h2, styles.center]}>{"Couldn't open WhatsApp"}</Text>
            <Text style={[type.bodyMuted, styles.center]}>
              Please check that WhatsApp is installed on this phone, then try again.
            </Text>
            <BounceButton
              title="Try again"
              onPress={() => closeThen(() => {
                navigation.goBack();
                sendWish(wish);
              })}
            />
            <BounceButton title="Close" variant="text" onPress={() => closeThen(() => navigation.goBack())} />
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={[type.h2, styles.center]}>Did you send it?</Text>
            <Text style={[type.bodyMuted, styles.center]}>{`Your wish for ${day.name} was ready in WhatsApp.`}</Text>
            <BounceButton
              title="Yes, I sent it"
              onPress={() =>
                closeThen(() => {
                  markWishSent(wish.id);
                  // Show the wish turning "Sent" with the blue tick animation.
                  navigation.popTo('Main', { screen: 'Wishes' });
                })
              }
            />
            <BounceButton title="Not yet" variant="text" onPress={() => closeThen(() => navigation.goBack())} />
          </View>
        )}
      </SlideUpSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.md },
  center: { textAlign: 'center' },
});
