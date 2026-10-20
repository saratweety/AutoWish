import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAccount } from '../auth/AccountProvider';
import { useAccountActions } from '../auth/useAccountActions';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';
import { BounceButton } from './BounceButton';
import { SlideUpSheet } from './SlideUpSheet';

/**
 * Who you are logged in as, for "Your profile" (CLAUDE.md 14.7): your initial and
 * your email. Saving to the account happens by itself, so there is nothing here to
 * press for it, and "Log out" sits at the bottom of Settings next to "Delete account"
 * (see useLogOut below).
 * Signed out (a session that lapsed): "You're signed out" and a way back in.
 */
export function useAccountCard() {
  const navigation = useNavigation();
  const { signedIn, email } = useAccount();

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
          <Text style={styles.muted}>Your special days are saved here.</Text>
        </View>
      </View>
    </View>
  ) : (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.avatar, styles.avatarGuest]}>
          <Feather name="cloud" size={24} color={colors.text} />
        </View>
        <View style={styles.flex}>
          <Text style={type.h3}>{"You're signed out"}</Text>
          <Text style={styles.muted}>Sign in again to keep your special days saved.</Text>
        </View>
      </View>
      <BounceButton title="Sign in" size="small" onPress={() => navigation.navigate('Login')} />
    </View>
  );

  return card;
}

/**
 * The "Log out" button for the bottom of Settings, just above "Delete account",
 * and the "Not saved yet" sheet it opens when changes still have to upload.
 * Two pieces, because the sheet must sit at the top level of the screen to cover it.
 */
export function useLogOut() {
  const { signedIn } = useAccount();
  const { logOut, logOutAnyway } = useAccountActions();
  const [busy, setBusy] = useState<'logout' | null>(null);
  const [unsaved, setUnsaved] = useState(false);

  const tryLogOut = async () => {
    setBusy('logout');
    const result = await logOut();
    // 'done' has already moved to the Login screen.
    if (result === 'unsaved') {
      setBusy(null);
      setUnsaved(true);
    }
  };

  const button = signedIn ? (
    <BounceButton
      title={busy === 'logout' ? 'Logging out…' : 'Log out'}
      variant="text"
      onPress={tryLogOut}
      disabled={busy !== null}
      style={styles.logOutButton}
    />
  ) : null;

  const sheet = (
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
  );

  return { button, sheet };
}

/**
 * The red "Delete account" button for the bottom of Settings, and the confirm sheet
 * that goes with it. Kept apart from the profile card: it wipes the account for good.
 */
export function useDeleteAccount() {
  const { signedIn } = useAccount();
  const { deleteAccount } = useAccountActions();
  const [busy, setBusy] = useState<'delete' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const button = signedIn ? (
    <BounceButton title="Delete account" variant="danger" onPress={() => setConfirmDelete(true)} style={styles.deleteButton} />
  ) : null;

  const sheet = (
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
  );

  return { button, sheet };
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
  sheet: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.md },
  center: { textAlign: 'center' },
  danger: { backgroundColor: colors.danger },
  error: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral, textAlign: 'center' },
  logOutButton: { alignSelf: 'center' },
  deleteButton: { alignSelf: 'center' },
});
