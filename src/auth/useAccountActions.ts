import { useNavigation } from '@react-navigation/native';
import { api } from '../api/client';
import { forgetAccount, pendingChanges, syncNow } from '../api/sync';
import { useApp } from '../state/AppContext';
import { useAccount } from './AccountProvider';

/** Log out and Delete account, exactly as in CLAUDE.md 14.5. */
export function useAccountActions() {
  const navigation = useNavigation();
  const { signOut } = useAccount();
  const { clearAccountData } = useApp();

  /** Removes the account from this phone and goes to the Login screen. */
  const leave = async () => {
    // Stop syncing first, so nothing is written back while we clear.
    // This also forgets the outbox and lastSyncedAt.
    await forgetAccount();
    // Cancels ALL notifications (a logged-out phone must never remind),
    // then clears special days, wishes, settings and gift state.
    await clearAccountData();
    await signOut().catch(() => {});
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  /**
   * Step 1-2: save what's left. Returns 'unsaved' if some changes couldn't reach the
   * account (offline), so the screen can ask "Try again" / "Log out anyway".
   */
  const logOut = async (): Promise<'done' | 'unsaved'> => {
    await syncNow();
    if ((await pendingChanges()) > 0) return 'unsaved';
    await leave();
    return 'done';
  };

  /** Deletes the account and all its data on the server, then leaves. Throws an ApiError if it fails. */
  const deleteAccount = async () => {
    await api('/me', { method: 'DELETE', timeoutMs: 30_000 });
    await leave();
  };

  return { logOut, logOutAnyway: leave, deleteAccount };
}
