import { useSSO } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLottie } from '../components/AppLottie';
import { BounceButton } from '../components/BounceButton';
import { FieldLabel, TextField } from '../components/Field';
import { GettingReady } from '../components/GettingReady';
import { SlideUpSheet } from '../components/SlideUpSheet';
import { loginConfigured, useAccount } from '../auth/AccountProvider';
import { loginErrorMessage } from '../auth/errors';
import { useAfterLogin } from '../auth/useAfterLogin';
import { useEmailCode } from '../auth/useEmailCode';
import type { RootScreenProps } from '../navigation/types';
import { colors, fonts, fontSizes, screenPadding, spacing, type } from '../theme';

// Closes the Google login browser window when it sends us back to the app.
WebBrowser.maybeCompleteAuthSession();

const NOT_SET_UP = "Login isn't set up yet. You can use AutoWish without an account for now.";

type LayoutProps = {
  busy: boolean;
  error: string | null;
  onGoogle: () => void;
  onEmail: () => void;
  onGuest: () => void;
};

/** "Welcome to AutoWish": the gift, the wordmark and the three ways in. */
function LoginLayout({ busy, error, onGoogle, onEmail, onGuest }: LayoutProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        <AppLottie source={require('../../assets/animations/autowish_splash.json')} loop style={styles.animation} />
        <Text style={styles.wordmark} accessibilityRole="header">
          Auto<Text style={styles.wordmarkWish}>Wish</Text>
        </Text>
        <Text style={styles.title}>Welcome to AutoWish</Text>
        <Text style={styles.text}>Save your special days to your account so you never lose them.</Text>
      </View>
      <View style={styles.bottom}>
        {error && <Text style={styles.error}>{error}</Text>}
        <BounceButton
          title="Continue with Google"
          variant="secondary"
          icon={<Ionicons name="logo-google" size={20} color={colors.text} />}
          onPress={onGoogle}
          disabled={busy}
        />
        <BounceButton title="Continue with email" onPress={onEmail} disabled={busy} />
        <BounceButton title="Use without an account" variant="text" onPress={onGuest} disabled={busy} />
        <Text style={styles.small}>We only use your email to log you in.</Text>
      </View>
    </SafeAreaView>
  );
}

/** Login with Clerk: Google, or a code sent by email. */
function ClerkLogin({ navigation }: RootScreenProps<'Login'>) {
  const { setGuest } = useAccount();
  const { afterLogin, afterGuest, gettingReady } = useAfterLogin();
  const { startSSOFlow } = useSSO();
  const emailCode = useEmailCode();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askingEmail, setAskingEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Android: open the browser faster when Google login is tapped.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    WebBrowser.warmUpAsync().catch(() => {});
    return () => {
      WebBrowser.coolDownAsync().catch(() => {});
    };
  }, []);

  const google = async () => {
    setBusy(true);
    setError(null);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        // Google sends the person back to this address in our app: autowish://sso-callback
        redirectUrl: AuthSession.makeRedirectUri({ scheme: 'autowish', path: 'sso-callback' }),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        afterLogin();
      }
      // No session = the person closed the Google window. Nothing to show.
    } catch (e) {
      setError(loginErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    const address = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(address)) return setEmailError('Please check your email address, e.g. name@gmail.com.');
    setBusy(true);
    setEmailError(null);
    try {
      const flow = await emailCode.sendCode(address);
      setAskingEmail(false);
      navigation.navigate('EmailCode', { email: address, flow });
    } catch (e) {
      setEmailError(loginErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const guest = async () => {
    await setGuest(true);
    afterGuest();
  };

  return (
    // Lifts the email sheet above the keyboard on iPhone (Android does this by itself).
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LoginLayout busy={busy} error={error} onGoogle={google} onEmail={() => setAskingEmail(true)} onGuest={guest} />
      <SlideUpSheet visible={askingEmail} onClose={() => setAskingEmail(false)}>
        <View style={styles.sheet}>
          <Text style={[type.h2, styles.centerText]}>Continue with email</Text>
          <Text style={[type.bodyMuted, styles.centerText]}>{"We'll send you a 6-digit code."}</Text>
          <FieldLabel>Your email</FieldLabel>
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="name@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={sendCode}
            accessibilityLabel="Your email"
          />
          {emailError && <Text style={styles.error}>{emailError}</Text>}
          <BounceButton title={busy ? 'Sending…' : 'Send code'} onPress={sendCode} disabled={busy || !emailCode.ready} />
          <BounceButton title="Cancel" variant="text" onPress={() => setAskingEmail(false)} />
        </View>
      </SlideUpSheet>
      {gettingReady && <GettingReady overlay />}
    </KeyboardAvoidingView>
  );
}

/** Shown while the Clerk key isn't in .env yet: only "Use without an account" works. */
function LoginNotSetUp() {
  const { setGuest } = useAccount();
  const { afterGuest } = useAfterLogin();
  const [error, setError] = useState<string | null>(null);
  return (
    <LoginLayout
      busy={false}
      error={error}
      onGoogle={() => setError(NOT_SET_UP)}
      onEmail={() => setError(NOT_SET_UP)}
      onGuest={async () => {
        await setGuest(true);
        afterGuest();
      }}
    />
  );
}

export default function LoginScreen(props: RootScreenProps<'Login'>) {
  return loginConfigured ? <ClerkLogin {...props} /> : <LoginNotSetUp />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  animation: { width: 180, height: 180 },
  wordmark: { ...type.h1, fontSize: 40, marginTop: -spacing.md },
  wordmarkWish: { color: colors.wordmarkCoral },
  title: { ...type.h2, marginTop: spacing.lg, textAlign: 'center' },
  text: { ...type.bodyMuted, fontSize: 17, lineHeight: 24, textAlign: 'center', marginTop: spacing.xs },
  bottom: { paddingHorizontal: screenPadding + spacing.xs, paddingBottom: spacing.md, gap: spacing.sm },
  small: { ...type.caption, textAlign: 'center' },
  error: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral, textAlign: 'center' },
  sheet: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.md },
  centerText: { textAlign: 'center' },
});
