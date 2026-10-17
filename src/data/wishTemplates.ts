import type { Occasion, Tone } from '../types';

// Ready-made wishes for every occasion and tone. {name} and {occasion} are filled in for you.
// "Other" uses the occasion name the user typed (e.g. Graduation, Eid, New job),
// so those wishes are written to fit any occasion.
export const WISH_TEMPLATES: Record<Occasion, Record<Tone, string[]>> = {
  birthday: {
    funny: [
      "Happy birthday {name}! Don't count the candles, just enjoy the cake.",
      "Happy birthday {name}! You're not getting older, you're getting more legendary.",
      'Happy birthday {name}! Another year wiser, or at least another year of pretending. Have the best day!',
      'Happy birthday {name}! Age is just a number, and yours is looking great. Now go eat too much cake.',
      'Happy birthday {name}! I was going to get you something amazing, then I remembered you already have me.',
    ],
    emotional: [
      'Happy birthday {name}. I feel lucky to have you in my life. Wishing you all the happiness you give others.',
      'Happy birthday {name}! Thank you for always being there. Today is all about you.',
      'Happy birthday {name}. May this year bring you peace, love and everything your heart wants.',
      'Happy birthday {name}. The world is brighter with you in it. I hope you feel as loved today as you are.',
      'Happy birthday {name}! So grateful for every memory we share. Here is to many more.',
    ],
    formal: [
      'Happy birthday {name}. Wishing you a wonderful day and a successful year ahead.',
      'Warm wishes on your birthday, {name}. May the year ahead bring you health and success.',
      'Happy birthday {name}. Best wishes for a great day with your loved ones.',
      'Many happy returns of the day, {name}. Wishing you continued success and happiness.',
      'Wishing you a very happy birthday, {name}, and a year full of good health and achievements.',
    ],
    urdu: [
      'Saalgirah mubarak ho, {name}! Allah aap ko hamesha khush rakhe.',
      '{name}, saalgirah ki dher saari mubarakbaad! Aap ka din bohat khaas ho.',
      'Happy birthday {name}! Allah aap ko lambi umar aur achi sehat de.',
      'Saalgirah bohat bohat mubarak ho, {name}! Har khushi aap ke naseeb mein ho.',
      '{name}, janamdin mubarak! Yeh saal aap ke liye khushiyan aur kamyabiyan laaye.',
    ],
  },
  anniversary: {
    funny: [
      'Happy anniversary {name}! Another year of putting up with each other. True love!',
      'Happy anniversary {name}! You two make marriage look easy. Please share the secret.',
      'Happy anniversary {name}! Still together and still smiling. That deserves cake.',
      'Happy anniversary {name}! Proof that some people really do find their perfect match.',
      'Happy anniversary {name}! May your love grow stronger and your arguments shorter.',
    ],
    emotional: [
      'Happy anniversary {name}. Your love is a beautiful example for all of us.',
      'Happy anniversary {name}! Wishing you a lifetime of love, laughter and togetherness.',
      'Happy anniversary {name}. May every year together be even more beautiful than the last.',
      'Happy anniversary {name}. Seeing your love makes my heart happy. Wishing you both endless joy.',
      'Happy anniversary {name}! May your bond keep growing stronger with every passing year.',
    ],
    formal: [
      'Happy anniversary {name}. Warm wishes for many more happy years together.',
      'Congratulations on your anniversary, {name}. Wishing you both continued happiness.',
      'Best wishes on your anniversary, {name}. May the years ahead be filled with joy.',
      'Happy anniversary {name}. Wishing you both health, happiness and love.',
      'Warm congratulations on your anniversary, {name}. Have a wonderful celebration.',
    ],
    urdu: [
      'Shaadi ki saalgirah mubarak ho, {name}! Allah aap dono ko hamesha saath aur khush rakhe.',
      '{name}, saalgirah ki bohat bohat mubarakbaad! Aap ki jodi salamat rahe.',
      'Happy anniversary {name}! Allah aap dono ki mohabbat mein aur barkat de.',
      'Shaadi ki saalgirah mubarak, {name}! Aap ka saath hamesha yun hi khoobsurat rahe.',
      '{name}, aap dono ko dher saari mubarakbaad! Har saal pehle se behtar ho.',
    ],
  },
  mothers_day: {
    funny: [
      "Happy Mother's Day {name}! Thank you for not selling me when I was a kid.",
      "Happy Mother's Day {name}! You were right about everything. Please don't tell anyone I said that.",
      "Happy Mother's Day {name}! Sorry for all the grey hair. You still look amazing.",
      "Happy Mother's Day {name}! Your cooking is still the best, and I will keep coming back for it.",
      "Happy Mother's Day {name}! Thank you for raising such a wonderful child. You're welcome.",
    ],
    emotional: [
      "Happy Mother's Day {name}. Everything good in me started with you. Thank you for everything.",
      "Happy Mother's Day {name}! Your love is my strength. I love you more than words can say.",
      "Happy Mother's Day {name}. Thank you for every prayer, every sacrifice and every hug.",
      "Happy Mother's Day {name}. I am so lucky to be loved by you.",
      "Happy Mother's Day {name}! You make every day better. Today is all about you.",
    ],
    formal: [
      "Happy Mother's Day {name}. Wishing you a peaceful and joyful day.",
      "Warm wishes on Mother's Day, {name}. Thank you for all your love and care.",
      "Happy Mother's Day {name}. Wishing you good health and happiness always.",
      "Best wishes on Mother's Day, {name}. You are truly appreciated.",
      "Happy Mother's Day {name}. May your day be as special as you are.",
    ],
    urdu: [
      "Happy Mother's Day {name}! Aap ki duaon ki wajah se hi sab kuch hai. Bohat pyaar.",
      "{name}, Maa ka din mubarak! Allah aap ka saaya hamesha hum par salamat rakhe.",
      "Happy Mother's Day {name}! Aap duniya ki sab se achi Ammi hain.",
      "{name}, aap ki mohabbat aur qurbaniyon ka shukriya. Happy Mother's Day!",
      "Happy Mother's Day {name}! Allah aap ko lambi umar aur achi sehat de.",
    ],
  },
  fathers_day: {
    funny: [
      "Happy Father's Day {name}! Thank you for all the jokes. Most of them were funny.",
      "Happy Father's Day {name}! You taught me everything, except how to fix things myself.",
      "Happy Father's Day {name}! The best dad, and the best at finding the TV remote.",
      "Happy Father's Day {name}! Sorry for all the money I cost you. Love you!",
      "Happy Father's Day {name}! You're not just a dad, you're a legend.",
    ],
    emotional: [
      "Happy Father's Day {name}. Thank you for your strength, your patience and your love.",
      "Happy Father's Day {name}! Everything I am, I owe to you.",
      "Happy Father's Day {name}. You are my hero, today and always.",
      "Happy Father's Day {name}. Thank you for always believing in me.",
      "Happy Father's Day {name}! So grateful to have you. I love you.",
    ],
    formal: [
      "Happy Father's Day {name}. Wishing you a relaxing and happy day.",
      "Warm wishes on Father's Day, {name}. Thank you for everything you do.",
      "Happy Father's Day {name}. Wishing you good health and happiness.",
      "Best wishes on Father's Day, {name}. You are truly appreciated.",
      "Happy Father's Day {name}. May your day be filled with joy.",
    ],
    urdu: [
      "Happy Father's Day {name}! Aap ki mehnat aur pyaar ka bohat shukriya.",
      "{name}, Abbu ka din mubarak! Allah aap ka saaya hamesha hum par salamat rakhe.",
      "Happy Father's Day {name}! Aap duniya ke sab se ache Abbu hain.",
      "{name}, aap hamare hero hain. Happy Father's Day!",
      "Happy Father's Day {name}! Allah aap ko lambi umar aur achi sehat de.",
    ],
  },
  other: {
    funny: [
      'Happy {occasion}, {name}! Time to celebrate, and yes, that means cake.',
      "Happy {occasion}, {name}! Big day, big smiles. Don't forget to save me some sweets.",
      'Happy {occasion}, {name}! Party mode: on. Enjoy every minute of it.',
      "{occasion} mubarak {name}! I'd throw you a party, but you'd make me clean up.",
      'Happy {occasion}, {name}! You deserve all the celebrations today.',
    ],
    emotional: [
      'Happy {occasion}, {name}. Wishing you a day full of love and happiness.',
      'Happy {occasion}, {name}! Thinking of you today and wishing you all the best.',
      'Warm wishes on your {occasion}, {name}. You truly deserve this moment.',
      'Happy {occasion}, {name}. May this day bring you joy you will always remember.',
      "Happy {occasion}, {name}! So happy for you. Here's to many more beautiful moments.",
    ],
    formal: [
      'Warm wishes on your {occasion}, {name}.',
      'Happy {occasion}, {name}. Wishing you continued success and happiness.',
      'Best wishes on your {occasion}, {name}. Have a wonderful day.',
      'Congratulations and happy {occasion}, {name}. Wishing you all the best ahead.',
      'Happy {occasion}, {name}. May this occasion bring you joy and success.',
    ],
    urdu: [
      '{occasion} mubarak ho, {name}! Allah aap ko hamesha khush rakhe.',
      '{name}, {occasion} ki dher saari mubarakbaad!',
      '{occasion} bohat bohat mubarak ho, {name}! Yeh din aap ke liye khushiyan laaye.',
      '{name}, aap ko {occasion} mubarak! Har khushi aap ke naseeb mein ho.',
      '{occasion} ki mubarakbaad, {name}! Allah aap ko kamyabi de.',
    ],
  },
};

export function fillTemplate(template: string, name: string, occasion: string) {
  return template.replaceAll('{name}', name).replaceAll('{occasion}', occasion);
}
