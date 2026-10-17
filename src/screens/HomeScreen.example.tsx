// Example: how the motion pieces fit together on the Home screen.
// Swap the sample data for your real saved dates.
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { SlideInCard } from '../components/SlideInCard';
import { BounceButton } from '../components/BounceButton';
import { colors } from '../theme/colors';

type SpecialDay = { id: string; name: string; occasion: string; relation: string; daysLeft: number };

const SAMPLE: SpecialDay[] = [
  { id: '1', name: 'Ahmed', occasion: 'Birthday', relation: 'Friend', daysLeft: 0 },
  { id: '2', name: 'Ammi and Abbu', occasion: 'Anniversary', relation: 'Family', daysLeft: 3 },
  { id: '3', name: 'Sara', occasion: 'Birthday', relation: 'Friend', daysLeft: 9 },
  { id: '4', name: 'Abbu', occasion: "Father's Day", relation: 'Family', daysLeft: 21 },
];

export default function HomeScreen({ days = SAMPLE }: { days?: SpecialDay[] }) {
  if (days.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}>
          <LottieView source={require('../../assets/animations/autowish_empty_state.json')} autoPlay loop style={styles.emptyAnim} />
          <Text style={styles.emptyTitle}>No special days yet</Text>
          <Text style={styles.emptyText}>{"Add your first special day and we'll remind you before it comes."}</Text>
          <BounceButton title="+ Add your first special day" onPress={() => {}} style={{ alignSelf: 'stretch' }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={days}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.hi}>Hi Ali</Text>}
        renderItem={({ item, index }) =>
          item.daysLeft === 0 ? (
            <SlideInCard index={index} style={[styles.card, styles.today]}>
              <LottieView source={require('../../assets/animations/autowish_today_gift.json')} autoPlay loop style={styles.todayGift} />
              <View style={{ flex: 1 }}>
                <Text style={styles.todayChip}>TODAY</Text>
                <Text style={styles.name}>{`${item.name}'s ${item.occasion.toLowerCase()}`}</Text>
              </View>
            </SlideInCard>
          ) : (
            <SlideInCard index={index} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.occasion} · {item.relation}</Text>
              </View>
              <Text style={styles.countdown}>{item.daysLeft} days</Text>
            </SlideInCard>
          )
        }
        ListFooterComponent={<BounceButton title="+ Add special day" onPress={() => {}} style={{ marginTop: 8 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 12 },
  hi: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  today: { backgroundColor: colors.pink, paddingLeft: 8 },
  todayGift: { width: 88, height: 88 },
  todayChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.yellow,
    color: colors.text,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 99,
    overflow: 'hidden',
  },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted },
  countdown: {
    backgroundColor: colors.orange,
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    overflow: 'hidden',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyAnim: { width: 240, height: 240 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
});
