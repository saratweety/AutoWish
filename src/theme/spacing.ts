// Spacing scale: use these for padding, margin and gap.
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

// Side padding for normal screens and for forms.
export const screenPadding = spacing.md;
export const formPadding = spacing.lg;

export const radius = {
  card: 20,
  cardLarge: 24,
  sheet: 28, // top corners of bottom sheets
  pill: 999, // buttons and chips
} as const;

// Minimum touch target size (Apple and Google guidelines).
export const touchTarget = 44;
