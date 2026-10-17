import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';
import { Logo } from './Logo';

/** Logo bar and "Hi Ali" greeting, shared by both versions of Home. */
export function HomeHeader() {
  const navigation = useNavigation();
  const { settings, gift } = useApp();
  const firstName = settings.userName?.trim().split(/\s+/)[0];

  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <Logo size={44} />
        <View style={styles.right}>
          {/* Stars from the daily game; tap to dress up your gift. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${gift.stars} stars. Open My Gift`}
            onPress={() => navigation.navigate('MyGift')}
            style={styles.stars}
          >
            <Ionicons name="star" size={18} color={colors.sparkle} />
            <Text style={styles.starsText}>{gift.stars}</Text>
          </Pressable>
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
      </View>
      <Text style={type.h1}>{firstName ? `Hi ${firstName}` : 'Hi there'}</Text>
      <Text style={type.bodyMuted}>Never miss a special day</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: 44,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  starsText: { fontFamily: fonts.heading, fontSize: fontSizes.lg, color: colors.text },
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
