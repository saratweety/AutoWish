import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nextStreak, todayKey } from '../services/dates';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';
import { DressedGift } from './GiftArt';
import { SlideInCard } from './SlideInCard';

/** Home card for the daily Catch the Confetti game. Always has a Play button; after today's game it's for fun. */
export function DailyGameCard() {
  const navigation = useNavigation();
  const { gift } = useApp();
  const played = gift.lastPlayed === todayKey();

  return (
    <SlideInCard>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={played ? 'Play Catch the Confetti for fun' : 'Play Catch the Confetti, your daily gift'}
        onPress={() => navigation.navigate('ConfettiGame')}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.giftCircle}>
          <DressedGift equipped={gift.equipped} width={58} height={64} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{played ? "You caught today's stars" : 'Your daily gift is ready'}</Text>
          <Text style={type.bodyMuted} numberOfLines={2}>
            {played
              ? 'Play again for fun, or spend your stars in My Gift.'
              : `Catch the Confetti · Day ${nextStreak(gift.lastPlayed, gift.streak)} streak`}
          </Text>
        </View>
        <View style={[styles.action, played && styles.actionQuiet]}>
          <Ionicons name="play" size={14} color={colors.text} />
          <Text style={styles.actionText}>Play</Text>
        </View>
      </Pressable>
    </SlideInCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    padding: spacing.sm,
    paddingRight: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  giftCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.lg, color: colors.text },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.orange,
  },
  actionQuiet: { backgroundColor: colors.blueMist },
  actionText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.text },
});
