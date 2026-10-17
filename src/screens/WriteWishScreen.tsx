import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLottie } from '../components/AppLottie';
import { BounceButton } from '../components/BounceButton';
import { Chip, ChipRow } from '../components/Chip';
import { useDateTimePicker } from '../components/DateTimeSheet';
import { FieldLabel } from '../components/Field';
import { ScreenHeader } from '../components/ScreenHeader';
import { WhatsAppBubble } from '../components/WhatsAppBubble';
import { occasionName, TONE_LABELS } from '../data/labels';
import { fillTemplate, WISH_TEMPLATES } from '../data/wishTemplates';
import type { RootScreenProps } from '../navigation/types';
import { formatShortDate, formatTime, nextOccurrence, withTime } from '../services/dates';
import { newId, useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, type } from '../theme';
import type { SpecialDay, Tone, Wish } from '../types';

const TONES: Tone[] = ['funny', 'emotional', 'formal', 'urdu'];
const PLANE_MS = 1500;

export default function WriteWishScreen({ navigation, route }: RootScreenProps<'WriteWish'>) {
  const { specialDays, wishes, settings, saveWish } = useApp();
  const day = specialDays.find((d) => d.id === route.params.specialDayId);
  // Editing: the wish that was tapped, or the unsent wish already written for this day.
  const existing =
    wishes.find((w) => w.id === route.params.wishId) ??
    wishes.find((w) => w.specialDayId === route.params.specialDayId && w.status === 'scheduled');

  // The day was deleted while this screen was open.
  useEffect(() => {
    if (!day) navigation.goBack();
  }, [day, navigation]);

  if (!day) return null;
  return <WishForm day={day} existing={existing} defaultSendTime={day.sendTime ?? settings.defaultSendTime} onSave={saveWish} navigation={navigation} />;
}

/** First send time to suggest: the day at this person's send time (or the default, 12:00 AM), or in an hour if that has passed. */
function defaultSendAt(day: SpecialDay, hhmm: string) {
  const onTheDay = withTime(nextOccurrence(day), hhmm);
  if (onTheDay > new Date()) return onTheDay;
  const soon = new Date(Date.now() + 60 * 60 * 1000);
  soon.setMinutes(0, 0, 0);
  return soon;
}

type FormProps = {
  day: SpecialDay;
  existing?: Wish;
  defaultSendTime: string;
  onSave: (wish: Wish) => void;
  navigation: RootScreenProps<'WriteWish'>['navigation'];
};

function WishForm({ day, existing, defaultSendTime, onSave, navigation }: FormProps) {
  const reduceMotion = useReducedMotion();
  const picker = useDateTimePicker();

  const [text, setText] = useState(existing?.text ?? '');
  const [tone, setTone] = useState<Tone>(existing?.tone ?? 'funny');
  const [sendAt, setSendAt] = useState(() => (existing ? new Date(existing.sendAt) : defaultSendAt(day, defaultSendTime)));
  const [suggestion, setSuggestion] = useState(0);
  const [sending, setSending] = useState(false);

  const suggest = () => {
    const list = WISH_TEMPLATES[tone];
    setText(fillTemplate(list[suggestion % list.length], day.name, occasionName(day).toLowerCase()));
    setSuggestion(suggestion + 1);
  };

  const schedule = () => {
    // Milestone 6 also schedules the "time to send" notification here.
    onSave({
      id: existing?.id ?? newId(),
      specialDayId: day.id,
      text: text.trim(),
      tone,
      sendAt: sendAt.toISOString(),
      status: 'scheduled',
    });
    setSending(true);
    setTimeout(
      () => navigation.replace('Success', { name: day.name, sendAt: sendAt.toISOString() }),
      reduceMotion ? 0 : PLANE_MS,
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeader title={`Wish for ${day.name}`} showBack />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.messageCard}>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder={`Write your wish for ${day.name}`}
            placeholderTextColor={colors.greyBlue}
            accessibilityLabel="Your wish"
            style={styles.message}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Suggest a wish" onPress={suggest} style={styles.suggest}>
            <Ionicons name="sparkles-outline" size={18} color={colors.text} />
            <Text style={styles.suggestText}>Suggest a wish</Text>
          </Pressable>
        </View>

        <FieldLabel>Tone</FieldLabel>
        <ChipRow>
          {TONES.map((t) => (
            <Chip key={t} label={TONE_LABELS[t]} selected={tone === t} onPress={() => setTone(t)} />
          ))}
        </ChipRow>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change send time"
          onPress={() => picker.open('datetime', sendAt, setSendAt)}
          style={styles.sendRow}
        >
          <Ionicons name="logo-whatsapp" size={26} color={colors.text} />
          <Text style={styles.sendText}>
            Send on WhatsApp · {formatShortDate(sendAt)} · {formatTime(sendAt)}
          </Text>
          <Feather name="chevron-right" size={22} color={colors.greyBlue} />
        </Pressable>

        <FieldLabel>Preview</FieldLabel>
        <WhatsAppBubble text={text} time={formatTime(sendAt)} name={day.name} />
      </ScrollView>

      <View style={styles.footer}>
        <BounceButton title="Schedule Wish" disabled={!text.trim() || sending} onPress={schedule} />
      </View>

      {sending && (
        <View style={styles.overlay} accessibilityLabel="Scheduling your wish">
          <AppLottie source={require('../../assets/animations/autowish_schedule_plane.json')} style={styles.plane} />
        </View>
      )}
      {picker.sheet}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: screenPadding + spacing.xs },
  content: { padding: screenPadding + spacing.xs, paddingTop: spacing.xs, gap: spacing.sm },
  messageCard: { backgroundColor: colors.surface, borderRadius: radius.cardLarge, padding: spacing.lg, gap: spacing.sm },
  message: { ...type.body, fontSize: 17, lineHeight: 24, minHeight: 96, textAlignVertical: 'top' },
  suggest: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkLight,
  },
  suggestText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.md, color: colors.text },
  sendRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sendText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.text },
  footer: { paddingHorizontal: screenPadding + spacing.xs, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plane: { width: 260, height: 260 },
});
