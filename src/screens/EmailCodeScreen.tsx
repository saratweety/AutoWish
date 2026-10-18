import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginErrorMessage } from '../auth/errors';
import { useAfterLogin } from '../auth/useAfterLogin';
import { useEmailCode } from '../auth/useEmailCode';
import { BounceButton } from '../components/BounceButton';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootScreenProps } from '../navigation/types';
import { colors, fonts, fontSizes, formPadding, radius, spacing, type } from '../theme';

const CODE_LENGTH = 6;
const RESEND_AFTER_S = 30;

/**
 * "Check your email": six code boxes.
 * One hidden text field holds the whole code, so typing moves to the next box by itself,
 * and pasting (or the keyboard's "code from email" suggestion) fills all six at once.
 */
export default function EmailCodeScreen({ route }: RootScreenProps<'EmailCode'>) {
  const { email, flow } = route.params;
  const { verifyCode, resendCode } = useEmailCode();
  const afterLogin = useAfterLogin();
  const input = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [wait, setWait] = useState(RESEND_AFTER_S);

  // Counts down to when "Resend code" can be tapped.
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const check = async (value: string) => {
    if (value.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    try {
      await verifyCode(flow, value);
      afterLogin();
    } catch (e) {
      // "not finished" = the code was right, but Clerk wants more details (see useEmailCode).
      const unfinished = e instanceof Error && e.message.includes('not finished');
      setError(unfinished ? "We couldn't finish logging you in. Please try again, or use Google." : loginErrorMessage(e));
      setCode('');
      input.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const onChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === CODE_LENGTH) check(digits);
  };

  const resend = async () => {
    setWait(RESEND_AFTER_S);
    setError(null);
    try {
      await resendCode(flow);
      setNote(`We sent a new code to ${email}.`);
    } catch (e) {
      setError(loginErrorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <ScreenHeader title="" showBack />
          <Text style={styles.title} accessibilityRole="header">
            Check your email
          </Text>
          <Text style={styles.text}>We sent a 6-digit code to {email}</Text>

          <Pressable
            onPress={() => input.current?.focus()}
            accessibilityRole="button"
            accessibilityLabel={`Code, ${code.length} of ${CODE_LENGTH} digits entered`}
            style={styles.boxes}
          >
            {Array.from({ length: CODE_LENGTH }, (_, i) => (
              <View key={i} style={[styles.box, i === Math.min(code.length, CODE_LENGTH - 1) && styles.boxActive, error && styles.boxError]}>
                <Text style={styles.digit}>{code[i] ?? ''}</Text>
              </View>
            ))}
            <TextInput
              ref={input}
              value={code}
              onChangeText={onChange}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
              maxLength={CODE_LENGTH}
              autoFocus
              caretHidden
              style={styles.hiddenInput}
              accessibilityLabel="6-digit code"
            />
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}
          {note && !error && <Text style={styles.note}>{note}</Text>}
        </View>

        <View style={styles.footer}>
          <BounceButton title={busy ? 'Checking…' : 'Continue'} onPress={() => check(code)} disabled={busy || code.length < CODE_LENGTH} />
          <BounceButton
            title={wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
            variant={wait > 0 ? 'text' : 'link'}
            onPress={resend}
            disabled={wait > 0 || busy}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: formPadding, gap: spacing.xs },
  title: { ...type.h1, fontSize: 30, marginTop: spacing.md },
  text: { ...type.bodyMuted, fontSize: 17, lineHeight: 24 },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  box: {
    width: 48,
    height: 60,
    borderRadius: radius.card - 6,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.blue, borderWidth: 2 },
  boxError: { borderColor: colors.danger },
  digit: { fontFamily: fonts.heading, fontSize: fontSizes.xxl, color: colors.text },
  // Covers the boxes but can't be seen, so a tap anywhere on them opens the keyboard.
  hiddenInput: { ...StyleSheet.absoluteFill, opacity: 0, color: 'transparent' },
  error: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.wordmarkCoral, textAlign: 'center', marginTop: spacing.md },
  note: { ...type.caption, textAlign: 'center', marginTop: spacing.md },
  footer: { paddingHorizontal: formPadding, paddingBottom: spacing.xs, gap: spacing.xxs },
});
