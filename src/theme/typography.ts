import {
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { TextStyle } from 'react-native';
import { colors } from './colors';

// Passed to useFonts() in App.tsx so every font is ready before the app shows.
export const fontAssets = {
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
};

// Fredoka for headings, the app name and big numbers. Nunito for everything else.
export const fonts = {
  headingSemiBold: 'Fredoka_600SemiBold',
  heading: 'Fredoka_700Bold',
  body: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyExtraBold: 'Nunito_800ExtraBold',
} as const;

export const fontSizes = {
  xxl: 28,
  xl: 22,
  lg: 18,
  md: 16, // body
  sm: 14,
  xs: 12,
} as const;

// Ready-made text styles. Spread them into a StyleSheet: { ...type.h1, marginBottom: 8 }
export const type = {
  h1: { fontFamily: fonts.heading, fontSize: fontSizes.xxl, color: colors.text },
  h2: { fontFamily: fonts.heading, fontSize: fontSizes.xl, color: colors.text },
  h3: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.lg, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.text },
  bodyMuted: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.textMuted },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.text },
  caption: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  button: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.md, color: colors.text },
} satisfies Record<string, TextStyle>;
