// AutoWish brand palette. Use these everywhere instead of typing hex codes,
// so screens, Lottie animations and components always match.

export const colors = {
  // backgrounds
  background: '#F6F5F2', // warm off-white, app background
  surface: '#FFFFFF', // cards, sheets
  surfaceMuted: '#EFEEEC',

  // text
  text: '#2F3550', // dark navy, main text
  textMuted: '#5D6585', // secondary text

  // brand
  pink: '#FFB4B4', // lid, Today card
  pinkLight: '#FDE3E4', // glows, soft fills
  pinkPale: '#FEF1F1', // the lightest pink, behind the big gift so the whole box stands out
  coral: '#F9A39C', // gift box
  heart: '#EF7A70', // heart, success circle
  wordmarkCoral: '#E0645A', // "Wish" in the wordmark
  blue: '#789BD9', // knot, Sent tick, selected chips
  blueDark: '#4A68A8', // "Sent" label text
  blueLight: '#A9C1E6', // ribbon, trails, z's
  blueMist: '#DAE3EA', // chips, Scheduled pill
  greyBlue: '#A0AFCC',
  orange: '#FFA618', // main buttons and countdowns
  orangeGlow: 'rgba(255,166,24,0.45)', // soft glow around the picked day
  yellow: '#FFD961', // highlights, Today chip
  sparkle: '#F2C94C',
  outline: '#E6DFD3', // soft borders

  // status
  danger: '#E5736B', // Failed / Not sent (soft red)

  // overlays
  scrim: 'rgba(47,53,80,0.35)', // dark navy at 35%, behind bottom sheets
} as const;

export type ColorName = keyof typeof colors;
