import { useSignIn, useSignUp } from '@clerk/expo/legacy';
import { clerkErrorCode } from './errors';

/** signIn = this email already has an account; signUp = a new account is being made. */
export type EmailFlow = 'signIn' | 'signUp';

/** The id Clerk needs to email a code to this address, from the sign-in's login options. */
function emailCodeId(factors: readonly { strategy: string }[] | null | undefined) {
  for (const f of factors ?? []) {
    if (f.strategy === 'email_code' && 'emailAddressId' in f && typeof f.emailAddressId === 'string') return f.emailAddressId;
  }
  return undefined;
}

/**
 * Login with a 6-digit code sent by email, for new and existing accounts alike.
 * We first try to sign in; if Clerk doesn't know the email yet, we create the account instead.
 */
export function useEmailCode() {
  const signInState = useSignIn();
  const signUpState = useSignUp();

  const sendCode = async (email: string): Promise<EmailFlow> => {
    if (!signInState.isLoaded || !signUpState.isLoaded) throw new Error('Login is still loading');
    try {
      const attempt = await signInState.signIn.create({ identifier: email });
      const emailAddressId = emailCodeId(attempt.supportedFirstFactors);
      if (!emailAddressId) throw new Error('Email code login is turned off in Clerk');
      await signInState.signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId });
      return 'signIn';
    } catch (error) {
      if (clerkErrorCode(error) !== 'form_identifier_not_found') throw error;
      // No account with this email yet: make one.
      await signUpState.signUp.create({ emailAddress: email });
      await signUpState.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      return 'signUp';
    }
  };

  /** Sends a fresh code for the login that's already in progress. */
  const resendCode = async (flow: EmailFlow) => {
    if (!signInState.isLoaded || !signUpState.isLoaded) return;
    if (flow === 'signUp') {
      await signUpState.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      return;
    }
    const emailAddressId = emailCodeId(signInState.signIn.supportedFirstFactors);
    if (emailAddressId) await signInState.signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId });
  };

  /** Checks the code and, if it's right, logs the person in. */
  const verifyCode = async (flow: EmailFlow, code: string) => {
    if (!signInState.isLoaded || !signUpState.isLoaded) throw new Error('Login is still loading');
    if (flow === 'signIn') {
      const result = await signInState.signIn.attemptFirstFactor({ strategy: 'email_code', code });
      if (result.status !== 'complete') throw new Error(`Sign in not finished: ${result.status}`);
      await signInState.setActive({ session: result.createdSessionId });
    } else {
      const result = await signUpState.signUp.attemptEmailAddressVerification({ code });
      if (result.status !== 'complete') throw new Error(`Sign up not finished: ${result.status}`);
      await signUpState.setActive({ session: result.createdSessionId });
    }
  };

  return { ready: signInState.isLoaded && signUpState.isLoaded, sendCode, resendCode, verifyCode };
}
