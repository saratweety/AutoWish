import { useNavigation } from '@react-navigation/native';
import { useApp } from '../state/AppContext';

/**
 * Where to go once someone has logged in (or chosen "Use without an account").
 * During the first-launch setup: on to "Tell us about you", then Permissions.
 * Otherwise (they had logged out): straight to Home.
 */
export function useAfterLogin() {
  const navigation = useNavigation();
  const { settings } = useApp();

  return () => {
    navigation.reset({ index: 0, routes: [{ name: settings.onboardingDone ? 'Main' : 'AboutYou' }] });
  };
}
