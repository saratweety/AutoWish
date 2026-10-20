import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountCard } from '../components/AccountCard';
import { BounceButton } from '../components/BounceButton';
import { useCalendarSheet } from '../components/CalendarSheet';
import { datePartsForCalendar, DateFields, readDateParts, toDateParts } from '../components/DateFields';
import { useCountryCodeField } from '../components/CountryCodeField';
import { FieldBox, FieldLabel, fieldStyles, TextField } from '../components/Field';
import { DressedGift } from '../components/GiftArt';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootScreenProps } from '../navigation/types';
import { dialOf, splitNumber } from '../data/countries';
import { cleanLocalNumber } from '../services/phone';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, formPadding, radius, spacing, type } from '../theme';

/** The user's own details: shown after onboarding, and again from the profile circle on Home. */
export default function AboutYouScreen({ navigation, route }: RootScreenProps<'AboutYou'>) {
  const editing = Boolean(route.params?.editing);
  const { settings, updateSettings, gift } = useApp();

  const [photoUri, setPhotoUri] = useState(settings.userPhotoUri);
  const [name, setName] = useState(settings.userName ?? '');
  // Split a saved number back into its country and the rest, so the picker shows
  // the right flagless code and the box shows only what they typed.
  const savedPhone = splitNumber(settings.userPhone);
  const [iso, setIso] = useState(settings.userPhone ? savedPhone.iso : (settings.defaultCountry ?? savedPhone.iso));
  const [phone, setPhone] = useState(savedPhone.local);
  const countryCode = dialOf(iso);
  const countryField = useCountryCodeField({ iso, onChange: setIso });
  const [birthday, setBirthday] = useState(toDateParts(settings.userBirthday));
  const [error, setError] = useState<string | null>(null);
  const calendar = useCalendarSheet();
  // Who you're logged in as, and the way out. Only on the profile, not during setup.
  const account = useAccountCard();

  const pickBirthday = () =>
    calendar.open({
      title: "When's your birthday?",
      subtitle: 'Pick the day you were born',
      ...datePartsForCalendar(birthday),
      yearOptional: true,
      yearBadge: (n) => `Turns ${n}!`,
      yearLine: (date, n) => `Born ${date} · You turn ${n}`,
      onDone: (pick) => setBirthday({ day: String(pick.day), month: pick.month, year: pick.year ? String(pick.year) : '' }),
    });

  // During setup the next step is Permissions; when editing, go back where we came from.
  const next = () => (editing ? navigation.goBack() : navigation.navigate('Permissions'));

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
    if (!name.trim()) return setError('Please add your name.');
    if (phone && phone.length < 7) return setError('Please check your WhatsApp number, e.g. 300 1234567.');
    // The birthday is optional: only check it once something has been typed.
    const hasBirthday = Boolean(birthday.day || birthday.month || birthday.year);
    const userBirthday = hasBirthday ? readDateParts(birthday) : undefined;
    if (userBirthday && 'error' in userBirthday) return setError(userBirthday.error);
    updateSettings({
      userName: name.trim(),
      userPhone: phone ? countryCode + phone : undefined,
      defaultCountry: iso,
      userPhotoUri: photoUri,
      userBirthday,
    });
    next();
  };

  const initial = name.trim()[0]?.toUpperCase();

  return (
    <SafeAreaView style={styles.screen}>
      {editing && (
        <View style={styles.header}>
          <ScreenHeader title="Your profile" showBack />
        </View>
      )}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!editing && (
          <>
            <Image source={require('../../assets/icon.png')} style={styles.gift} accessibilityIgnoresInvertColors />
            <Text style={styles.title} accessibilityRole="header">
              Tell us about you
            </Text>
            <Text style={styles.subtitle}>So your wishes go out from you</Text>
          </>
        )}

        <Pressable accessibilityRole="button" accessibilityLabel="Add photo" onPress={pickPhoto} style={styles.photoWrap}>
          <View style={styles.photo}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
            ) : initial ? (
              <Text style={styles.initial}>{initial}</Text>
            ) : (
              <Feather name="camera" size={30} color={colors.text} />
            )}
            <View style={styles.photoPlus}>
              <Feather name="plus" size={18} color={colors.text} />
            </View>
          </View>
          <Text style={styles.photoLabel}>{photoUri ? 'Change photo' : 'Add photo'}</Text>
        </Pressable>

        <FieldLabel>Your name</FieldLabel>
        <TextField value={name} onChangeText={setName} placeholder="Ali" autoCapitalize="words" accessibilityLabel="Your name" />

        <FieldLabel>WhatsApp number</FieldLabel>
        <View style={styles.phoneRow}>
          <View style={styles.codeBox}>
            <FieldBox>
              {countryField.field}
            </FieldBox>
          </View>
          <View style={styles.numberBox}>
            <FieldBox>
              <TextInput
                value={phone}
                onChangeText={(t) => setPhone(cleanLocalNumber(t, countryCode).digits)}
                placeholder="300 1234567"
                placeholderTextColor={colors.greyBlue}
                keyboardType="number-pad"
                accessibilityLabel="Your WhatsApp number"
                style={fieldStyles.input}
              />
            </FieldBox>
          </View>
        </View>

        <FieldLabel>Your birthday (optional)</FieldLabel>
        <DateFields value={birthday} onPress={pickBirthday} />

        {/* Dress up your own gift box. Only once the profile exists; during setup there are no stars yet. */}
        {editing && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`My Gift. ${gift.stars} stars. Change your gift box outfit`}
            onPress={() => navigation.navigate('MyGift')}
            style={styles.giftCard}
          >
            <DressedGift equipped={gift.equipped} width={56} height={56} centered />
            <View style={styles.giftText}>
              <Text style={type.h3}>My Gift</Text>
              <Text style={styles.giftMuted}>Change your gift box outfit</Text>
            </View>
            <View style={styles.giftStars}>
              <Ionicons name="star" size={16} color={colors.sparkle} />
              <Text style={styles.giftStarsText}>{gift.stars}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.greyBlue} />
          </Pressable>
        )}

        <View style={styles.note}>
          <Text style={styles.noteText}>We only use your number to send your wishes.</Text>
        </View>

        {editing && <View style={styles.account}>{account.card}</View>}
      </ScrollView>

      <View style={styles.footer}>
        {error && <Text style={styles.error}>{error}</Text>}
        <BounceButton title={editing ? 'Save' : 'Continue'} onPress={save} />
        {!editing && <BounceButton title="Skip for now" variant="text" onPress={next} />}
      </View>
      {calendar.sheet}
      {countryField.sheet}
      {editing && account.sheet}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: formPadding },
  content: { padding: formPadding, paddingTop: spacing.xs, gap: spacing.xs },
  gift: { width: 96, height: 96, marginLeft: -spacing.md },
  title: { ...type.h1, fontSize: 30 },
  subtitle: { ...type.bodyMuted, fontSize: 17, marginBottom: spacing.md },
  photoWrap: { alignSelf: 'center', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  photo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.pinkLight,
    borderWidth: 2,
    borderColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: { width: 80, height: 80, borderRadius: 40 },
  initial: { fontFamily: fonts.heading, fontSize: 34, color: colors.text },
  photoPlus: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.orange,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.textMuted },
  phoneRow: { flexDirection: 'row', gap: spacing.xs },
  codeBox: { width: 110 },
  numberBox: { flex: 1 },
  giftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  giftText: { flex: 1 },
  giftMuted: { ...type.bodyMuted, fontSize: fontSizes.sm },
  giftStars: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  giftStarsText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.text },
  account: { marginTop: spacing.md },
  note: { backgroundColor: colors.blueMist, borderRadius: radius.card, padding: spacing.md, marginTop: spacing.xs },
  noteText: { ...type.body, textAlign: 'center' },
  footer: { paddingHorizontal: formPadding, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  error: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral, textAlign: 'center', marginBottom: spacing.xs },
});
