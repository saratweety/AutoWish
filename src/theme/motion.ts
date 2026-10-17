import { Easing } from 'react-native-reanimated';

// One set of motion rules for the whole app.
// outBack is the same curve used inside every AutoWish Lottie animation
// (splash, reminder, success...), so code animations feel identical to them.

export const easings = {
  outBack: Easing.bezier(0.34, 1.56, 0.64, 1), // soft overshoot, the AutoWish "bounce"
  out: Easing.bezier(0.2, 0.8, 0.4, 1), // quick, gentle stop
  inOut: Easing.bezier(0.33, 0, 0.67, 1),
};

export const motion = {
  // cards sliding in one after another
  stagger: 100, // ms between cards (0.1 s)
  maxStaggered: 8, // cards after this appear together, so long lists don't wait
  cardEnter: { duration: 450, distance: 24 },

  // button press
  press: {
    scale: 0.95,
    down: { damping: 15, stiffness: 400, mass: 0.6 },
    up: { damping: 8, stiffness: 300, mass: 0.6 }, // springs back with a tiny bounce
  },

  // bottom sheets (reminder pop-up)
  sheet: { damping: 16, stiffness: 160, mass: 0.9 },
};
