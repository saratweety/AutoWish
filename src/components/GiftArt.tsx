import React, { useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { cardPattern, dressedGiftSVG, giftItem, type Equipped, type GiftItem } from '../data/giftItems';

/** The AutoWish gift wearing the chosen hat and ribbon. */
export function DressedGift({
  equipped,
  width,
  height,
  centered,
}: {
  equipped: Equipped;
  width: number;
  height: number;
  /** Square and centred on the gift (with or without a hat), for round frames. */
  centered?: boolean;
}) {
  return <SvgXml xml={dressedGiftSVG(equipped, centered)} width={width} height={height} />;
}

/** One item's picture: a hat, ribbon, card or sticker. */
export function ItemArt({ xml, size }: { xml: string; size: number }) {
  return <SvgXml xml={xml} width={size} height={size} />;
}

/** A sticker (or nothing for "No sticker"). */
export function Sticker({ id, size, style }: { id: string; size: number; style?: StyleProp<ViewStyle> }) {
  const it = giftItem(id);
  if (!it || it.none) return null;
  return (
    <View style={style} pointerEvents="none">
      <SvgXml xml={`<svg viewBox="0 0 64 64">${it.svg}</svg>`} width={size} height={size} />
    </View>
  );
}

/** Fills its parent with a card theme: the colour plus soft hearts or stripes. Put it first inside the card. */
export function CardBackground({ theme }: { theme: GiftItem }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 && (
        <SvgXml xml={`<svg viewBox="0 0 ${size.w} ${size.h}">${cardPattern(theme, size.w, size.h)}</svg>`} width={size.w} height={size.h} />
      )}
    </View>
  );
}
