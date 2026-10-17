import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BounceButton } from '../components/BounceButton';
import { Chip, ChipRow, ChipScrollRow } from '../components/Chip';
import { useCalendarSheet } from '../components/CalendarSheet';
import { datePartsForCalendar, DateFields, emptyDateParts, readDateParts, toDateParts } from '../components/DateFields';
import { useClockSheet } from '../components/ClockSheet';
import { FieldBox, FieldLabel, fieldStyles, TextField } from '../components/Field';
import { ContactPickerSheet } from '../components/ContactPickerSheet';
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
import { formatLongDate, nextOccurrence } from '../services/dates';
import { cleanLocalNumber } from '../services/phone';
import { newId, useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, formPadding, radius, spacing, type } from '../theme';
import type { Occasion, Relationship, RemindDays } from '../types';

/** 1st, 2nd, 3rd, 4th ... 11th, 12th, 13th ... 21st */
function ordinal(n: number) {
  const teens = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teens ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

const OCCASIONS: Occasion[] = ['birthday', 'anniversary', 'mothers_day', 'fathers_day', 'other'];
const COUNTRY_CODE = '92'; // Pakistan. A country code picker comes in the polish milestone.

export default function AddSpecialDayScreen({ navigation, route }: RootScreenProps<'AddSpecialDay'>) {
  const { specialDays, settings, saveDay, deleteDay } = useApp();
  const existing = specialDays.find((d) => d.id === route.params?.specialDayId);
  const isEdit = Boolean(existing);
  const clock = useClockSheet();
  const calendar = useCalendarSheet();

  const [photoUri, setPhotoUri] = useState(existing?.photoUri);
  const [name, setName] = useState(existing?.name ?? '');
  // The number as typed, without the country code.
  const [phone, setPhone] = useState(existing?.phone.replace(new RegExp(`^${COUNTRY_CODE}`), '') ?? '');
  const [occasion, setOccasion] = useState<Occasion>(existing?.occasion ?? 'birthday');
  const [customOccasion, setCustomOccasion] = useState(existing?.customOccasion ?? '');
  const [date, setDate] = useState(existing ? toDateParts(existing) : emptyDateParts);
  const [relationship, setRelationship] = useState<Relationship>(existing?.relationship ?? 'friend');
  const [remind, setRemind] = useState<RemindDays>(existing?.remindDaysBefore ?? settings.defaultRemindDaysBefore);
  // undefined = use the default reminder time from Settings.
  const [reminderTime, setReminderTime] = useState<string | undefined>(existing?.reminderTime);
  const [codeRemoved, setCodeRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickingContact, setPickingContact] = useState(false);
  // True right after a contact's number was filled in, until the number is edited.
  const [fromContacts, setFromContacts] = useState(false);

  const pickContact = ({ name: contactName, phone: full }: { name: string; phone: string }) => {
    // The field shows +92 on its own, so only the rest of the number goes in.
    setPhone(full.startsWith(COUNTRY_CODE) ? full.slice(COUNTRY_CODE.length) : full);
    if (!name.trim()) setName(contactName);
    setFromContacts(true);
    setCodeRemoved(false);
    setError(full.startsWith(COUNTRY_CODE) ? null : `This number doesn't start with +${COUNTRY_CODE}. Please check it.`);
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  // Mother's Day and Father's Day fall on a different date each year, so we work it out.
  const autoDate = occasion === 'mothers_day' || occasion === 'fathers_day';
  const autoDateValue = nextOccurrence({ occasion, month: 1, day: 1 });

  /** What the year means for this occasion: "Turns 30!" for a birthday, "30th anniversary" for an anniversary. */
  const yearWords = () => {
    const who = name.trim();
    if (occasion === 'birthday') {
      return {
        yearBadge: (n: number) => `Turns ${n}!`,
        yearLine: (date: string, n: number) => `Born ${date} · ${who ? `${who} turns` : 'Turns'} ${n}`,
      };
    }
    if (occasion === 'anniversary') {
      return {
        yearBadge: (n: number) => `${ordinal(n)} year!`,
        yearLine: (date: string, n: number) => `Married ${date} · ${ordinal(n)} anniversary`,
      };
    }
    return {};
  };

  // One sheet for the date and whether the year is known. The send time has its own row below.
  const pickDate = () =>
    calendar.open({
      title: "When's the big day?",
      subtitle: 'Pick the date',
      ...datePartsForCalendar(date),
      yearOptional: true,
      skipDayId: existing?.id,
      ...yearWords(),
      onDone: (pick) => {
        setDate({ day: String(pick.day), month: pick.month, year: pick.year ? String(pick.year) : '' });
      },
    });

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
    // Mother's and Father's Day work out their own date, so the typed one isn't needed.
    const picked = autoDate
      ? { day: autoDateValue.getDate(), month: autoDateValue.getMonth() + 1, year: undefined }
      : readDateParts(date);
    if ('error' in picked) return setError(picked.error);

    saveDay({
      id: existing?.id ?? newId(),
      name: name.trim(),
      phone: COUNTRY_CODE + localNumber,
      occasion,
      customOccasion: occasion === 'other' ? customOccasion.trim() : undefined,
      month: picked.month,
      day: picked.day,
      year: picked.year,
      relationship,
      photoUri,
      remindDaysBefore: remind,
      reminderTime,
      // No send time row here any more: keep one saved earlier, else wishes use the default from Settings.
      sendTime: existing?.sendTime,
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
        <TextField value={name} onChangeText={setName} placeholder="Person name" autoCapitalize="words" accessibilityLabel="Name" />

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
              setFromContacts(false);
              if (removedCode) setCodeRemoved(true);
            }}
            placeholder="300 1234567"
            placeholderTextColor={colors.greyBlue}
            keyboardType="number-pad"
            accessibilityLabel="WhatsApp number"
            style={fieldStyles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pick from contacts"
            onPress={() => setPickingContact(true)}
            hitSlop={4}
            style={styles.contactButton}
          >
            <Ionicons name="person-add-outline" size={20} color={colors.text} />
          </Pressable>
        </FieldBox>
        {fromContacts ? (
          <View style={styles.contactTag}>
            <Feather name="check" size={14} color={colors.blueDark} />
            <Text style={styles.contactTagText}>Number added from contacts</Text>
          </View>
        ) : codeRemoved ? (
          <Text style={type.caption}>{`We removed the +${COUNTRY_CODE} for you, it's already added.`}</Text>
        ) : (
          <Text style={type.caption}>Type it, or tap the contact button to pick from your phone.</Text>
        )}

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
        {autoDate ? (
          <>
            <FieldBox>
              <Text style={styles.dateText}>{formatLongDate(autoDateValue)}</Text>
              <Feather name="calendar" size={24} color={colors.blue} />
            </FieldBox>
            <Text style={type.caption}>Set automatically each year</Text>
          </>
        ) : (
          <DateFields value={date} onPress={pickDate} />
        )}

        <FieldLabel>Relationship</FieldLabel>
        <ChipScrollRow edge={formPadding}>
          {RELATIONSHIPS.map((r) => (
            <Chip key={r} label={RELATIONSHIP_LABELS[r]} selected={relationship === r} onPress={() => setRelationship(r)} />
          ))}
        </ChipScrollRow>

        <FieldLabel>Remind me</FieldLabel>
        <ChipScrollRow edge={formPadding}>
          {REMIND_CHOICES.map((r) => (
            <Chip key={r} compact label={REMIND_LABELS[r]} selected={remind === r} onPress={() => setRemind(r)} />
          ))}
        </ChipScrollRow>
        <TimeField
          icon="clock"
          label="Reminder time"
          value={reminderTime}
          defaultValue={settings.reminderTimeOfDay}
          onPress={() => clock.open({ title: "We'll remind you at", value: reminderTime ?? settings.reminderTimeOfDay, onDone: setReminderTime })}
          onReset={() => setReminderTime(undefined)}
        />

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
      {clock.sheet}
      <ContactPickerSheet visible={pickingContact} onClose={() => setPickingContact(false)} onPick={pickContact} />
      {calendar.sheet}
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
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: -spacing.xs,
    backgroundColor: colors.blueMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.blueMist,
  },
  contactTagText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.blueDark },
  dateText: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text },
  footer: { paddingHorizontal: formPadding, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  error: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral, textAlign: 'center', marginBottom: spacing.xs },
  sheet: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.md },
  center: { textAlign: 'center' },
  danger: { backgroundColor: colors.danger },
});
