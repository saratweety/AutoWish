import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DEFAULT_EQUIPPED, giftItem, type Equipped } from '../data/giftItems';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';
import { CardBackground, DressedGift, Sticker } from './GiftArt';

/** The text colour that reads well on the chosen card theme (white on Night, navy on the rest). */
export function todayTextColor(equipped: Equipped) {
  return (giftItem(equipped.theme) ?? giftItem(DEFAULT_EQUIPPED.theme)!).fg ?? colors.text;
}

type Props = {
  equipped: Equipped;
  title: string;
  /** The line under the title, e.g. "Wish scheduled for 12:00 AM". */
  status: React.ReactNode;
  /** Smaller gift, for the preview in My Gift. */
  compact?: boolean;
};

/** The pink "TODAY" card, dressed in the card theme, sticker and gift picked in My Gift. */
export function TodayCard({ equipped, title, status, compact }: Props) {
  const theme = giftItem(equipped.theme) ?? giftItem(DEFAULT_EQUIPPED.theme)!;
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <CardBackground theme={theme} />
      <View style={styles.text}>
        <Text style={styles.chip}>TODAY</Text>
        {/* Always one line, like the design; long names shrink a little to fit. */}
        <Text style={[styles.title, compact && styles.titleCompact, { color: theme.fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {title}
        </Text>
        {status}
      </View>
      <Sticker id={equipped.sticker} size={34} style={[styles.sticker, compact && styles.stickerCompact]} />
      {/* A pale circle behind the gift, so its pink lid doesn't disappear into a pink card. */}
      <View style={[styles.giftCircle, compact && styles.giftCircleCompact]}>
        <DressedGift equipped={equipped} width={compact ? 70 : 86} height={compact ? 80 : 99} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.cardLarge,
    padding: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  compact: { paddingLeft: spacing.md, paddingVertical: spacing.sm },
  text: { flex: 1, gap: spacing.xs },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.yellow,
    color: colors.text,
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.xs,
    letterSpacing: 0.8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  title: { ...type.h2 },
  titleCompact: { fontSize: 20 },
  giftCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
    backgroundColor: colors.pinkPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftCircleCompact: { width: 80, height: 80, borderRadius: 40 },
  sticker: { position: 'absolute', right: 92, top: spacing.xs, zIndex: 1 },
  stickerCompact: { right: 76 },
});
