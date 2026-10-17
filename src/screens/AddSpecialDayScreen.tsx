import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BounceButton } from '../components/BounceButton';
import { Chip, ChipRow, ChipScrollRow } from '../components/Chip';
import { useDateTimePicker } from '../components/DateTimeSheet';
import { FieldBox, FieldLabel, fieldStyles, TextField } from '../components/Field';
import { ScreenHeader } from '../components/ScreenHeader';
import { SlideUpSheet } from '../components/SlideUpSheet';
import { TimeField } from '../components/TimeField';
import {
  OCCASION_LABELS,
  possessiveOccasion,
  RELATIONSHIP_LABELS,
  RELATIONSHIPS,
  REMIND_CHOICES,
  REMIND_LABELS,
} from '../data/labels';
import type { RootScreenProps } from '../navigation/types';
import { formatLongDate, nextOccurrence, withTime } from '../services/dates';
import { cleanLocalNumber } from '../services/phone';
import { newId, useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, formPadding, spacing, type } from '../theme';
import type { Occasion, Relationship, RemindDays } from '../types';

const OCCASIONS: Occasion[] = ['birthday', 'anniversary', 'mothers_day', 'fathers_day', 'other'];
const COUNTRY_CODE = '92'; // Pakistan. A country code picker comes in the polish milestone.

export default function AddSpecialDayScreen({ navigation, route }: RootScreenProps<'AddSpecialDay'>) {
  const { specialDays, settings, saveDay, deleteDay } = useApp();
  const existing = specialDays.find((d) => d.id === route.params?.specialDayId);
  const isEdit = Boolean(existing);
  const picker = useDateTimePicker();

  const [photoUri, setPhotoUri] = useState(existing?.photoUri);
  const [name, setName] = useState(existing?.name ?? '');
  // The number as typed, without the country code.
  const [phone, setPhone] = useState(existing?.phone.replace(new RegExp(`^${COUNTRY_CODE}`), '') ?? '');
  const [occasion, setOccasion] = useState<Occasion>(existing?.occasion ?? 'birthday');
  const [customOccasion, setCustomOccasion] = useState(existing?.customOccasion ?? '');
  const [date, setDate] = useState<Date | null>(existing ? nextOccurrence(existing) : null);
  const [relationship, setRelationship] = useState<Relationship>(existing?.relationship ?? 'friend');
  const [remind, setRemind] = useState<RemindDays>(existing?.remindDaysBefore ?? settings.defaultRemindDaysBefore);
  // undefined = use the default reminder time from Settings.
  const [reminderTime, setReminderTime] = useState<string | undefined>(existing?.reminderTime);
  const [sendTime, setSendTime] = useState<string | undefined>(existing?.sendTime);
  const [codeRemoved, setCodeRemoved] = useState(false);

  /** Opens a time picker and stores the picked time as "HH:mm". */
  const pickTime = (current: string, save: (hhmm: string) => void) =>
    picker.open('time', withTime(new Date(), current), (t) => save(format(t, 'HH:mm')));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Mother's Day and Father's Day fall on a different date each year, so we work it out.
  const autoDate = occasion === 'mothers_day' || occasion === 'fathers_day';
  const shownDate = autoDate ? nextOccurrence({ occasion, month: 1, day: 1 }) : date;

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const save = () => {
    const localNumber = phone;
    if (!name.trim()) return setError('Please add a name.');
    if (localNumber.length < 7) return setError('Please add their WhatsApp number, e.g. 300 1234567.');
    if (occasion === 'other' && !customOccasion.trim()) return setError('Please name the occasion.');
    if (!shownDate) return setError('Please choose a date.');

    saveDay({
      id: existing?.id ?? newId(),
      name: name.trim(),
      phone: COUNTRY_CODE + localNumber,
      occasion,
      customOccasion: occasion === 'other' ? customOccasion.trim() : undefined,
      month: shownDate.getMonth() + 1,
      day: shownDate.getDate(),
      relationship,
      photoUri,
      remindDaysBefore: remind,
      reminderTime,
      sendTime,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    navigation.goBack();
  };

  const remove = () => {
    if (existing) deleteDay(existing.id);
    setConfirmDelete(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeader title={isEdit ? 'Edit Special Day' : 'Add Special Day'} showBack />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" accessibilityLabel="Choose a photo" onPress={pickPhoto} style={styles.photo}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          ) : (
            <Feather name="camera" size={30} color={colors.text} />
          )}
          <View style={styles.photoPlus}>
            <Feather name="plus" size={18} color={colors.text} />
          </View>
        </Pressable>

        <FieldLabel>Name</FieldLabel>
        <TextField value={name} onChangeText={setName} placeholder="Ahmed" autoCapitalize="words" accessibilityLabel="Name" />

        <FieldLabel>WhatsApp number</FieldLabel>
        <FieldBox>
          <Text style={styles.code}>+{COUNTRY_CODE}</Text>
          <View style={styles.divider} />
          <TextInput
            value={phone}
            onChangeText={(t) => {
              // +92 is already shown, so a typed or pasted country code (or leading 0) is removed.
              const { digits, removedCode } = cleanLocalNumber(t, COUNTRY_CODE);
              setPhone(digits);
              if (removedCode) setCodeRemoved(true);
            }}
            placeholder="300 1234567"
            placeholderTextColor={colors.greyBlue}
            keyboardType="number-pad"
            accessibilityLabel="WhatsApp number"
            style={fieldStyles.input}
          />
        </FieldBox>
        {codeRemoved && <Text style={type.caption}>{`We removed the +${COUNTRY_CODE} for you, it's already added.`}</Text>}

        <FieldLabel>Occasion</FieldLabel>
        <ChipRow>
          {OCCASIONS.map((o) => (
            <Chip key={o} label={OCCASION_LABELS[o]} selected={occasion === o} onPress={() => setOccasion(o)} />
          ))}
        </ChipRow>
        {occasion === 'other' && (
          <TextField
            value={customOccasion}
            onChangeText={setCustomOccasion}
            placeholder="e.g. Graduation"
            accessibilityLabel="Occasion name"
          />
        )}

        <FieldLabel>Date</FieldLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose date"
          disabled={autoDate}
          onPress={() => picker.open('date', date ?? new Date(), setDate)}
        >
          <FieldBox>
            <Text style={[styles.dateText, !shownDate && styles.placeholder]}>
              {shownDate ? formatLongDate(shownDate) : 'Choose a date'}
            </Text>
            <Feather name="calendar" size={24} color={colors.blue} />
          </FieldBox>
        </Pressable>
        {autoDate && <Text style={type.caption}>Set automatically each year</Text>}

        <FieldLabel>Relationship</FieldLabel>
        <ChipScrollRow edge={formPadding}>
          {RELATIONSHIPS.map((r) => (
            <Chip key={r} label={RELATIONSHIP_LABELS[r]} selected={relationship === r} onPress={() => setRelationship(r)} />
          ))}
        </ChipScrollRow>

        <FieldLabel>Remind me</FieldLabel>
        <ChipRow>
          {REMIND_CHOICES.map((r) => (
            <Chip key={r} label={REMIND_LABELS[r]} selected={remind === r} onPress={() => setRemind(r)} />
          ))}
        </ChipRow>
        <TimeField
          icon="clock"
          label="Reminder time"
          value={reminderTime}
          defaultValue={settings.reminderTimeOfDay}
          onPress={() => pickTime(reminderTime ?? settings.reminderTimeOfDay, setReminderTime)}
          onReset={() => setReminderTime(undefined)}
        />

        <FieldLabel>Send wish on WhatsApp</FieldLabel>
        <TimeField
          icon="send"
          label="Send time"
          value={sendTime}
          defaultValue={settings.defaultSendTime}
          onPress={() => pickTime(sendTime ?? settings.defaultSendTime, setSendTime)}
          onReset={() => setSendTime(undefined)}
        />
        <Text style={type.caption}>On the day. You can still change it for each wish.</Text>
      </ScrollView>

      <View style={styles.footer}>
        {error && (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}
        <BounceButton title="Save" onPress={save} />
        {isEdit && <BounceButton title="Delete" variant="text" onPress={() => setConfirmDelete(true)} />}
      </View>

      <SlideUpSheet visible={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <View style={styles.sheet}>
          <Text style={[type.h2, styles.center]}>
            {existing ? `Delete ${possessiveOccasion(existing)}?` : 'Delete this day?'}
          </Text>
          <Text style={[type.bodyMuted, styles.center]}>Its reminder and any scheduled wish will be removed.</Text>
          <BounceButton title="Delete" onPress={remove} style={styles.danger} />
          <BounceButton title="Cancel" variant="text" onPress={() => setConfirmDelete(false)} />
        </View>
      </SlideUpSheet>
      {picker.sheet}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: formPadding },
  content: { padding: formPadding, paddingTop: spacing.xs, gap: spacing.xs },
  photo: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: { width: 88, height: 88, borderRadius: 44 },
  photoPlus: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.orange,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text },
  divider: { width: 1, height: 24, backgroundColor: colors.outline },
  dateText: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text },
  placeholder: { color: colors.greyBlue },
  footer: { paddingHorizontal: formPadding, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  error: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral, textAlign: 'center', marginBottom: spacing.xs },
  sheet: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.md },
  center: { textAlign: 'center' },
  danger: { backgroundColor: colors.danger },
});
