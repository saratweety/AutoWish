import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { GIFT_ITEMS } from '../data/giftItems';
import { CONFETTI_HTML } from '../game/confettiHtml';
import type { RootScreenProps } from '../navigation/types';
import { useApp } from '../state/AppContext';
import { colors } from '../theme';
import type { GiftState } from '../types';

// The game's own names for what it saves, and where each one lives in the app.
const KEYS = { total: 'stars', best: 'best', streak: 'streak', last: 'lastPlayed', song: 'song', sfx: 'sfx' } as const;
type GameKey = keyof typeof KEYS;

type GameMessage = { type: 'set'; key: GameKey; value: unknown } | { type: 'close' } | { type: 'myGift' };

/**
 * Catch the Confetti, the daily mini-game. It's the HTML game from the design running in a web view,
 * so its music, sounds and motion stay exactly as designed. Stars are saved in the app.
 */
export default function ConfettiGameScreen({ navigation }: RootScreenProps<'ConfettiGame'>) {
  const { gift, updateGift } = useApp();

  // What the game starts with. Read once, so saving stars mid-game doesn't reload the page.
  const [injected] = useState(() => {
    const start: Record<GameKey, unknown> = {
      total: gift.stars,
      best: gift.best,
      streak: gift.streak,
      last: gift.lastPlayed ?? null,
      song: gift.song,
      sfx: gift.sfx,
    };
    // Stickers bought in My Gift fall in the game as bonus items (not the free starter heart).
    const stickers = GIFT_ITEMS.filter((i) => i.t === 'sticker' && i.cost > 0 && gift.unlocked.includes(i.id)).map((i) => ({
      name: i.name,
      svg: i.svg,
    }));
    return `window.AW_STORE = ${JSON.stringify({ ...start, stickers })}; true;`;
  });

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: GameMessage;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'close') navigation.goBack();
    if (msg.type === 'myGift') navigation.replace('MyGift');
    if (msg.type === 'set' && msg.key in KEYS) {
      updateGift({ [KEYS[msg.key]]: msg.value ?? undefined } as Partial<GiftState>);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <WebView
        source={{ html: CONFETTI_HTML }}
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={injected}
        onMessage={onMessage}
        // Music starts when Play is tapped, so it's allowed to play.
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        style={styles.web}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  web: { flex: 1, backgroundColor: colors.background },
});
