import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BounceButton } from '../components/BounceButton';
import { DressedGift, ItemArt } from '../components/GiftArt';
import { ScreenHeader } from '../components/ScreenHeader';
import { SlideUpSheet } from '../components/SlideUpSheet';
import { TodayCard, todayTextColor } from '../components/TodayCard';
import { GIFT_ITEMS, giftItem, itemArtSVG, type GiftItem, type GiftKind } from '../data/giftItems';
import { possessiveOccasion } from '../data/labels';
import type { RootScreenProps } from '../navigation/types';
import { daysUntil } from '../services/dates';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, motion, radius, spacing, type } from '../theme';

const TABS: { kind: GiftKind; label: string }[] = [
  { kind: 'hat', label: 'Hats' },
  { kind: 'ribbon', label: 'Ribbons' },
  { kind: 'theme', label: 'Cards' },
  { kind: 'sticker', label: 'Stickers' },
];
const PAD = 18;
const GAP = 10;
// The circle behind the big gift. The gift is drawn a bit smaller and centred,
// so the whole box (corners too) sits inside the circle.
const STAGE = 250;
const GIFT_W = 180;
const GIFT_H = 207; // keeps the gift's 200 x 230 shape
const RARE_FROM = 250; // items this pricey get a "Rare" tag
const CONFETTI = [colors.blueLight, colors.pink, colors.yellow, colors.blue, colors.heart];

/** Dress up the AutoWish gift with hats, ribbons, card themes and stickers bought with stars. */
export default function MyGiftScreen({ navigation }: RootScreenProps<'MyGift'>) {
  const { gift, updateGift, specialDays } = useApp();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<GiftKind>('hat');
  const [pending, setPending] = useState<GiftItem | null>(null);
  const [burst, setBurst] = useState(0);

  // The gift hops each time it changes.
  const hop = useSharedValue(0);
  const hopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 * hop.value }, { scale: 1 + 0.04 * hop.value }],
  }));
  const bounce = () => {
    if (!reduceMotion) hop.set(withSequence(withTiming(1, { duration: 160 }), withSpring(0, motion.press.up)));
  };

  const list = GIFT_ITEMS.filter((i) => i.t === tab);
  const real = list.filter((i) => !i.none);
  const owned = (it: GiftItem) => gift.unlocked.includes(it.id);
  const hat = giftItem(gift.equipped.hat);
  const ribbon = giftItem(gift.equipped.ribbon);

  // The preview uses the soonest saved special day, so it looks like their own Home.
  const soonest = [...specialDays].sort((a, b) => daysUntil(a) - daysUntil(b))[0];
  const previewText = todayTextColor(gift.equipped);

  const choose = (it: GiftItem) => {
    if (owned(it)) {
      updateGift((g) => ({ equipped: { ...g.equipped, [it.t]: it.id } }));
      bounce();
      return;
    }
    setPending(it);
  };

  const unlock = () => {
    if (!pending) return;
    if (gift.stars < pending.cost) {
      setPending(null);
      navigation.navigate('ConfettiGame');
      return;
    }
    const it = pending;
    updateGift((g) => ({
      stars: g.stars - it.cost,
      unlocked: [...g.unlocked, it.id],
      equipped: { ...g.equipped, [it.t]: it.id },
    }));
    setPending(null);
    bounce();
    setBurst((n) => n + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
  };

  const tileWidth = (width - PAD * 2 - GAP * 2) / 3;
  const canAfford = pending ? gift.stars >= pending.cost : false;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} stickyHeaderIndices={[4]}>
        <ScreenHeader
          title="My Gift"
          showBack
          right={
            <View style={styles.stars} accessibilityLabel={`${gift.stars} stars`} accessibilityLiveRegion="polite">
              <Ionicons name="star" size={20} color={colors.sparkle} />
              <Text style={styles.starsText}>{gift.stars}</Text>
            </View>
          }
        />

        <View style={styles.stageWrap}>
          <View style={styles.stage}>
            <Animated.View style={hopStyle} accessible accessibilityLabel="Your gift">
              <DressedGift equipped={gift.equipped} width={GIFT_W} height={GIFT_H} />
            </Animated.View>
            {burst > 0 && !reduceMotion && <ConfettiBurst key={burst} />}
          </View>
          <Text style={styles.wearing}>
            Wearing: {!hat || hat.none ? 'no hat' : hat.name}, {ribbon?.name} ribbon
          </Text>
        </View>

        <Text style={styles.label}>HOME SCREEN PREVIEW</Text>
        <TodayCard
          compact
          equipped={gift.equipped}
          title={soonest ? possessiveOccasion(soonest) : "Ahmed's birthday"}
          status={<Text style={[styles.previewStatus, { color: previewText }]}>Wish scheduled for 12:00 AM</Text>}
        />

        {/* Stays at the top while the grid scrolls. */}
        <View style={styles.tabsWrap}>
          <View style={styles.tabs} accessibilityRole="tablist">
            {TABS.map((t) => (
              <Pressable
                key={t.kind}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t.kind }}
                onPress={() => setTab(t.kind)}
                style={[styles.tab, tab === t.kind && styles.tabOn]}
              >
                <Text style={[styles.tabText, tab === t.kind && styles.tabTextOn]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.count}>
          <Text style={styles.countText}>{`${real.filter(owned).length} of ${real.length} unlocked`}</Text>
          <Text style={styles.countText}>Cheapest first</Text>
        </View>

        <View style={styles.grid}>
          {list.map((it) => {
            const has = owned(it);
            const on = gift.equipped[it.t] === it.id;
            const can = gift.stars >= it.cost;
            return (
              <Pressable
                key={it.id}
                accessibilityRole="button"
                accessibilityLabel={`${it.name}${has ? '' : `, locked, ${it.cost} stars`}${on ? ', in use' : ''}`}
                onPress={() => choose(it)}
                style={({ pressed }) => [styles.tile, { width: tileWidth }, on && styles.tileOn, pressed && styles.tilePressed]}
              >
                {it.cost >= RARE_FROM && <Text style={styles.rare}>Rare</Text>}
                {on ? (
                  <View style={styles.tick}>
                    <Feather name="check" size={12} color={colors.surface} />
                  </View>
                ) : (
                  !has && <Feather name="lock" size={15} color={colors.textMuted} style={styles.lock} />
                )}
                <View style={[styles.art, !has && styles.artLocked]}>
                  <ItemArt xml={itemArtSVG(it)} size={64} />
                </View>
                <Text style={styles.tileName} numberOfLines={2}>
                  {it.name}
                </Text>
                {on ? (
                  <Text style={styles.wear}>Using</Text>
                ) : has ? (
                  <Text style={styles.wear}>{it.t === 'hat' || it.t === 'ribbon' ? 'Wear' : 'Use'}</Text>
                ) : can ? (
                  <Text style={styles.cost}>{it.cost} stars</Text>
                ) : (
                  <Text style={styles.need}>Need {it.cost}</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('ConfettiGame')} style={styles.howto}>
          <Text style={styles.howtoText}>Play Catch the Confetti every day to earn more stars.</Text>
        </Pressable>
      </ScrollView>

      <SlideUpSheet visible={pending !== null} onClose={() => setPending(null)}>
        {pending && (
          <View style={styles.sheet}>
            <View style={styles.sheetArt}>
              <ItemArt xml={itemArtSVG(pending)} size={96} />
            </View>
            <Text style={styles.sheetTitle}>{canAfford ? `Unlock ${pending.name}?` : `${pending.name} needs ${pending.cost} stars`}</Text>
            <Text style={styles.sheetText}>
              {canAfford
                ? `It costs ${pending.cost} stars. You'll have ${gift.stars - pending.cost} left.`
                : `You have ${gift.stars}. Play Catch the Confetti to earn ${pending.cost - gift.stars} more.`}
            </Text>
            <BounceButton title={canAfford ? `Unlock for ${pending.cost} stars` : "Play today's game"} onPress={unlock} style={styles.sheetButton} />
            <BounceButton title="Not now" variant="text" onPress={() => setPending(null)} />
          </View>
        )}
      </SlideUpSheet>
    </SafeAreaView>
  );
}

/** A little burst of confetti from behind the gift after an unlock. */
function ConfettiBurst() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 20 }, (_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
}

function ConfettiPiece({ index }: { index: number }) {
  const t = useSharedValue(0);
  const [angle] = useState(() => (index / 20) * Math.PI * 2);
  const [distance] = useState(() => 100 + Math.random() * 50);

  useEffect(() => {
    t.set(withTiming(1, { duration: 1400 }));
  }, [t]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateX: Math.cos(angle) * distance * t.value },
      // Falls a little as it flies out.
      { translateY: (Math.sin(angle) * distance + 60 * t.value) * t.value },
      { rotate: `${540 * t.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        { backgroundColor: CONFETTI[index % CONFETTI.length], borderRadius: index % 3 === 0 ? 5 : 2 },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: PAD, paddingBottom: spacing.xxl, gap: spacing.sm },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.xxs + 2,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
  },
  starsText: { fontFamily: fonts.heading, fontSize: fontSizes.lg, color: colors.text },
  stageWrap: { alignItems: 'center', gap: spacing.xs },
  stage: {
    width: STAGE,
    height: STAGE,
    borderRadius: STAGE / 2,
    backgroundColor: colors.pinkPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wearing: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center' },
  label: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.xs, letterSpacing: 0.7, color: colors.textMuted, marginTop: spacing.xxs },
  previewStatus: { fontFamily: fonts.bodySemiBold, fontSize: 13 },
  tabsWrap: { backgroundColor: colors.background, paddingVertical: spacing.xs, marginHorizontal: -PAD, paddingHorizontal: PAD },
  tabs: { flexDirection: 'row', gap: 6, backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4 },
  tab: { flex: 1, minHeight: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: colors.blue },
  tabText: { fontFamily: fonts.bodyExtraBold, fontSize: 13, color: colors.textMuted },
  tabTextOn: { color: colors.surface },
  count: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 2 },
  countText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  tileOn: { borderColor: colors.blue },
  tilePressed: { transform: [{ scale: 0.95 }] },
  art: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  artLocked: { opacity: 0.45 },
  tileName: { fontFamily: fonts.bodyBold, fontSize: 12.5, lineHeight: 15, minHeight: 30, textAlign: 'center', color: colors.text, textAlignVertical: 'center' },
  wear: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.xs, color: colors.blueDark },
  cost: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.xs,
    color: colors.text,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  need: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.xs, color: colors.textMuted },
  rare: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    fontFamily: fonts.bodyExtraBold,
    fontSize: 10,
    color: colors.text,
    backgroundColor: colors.yellow,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
    zIndex: 1,
  },
  tick: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  lock: { position: 'absolute', top: spacing.xs, right: spacing.xs, zIndex: 1 },
  howto: { minHeight: 44, justifyContent: 'center', marginTop: spacing.xs },
  howtoText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  sheet: { alignSelf: 'stretch', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  sheetArt: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { ...type.h2, textAlign: 'center' },
  sheetText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.textMuted, textAlign: 'center' },
  sheetButton: { alignSelf: 'stretch' },
  confetti: { position: 'absolute', left: STAGE / 2 - 5, top: STAGE / 2 - 5, width: 10, height: 10 },
});
