import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { setTokenGetter } from '../api/client';

// Login is done by Clerk (email code or Google). The publishable key is public
// and lives in autowish/.env as EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

/** False until the Clerk key is added to .env. Nobody can log in until it is. */
export const loginConfigured = PUBLISHABLE_KEY.length > 0;

type Account = {
  /** False until we know whether someone is logged in. */
  loaded: boolean;
  signedIn: boolean;
  userId: string | null;
  email: string | null;
  /** Clerk sign out. Clearing the phone's data is done by the caller (see useLogout). */
  signOut: () => Promise<void>;
};

const AccountContext = createContext<Account | null>(null);

/** Reads Clerk's login state and shares it with the rest of the app. */
function ClerkBridge({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const { user } = useUser();

  // Every server request asks Clerk for a fresh, short-lived token.
  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  const value = useMemo<Account>(
    () => ({
      loaded: Boolean(isLoaded),
      signedIn: Boolean(isSignedIn),
      userId: userId ?? null,
      email: user?.primaryEmailAddress?.emailAddress ?? null,
      signOut: () => signOut(),
    }),
    [isLoaded, isSignedIn, userId, user, signOut],
  );
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

/** Used while the Clerk key isn't set: the Login screen explains and nobody gets in. */
function NoLogin({ children }: { children: React.ReactNode }) {
  const value = useMemo<Account>(
    () => ({ loaded: true, signedIn: false, userId: null, email: null, signOut: async () => {} }),
    [],
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
