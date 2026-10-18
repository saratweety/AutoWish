import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setTokenGetter } from '../api/client';
import { storage } from '../storage';

// Login is done by Clerk (email code or Google). The publishable key is public
// and lives in autowish/.env as EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

/** False until the Clerk key is added to .env. The app then works as guest only. */
export const loginConfigured = PUBLISHABLE_KEY.length > 0;

type Account = {
  /** False until we know whether someone is logged in. */
  loaded: boolean;
  signedIn: boolean;
  userId: string | null;
  email: string | null;
  /** Chose "Use without an account" (and isn't logged in). */
  guest: boolean;
  setGuest: (guest: boolean) => Promise<void>;
  /** Clerk sign out. Clearing the phone's data is done by the caller (see useLogout). */
  signOut: () => Promise<void>;
};

const AccountContext = createContext<Account | null>(null);

/** Remembers "Use without an account" on this phone. */
function useGuestFlag() {
  const [guest, setGuestState] = useState<boolean | null>(null);
  useEffect(() => {
    storage.loadGuest().then(setGuestState);
  }, []);
  const setGuest = async (value: boolean) => {
    setGuestState(value);
    await storage.saveGuest(value);
  };
  return { guest, setGuest };
}

/** Reads Clerk's login state and shares it with the rest of the app. */
function ClerkBridge({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const { user } = useUser();
  const { guest, setGuest } = useGuestFlag();

  // Every server request asks Clerk for a fresh, short-lived token.
  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  const value = useMemo<Account>(
    () => ({
      loaded: Boolean(isLoaded) && guest !== null,
      signedIn: Boolean(isSignedIn),
      userId: userId ?? null,
      email: user?.primaryEmailAddress?.emailAddress ?? null,
      guest: Boolean(guest) && !isSignedIn,
      setGuest,
      signOut: () => signOut(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoaded, isSignedIn, userId, user, guest, signOut],
  );
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

/** Used while the Clerk key isn't set: nobody can log in, guest mode works as before. */
function NoLogin({ children }: { children: React.ReactNode }) {
  const { guest, setGuest } = useGuestFlag();
  const value = useMemo<Account>(
    () => ({
      loaded: guest !== null,
      signedIn: false,
      userId: null,
      email: null,
      guest: Boolean(guest),
      setGuest,
      signOut: async () => {},
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guest],
  );
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

/**
 * Wraps the app with Clerk. The login token is kept in the phone's secure,
 * encrypted storage (expo-secure-store), so people stay logged in.
 */
export function AccountProvider({ children }: { children: React.ReactNode }) {
  if (!loginConfigured) return <NoLogin>{children}</NoLogin>;
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkBridge>{children}</ClerkBridge>
    </ClerkProvider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside <AccountProvider>');
  return ctx;
}
