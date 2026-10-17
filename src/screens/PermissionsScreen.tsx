import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BounceButton } from '../components/BounceButton';
import type { RootScreenProps } from '../navigation/types';
import {
  contactsAllowed,
  notificationsAllowed,
  notificationsAvailable,
  requestContacts,
  requestNotifications,
} from '../services/permissions';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, type } from '../theme';

type CardProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  allowed: boolean;
  onAllow: () => void;
};

function PermissionCard({ icon, title, subtitle, allowed, onAllow }: CardProps) {
  return (
    <View style={styles.card}>
      <Feather name={icon} size={30} color={colors.text} />
      <View style={styles.cardText}>
        <Text style={type.h3}>{title}</Text>
        <Text style={type.bodyMuted}>{subtitle}</Text>
      </View>
      {allowed ? (
        <View style={styles.allowed} accessibilityLabel={`${title} allowed`}>
          <Feather name="check-circle" size={20} color={colors.blue} />
          <Text style={styles.allowedText}>Allowed</Text>
        </View>
      ) : (
        <BounceButton title="Allow" size="small" onPress={onAllow} accessibilityLabel={`Allow ${title}`} />
      )}
    </View>
  );
}

export default function PermissionsScreen({ navigation }: RootScreenProps<'Permissions'>) {
  const [notifications, setNotifications] = useState(false);
  const [contacts, setContacts] = useState(false);

  // If you already allowed these before, show "Allowed" straight away.
  useEffect(() => {
    notificationsAllowed().then(setNotifications).catch(() => {});
    contactsAllowed().then(setContacts).catch(() => {});
  }, []);

  const { updateSettings, rescheduleNotifications } = useApp();

  // Setup is finished, so next time the app opens it goes straight to Home.
  const goHome = () => {
    updateSettings({ onboardingDone: true });
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={require('../../assets/icon.png')} style={styles.gift} accessibilityIgnoresInvertColors />
        <Text style={styles.title} accessibilityRole="header">
          {"Let's set up AutoWish"}
        </Text>
        <PermissionCard
          icon="bell"
          title="Notifications"
          subtitle="To remind you"
          allowed={notifications}
          onAllow={() =>
            requestNotifications()
              .then((granted) => {
                setNotifications(granted);
                if (granted) rescheduleNotifications();
              })
              .catch(() => {})
          }
        />
        {!notificationsAvailable() && (
          <Text style={styles.note}>
            {"Notifications can't run in Expo Go on Android. We'll set up a test build for them in milestone 6."}
          </Text>
        )}
        <PermissionCard
          icon="users"
          title="Contacts"
          subtitle="To import birthdays"
          allowed={contacts}
          onAllow={() => requestContacts().then(setContacts).catch(() => {})}
        />
      </ScrollView>
      <View style={styles.footer}>
        <BounceButton title="Continue" onPress={goHome} />
        <BounceButton title="I'll do this later" variant="text" onPress={goHome} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: screenPadding + spacing.xs, paddingTop: spacing.xs, gap: spacing.md },
  gift: { width: 96, height: 96, marginLeft: -spacing.md },
  title: { ...type.h1, fontSize: 30, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardText: { flex: 1, gap: 2 },
  allowed: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  allowedText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.blueDark },
  note: { ...type.caption, marginTop: -spacing.xs, paddingHorizontal: spacing.xs },
  footer: { paddingHorizontal: screenPadding + spacing.xs, paddingBottom: spacing.xs, gap: spacing.xxs },
});
