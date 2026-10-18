import { Feather } from '@expo/vector-icons';
import { differenceInMinutes, format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSyncStatus } from '../api/sync';
import { colors, fonts, fontSizes, spacing } from '../theme';

/** "just now", "2 min ago", "3 h ago", or the date. */
function ago(iso: string, now: Date) {
  const minutes = differenceInMinutes(now, new Date(iso));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`;
  return format(new Date(iso), 'd MMM');
}

/** The tiny sync state in the Settings account card. */
export function SyncStatusLine() {
  const status = useSyncStatus();
  // Refresh "2 min ago" every 30 seconds.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  let icon: keyof typeof Feather.glyphMap = 'check-circle';
  let text: string;
  let warn = false;
  if (status.state === 'saving' || status.downloading) {
    icon = 'refresh-cw';
    text = 'Saving…';
  } else if (status.state === 'offline') {
    icon = 'wifi-off';
    text = "Not saved yet · you're offline";
    warn = true;
  } else if (status.state === 'error') {
    icon = 'alert-circle';
    text = `Not saved yet · ${status.message ?? 'please try again'}`;
    warn = true;
  } else if (status.pending > 0) {
    icon = 'clock';
    text = 'Not saved yet · waiting to save';
  } else if (status.savedAt) {
    text = `Saved to your account · ${ago(status.savedAt, now)}`;
  } else {
    icon = 'refresh-cw';
    text = 'Saving…';
  }

  return (
    <View style={styles.row} accessibilityLiveRegion="polite">
      <Feather name={icon} size={14} color={warn ? colors.danger : colors.blueDark} />
      <Text style={[styles.text, warn && styles.warn]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  text: { flexShrink: 1, fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.blueDark },
  warn: { color: colors.text },
});
