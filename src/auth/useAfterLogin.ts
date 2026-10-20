import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { localSnapshot, whenAccountReady } from '../api/sync';
import { notificationsAllowed } from '../services/permissions';
import { useApp } from '../state/AppContext';

/**
 * Where to go once someone has logged in, CLAUDE.md 14.5.
 *
 * Logged in during the first-launch setup: we wait for the account's data to download
 * ("Getting your special days…"), so a returning user isn't asked for their name again.
 * Then "Tell us about you" (only if we don't know their name yet), then Permissions.
 *
 * Logged in again after logging out: straight to Home, which shows the loading state
 * while the data downloads. On a phone where notifications aren't allowed yet,
 * the Permissions screen comes first.
 */
export function useAfterLogin() {
  const navigation = useNavigation();
  const { settings } = useApp();
  const [gettingReady, setGettingReady] = useState(false);

  const afterLogin = async () => {
    const allowed = await notificationsAllowed().catch(() => false);
    if (settings.onboardingDone) {
      navigation.reset({ index: 0, routes: [{ name: allowed ? 'Main' : 'Permissions' }] });
      return;
    }
    setGettingReady(true);
    await whenAccountReady();
    setGettingReady(false);
    const knowsName = Boolean(localSnapshot()?.settings.userName);
    navigation.reset({ index: 0, routes: [{ name: knowsName ? 'Permissions' : 'AboutYou' }] });
  };

  return { afterLogin, gettingReady };
}
