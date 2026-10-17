import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius, spacing, touchTarget } from '../theme';
import type { WishStatus } from '../types';
import { AppLottie } from './AppLottie';

type Props = {
  status: WishStatus;
  /** Shows a "Send now" button that opens WhatsApp with the wish. */
  onSendNow?: () => void;
};

/** The one place wish statuses are drawn, so they look the same everywhere. */
export function StatusPill({ status, onSendNow }: Props) {
  if (status === 'scheduled') {
    return (
      <View style={styles.stack}>
        <View style={[styles.pill, styles.scheduled]}>
          <Text style={styles.scheduledText}>Scheduled</Text>
        </View>
        {onSendNow && (
          <Pressable accessibilityRole="button" accessibilityLabel="Send now" onPress={onSendNow} style={styles.sendNow}>
            <Text style={styles.sendNowBlue}>Send now</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (status === 'sent') {
    return (
      <View style={styles.sentRow} accessibilityLabel="Sent">
        <Text style={styles.sentText}>Sent</Text>
        <AppLottie source={require('../../assets/animations/autowish_wish_sent.json')} style={styles.sentIcon} />
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <View style={[styles.pill, styles.notSentPill]}>
        <Text style={styles.notSentText}>Not sent</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Send now" onPress={onSendNow} style={styles.sendNow}>
        <Text style={styles.sendNowText}>Send now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs + 2 },
  scheduled: { backgroundColor: colors.blueMist },
  scheduledText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.text },
  sentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  sentText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.blueDark },
  sentIcon: { width: 40, height: 40 },
  stack: { alignItems: 'flex-end' },
  notSentPill: { backgroundColor: colors.pinkLight },
  notSentText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral },
  sendNow: { minHeight: touchTarget, justifyContent: 'center' },
  sendNowBlue: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.blueDark },
  sendNowText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral },
});
