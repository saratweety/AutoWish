import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAccount } from '../auth/AccountProvider';
import { useApp } from '../state/AppContext';
import { setSyncUser, syncNow } from './sync';

/**
 * Runs sync at the right moments (CLAUDE.md 14.4). Renders nothing.
 * - Right after login, and on app start: setSyncUser (a new login downloads everything).
 * - When the app comes back to the front.
 * - When the phone comes back online.
 * - 2 seconds after any local change (handled inside sync.ts).
 * - Pull-to-refresh on Home and Wishes calls syncNow() directly.
 */
export function SyncManager() {
  const { loaded, signedIn, userId } = useAccount();
  const { ready } = useApp();
  const active = ready && loaded && signedIn && userId !== null;

  // Login, logout and app start. Waits until the phone's data is loaded,
  // so a guest's records are there to be uploaded.
  useEffect(() => {
    if (!ready || !loaded) return;
    setSyncUser(signedIn ? userId : null);
  }, [ready, loaded, signedIn, userId]);

  // Back to the front.
  useEffect(() => {
    if (!active) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNow();
    });
    return () => subscription.remove();
  }, [active]);

  // Back online after being offline.
  const wasOffline = useRef(false);
  useEffect(() => {
    if (!active) return;
    return NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      if (online && wasOffline.current) syncNow();
      wasOffline.current = !online;
    });
  }, [active]);

  return null;
}
