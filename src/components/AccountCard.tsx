import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { syncNow } from '../api/sync';
import { useAccount } from '../auth/AccountProvider';
import { useAccountActions } from '../auth/useAccountActions';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';
import { BounceButton } from './BounceButton';
import { SlideUpSheet } from './SlideUpSheet';
import { SyncStatusLine } from './SyncStatusLine';

/**
 * The account parts of Settings (CLAUDE.md 14.7). Returns three pieces, because the
 * sheets must sit at the top level of the screen to cover all of it:
 * - card: top of Settings. Logged in: initial, email, sync line, "Sync now", "Log out".
 *   Guest: "Sign in to back up your special days".
 * - deleteButton: the red "Delete account" text button for the bottom of Settings.
 * - sheets: "Not saved yet" (logging out while offline) and the delete confirm.
 */
export function useAccountSection() {
  const navigation = useNavigation();
  const { signedIn, email } = useAccount();
  const { logOut, logOutAnyway, deleteAccount } = useAccountActions();
  const [busy, setBusy] = useState<'sync' | 'logout' | 'delete' | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sync = async () => {
    setBusy('sync');
    await syncNow();
    setBusy(null);
  };

  const tryLogOut = async () => {
    setBusy('logout');
    const result = await logOut();
    // 'done' has already moved to the Login screen.
    if (result === 'unsaved') {
      setBusy(null);
      setUnsaved(true);
    }
  };

  const remove = async () => {
    setBusy('delete');
    setDeleteError(null);
    try {
      await deleteAccount(); // moves to the Login screen when done
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setBusy(null);
    }
  };

  const card = signedIn ? (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{email?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.email} numberOfLines={1}>
            {email}
          </Text>
          <SyncStatusLine />
        </View>
      </View>
      <View style={styles.buttons}>
        <BounceButton
          title={busy === 'sync' ? 'Syncing…' : 'Sync now'}
          variant="secondary"
          size="small"
          onPress={sync}
          disabled={busy !== null}
          style={styles.flex}
        />
        <BounceButton
          title={busy === 'logout' ? 'Logging out…' : 'Log out'}
          variant="text"
          size="small"
          onPress={tryLogOut}
          disabled={busy !== null}
        />
      </View>
    </View>
  ) : (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.avatar, styles.avatarGuest]}>
          <Feather name="cloud" size={24} color={colors.text} />
        </View>
        <View style={styles.flex}>
          <Text style={type.h3}>Sign in to back up your special days</Text>
          <Text style={styles.muted}>So they come back on a new phone.</Text>
        </View>
      </View>
      <BounceButton title="Sign in" size="small" onPress={() => navigation.navigate('Login')} />
    </View>
  );

  const deleteButton = signedIn ? (
    <BounceButton title="Delete account" variant="danger" onPress={() => setConfirmDelete(true)} style={styles.deleteButton} />
  ) : null;

  const sheets = (
    <>
      <SlideUpSheet visible={unsaved} onClose={() => setUnsaved(false)}>
        <View style={styles.sheet}>
          <Text style={[type.h2, styles.center]}>Not saved yet</Text>
          <Text style={[type.bodyMuted, styles.center]}>
            {"Some changes aren't saved to your account yet. Connect to the internet and try again, or log out anyway and lose them."}
          </Text>
          <BounceButton
            title="Try again"
            onPress={() => {
              setUnsaved(false);
              tryLogOut();
            }}
          />
          <BounceButton
            title="Log out anyway"
            variant="text"
            onPress={() => {
              setUnsaved(false);
              logOutAnyway();
            }}
          />
        </View>
      </SlideUpSheet>

      <SlideUpSheet visible={confirmDelete} onClose={() => busy !== 'delete' && setConfirmDelete(false)}>
        <View style={styles.sheet}>
          <Text style={[type.h2, styles.center]}>Delete your account?</Text>
          <Text style={[type.bodyMuted, styles.center]}>
            {"This deletes your account and all your special days and wishes from our server. This can't be undone."}
          </Text>
          {deleteError && <Text style={styles.error}>{deleteError}</Text>}
          <BounceButton
            title={busy === 'delete' ? 'Deleting…' : 'Delete my account'}
            onPress={remove}
            disabled={busy === 'delete'}
            style={styles.danger}
          />
          <BounceButton title="Keep my account" variant="text" onPress={() => setConfirmDelete(false)} disabled={busy === 'delete'} />
        </View>
      </SlideUpSheet>
    </>
  );

  return { card, deleteButton, sheets };
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.cardLarge, padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, gap: spacing.xxs },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.pinkLight,
    borderWidth: 2,
    borderColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGuest: { backgroundColor: colors.blueMist, borderColor: colors.blueLight },
  initial: { fontFamily: fonts.heading, fontSize: fontSizes.xl, color: colors.text },
  email: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.text },
  muted: { ...type.bodyMuted, fontSize: fontSizes.sm },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sheet: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.md },
  center: { textAlign: 'center' },
  danger: { backgroundColor: colors.danger },
  error: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral, textAlign: 'center' },
  deleteButton: { alignSelf: 'center' },
});
