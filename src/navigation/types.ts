import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// The three tabs at the bottom of the main screens.
export type TabParamList = {
  Home: undefined;
  Wishes: undefined;
  Settings: undefined;
};

// Every screen in the app, and what information each one needs when opened.
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  // "Welcome to AutoWish": after onboarding, and whenever logged out.
  // preview = just look at the screen (the __DEV__ row in Settings), stay logged in.
  Login: { preview?: boolean } | undefined;
  EmailCode: { email: string; flow: 'signIn' | 'signUp' }; // the 6-digit code from the email
  AboutYou: { editing?: boolean } | undefined; // editing = opened from Home/Settings, not during setup
  Permissions: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  // no id = add, id = edit. prefill = name and number taken from a contact.
  AddSpecialDay: { specialDayId?: string; prefill?: { name: string; phone: string } } | undefined;
  Person: { specialDayId: string }; // one person's page: their day, wish, reminder and past wishes
  Reminder: { specialDayId: string };
  WriteWish: { specialDayId: string; wishId?: string }; // wishId = edit an existing wish
  Success: { name: string; sendAt: string }; // sendAt as an ISO date-time
  SendConfirm: { wishId: string; failed?: boolean }; // failed = WhatsApp couldn't open
  AutoSendSetup: undefined;
  MyGift: undefined;
  ConfettiGame: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

// Lets useNavigation() know every screen name, so typos are caught early.
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
