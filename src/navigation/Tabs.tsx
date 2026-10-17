import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WishesScreen from '../screens/WishesScreen';
import { onNotificationTap } from '../services/notificationTaps';
import { useApp } from '../state/AppContext';
import { useSendWish } from '../state/useSendWish';
import { colors, fonts, fontSizes, radius, spacing } from '../theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

// Height of the icons + labels area, not counting the phone's own bottom bar.
const BAR_HEIGHT = 64;

const ICONS: Record<keyof TabParamList, keyof typeof Feather.glyphMap> = {
  Home: 'home',
  Wishes: 'message-square',
  Settings: 'settings',
};

/**
 * What happens when a notification is tapped:
 * a reminder opens the reminder pop-up, a "time to send" opens WhatsApp with the wish.
 */
function useNotificationTaps() {
  const navigation = useNavigation();
  const { wishes } = useApp();
  const sendWish = useSendWish();

  // Always use the latest wishes, without re-subscribing on every change.
  const handle = useRef<Parameters<typeof onNotificationTap>[0]>(() => {});
  useEffect(() => {
    handle.current = (data) => {
      if (data.kind === 'reminder') {
        navigation.navigate('Reminder', { specialDayId: data.specialDayId });
        return;
      }
      const wish = wishes.find((w) => w.id === data.wishId);
      if (wish) sendWish(wish);
    };
  });

  useEffect(() => onNotificationTap((data) => handle.current(data)), []);
}

export function Tabs() {
  useNotificationTaps();

  // Space taken by the phone's own bottom bar (Android buttons or the iPhone home line),
  // so our tabs sit above it and can be tapped.
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // As in the designs: the active tab is dark navy, the others soft grey-blue.
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          height: BAR_HEIGHT + insets.bottom,
          paddingTop: spacing.xs,
          paddingBottom: insets.bottom + spacing.xs,
          shadowColor: colors.text,
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs + 1 },
        tabBarIcon: ({ color, size }) => <Feather name={ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Wishes" component={WishesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
