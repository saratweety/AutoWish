import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BounceButton } from '../components/BounceButton';
import { useDateTimePicker } from '../components/DateTimeSheet';
import { FieldBox, FieldLabel, fieldStyles, TextField } from '../components/Field';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootScreenProps } from '../navigation/types';
import { formatLongDate } from '../services/dates';
import { cleanLocalNumber, DEFAULT_COUNTRY_CODE } from '../services/phone';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, formPadding, radius, spacing, type } from '../theme';

/** The user's own details: shown after onboarding, and again from the profile circle on Home. */
export default function AboutYouScreen({ navigation, route }: RootScreenProps<'AboutYou'>) {
  const editing = Boolean(route.params?.editing);
  const { settings, updateSettings } = useApp();
  const picker = useDateTimePicker();

  const [photoUri, setPhotoUri] = useState(settings.userPhotoUri);
  const [name, setName] = useState(settings.userName ?? '');
  const [phone, setPhone] = useState(settings.userPhone?.replace(new RegExp(`^${DEFAULT_COUNTRY_CODE}`), '') ?? '');
  const [birthday, setBirthday] = useState(settings.userBirthday);
  const [error, setError] = useState<string | null>(null);

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
    updateSettings({
      userName: name.trim(),
      userPhone: phone ? DEFAULT_COUNTRY_CODE + phone : undefined,
      userPhotoUri: photoUri,
      userBirthday: birthday,
    });
    next();
  };

  // The year doesn't matter for a birthday, so any year works for the picker.
  const birthdayDate = birthday ? new Date(2000, birthday.month - 1, birthday.day) : null;
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
              <Text style={styles.code}>+{DEFAULT_COUNTRY_CODE}</Text>
            </FieldBox>
          </View>
          <View style={styles.numberBox}>
            <FieldBox>
              <TextInput
                value={phone}
                onChangeText={(t) => setPhone(cleanLocalNumber(t).digits)}
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose your birthday"
          onPress={() =>
            picker.open('date', birthdayDate ?? new Date(2000, 0, 1), (d) =>
              setBirthday({ month: d.getMonth() + 1, day: d.getDate() }),
            )
          }
        >
          <FieldBox>
            <Text style={[styles.dateText, !birthdayDate && styles.placeholder]}>
              {birthdayDate ? formatLongDate(birthdayDate) : 'DD / MM'}
            </Text>
            <Feather name="calendar" size={22} color={colors.blue} />
          </FieldBox>
        </Pressable>

        <View style={styles.note}>
          <Text style={styles.noteText}>We only use your number to send your wishes.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {error && <Text style={styles.error}>{error}</Text>}
        <BounceButton title={editing ? 'Save' : 'Continue'} onPress={save} />
        {!editing && <BounceButton title="Skip for now" variant="text" onPress={next} />}
      </View>
      {picker.sheet}
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
  codeBox: { width: 96 },
  numberBox: { flex: 1 },
  code: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text },
  dateText: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text },
  placeholder: { color: colors.greyBlue },
  note: { backgroundColor: colors.blueMist, borderRadius: radius.card, padding: spacing.md, marginTop: spacing.xs },
  noteText: { ...type.body, textAlign: 'center' },
  footer: { paddingHorizontal: formPadding, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  error: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral, textAlign: 'center', marginBottom: spacing.xs },
});
