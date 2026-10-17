import type { Tone } from '../types';

// A starter set of wishes. {name} and {occasion} are filled in for you.
// Milestone 5 grows this into 5+ wishes for every occasion and tone.
export const WISH_TEMPLATES: Record<Tone, string[]> = {
  funny: [
    'Happy {occasion} {name}! Wishing you a year full of laughter, good health and big wins. Have the best day!',
    "Happy {occasion} {name}! Don't count the candles, just enjoy the cake.",
    "Happy {occasion} {name}! You're not getting older, you're getting more legendary.",
  ],
  emotional: [
    'Happy {occasion} {name}. I feel lucky to have you in my life. Wishing you all the happiness you give others.',
    'Happy {occasion} {name}! Thank you for always being there. Today is all about you.',
    'Happy {occasion} {name}. May this year bring you peace, love and everything your heart wants.',
  ],
  formal: [
    'Happy {occasion} {name}. Wishing you a wonderful day and a successful year ahead.',
    'Warm wishes on your {occasion}, {name}. May the year ahead bring you health and success.',
    'Happy {occasion} {name}. Best wishes for a great day with your loved ones.',
  ],
  urdu: [
    'Saalgirah mubarak ho, {name}! Allah aap ko hamesha khush rakhe.',
    '{name}, aap ko dher saari mubarakbaad! Aap ka din bohat khaas ho.',
    'Bohat bohat mubarak ho, {name}! Har khushi aap ke naseeb mein ho.',
  ],
};

export function fillTemplate(template: string, name: string, occasion: string) {
  return template.replaceAll('{name}', name).replaceAll('{occasion}', occasion);
}
