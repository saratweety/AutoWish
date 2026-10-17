import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AboutYouScreen from '../screens/AboutYouScreen';
import AddSpecialDayScreen from '../screens/AddSpecialDayScreen';
import AutoSendSetupScreen from '../screens/AutoSendSetupScreen';
import ImportContactsScreen from '../screens/ImportContactsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import ReminderScreen from '../screens/ReminderScreen';
import SendConfirmScreen from '../screens/SendConfirmScreen';
import SplashScreen from '../screens/SplashScreen';
import SuccessScreen from '../screens/SuccessScreen';
import WriteWishScreen from '../screens/WriteWishScreen';
import { colors } from '../theme';
import { Tabs } from './Tabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Brand colours for React Navigation's built-in pieces (screen background, borders).
const theme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.orange,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.outline,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="AboutYou" component={AboutYouScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="Main" component={Tabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="AddSpecialDay" component={AddSpecialDayScreen} />
        <Stack.Screen name="WriteWish" component={WriteWishScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="ImportContacts" component={ImportContactsScreen} />
        <Stack.Screen name="AutoSendSetup" component={AutoSendSetupScreen} />
        {/* See-through screen: the bottom sheet draws its own dark backdrop and slide-up motion. */}
        <Stack.Screen
          name="Reminder"
          component={ReminderScreen}
          options={{ presentation: 'transparentModal', animation: 'none' }}
        />
        <Stack.Screen
          name="SendConfirm"
          component={SendConfirmScreen}
          options={{ presentation: 'transparentModal', animation: 'none' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
