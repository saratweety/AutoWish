import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { Chip, ChipScrollRow } from '../components/Chip';
import { SlideInCard } from '../components/SlideInCard';
import { StatusPill } from '../components/StatusPill';
import { occasionName } from '../data/labels';
import { displayStatus } from '../services/wishes';
import { useApp } from '../state/AppContext';
import { useSendWish } from '../state/useSendWish';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, type } from '../theme';
import type { WishStatus } from '../types';

type Filter = 'all' | WishStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'sent', label: 'Sent' },
  { key: 'not_sent', label: 'Not sent' },
];

export default function WishesScreen() {
  const navigation = useNavigation();
  const { specialDays, wishes: saved } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const sendWish = useSendWish();

  // Scheduled wishes first (soonest at the top), then missed ones, then sent (newest first).
  const ORDER: Record<WishStatus, number> = { scheduled: 0, not_sent: 1, sent: 2 };
  const wishes = saved
    .map((w) => ({ ...w, shown: displayStatus(w) }))
    .filter((w) => filter === 'all' || w.shown === filter)
    .sort((a, b) =>
      ORDER[a.shown] - ORDER[b.shown] ||
      (a.shown === 'sent' ? b.sendAt.localeCompare(a.sendAt) : a.sendAt.localeCompare(b.sendAt)),
    );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Scheduled Wishes
        </Text>
        {/* One line of filters; scrolls sideways on narrow phones instead of wrapping. */}
        <ChipScrollRow edge={screenPadding + spacing.xs}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} compact selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ChipScrollRow>

        <View style={styles.list}>
          {wishes.map((wish, index) => {
            const day = specialDays.find((d) => d.id === wish.specialDayId);
            if (!day) return null;
            const edit = () => navigation.navigate('WriteWish', { specialDayId: day.id, wishId: wish.id });
            return (
              <Pressable
                key={wish.id}
                accessibilityRole="button"
                accessibilityLabel={`Wish for ${day.name}`}
                disabled={wish.shown !== 'scheduled'}
                onPress={edit}
              >
                <SlideInCard index={index} style={styles.card}>
                  <Avatar name={day.name} photoUri={day.photoUri} />
                  <View style={styles.cardText}>
                    <Text style={styles.name} numberOfLines={1}>
                      {day.name}
                    </Text>
                    <Text style={styles.meta}>
                      {occasionName(day)} · {format(new Date(wish.sendAt), 'd MMM, h:mm a')}
                    </Text>
                  </View>
                  <StatusPill status={wish.shown} onSendNow={wish.shown === 'sent' ? undefined : () => sendWish(wish)} />
                </SlideInCard>
              </Pressable>
            );
          })}
          {wishes.length === 0 && (
            <Text style={styles.empty}>
              {saved.length === 0 ? 'No wishes yet. Wishes you schedule will show up here.' : 'No wishes here.'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: screenPadding + spacing.xs, paddingTop: spacing.xs, gap: spacing.md },
  title: { ...type.h1, fontSize: 30 },
  list: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardText: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.lg, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.textMuted },
  empty: { ...type.bodyMuted, textAlign: 'center', marginTop: spacing.xl },
});
