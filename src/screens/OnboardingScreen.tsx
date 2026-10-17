import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLottie } from '../components/AppLottie';
import { BounceButton } from '../components/BounceButton';
import type { RootScreenProps } from '../navigation/types';
import { colors, radius, screenPadding, spacing, type } from '../theme';

const PAGES = [
  {
    title: 'Never forget a special day',
    text: "Birthdays, anniversaries, Mother's Day and Father's Day in one place.",
    animation: require('../../assets/animations/autowish_onboarding_1_calendar.json'),
    circle: colors.pinkLight,
  },
  {
    title: 'Busy? Write your wish in advance',
    text: 'Write it whenever you have a minute and pick when it goes out.',
    animation: require('../../assets/animations/autowish_onboarding_2_write.json'),
    circle: colors.blueMist,
  },
  {
    title: 'We send it on WhatsApp',
    text: 'At the right time, we open WhatsApp with your wish ready. Just tap Send.',
    animation: require('../../assets/animations/autowish_onboarding_3_send.json'),
    circle: colors.pinkLight,
    // The gift the heart flies out of (bottom left), as in the design.
    gift: true,
    oneLine: true,
  },
] as const;

export default function OnboardingScreen({ navigation }: RootScreenProps<'Onboarding'>) {
  const { width } = useWindowDimensions();
  const list = useRef<FlatList>(null);
  const [page, setPage] = useState(0);
  const isLast = page === PAGES.length - 1;

  // After the intro pages comes "Tell us about you", then Permissions.
  const goToPermissions = () => navigation.reset({ index: 0, routes: [{ name: 'AboutYou' }] });
  const next = () => {
    if (isLast) return goToPermissions();
    list.current?.scrollToIndex({ index: page + 1 });
    setPage(page + 1);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <BounceButton title="Skip" variant="text" onPress={goToPermissions} />
      </View>

      <FlatList
        ref={list}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.title}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            <View style={[styles.circle, { backgroundColor: item.circle }]}>
              {'gift' in item && (
                <AppLottie source={require('../../assets/animations/autowish_reminder_gift.json')} style={styles.gift} />
              )}
              <AppLottie source={item.animation} loop style={styles.animation} />
            </View>
            <Text
              style={styles.title}
              accessibilityRole="header"
              // "We send it on WhatsApp" stays on one line like the design; the others may wrap.
              numberOfLines={'oneLine' in item ? 1 : undefined}
              adjustsFontSizeToFit={'oneLine' in item}
              minimumFontScale={0.75}
            >
              {item.title}
            </Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {PAGES.map((p, i) => (
            <View key={p.title} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <BounceButton title={isLast ? 'Get started' : 'Next'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { alignItems: 'flex-end', paddingHorizontal: spacing.xs },
  page: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  circle: { width: 280, height: 280, borderRadius: 140, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl + spacing.lg },
  animation: { width: 300, height: 300 },
  // Sized and placed so the gift sits bottom-left in the circle and its bubble meets the flying heart.
  gift: { position: 'absolute', left: -10, top: 97, width: 182, height: 182 },
  title: { ...type.h1, fontSize: 30, textAlign: 'center', marginBottom: spacing.sm },
  text: { ...type.bodyMuted, fontSize: 17, textAlign: 'center', lineHeight: 24 },
  bottom: { paddingHorizontal: screenPadding + spacing.xs, paddingBottom: spacing.md, gap: spacing.xxl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.outline },
  dotActive: { width: 24, backgroundColor: colors.heart },
});
