import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { colors, fonts, spacing, type } from '../theme';
import { Logo } from './Logo';

/** Logo bar and "Hi Ali" greeting, shared by both versions of Home. */
export function HomeHeader() {
  const navigation = useNavigation();
  const { settings } = useApp();
  const firstName = settings.userName?.trim().split(/\s+/)[0];

  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <Logo size={44} />
        {/* Your photo or initial; tap to edit your profile. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Your profile"
          onPress={() => navigation.navigate('AboutYou', { editing: true })}
          style={styles.profile}
        >
          {settings.userPhotoUri ? (
            <Image source={{ uri: settings.userPhotoUri }} style={styles.photo} />
          ) : firstName ? (
            <Text style={styles.initial}>{firstName[0].toUpperCase()}</Text>
          ) : (
            <Feather name="user" size={22} color={colors.text} />
          )}
        </Pressable>
      </View>
      <Text style={type.h1}>{firstName ? `Hi ${firstName}` : 'Hi there'}</Text>
      <Text style={type.bodyMuted}>Never miss a special day</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  profile: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blueLight,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: 48, height: 48 },
  initial: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
});
